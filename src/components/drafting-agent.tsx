"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Loader2 } from "lucide-react";
import { draftDocument } from "@/ai/flows/draft-document";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";

export default function DraftingAgent() {
  const [documentType, setDocumentType] = useState("");
  const [language, setLanguage] = useState("English");
  const [userInputs, setUserInputs] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDraft = async () => {
    if (!documentType || !userInputs) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please select a document type and provide your details.",
        });
        return;
    }
    setIsLoading(true);
    setGeneratedDraft("");
    try {
        const result = await draftDocument({
            documentType,
            language,
            userInputs,
        });
        setGeneratedDraft(result.draftContent);
    } catch (error) {
        console.error("Draft generation failed:", error);
        toast({
            variant: "destructive",
            title: "Draft Generation Failed",
            description: "An error occurred while generating the document. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([generatedDraft], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentType.replace(" ", "_")}_${language}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10">
            <h1 className="text-3xl font-bold text-primary">AI Legal Drafting Agent</h1>
            <p className="text-muted-foreground mt-1">
                Generate precise, jurisdiction-compliant Indian legal documents.
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <Card className="bg-white shadow-none border-border">
                    <CardHeader>
                        <CardTitle>Drafting Inputs</CardTitle>
                        <CardDescription>Fill in the details to generate your legal document.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="document-type">Document Type</Label>
                                <Select onValueChange={setDocumentType} value={documentType}>
                                    <SelectTrigger id="document-type">
                                        <SelectValue placeholder="Select a document..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Simple Affidavit">Simple Affidavit</SelectItem>
                                        <SelectItem value="Mutual NDA">Mutual NDA</SelectItem>
                                        <SelectItem value="Sale Agreement" disabled>Sale Agreement (Coming Soon)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="language">Language</Label>
                                <Select onValueChange={setLanguage} defaultValue="English">
                                    <SelectTrigger id="language">
                                        <SelectValue placeholder="Select language..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="Hindi">Hindi</SelectItem>
                                        <SelectItem value="Marathi">Marathi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="user-inputs">Provide Details</Label>
                             <Textarea
                                id="user-inputs"
                                placeholder="Enter all relevant details here. For example:&#10;- Name: John Doe, Age: 45, Address: 123 Main St, Anytown&#10;- Statement: I affirm that the information provided is true..."
                                value={userInputs}
                                onChange={(e) => setUserInputs(e.target.value)}
                                rows={10}
                             />
                        </div>
                         <Button onClick={handleDraft} disabled={isLoading} className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent/90">
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Draft...</> : "Generate Draft"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div>
                 <Card className="bg-white shadow-none border-border h-full">
                    <CardHeader>
                        <CardTitle>Generated Draft</CardTitle>
                        <CardDescription>Review the AI-generated draft below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && (
                             <div className="space-y-4 p-6">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        )}
                        {generatedDraft && (
                            <div className="space-y-4">
                                <Textarea value={generatedDraft} readOnly rows={15} className="bg-background"/>
                                <div className="flex gap-4">
                                     <Button onClick={handleDownloadTxt} variant="outline">Download .txt</Button>
                                     <Button disabled variant="outline">Download .pdf (Coming Soon)</Button>
                                </div>
                            </div>
                        )}
                         {!isLoading && !generatedDraft && (
                            <div className="text-center text-muted-foreground py-16">
                                <p>Your generated draft will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>

    </main>
  );
}