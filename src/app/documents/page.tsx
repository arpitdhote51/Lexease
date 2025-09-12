
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import LexeaseLayout from "@/components/layout/lexease-layout";
import { type DocumentData } from "@/components/dashboard";
import Link from "next/link";

function DocumentListItem({ doc, onSelect }: { doc: DocumentData, onSelect: (docId: string) => void }) {
    const analysisComplete = !!doc.analysis;
    return (
        <div 
            onClick={() => onSelect(doc.id)}
            className="bg-white p-4 rounded-xl border border-border flex items-center gap-4 transition-shadow hover:shadow-md cursor-pointer">
            <div className="p-3 bg-background rounded-lg">
                <span className="material-symbols-outlined text-primary">description</span>
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-foreground truncate">{doc.fileName}</h3>
                <p className="text-sm text-muted-foreground">
                    Uploaded on {doc.createdAt?.toDate ? format(doc.createdAt.toDate(), "yyyy-MM-dd") : 'N/A'}
                </p>
                <div className="mt-2 h-2 bg-background rounded-full">
                    <div className={`h-2 ${analysisComplete ? 'bg-accent' : 'bg-yellow-400'} rounded-full`} style={{ width: analysisComplete ? '100%' : '60%' }}></div>
                </div>
                 <p className="text-xs text-muted-foreground mt-1">{analysisComplete ? 'Analysis Complete' : 'Analysis in Progress...'}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
                {doc.analysis?.risks?.riskyClauses?.length > 0 && 
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">{doc.analysis.risks.riskyClauses.length} risk(s)</span>
                }
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </div>
        </div>
    );
}

export default function AllDocumentsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const fetchDocuments = async () => {
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
                console.error("Error fetching all documents: ", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDocuments();
    }, [user]);

    const handleSelectDocument = (docId: string) => {
        router.push(`/${docId}`);
    };
    
    const handleNewAnalysis = () => {
        router.push("/new");
    };

    return (
        <LexeaseLayout>
            <main className="flex-1 p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">All Documents</h1>
                        <p className="text-muted-foreground mt-1">Browse and manage all your uploaded documents.</p>
                    </div>
                     <Button onClick={handleNewAnalysis} className="bg-accent text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 shadow-sm">
                        <span className="material-symbols-outlined">upload_file</span>
                        Upload New Document
                    </Button>
                </header>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : documents.length > 0 ? (
                    <div className="space-y-4">
                        {documents.map(doc => (
                            <DocumentListItem key={doc.id} doc={doc} onSelect={handleSelectDocument} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-border">
                        <span className="material-symbols-outlined text-6xl text-muted-foreground">folder_off</span>
                        <h2 className="mt-4 text-xl font-semibold text-foreground">No Documents Found</h2>
                        <p className="mt-2 text-muted-foreground">Get started by uploading your first document.</p>
                        <Button onClick={handleNewAnalysis} className="mt-6 bg-accent text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-accent/90">
                           Upload Document
                        </Button>
                    </div>
                )}
            </main>
        </LexeaseLayout>
    );
}
