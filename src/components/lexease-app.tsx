"use client";
import { useState, useCallback, useEffect } from "react";
import { Loader2, FileUp, FileIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

import {
  analyzeDocumentInBackground,
  DocumentAnalysisOutput,
} from "@/ai/flows/document-analysis";

import SummaryDisplay from "./summary-display";
import EntitiesDisplay from "./entities-display";
import RisksDisplay from "./risks-display";
import QAChat from "./qa-chat";
import { Skeleton } from "./ui/skeleton";
import type { DocumentData } from "./dashboard";
import Header from "./layout/header";

type UserRole = "layperson" | "lawStudent" | "lawyer";

interface LexeaseAppProps {
    existingDocument?: DocumentData | null;
}

export default function LexeaseApp({ existingDocument: initialDocument }: LexeaseAppProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentData | null>(initialDocument || null);
  const [documentText, setDocumentText] = useState(initialDocument?.documentText || "");
  const [userRole, setUserRole] = useState<UserRole>("layperson");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisOutput | null>(initialDocument?.analysis || null);
  const [file, setFile] = useState<File | null>(initialDocument ? new File([], initialDocument.fileName) : null);
  const [documentId, setDocumentId] = useState<string | null>(initialDocument?.id || null);

  const { toast } = useToast();

  useEffect(() => {
    if (initialDocument) {
      setDocumentId(initialDocument.id);
      setFile(new File([], initialDocument.fileName));
    }
  }, [initialDocument]);

  useEffect(() => {
    if (!documentId) return;

    const unsubscribe = onSnapshot(doc(db, "documents", documentId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as DocumentData;
        setDocument({ ...data, id: doc.id });
        setDocumentText(data.documentText || "");
        
        if (data.analysis) {
            setAnalysisResult(data.analysis);
            const { summary, entities, risks } = data.analysis;
            if (summary && entities && risks) {
                setIsAnalyzing(false);
            }
        }
      }
    });

    return () => unsubscribe();
  }, [documentId]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to upload a document.", variant: "destructive" });
        return;
    }
    
    setIsProcessing(true);
    setFile(file);
    setAnalysisResult(null); // Clear previous analysis

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const dataUri = e.target?.result as string;
                await saveInitialDocumentAndAnalyze(file.name, dataUri);
            } catch (error) {
                handleFileError(error, file.type);
            }
        };
        reader.readAsDataURL(file);
    } catch (error) {
        handleFileError(error, "general");
    }
  };

  const handleFileError = (error: any, type: string) => {
    console.error(`File processing error (${type}):`, error);
    toast({ variant: 'destructive', title: `Error Processing ${type} File`, description: 'There was an error processing your file.' });
    setFile(null);
    setIsProcessing(false);
  }

  const saveInitialDocumentAndAnalyze = async (fileName: string, dataUri: string) => {
    if (!user) return;
    
    try {
        const newDocRef = await addDoc(collection(db, 'documents'), {
            userId: user.uid,
            fileName: fileName,
            createdAt: serverTimestamp(),
            analysis: {}, // Initialize with empty object
        });
        setDocumentId(newDocRef.id);
        setIsProcessing(false);
        router.push(`/${newDocRef.id}`, { scroll: false }); 

        // Start analysis in the background
        handleAnalyze(newDocRef.id, dataUri, false);
    } catch (error) {
        console.error("Failed to save initial document:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save the document to the database." });
        setIsProcessing(false);
    }
  };

  const handleAnalyze = async (docId: string, fileDataUri: string, forceReanalysis = false) => {
    if (!docId) {
      toast({ variant: "destructive", title: "Error", description: "No document ID available to analyze." });
      return;
    }

    if (analysisResult && analysisResult.summary && analysisResult.entities && analysisResult.risks && !forceReanalysis) {
        toast({ title: "Analysis Already Complete", description: "Click 'Re-Analyze' to run the analysis again." });
        return;
    }

    setIsAnalyzing(true);
    if(forceReanalysis) {
        setAnalysisResult(null);
        const docRef = doc(db, 'documents', docId);
        await updateDoc(docRef, { analysis: {} });
    }
    toast({ title: "Analysis Started", description: "Your document analysis is running in the background. Results will appear here shortly." });

    analyzeDocumentInBackground({ documentId: docId, userRole, fileDataUri })
        .catch((error) => {
            console.error("Analysis failed to start:", error);
            toast({ variant: "destructive", title: "Analysis Failed", description: "An error occurred while starting the analysis." });
            setIsAnalyzing(false);
        });
  };
  
  const AnalysisPlaceholder = ({title}: {title: string}) => (
    <div className="space-y-4 p-6">
      <h3 className="font-semibold text-lg">{title}</h3>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
  
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if(isProcessing || isAnalyzing) return;
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [isProcessing, isAnalyzing]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const isLoading = isProcessing;

  const handleStartNew = () => {
    router.push('/new');
  };

  return (
    <>
    <Header />
    <main className="flex-1 p-10 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        { !initialDocument && (
        <div className="lg:col-span-5">
          <Card className="sticky top-8 bg-white shadow-none border-border">
            <CardHeader>
              <CardTitle className="font-bold text-2xl text-foreground">Document Input</CardTitle>
              <CardDescription>
                Upload a document to get started. The analysis will begin automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl bg-background  ${!isLoading ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed'}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                >
                <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                    disabled={isLoading}
                />
                {isProcessing ? (
                    <div className="text-center">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Processing file...</p>
                    </div>
                ) : file ? (
                    <div className="text-center p-4">
                        <FileIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 font-semibold truncate">{file.name}</p>
                         <p className="text-sm text-muted-foreground">Redirecting to analysis page...</p>
                    </div>
                ) : (
                    <label htmlFor="file-upload" className={`w-full h-full flex flex-col items-center justify-center text-center ${!isLoading ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <FileUp className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-sm font-semibold text-foreground">
                            Drag & drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            PDF, DOCX, TXT, PNG, or JPG
                        </p>
                    </label>
                )}
                </div>

              <div className="space-y-4">
                <Label className="font-semibold text-foreground">Select Your Role (for analysis)</Label>
                <RadioGroup
                  defaultValue="layperson"
                  className="flex flex-col sm:flex-row gap-4"
                  value={userRole}
                  onValueChange={(value: UserRole) => setUserRole(value)}
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="layperson" id="r1" />
                    <Label htmlFor="r1" className="text-foreground">Layperson</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lawStudent" id="r2" />
                    <Label htmlFor="r2" className="text-foreground">Law Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lawyer" id="r3" />
                    <Label htmlFor="r3" className="text-foreground">Lawyer</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>
        )}
        <div className={initialDocument ? "lg:col-span-12" : "lg:col-span-7"}>
          <Card className="bg-white shadow-none border-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="font-bold text-2xl text-foreground">
                  { file ? file.name : "Analysis Results" }
                  </CardTitle>
                <CardDescription>
                  { file ? "Viewing analysis for your document." : "Here is a breakdown of your legal document." }
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {!documentId ? (
                  <div className="text-center text-muted-foreground py-16">
                    <p>Your analysis results will appear here once you upload a document.</p>
                  </div>
                ) : (
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-background">
                    <TabsTrigger value="summary" disabled={!analysisResult?.summary}>Summary</TabsTrigger>
                    <TabsTrigger value="entities" disabled={!analysisResult?.entities}>Key Entities</TabsTrigger>
                    <TabsTrigger value="risks" disabled={!analysisResult?.risks}>Risk Flags</TabsTrigger>
                    <TabsTrigger value="qa">Q&A</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary">
                    {analysisResult?.summary ? <SummaryDisplay summary={analysisResult.summary.plainLanguageSummary} /> : <AnalysisPlaceholder title="Generating Summary..." />}
                  </TabsContent>
                  <TabsContent value="entities">
                    {analysisResult?.entities ? <EntitiesDisplay entities={analysisResult.entities.entities} /> : <AnalysisPlaceholder title="Extracting Entities..." />}
                  </TabsContent>
                  <TabsContent value="risks">
                     {analysisResult?.risks ? <RisksDisplay risks={analysisResult.risks.riskyClauses} /> : <AnalysisPlaceholder title="Flagging Risks..." />}
                  </TabsContent>
                  <TabsContent value="qa">
                    <QAChat documentId={documentId} documentText={documentText} />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
    </>
  );
}
