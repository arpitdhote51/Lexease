
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import LexeaseApp from "./lexease-app";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { FileText, Loader2, PlusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type DocumentData = {
  id: string;
  fileName: string;
  createdAt: any;
  documentText: string;
  analysis: {
    summary: { plainLanguageSummary: string };
    entities: { entities: { type: string; value: string }[] };
    risks: { riskyClauses: string[] };
  };
};

export default function Dashboard() {
  const { user } = useAuth();
  const [view, setView] = useState<"dashboard" | "new_analysis">("dashboard");
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "documents"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as DocumentData)
      );
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && view === "dashboard") {
      fetchDocuments();
    }
  }, [user, view]);

  const handleNewAnalysis = () => {
    setSelectedDocument(null);
    setView("new_analysis");
  };

  const handleSelectDocument = (doc: DocumentData) => {
    setSelectedDocument(doc);
    setView("new_analysis");
  };
  
  const handleAnalysisComplete = () => {
      setView('dashboard');
  }

  if (view === "new_analysis") {
    return <LexeaseApp onAnalysisComplete={handleAnalysisComplete} existingDocument={selectedDocument} />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline">My Documents</CardTitle>
                <CardDescription>
                    Here are all the legal documents you've analyzed.
                </CardDescription>
            </div>
          <Button onClick={handleNewAnalysis}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by analyzing your first document.</p>
                <Button className="mt-6" onClick={handleNewAnalysis}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Analyze New Document
                </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card 
                    key={doc.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectDocument(doc)}
                >
                  <CardHeader>
                    <CardTitle className="font-headline text-lg truncate flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {doc.fileName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Analyzed{" "}
                      {doc.createdAt?.toDate ? formatDistanceToNow(doc.createdAt.toDate(), {
                        addSuffix: true,
                      }) : 'a while ago'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
