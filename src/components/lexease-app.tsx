
"use client";
import { useState, useCallback, useEffect } from "react";
import { Loader2, FileUp, File, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

import {
  plainLanguageSummarization,
  PlainLanguageSummarizationInput,
  PlainLanguageSummarizationOutput,
} from "@/ai/flows/plain-language-summarization";
import {
  identifyKeyEntities,
  KeyEntityRecognitionInput,
  KeyEntityRecognitionOutput,
} from "@/ai/flows/key-entity-recognition";
import {
  riskFlagging,
  RiskFlaggingInput,
  RiskFlaggingOutput,
} from "@/ai/flows/risk-flagging";

import SummaryDisplay from "./summary-display";
import EntitiesDisplay from "./entities-display";
import RisksDisplay from "./risks-display";
import QAChat from "./qa-chat";
import { Skeleton } from "./ui/skeleton";
import type { DocumentData } from "./dashboard";


pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type UserRole = "layperson" | "lawStudent" | "lawyer";

interface LexeaseAppProps {
    existingDocument?: DocumentData | null;
}

export default function LexeaseApp({ existingDocument }: LexeaseAppProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [documentText, setDocumentText] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("layperson");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    summary: PlainLanguageSummarizationOutput;
    entities: KeyEntityRecognitionOutput;
    risks: RiskFlaggingOutput;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (existingDocument) {
      setDocumentText(existingDocument.documentText);
      if (existingDocument.analysis) {
        setAnalysisResult({
            summary: existingDocument.analysis.summary,
            entities: existingDocument.analysis.entities,
            risks: existingDocument.analysis.risks,
        });
      }
      setFile(new File([], existingDocument.fileName));
    } else {
        // Reset state for new analysis
        setDocumentText("");
        setAnalysisResult(null);
        setFile(null);
        setUserRole("layperson");
    }
  }, [existingDocument]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setDocumentText('');
    const fileType = file.type;

    try {
        let text = '';
        if (fileType === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
                const pdf = await pdfjs.getDocument(typedArray).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(item => (item as any).str).join(' ');
                }
                setDocumentText(fullText);
                setIsLoading(false);
            };
            reader.readAsArrayBuffer(file);
        } else if (file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const result = await mammoth.extractRawText({ arrayBuffer });
                setDocumentText(result.value);
                setIsLoading(false);
            };
            reader.readAsArrayBuffer(file);
        } else if (fileType === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                setDocumentText(e.target?.result as string);
                setIsLoading(false);
            };
            reader.readAsText(file);
        } else {
            toast({
                variant: 'destructive',
                title: 'Unsupported File Type',
                description: 'Please upload a PDF, DOCX, or TXT file.',
            });
            setFile(null);
            setIsLoading(false);
        }
    } catch (error) {
        console.error('File processing error:', error);
        toast({
            variant: 'destructive',
            title: 'File Error',
            description: 'There was an error processing your file.',
        });
        setFile(null);
        setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!documentText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload and process a file to analyze.",
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const summarizationInput: PlainLanguageSummarizationInput = {
        legalDocumentText: documentText,
        userRole,
      };
      const entityInput: KeyEntityRecognitionInput = { documentText: documentText };
      const riskInput: RiskFlaggingInput = { legalText: documentText };

      const [summary, entities, risks] = await Promise.all([
        plainLanguageSummarization(summarizationInput),
        identifyKeyEntities(entityInput),
        riskFlagging(riskInput),
      ]);
      
      const results = { summary, entities, risks };
      setAnalysisResult(results);

      if (user && file) {
          if (existingDocument) {
              // This case might not be needed if analysis is always done once
              await setDoc(doc(db, 'documents', existingDocument.id), {
                  analysis: results,
              }, { merge: true });
          } else {
              const newDocRef = await addDoc(collection(db, 'documents'), {
                  userId: user.uid,
                  fileName: file.name,
                  documentText,
                  analysis: results,
                  createdAt: serverTimestamp()
              });
              router.push(`/${newDocRef.id}`);
          }
      }

    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "An error occurred while analyzing the document. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const AnalysisPlaceholder = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
  
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if(existingDocument || isLoading) return;
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      processFile(files[0]);
    }
  }, [existingDocument, isLoading]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);


  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        { !existingDocument && (
        <div className="lg:col-span-5">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="font-headline">Document Input</CardTitle>
              <CardDescription>
                Upload a new document for analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg  bg-muted  ${!existingDocument ? 'cursor-pointer hover:bg-muted/50' : 'cursor-not-allowed'}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                >
                <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                    disabled={isLoading || !!existingDocument}
                />
                {file ? (
                    <div className="text-center p-4">
                        <File className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 font-semibold truncate">{file.name}</p>
                         {!existingDocument && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                    setFile(null);
                                    setDocumentText('');
                                    setAnalysisResult(null);
                                }}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Remove
                            </Button>
                        )}
                    </div>
                ) : (
                    <label htmlFor="file-upload" className={`w-full h-full flex flex-col items-center justify-center text-center ${!existingDocument ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <FileUp className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-sm font-semibold">
                            Drag & drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            PDF, DOCX, or TXT
                        </p>
                    </label>
                )}
                </div>

              <div className="space-y-4">
                <Label>Select Your Role</Label>
                <RadioGroup
                  defaultValue="layperson"
                  className="flex flex-col sm:flex-row gap-4"
                  value={userRole}
                  onValueChange={(value: UserRole) => setUserRole(value)}
                  disabled={isLoading || !!existingDocument}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="layperson" id="r1" />
                    <Label htmlFor="r1">Layperson</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lawStudent" id="r2" />
                    <Label htmlFor="r2">Law Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lawyer" id="r3" />
                    <Label htmlFor="r3">Lawyer</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button onClick={handleAnalyze} disabled={isLoading || !file || !!analysisResult} className="w-full">
                {isLoading && !analysisResult ? (
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
        <div className={existingDocument ? "lg:col-span-12" : "lg:col-span-7"}>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">
                { existingDocument ? existingDocument.fileName : "Analysis Results" }
                </CardTitle>
              <CardDescription>
                { existingDocument ? "Viewing analysis for your document." : "Here is a breakdown of your legal document." }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && !analysisResult ? <AnalysisPlaceholder /> :
                !analysisResult && !documentText && !existingDocument ? (
                  <div className="text-center text-muted-foreground py-16">
                    <p>Your analysis results will appear here once you upload and analyze a document.</p>
                  </div>
                ) : (
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="entities">Key Entities</TabsTrigger>
                    <TabsTrigger value="risks">Risk Flags</TabsTrigger>
                    <TabsTrigger value="qa">Q&A</TabsTrigger>
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
                      <TabsContent value="qa">
                        <QAChat documentId={existingDocument!.id} documentText={documentText} />
                      </TabsContent>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-16">
                        {isLoading ? (
                            <AnalysisPlaceholder />
                        ) : (
                             <p>Click "Analyze Document" to see the results.</p>
                        )}
                    </div>
                  )}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
