import LexeaseLayout from "@/components/layout/lexease-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Scale, FileText, Landmark } from "lucide-react";

const articles = [
  {
    title: "Understanding Contract Law: The Basics",
    description: "A foundational guide to the essential elements of a legally binding contract.",
    icon: FileText,
    category: "Contract Law",
    href: "#"
  },
  {
    title: "Navigating Intellectual Property for Startups",
    description: "Learn how to protect your brand, inventions, and creative works from the start.",
    icon: Landmark,
    category: "IP Law",
    href: "#"
  },
  {
    title: "The Importance of a Well-Drafted Will",
    description: "Discover why a will is crucial for estate planning and how to get started.",
    icon: Scale,
    category: "Family Law",
    href: "#"
  },
   {
    title: "Decoding the Fine Print: Common Clauses Explained",
    description: "An overview of common legal clauses like liability, indemnity, and jurisdiction.",
    icon: FileText,
    category: "General Law",
    href: "#"
  },
   {
    title: "Real Estate 101: Understanding Property Deeds",
    description: "A simple breakdown of what a property deed is and the different types.",
    icon: Landmark,
    category: "Property Law",
    href: "#"
  },
    {
    title: "Employment Agreements: What to Look For",
    description: "Key terms and conditions to watch out for before you sign an employment contract.",
    icon: Scale,
    category: "Employment Law",
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
                    Expand your legal knowledge with our curated library of articles and guides.
                </p>
            </header>
            
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article, index) => {
                        const Icon = article.icon;
                        return (
                            <Link href={article.href} key={index}>
                                <Card className="bg-white h-full border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer flex flex-col">
                                    <CardHeader className="flex-row items-start gap-4">
                                        <div className="p-3 bg-background rounded-lg mt-1">
                                            <Icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-foreground leading-snug">{article.title}</CardTitle>
                                            <p className="text-xs text-accent font-semibold mt-1">{article.category}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <p className="text-sm text-muted-foreground">{article.description}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </main>
    </LexeaseLayout>
  );
}
