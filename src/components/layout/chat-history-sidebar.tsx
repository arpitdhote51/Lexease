"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type DocumentData } from "@/components/dashboard";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatHistorySidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchDocuments = async () => {
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
        console.error("Error fetching documents for sidebar: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  const handleNewAnalysis = () => {
    router.push("/new");
  };

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col">
      <div className="px-6 py-5 border-b border-border flex justify-between items-center">
        <Link href="/">
          <h1 className="text-xl font-bold text-primary">LexEase</h1>
        </Link>
      </div>

      <div className="p-4">
        <Button onClick={handleNewAnalysis} className="w-full bg-accent text-white font-semibold rounded-lg hover:bg-accent/90">
            <span className="material-symbols-outlined mr-2">add</span>
            New Analysis
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="p-4 pt-0 space-y-2">
            <Link href="/" className={`flex items-center gap-3 px-4 py-2.5 rounded-md font-medium ${pathname === '/' ? 'bg-background text-accent' : 'text-muted-foreground hover:bg-background'}`}>
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
            </Link>

            {isLoading ? (
                <div className="space-y-2 px-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                </div>
            ) : documents.length > 0 ? (
                documents.map(doc => (
                    <Link key={doc.id} href={`/${doc.id}`} className={`flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm truncate ${pathname === `/${doc.id}` ? 'bg-background text-accent' : 'text-muted-foreground hover:bg-background'}`}>
                        <span className="material-symbols-outlined text-base">description</span>
                        <span className="truncate">{doc.fileName}</span>
                    </Link>
                ))
            ) : (
                <p className="px-4 text-sm text-center text-muted-foreground mt-4">No documents analyzed yet.</p>
            )}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border mt-auto">
        <a href="#" onClick={(e) => { e.preventDefault(); signOut(); }} className="flex items-center gap-3 px-4 py-2.5 rounded-md text-red-500 hover:bg-red-50 font-medium">
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}
