
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { interactiveQA, InteractiveQAInput } from "@/ai/flows/interactive-qa";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

interface QAChatProps {
  documentText: string;
  documentId: string;
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: any;
}

export default function QAChat({ documentText, documentId }: QAChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            scrollAreaRef.current!.scrollTo({ top: scrollAreaRef.current!.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  }, []);

  useEffect(() => {
    if (!documentId) return;

    const messagesCol = collection(db, "documents", documentId, "messages");
    const q = query(messagesCol, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const history: Message[] = [];
       querySnapshot.forEach((doc) => {
         history.push({ id: doc.id, ...doc.data() } as Message);
       });
      setMessages(history);
      scrollToBottom();
    }, (error) => {
      console.error("Error fetching chat history: ", error);
      // If the collection doesn't exist, it might throw an error.
      // We can ignore this for a new document.
      if (error.code === 'failed-precondition') {
          console.log("Chat history collection doesn't exist yet.");
      } else {
          toast({
              variant: "destructive",
              title: "Error",
              description: "Could not load chat history."
          });
      }
    });

    return () => unsubscribe();
  }, [documentId, scrollToBottom, toast]);


  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input, timestamp: serverTimestamp() };
    
    setInput("");
    setIsLoading(true);

    try {
        const messagesCol = collection(db, "documents", documentId, "messages");
        // Add user message to Firestore optimistically
        await addDoc(messagesCol, userMessage);
        
        const qaInput: InteractiveQAInput = {
            documentText,
            question: input,
        };
        const result = await interactiveQA(qaInput);
        const assistantMessage: Message = { role: "assistant", content: result.answer, timestamp: serverTimestamp() };

        // Add assistant message to Firestore
        await addDoc(messagesCol, assistantMessage);

    } catch (error) {
        console.error("Q&A failed:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not get an answer. Please try again."
        });
        // Remove the optimistic user message if the API call fails
        setMessages(prev => prev.filter(msg => msg.content !== userMessage.content));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="h-[70vh] flex flex-col mt-4 bg-white border-border shadow-none">
      <CardHeader>
        <CardTitle className="font-bold text-lg text-foreground">Interactive Q&A</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
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
                  className={`rounded-lg p-3 max-w-lg text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-body leading-relaxed">{message.content}</p>
                </div>
                 {message.role === "user" && (
                  <Avatar className="h-8 w-8 bg-muted">
                    <AvatarFallback><User size={20} /></AvatarFallback>
                  </Avatar>
                )}
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
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the document..."
            disabled={isLoading || !documentText}
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
