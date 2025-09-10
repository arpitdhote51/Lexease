"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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

  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!documentText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some legal text to analyze.",
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
      const entityInput: KeyEntityRecognitionInput = { documentText };
      const riskInput: RiskFlaggingInput = { legalText: documentText };

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

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="font-headline">Document Input</CardTitle>
              <CardDescription>
                Paste your legal document below and select your role to begin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="document-text">Legal Document Text</Label>
                <Textarea
                  id="document-text"
                  placeholder="Paste your legal document here..."
                  className="min-h-[300px] font-body"
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  disabled={isLoading}
                />
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
              <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
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
              {isLoading ? <AnalysisPlaceholder /> :
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
                    <TabsTrigger value="qa">Q&amp;A</TabsTrigger>
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
