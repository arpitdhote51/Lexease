
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, Mic, Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generalLegalQA } from "@/ai/flows/general-legal-qa";
import { textToSpeech } from "@/ai/flows/text-to-speech";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

export default function LexyChat() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isHomePage = pathname === '/';
  const initialPrompt = searchParams.get("q");

  useEffect(() => {
    const welcomeMessage = {
        role: "assistant" as const,
        content: "Hello! I'm Lexy, your AI legal assistant. Ask me any general legal question about Indian law.",
        id: "welcome-msg",
    };

    if (initialPrompt && messages.length === 0) {
      const userMessage: Message = { role: 'user', content: initialPrompt, id: `user-${Date.now()}` };
      const initialMessages = [welcomeMessage, userMessage];
      setMessages(initialMessages);
      fetchAnswer(initialPrompt, initialMessages);
    } else if (messages.length === 0) {
      setMessages([welcomeMessage]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            setTimeout(() => {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchAnswer = async (question: string, currentMessages: Message[]) => {
    setIsLoading(true);
    try {
        const result = await generalLegalQA({ question });
        const assistantMessage: Message = { role: "assistant", content: result.answer, id: `asst-${Date.now()}` };
        setMessages([...currentMessages, assistantMessage]);
    } catch (error) {
        console.error("General Q&A failed:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not get an answer. Please try again." });
        setMessages(prev => prev.slice(0, -1));
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const currentInput = input;
    if (!currentInput.trim() || isLoading) return;

    if (isHomePage) {
      router.push(`/lexy?q=${encodeURIComponent(currentInput)}`);
      return;
    }

    const userMessage: Message = { role: "user", content: currentInput, id: `user-${Date.now()}` };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    
    fetchAnswer(currentInput, newMessages);
  };
  
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


  return (
    <div className={`w-full flex flex-col bg-white/50 shadow-lg rounded-2xl border border-border/50 backdrop-blur-sm h-full`}>
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
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
                  className={`rounded-lg px-4 py-3 max-w-2xl text-sm shadow-md relative group ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/80"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-body leading-relaxed">{message.content}</p>
                   {message.role === "assistant" && (
                     <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -bottom-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handlePlayAudio(message.content, message.id!)}
                        disabled={audioLoading !== null}
                    >
                       {audioLoading === message.id ? <Loader2 className="animate-spin" /> : <Volume2 size={16} />}
                    </Button>
                   )}
                </div>
                 {message.role === "user" && (
                  <Avatar className="h-8 w-8 bg-muted text-muted-foreground">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                )}
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
               <Button type="button" variant={isRecognizing ? "destructive" : "outline"} size="icon" onClick={startRecognition} disabled={isLoading} className="h-12 w-12">
                  <Mic className="h-5 w-5" />
              </Button>
              <Button type="submit" disabled={isLoading || !input.trim()} className="bg-accent hover:bg-accent/90 h-12 px-6">
                <Send className="h-5 w-5" />
              </Button>
            </form>
        </div>
        <audio ref={audioRef} className="hidden" />
    </div>
  );
}
