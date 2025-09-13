
"use client";
import LexyChat from "@/components/lexy-chat";
import LexeaseLayout from "@/components/layout/lexease-layout";
import { Suspense } from "react";

function LexyChatPage() {
    return (
        <LexeaseLayout>
            <main className="flex-1 p-10 overflow-y-auto">
                 <header className="mb-8">
                    <h1 className="text-3xl font-bold text-primary">Lexy: AI Legal Assistant</h1>
                    <p className="text-muted-foreground mt-1">
                        Your dedicated space for interacting with Lexy on Indian legal matters.
                    </p>
                </header>
                <Suspense fallback={<div>Loading...</div>}>
                    <LexyChat />
                </Suspense>
            </main>
        </LexeaseLayout>
    );
}

export default LexyChatPage;
