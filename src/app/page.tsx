"use client";

import Dashboard from '@/components/dashboard';
import LexeaseLayout from '@/components/layout/lexease-layout';

export default function Home() {
  // Authentication is temporarily disabled via useAuth hook returning a mock user.
  // The app will directly render the dashboard.
  return (
    <LexeaseLayout>
      <Dashboard />
    </LexeaseLayout>
  );
}
