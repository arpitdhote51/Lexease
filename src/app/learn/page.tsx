import LexeaseLayout from "@/components/layout/lexease-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PlayCircle, Clock } from "lucide-react";
import Image from "next/image";

const videos = [
  {
    title: "Understanding Contract Law: The Basics",
    description: "A 10-minute guide to the essential elements of a legally binding contract, from offer to acceptance.",
    thumbnail: "https://picsum.photos/seed/video1/600/400",
    duration: "10:32",
    href: "#"
  },
  {
    title: "Navigating Intellectual Property for Startups",
    description: "Learn how to protect your brand, inventions, and creative works. A must-watch for founders.",
    thumbnail: "https://picsum.photos/seed/video2/600/400",
    duration: "15:10",
    href: "#"
  },
  {
    title: "The Importance of a Well-Drafted Will",
    description: "Discover why a will is crucial for estate planning and the key components to include.",
    thumbnail: "https://picsum.photos/seed/video3/600/400",
    duration: "8:45",
    href: "#"
  },
   {
    title: "Decoding the Fine Print: Common Clauses",
    description: "An overview of common legal clauses like liability, indemnity, and jurisdiction in under 12 minutes.",
    thumbnail: "https://picsum.photos/seed/video4/600/400",
    duration: "11:54",
    href: "#"
  },
   {
    title: "Real Estate 101: Understanding Property Deeds",
    description: "A simple breakdown of what a property deed is, the different types, and why they matter.",
    thumbnail: "https://picsum.photos/seed/video5/600/400",
    duration: "9:20",
    href: "#"
  },
    {
    title: "Employment Agreements: What to Look For",
    description: "Key terms and conditions to watch out for before you sign an employment contract.",
    thumbnail: "https://picsum.photos/seed/video6/600/400",
    duration: "14:05",
    href: "#"
  }
];

export default function LearnLawPage() {
  return (
    <LexeaseLayout>
        <main className="flex-1 p-10 overflow-y-auto">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-primary">Learn Law with LexEase</h1>
                <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
                    Expand your legal knowledge with our curated library of short, easy-to-understand videos.
                </p>
            </header>
            
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {videos.map((video, index) => (
                        <Link href={video.href} key={index}>
                            <Card className="bg-white h-full border-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col overflow-hidden rounded-xl">
                                <div className="relative">
                                    <Image 
                                        src={video.thumbnail} 
                                        alt={video.title} 
                                        width={600}
                                        height={400}
                                        className="object-cover w-full h-48"
                                        data-ai-hint="legal books"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <PlayCircle className="h-16 w-16 text-white/80" />
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                                        <Clock className="h-3 w-3"/>
                                        <span>{video.duration}</span>
                                    </div>
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-foreground leading-snug">{video.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground">{video.description}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    </LexeaseLayout>
  );
}
