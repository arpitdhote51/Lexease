"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Dashboard from '@/components/dashboard';
import LexeaseLayout from '@/components/layout/lexease-layout';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <LexeaseLayout>
      <Dashboard />
    </LexeaseLayout>
  );
}
