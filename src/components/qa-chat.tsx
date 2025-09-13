
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Bot, Mic, Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { interactiveQA, InteractiveQAInput } from "@/ai/flows/interactive-qa";
import { textToSpeech } from "@/ai/flows/text-to-speech";
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
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            scrollAreaRef.current!.scrollTo({ top: scrollAreaRef.current!.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  }, []);

  useEffect(() => {
    // With auth disabled, documentId will be 'temp-id' and we don't fetch history.
    // If you re-enable auth, this will work for persisted documents.
    if (!documentId || documentId === 'temp-id') return;

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
      if (error.code !== 'failed-precondition') {
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

  const handlePlayAudio = async (text: string, messageId: string) => {
    if (audioPlaying === messageId) {
        audioRef.current?.pause();
        setAudioPlaying(null);
        return;
    }
    
    setAudioLoading(messageId);
    try {
        const { audioDataUri } = await textToSpeech({ text });
        if (audioRef.current) {
            audioRef.current.src = audioDataUri;
            audioRef.current.play();
            setAudioPlaying(messageId);
            audioRef.current.onended = () => setAudioPlaying(null);
        }
    } catch (error) {
        console.error("TTS failed:", error);
        toast({ variant: "destructive", title: "Audio Playback Failed" });
    } finally {
        setAudioLoading(null);
    }
  };

  const startRecognition = () => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecognizing(false);
        recognitionRef.current = null;
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        toast({ variant: 'destructive', title: 'Speech recognition not supported' });
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecognizing(true);
    recognition.onend = () => {
        setIsRecognizing(false);
        recognitionRef.current = null;
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      toast({ variant: 'destructive', title: 'Speech Recognition Error' });
    };

    let finalTranscript = '';
    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        setInput(finalTranscript + interimTranscript);
        if(finalTranscript){
            setInput(finalTranscript);
        }
    };
    
    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const currentInput = input;
    if (!currentInput.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: currentInput };
    setMessages(prev => [...prev, userMessage]);
    
    setInput("");
    setIsLoading(true);

    try {
        const qaInput: InteractiveQAInput = { documentText, question: currentInput };
        const result = await interactiveQA(qaInput);
        const assistantMessage: Message = { role: "assistant", content: result.answer };
        setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
        console.error("Q&A failed:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not get an answer. Please try again." });
        setMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="h-[70vh] flex flex-col mt-4 bg-white border-border shadow-none">
      <CardHeader>
        <CardTitle className="font-bold text-lg text-foreground">Interactive Q&amp;A</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id || `msg-${index}`}
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
                  className={`rounded-lg p-3 max-w-lg text-sm relative group ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-body leading-relaxed">{message.content}</p>
                   {message.role === "assistant" && (
                     <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -bottom-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handlePlayAudio(message.content, message.id || `msg-audio-${index}`)}
                        disabled={audioLoading !== null}
                    >
                       {audioLoading === (message.id || `msg-audio-${index}`) ? <Loader2 className="animate-spin" /> : <Volume2 size={16} />}
                    </Button>
                   )}
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
          <Button type="button" variant={isRecognizing ? "destructive" : "outline"} size="icon" onClick={startRecognition} disabled={isLoading}>
              <Mic className="h-4 w-4" />
          </Button>
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-accent hover:bg-accent/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
         <audio ref={audioRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
