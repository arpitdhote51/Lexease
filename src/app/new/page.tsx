"use client";

import LexeaseLayout from "@/components/layout/lexease-layout";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

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


export default function NewAnalysisPage() {
  return (
    <LexeaseLayout>
      <LexeaseApp />
    </LexeaseLayout>
  );
}
