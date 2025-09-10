import Header from '@/components/layout/header';
import LexeaseApp from '@/components/lexease-app';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <LexeaseApp />
      </main>
    </div>
  );
}
