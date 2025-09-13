"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import dynamic from "next/dynamic";
import { type DocumentData } from "@/lib/types";
import { Loader2 } from "lucide-react";
import LexeaseLayout from "@/components/layout/lexease-layout";
import { Skeleton } from "@/components/ui/skeleton";

const LexeaseApp = dynamic(() => import('@/components/lexease-app'), {
  ssr: false,
  loading: () => <AnalysisPlaceholder />,
});

const AnalysisPlaceholder = () => (
    <div className="p-10">
        <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-20 w-full" />
        </div>
    </div>
);


export default function DocumentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchDocument = async () => {
      if (!documentId || !user) return;
      setLoading(true);
      try {
        const docRef = doc(db, "documents", documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDocument({ id: docSnap.id, ...data } as DocumentData);
        } else {
          setError("Document not found.");
        }
      } catch (err) {
        setError("Failed to fetch document.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <LexeaseLayout>
        {document && <LexeaseApp existingDocument={document} />}
    </LexeaseLayout>
  );
}
