
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generalLegalQA } from "@/ai/flows/general-legal-qa";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function LexyChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm Lexy, your AI legal assistant. Ask me any general legal question about Indian law.",
        },
      ]);
    }
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            const viewport = scrollAreaRef.current.querySelector('div');
            if (viewport) {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const currentInput = input;
    if (!currentInput.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: currentInput };
    setMessages(prev => [...prev, userMessage]);
    
    setInput("");
    setIsLoading(true);

    try {
        const result = await generalLegalQA({ question: currentInput });
        const assistantMessage: Message = { role: "assistant", content: result.answer };
        setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
        console.error("General Q&A failed:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not get an answer. Please try again." });
        setMessages(prev => prev.slice(0, -1));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="h-[60vh] w-full flex flex-col bg-white/50 shadow-lg rounded-2xl border border-border/50 backdrop-blur-sm">
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={`msg-${index}`}
                className={`flex items-start gap-4 text-left ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-3 max-w-2xl text-sm shadow-md ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/80"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-body leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
                 <div className="flex items-start gap-4 text-left">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback><Bot size={20} /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-4 py-3 max-w-sm bg-background/80 shadow-md flex items-center space-x-2">
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse"></span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-4 bg-background/20 rounded-b-2xl">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about Indian Law..."
                disabled={isLoading}
                className="text-base h-12 flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="bg-accent hover:bg-accent/90 h-12 px-6">
                <Send className="h-5 w-5" />
              </Button>
            </form>
        </div>
    </div>
  );
}
