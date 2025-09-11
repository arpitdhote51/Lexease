import ChatHistorySidebar from "./chat-history-sidebar";

interface LexeaseLayoutProps {
    children: React.ReactNode;
}

export default function LexeaseLayout({ children }: LexeaseLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <ChatHistorySidebar />
      <div className="flex flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
