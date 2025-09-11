"use client";

import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ChatHistorySidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleNewAnalysis = () => {
    router.push("/new");
  };

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col">
        <div className="px-6 py-5 border-b border-border">
            <h1 className="text-xl font-bold text-primary">LexEase</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-md bg-background text-accent font-semibold">
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
            </Link>
            <a href="#" onClick={(e) => {e.preventDefault(); handleNewAnalysis()}} className="flex items-center gap-3 px-4 py-2.5 rounded-md text-muted-foreground hover:bg-background font-medium">
                <span className="material-symbols-outlined">description</span>
                <span>Documents</span>
            </a>
            {/* These are placeholders for future features */}
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-muted-foreground hover:bg-background font-medium">
                <span className="material-symbols-outlined">summarize</span>
                <span>Summaries</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-muted-foreground hover:bg-background font-medium">
                <span className="material-symbols-outlined">lightbulb</span>
                <span>Explanations</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-muted-foreground hover:bg-background font-medium">
                <span className="material-symbols-outlined">flag</span>
                <span>Risks</span>
            </a>
        </nav>
        <div className="p-4 border-t border-border">
             <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-md text-muted-foreground hover:bg-background font-medium">
                <span className="material-symbols-outlined">settings</span>
                <span>Settings</span>
            </a>
             <a href="#" onClick={(e) => {e.preventDefault(); signOut()}} className="flex items-center gap-3 px-4 py-2.5 rounded-md text-red-500 hover:bg-red-50 font-medium mt-2">
                <span className="material-symbols-outlined">logout</span>
                <span>Logout</span>
            </a>
        </div>
    </aside>
  );
}
