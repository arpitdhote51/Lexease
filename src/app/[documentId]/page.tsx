"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import LexeaseApp from "@/components/lexease-app";
import { type DocumentData } from "@/components/dashboard";
import { Loader2 } from "lucide-react";
import LexeaseLayout from "@/components/layout/lexease-layout";

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
          // Since auth is disabled, we don't need to check for user.uid
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
