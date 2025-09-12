"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type DocumentData = {
  id: string;
  fileName: string;
  createdAt: any;
  documentText: string;
  userId?: string;
  analysis?: {
    summary: { plainLanguageSummary: string };
    entities: { entities: { type: string; value: string }[] };
    risks: { riskyClauses: string[] };
  };
};

function DocumentCard({ doc, onSelect }: { doc: DocumentData, onSelect: (doc: DocumentData) => void }) {
  const analysisComplete = !!doc.analysis;
  const cardStyles = "bg-white p-5 rounded-xl border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer";
  
  return (
    <div onClick={() => onSelect(doc)} className={cardStyles}>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-background rounded-lg">
          <span className="material-symbols-outlined text-primary">description</span>
        </div>
        <div>
          <h3 className="font-semibold text-foreground truncate">{doc.fileName}</h3>
          <p className="text-sm text-muted-foreground">
            Uploaded on {doc.createdAt?.toDate ? format(doc.createdAt.toDate(), "yyyy-MM-dd") : 'N/A'}
          </p>
        </div>
      </div>
      <div className="h-2 bg-background rounded-full mb-3">
        <div 
          className={`h-2 ${analysisComplete ? 'bg-accent' : 'bg-yellow-400'} rounded-full`} 
          style={{ width: analysisComplete ? '100%' : '60%' }}
        ></div>
      </div>
      <p className="text-xs text-center text-muted-foreground">{analysisComplete ? 'Analysis Complete' : 'Analysis in Progress...'}</p>
    </div>
  );
}

function UploadNewCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center bg-transparent border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:bg-white hover:border-accent hover:text-accent transition-colors cursor-pointer min-h-[164px]"
    >
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl">add_circle</span>
        <p className="mt-1 font-medium">Upload New</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait until auth state is confirmed
    if (!user) return; // Don't fetch if no user

    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "documents"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const docsData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as DocumentData)
        );
        setDocuments(docsData);
      } catch (error) {
        console.error("Error fetching documents: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [user, authLoading]);

  const handleNewAnalysis = () => {
    router.push("/new");
  };

  const handleSelectDocument = (doc: DocumentData) => {
    router.push(`/${doc.id}`);
  };

  // Filter documents on the client-side
  const recentDocuments = documents.slice(0, 3);
  const keyInsights = documents.filter(d => d.analysis && d.analysis.summary).slice(0, 2);
  const flaggedRisks = documents
    .filter(d => d.analysis && d.analysis.risks && d.analysis.risks.riskyClauses.length > 0)
    .slice(0, 2);

  return (
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your legal documents.</p>
          </div>
          <Button onClick={handleNewAnalysis} className="bg-accent text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined">upload_file</span>
            Upload Document
          </Button>
        </header>

        {isLoading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
          <div className="space-y-12">
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Recently Uploaded Documents</h2>
                <Link href="/documents" className="text-accent font-semibold hover:underline">View all</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {recentDocuments.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onSelect={handleSelectDocument} />
                ))}
                <UploadNewCard onClick={handleNewAnalysis} />
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Key Insights</h2>
                   <Link href="/documents" className="text-accent font-semibold hover:underline">View all</Link>
                </div>
                <div className="space-y-4">
                  {keyInsights.length > 0 ? keyInsights.map(doc => (
                     <div key={doc.id} onClick={() => handleSelectDocument(doc)} className="bg-white p-4 rounded-xl border border-border flex items-center gap-4 transition-shadow hover:shadow-md cursor-pointer">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <span className="material-symbols-outlined text-blue-600">summarize</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Summary of {doc.fileName}</h3>
                            <p className="text-sm text-muted-foreground">Generated on {doc.createdAt?.toDate ? format(doc.createdAt.toDate(), "yyyy-MM-dd") : 'N/A'}</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 ml-auto">chevron_right</span>
                    </div>
                  )) : <p className="text-muted-foreground">No insights generated yet.</p>}
                </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Flagged Risks</h2>
                   <Link href="/documents" className="text-accent font-semibold hover:underline">View all</Link>
                </div>
                 <div className="space-y-4">
                  {flaggedRisks.length > 0 ? flaggedRisks.flatMap(doc => 
                    doc.analysis!.risks.riskyClauses.slice(0,1).map((risk, index) => (
                      <div key={`${doc.id}-${index}`} onClick={() => handleSelectDocument(doc)} className="bg-white p-4 rounded-xl border border-red-200 flex items-center gap-4 transition-shadow hover:shadow-md cursor-pointer">
                        <div className="p-3 bg-red-100 rounded-lg">
                          <span className="material-symbols-outlined text-red-600">flag</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-red-800 truncate">{risk}</h3>
                          <p className="text-sm text-red-600">In {doc.fileName}, High Risk</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 ml-auto">chevron_right</span>
                      </div>
                    ))
                  ) : <p className="text-muted-foreground">No risks flagged yet.</p>}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
  );
}
