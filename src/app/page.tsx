"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import Dashboard from '@/components/dashboard';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth');
      } else {
        setInitialLoad(false);
      }
    }
  }, [user, loading, router]);

  if (initialLoad) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return <Dashboard />;
}
