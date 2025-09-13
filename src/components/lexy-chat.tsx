
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          content: "Hello! I'm Lexy, your AI legal assistant. Ask me any general legal question.",
        },
      ]);
    }
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            scrollAreaRef.current!.scrollTo({ top: scrollAreaRef.current!.scrollHeight, behavior: 'smooth' });
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
        // Optionally remove the user's message on failure
        // setMessages(prev => prev.slice(0, -1)); 
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="h-[450px] w-full max-w-md flex flex-col bg-white shadow-2xl rounded-2xl border-border">
      <CardHeader className="text-center">
        <CardTitle className="font-bold text-lg text-primary">Ask Lexy</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`msg-${index}`}
                className={`flex items-start gap-3 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 max-w-xs text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-body leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback><Bot size={20} /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 max-w-sm bg-background flex items-center space-x-2">
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse"></span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a legal question..."
            disabled={isLoading}
            className="text-base"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-accent hover:bg-accent/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
