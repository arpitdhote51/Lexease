"use client";
import { useState, useCallback } from "react";
import { Loader2, FileUp, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

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

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type UserRole = "layperson" | "lawStudent" | "lawyer";

export default function LexeaseApp() {
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
        if (fileType.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setDocumentText(e.target?.result as string);
                setIsLoading(false);
            };
            reader.readAsDataURL(file);
            return;
        } else if (fileType === 'application/pdf') {
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
            };
            reader.readAsArrayBuffer(file);
        } else if (file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const result = await mammoth.extractRawText({ arrayBuffer });
                setDocumentText(result.value);
            };
            reader.readAsArrayBuffer(file);
        } else if (fileType === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                setDocumentText(e.target?.result as string);
            };
            reader.readAsText(file);
        } else {
            toast({
                variant: 'destructive',
                title: 'Unsupported File Type',
                description: 'Please upload a PDF, DOCX, TXT, or image file.',
            });
            setFile(null);
        }
    } catch (error) {
        console.error('File processing error:', error);
        toast({
            variant: 'destructive',
            title: 'File Error',
            description: 'There was an error processing your file.',
        });
        setFile(null);
    } finally {
        // For non-image files, loading state is handled inside reader.onload
        if (!file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => setIsLoading(false);
          reader.onerror = () => setIsLoading(false);
          if (file.type === 'application/pdf' || file.name.endsWith('.docx')) {
            reader.readAsArrayBuffer(file);
          } else {
            reader.readAsText(file);
          }
        }
    }
  };

  const handleAnalyze = async () => {
    if (!documentText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload a file to analyze.",
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    const docText = documentText;

    try {
      const summarizationInput: PlainLanguageSummarizationInput = {
        legalDocumentText: docText,
        userRole,
      };
      const entityInput: KeyEntityRecognitionInput = { documentText: docText };
      const riskInput: RiskFlaggingInput = { legalText: docText };

      const [summary, entities, risks] = await Promise.all([
        plainLanguageSummarization(summarizationInput),
        identifyKeyEntities(entityInput),
        riskFlagging(riskInput),
      ]);
      
      setAnalysisResult({ summary, entities, risks });

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
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      processFile(files[0]);
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);


  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="font-headline">Document Input</CardTitle>
              <CardDescription>
                Upload your legal document below and select your role to begin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div
                className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50"
                onDrop={onDrop}
                onDragOver={onDragOver}
                >
                <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt,image/*"
                    disabled={isLoading}
                />
                {file ? (
                    <div className="text-center">
                        <File className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 font-semibold">{file.name}</p>
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
                    </div>
                ) : (
                    <label htmlFor="file-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-center">
                        <FileUp className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-sm font-semibold">
                            Drag & drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            PDF, DOCX, TXT, or Image
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
                  disabled={isLoading}
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
              <Button onClick={handleAnalyze} disabled={isLoading || !file} className="w-full">
                {isLoading ? (
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
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Analysis Results</CardTitle>
              <CardDescription>
                Here is a breakdown of your legal document.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && !analysisResult ? <AnalysisPlaceholder /> :
                !analysisResult ? (
                  <div className="text-center text-muted-foreground py-16">
                    <p>Your analysis results will appear here.</p>
                  </div>
                ) : (
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="entities">Key Entities</TabsTrigger>
                    <TabsTrigger value="risks">Risk Flags</TabsTrigger>
                    <TabsTrigger value="qa">Q&A</TabsTrigger>
                  </TabsList>
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
                    <QAChat documentText={documentText} />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
