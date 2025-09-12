"use client";
import { useState, useCallback, useEffect } from "react";
import { Loader2, FileUp, FileIcon } from "lucide-react";
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
import mammoth from "mammoth";

import { plainLanguageSummarization } from "@/ai/flows/plain-language-summary";
import { keyEntityRecognition, KeyEntity } from "@/ai/flows/key-entity-recognition";
import { riskFlagging } from "@/ai/flows/risk-flagging";

import SummaryDisplay from "./summary-display";
import EntitiesDisplay from "./entities-display";
import RisksDisplay from "./risks-display";
import QAChat from "./qa-chat";
import { Skeleton } from "./ui/skeleton";
import type { DocumentData } from "./dashboard";
import Header from "./layout/header";

type UserRole = "layperson" | "lawStudent" | "lawyer";

export interface DocumentAnalysis {
  summary?: { plainLanguageSummary: string };
  entities?: { entities: KeyEntity[] };
  risks?: { riskyClauses: string[] };
}

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
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysis | null>(initialDocument?.analysis || null);
  const [file, setFile] = useState<File | null>(initialDocument ? new File([], initialDocument.fileName) : null);
  const [documentId, setDocumentId] = useState<string | null>(initialDocument?.id || null);

  const { toast } = useToast();

  useEffect(() => {
    if (initialDocument) {
      setDocumentId(initialDocument.id);
      setFile(new File([], initialDocument.fileName));
      setDocumentText(initialDocument.documentText || "");
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
            if (data.analysis.summary && data.analysis.entities && data.analysis.risks) {
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
    setIsAnalyzing(true);
    setFile(file);
    setAnalysisResult(null);

    try {
      const text = await extractText(file);
      setDocumentText(text);
      await saveInitialDocumentAndAnalyze(file.name, text);
    } catch (error) {
      handleFileError(error, file.type);
      setIsAnalyzing(false);
    }
  };
  
  const extractText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    resolve(result.value);
                } else {
                    // For PDF, TXT, and images, we will send to AI
                     const dataUri = e.target?.result as string;
                     const base64 = dataUri.split(',')[1];
                     // This is a placeholder for a flow that would do OCR
                     // For now, we are assuming text can be extracted or we can use a mock
                     if (file.type.startsWith('image/')) {
                       // This would be where you call an OCR flow
                       // For now, returning a placeholder
                       console.warn("OCR for images not implemented in this version. Using placeholder text.");
                       resolve("Text extracted from image: [Placeholder]");
                     } else if (file.type === 'application/pdf') {
                        // This would be where you call an OCR flow for PDFs
                        console.warn("OCR for PDF not implemented in this version. Using placeholder text.");
                        resolve("Text extracted from PDF: [Placeholder]");
                     }
                     else {
                       // Fallback for text files
                        const text = atob(base64);
                        resolve(text);
                     }
                }
            } catch (error) {
                reject(error);
            }
        };
         if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsDataURL(file); // For text, images, pdf
        }
    });
};


  const handleFileError = (error: any, type: string) => {
    console.error(`File processing error (${type}):`, error);
    toast({ variant: 'destructive', title: `Error Processing ${type} File`, description: 'There was an error processing your file.' });
    setFile(null);
    setIsProcessing(false);
  }

  const saveInitialDocumentAndAnalyze = async (fileName: string, extractedText: string) => {
    if (!user) return;
    
    try {
        const newDocRef = await addDoc(collection(db, 'documents'), {
            userId: user.uid,
            fileName: fileName,
            documentText: extractedText,
            createdAt: serverTimestamp(),
            analysis: {},
        });
        setDocumentId(newDocRef.id);
        setIsProcessing(false);
        router.push(`/${newDocRef.id}`, { scroll: false }); 

        toast({ title: "Analysis Started", description: "Your document analysis is running. Results will appear here shortly." });
        
        // Run all analysis tasks in parallel
        await Promise.all([
          runSummarization(newDocRef.id, extractedText),
          runEntityRecognition(newDocRef.id, extractedText),
          runRiskFlagging(newDocRef.id, extractedText)
        ]);
        
    } catch (error) {
        console.error("Failed to save or analyze document:", error);
        toast({ variant: "destructive", title: "Analysis Failed", description: "Could not save and analyze the document." });
        setIsProcessing(false);
        setIsAnalyzing(false);
    }
  };

  const runSummarization = async (docId: string, text: string) => {
    try {
      const result = await plainLanguageSummarization({ legalDocumentText: text, userRole });
      await updateDoc(doc(db, "documents", docId), { "analysis.summary": result });
    } catch (e) {
      console.error("Summarization failed", e);
      toast({variant: "destructive", title: "Summarization Failed"});
    }
  };

  const runEntityRecognition = async (docId: string, text: string) => {
    try {
      const result = await keyEntityRecognition({ legalDocumentText: text });
      await updateDoc(doc(db, "documents", docId), { "analysis.entities": result });
    } catch (e) {
      console.error("Entity Recognition failed", e);
      toast({variant: "destructive", title: "Entity Recognition Failed"});
    }
  };

  const runRiskFlagging = async (docId: string, text: string) => {
    try {
      const result = await riskFlagging({ legalDocumentText: text });
      await updateDoc(doc(db, "documents", docId), { "analysis.risks": result });
    } catch (e) {
      console.error("Risk Flagging failed", e);
      toast({variant: "destructive", title: "Risk Flagging Failed"});
    }
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

  const allAnalysisFinished = analysisResult?.summary && analysisResult?.entities && analysisResult?.risks;

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
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl bg-background  ${!isLoading && !isAnalyzing ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed'}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                >
                <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                    disabled={isLoading || isAnalyzing}
                />
                {isProcessing || isAnalyzing ? (
                    <div className="text-center">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">{isProcessing ? "Processing file..." : "Analyzing document..."}</p>
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
                  disabled={isLoading || isAnalyzing}
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
                  { file ? (isAnalyzing && !allAnalysisFinished ? "Analysis in progress..." : "Viewing analysis for your document.") : "Here is a breakdown of your legal document." }
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
