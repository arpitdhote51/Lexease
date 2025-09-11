"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PlusCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { DocumentData } from "@/components/dashboard";
import { Skeleton } from "../ui/skeleton";

export default function ChatHistorySidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const activeDocumentId = params.documentId;

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const q = query(
      collection(db, "documents"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as DocumentData)
      );
      setDocuments(docs);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching documents:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNewAnalysis = () => {
    router.push("/new");
  };

  return (
    <aside className="h-screen w-64 flex-col border-r bg-card p-4 flex">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-headline font-semibold">History</h2>
        <Button size="sm" variant="ghost" onClick={handleNewAnalysis}>
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 -mx-4">
        <div className="px-4 space-y-2">
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : documents.length > 0 ? (
            documents.map((doc) => (
                <Link key={doc.id} href={`/${doc.id}`} passHref>
                    <div
                        className={cn(
                        "flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm truncate",
                        doc.id === activeDocumentId
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                    >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{doc.fileName}</span>
                    </div>
                </Link>
            ))
            ) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                    No documents analyzed yet.
                </div>
            )}
        </div>
      </ScrollArea>
    </aside>
  );
}
