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
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

import {
  plainLanguageSummarization,
  PlainLanguageSummarizationOutput,
} from "@/ai/flows/plain-language-summarization";
import {
  identifyKeyEntities,
  KeyEntityRecognitionOutput,
} from "@/ai/flows/key-entity-recognition";
import {
  riskFlagging,
  RiskFlaggingOutput,
} from "@/ai/flows/risk-flagging";
import {
    extractTextFromFile
} from "@/ai/flows/extract-text-from-file";


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
  const [existingDocument, setExistingDocument] = useState(initialDocument);
  const [documentText, setDocumentText] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("layperson");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    summary: PlainLanguageSummarizationOutput;
    entities: KeyEntityRecognitionOutput;
    risks: RiskFlaggingOutput;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(initialDocument?.id || null);

  const { toast } = useToast();

  useEffect(() => {
    if (initialDocument) {
      setExistingDocument(initialDocument);
      setDocumentText(initialDocument.documentText);
      setDocumentId(initialDocument.id);
      if (initialDocument.analysis) {
        setAnalysisResult({
            summary: initialDocument.analysis.summary,
            entities: initialDocument.analysis.entities,
            risks: initialDocument.analysis.risks,
        });
      }
      if(initialDocument.fileName) {
        setFile(new global.File([], initialDocument.fileName));
      }
    } else {
        setExistingDocument(null);
        setDocumentText("");
        setAnalysisResult(null);
        setFile(null);
        setUserRole("layperson");
        setDocumentId(null);
    }
  }, [initialDocument]);

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
                const result = await extractTextFromFile({ fileDataUri: dataUri, fileType: file.type });
                await saveInitialDocument(file.name, result.text);
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

  const saveInitialDocument = async (fileName: string, text: string) => {
    if (!user) return;
    setDocumentText(text);

    try {
        const newDocRef = await addDoc(collection(db, 'documents'), {
            userId: user.uid,
            fileName: fileName,
            documentText: text,
            createdAt: serverTimestamp(),
            analysis: null,
        });
        setDocumentId(newDocRef.id);
        router.push(`/${newDocRef.id}`, { scroll: false }); 
    } catch (error) {
        console.error("Failed to save initial document:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save the document to the database." });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!documentText.trim() || !documentId) {
      toast({ variant: "destructive", title: "Error", description: "No document loaded to analyze." });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null); // Clear previous results while analyzing
    toast({ title: "Analysis Started", description: "Your document analysis is running in the background. Results will appear here shortly." });

    // Non-blocking analysis
    Promise.all([
      plainLanguageSummarization({ legalDocumentText: documentText, userRole }),
      identifyKeyEntities({ documentText: documentText }),
      riskFlagging({ legalText: documentText }),
    ]).then(async ([summary, entities, risks]) => {
        const results = { summary, entities, risks };
        
        // Update state to show results in UI
        setAnalysisResult(results);

        // Save results to Firestore
        const docRef = doc(db, 'documents', documentId);
        await updateDoc(docRef, { analysis: results });

        setIsAnalyzing(false);
        toast({ title: "Analysis Complete", description: "Your document analysis has finished." });
      })
      .catch((error) => {
        console.error("Analysis failed:", error);
        toast({ variant: "destructive", title: "Analysis Failed", description: "An error occurred while analyzing the document." });
        setIsAnalyzing(false);
      });
  };
  
  const AnalysisPlaceholder = () => (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-20 w-full" />
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

  const isLoading = isProcessing || isAnalyzing;

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
                Upload a document to get started.
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
                    accept=".pdf,.docx,.txt"
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
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-red-500 hover:text-red-700"
                            onClick={() => {
                                setFile(null);
                                setDocumentText('');
                                setAnalysisResult(null);
                                setDocumentId(null);
                                router.push('/new');
                            }}
                            disabled={isLoading}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Remove
                        </Button>
                    </div>
                ) : (
                    <label htmlFor="file-upload" className={`w-full h-full flex flex-col items-center justify-center text-center ${!isLoading ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <FileUp className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-sm font-semibold text-foreground">
                            Drag & drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            PDF, DOCX, or TXT
                        </p>
                    </label>
                )}
                </div>

              <div className="space-y-4">
                <Label className="font-semibold text-foreground">Select Your Role</Label>
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
              <Button onClick={handleAnalyze} disabled={isLoading || !documentId || !!analysisResult} className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent/90">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Document"
                )}
              </Button>
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
              {documentId && (
                 initialDocument ? 
                    <Button onClick={handleStartNew} variant="outline">
                      Start New Analysis
                    </Button>
                  :
                    <Button onClick={handleAnalyze} disabled={isLoading || !documentId || !!analysisResult} className="bg-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-accent/90">
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : analysisResult ? "Re-Analyze" : "Analyze Document" }
                    </Button>
              )}
            </CardHeader>
            <CardContent>
              {isAnalyzing && !analysisResult ? <AnalysisPlaceholder /> :
                !documentId ? (
                  <div className="text-center text-muted-foreground py-16">
                    <p>Your analysis results will appear here once you upload and analyze a document.</p>
                  </div>
                ) : (
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-background">
                    <TabsTrigger value="summary" disabled={!analysisResult}>Summary</TabsTrigger>
                    <TabsTrigger value="entities" disabled={!analysisResult}>Key Entities</TabsTrigger>
                    <TabsTrigger value="risks" disabled={!analysisResult}>Risk Flags</TabsTrigger>
                    <TabsTrigger value="qa" disabled={!documentId}>Q&A</TabsTrigger>
                  </TabsList>
                  {analysisResult ? (
                    <>
                      <TabsContent value="summary">
                        <SummaryDisplay summary={analysisResult.summary.plainLanguageSummary} />
                      </TabsContent>
                      <TabsContent value="entities">
                        <EntitiesDisplay entities={analysisResult.entities.entities} />
                      </TabsContent>
                      <TabsContent value="risks">
                        <RisksDisplay risks={analysisResult.risks.riskyClauses} />
                      </TabsContent>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-16">
                        {isAnalyzing ? (
                            <AnalysisPlaceholder />
                        ) : documentId && !analysisResult ? (
                             <p>Click "Analyze Document" to see the results.</p>
                        ) : null}
                    </div>
                  )}
                  <TabsContent value="qa">
                    {documentId && <QAChat documentId={documentId} documentText={documentText} />}
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
