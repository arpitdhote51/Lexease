
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import LexeaseLayout from "@/components/layout/lexease-layout";
import { type DocumentData } from "@/components/dashboard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DocumentListItem({ doc, onSelect, onDelete }: { doc: DocumentData, onSelect: (docId: string) => void, onDelete: (docId: string) => void }) {
    const analysisComplete = !!doc.analysis;
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(doc.id);
        // The component will unmount, so no need to set isDeleting to false
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-border flex items-center gap-4 transition-shadow hover:shadow-md">
            <div className="p-3 bg-background rounded-lg">
                <span className="material-symbols-outlined text-primary">description</span>
            </div>
            <div className="flex-1 cursor-pointer" onClick={() => onSelect(doc.id)}>
                <h3 className="font-semibold text-foreground truncate">{doc.fileName}</h3>
                <p className="text-sm text-muted-foreground">
                    Uploaded on {doc.createdAt?.toDate ? format(doc.createdAt.toDate(), "yyyy-MM-dd") : 'N/A'}
                </p>
                <div className="mt-2 h-2 bg-background rounded-full">
                    <div className={`h-2 ${analysisComplete ? 'bg-accent' : 'bg-yellow-400'} rounded-full`} style={{ width: analysisComplete ? '100%' : '60%' }}></div>
                </div>
                 <p className="text-xs text-muted-foreground mt-1">{analysisComplete ? 'Analysis Complete' : 'Analysis in Progress...'}</p>
            </div>
            <div className="flex items-center gap-2">
                {doc.analysis?.risks?.riskyClauses?.length > 0 && 
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">{doc.analysis.risks.riskyClauses.length} risk(s)</span>
                }
                <Button variant="outline" size="icon" onClick={() => onSelect(doc.id)}>
                    <Eye className="h-4 w-4" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the document
                                and its associated analysis data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

export default function AllDocumentsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [documents, setDocuments] = useState<DocumentData[]>([]);
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
            console.error("Error fetching all documents: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [user]);

    const handleSelectDocument = (docId: string) => {
        router.push(`/${docId}`);
    };
    
    const handleNewAnalysis = () => {
        router.push("/new");
    };

    const handleDeleteDocument = async (docId: string) => {
        try {
            await deleteDoc(doc(db, "documents", docId));
            // Refetch documents to update the list
            fetchDocuments();
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
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
                            <DocumentListItem key={doc.id} doc={doc} onSelect={handleSelectDocument} onDelete={handleDeleteDocument} />
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
