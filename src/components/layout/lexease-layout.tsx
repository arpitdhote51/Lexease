import Header from "./header";
import ChatHistorySidebar from "./chat-history-sidebar";

interface LexeaseLayoutProps {
    children: React.ReactNode;
}

export default function LexeaseLayout({ children }: LexeaseLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <ChatHistorySidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1">
            {children}
        </main>
      </div>
    </div>
  );
}
