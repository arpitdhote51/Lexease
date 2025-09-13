
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, BookOpen, Scale, FileText, Search, Languages, Shield, Briefcase, GitBranch, ArrowRight } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Up-to-Date Knowledge Base",
    description: "Access all Central and major State statutes, rules, regulations, and current judicial decisions from top courts and tribunals.",
  },
  {
    icon: Scale,
    title: "Procedural Law Expertise",
    description: "Understands and applies civil, criminal, and tribunal procedural laws, including limitation periods and e-filing protocols.",
  },
  {
    icon: Search,
    title: "Precise Legal Research",
    description: "Locates headnotes, ratio decidendi, and dicta with accurate Indian citation conventions (SCC, AIR, CriLJ).",
  },
  {
    icon: FileText,
    title: "Advanced Document Drafting",
    description: "Drafts petitions, briefs, contracts, and notices using standardized Indian clause libraries with version control.",
  },
  {
    icon: Languages,
    title: "Multilingual Support",
    description: "Offers support in English, Hindi, and regional languages, understanding legal idioms and local court etiquettes.",
  },
  {
    icon: Shield,
    title: "Confidentiality & Compliance",
    description: "Ensures strict confidentiality, performs conflict checks, and complies with the DPDP Act to mitigate bias.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-white border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <h1 className="text-2xl font-bold text-primary font-headline">LexEase</h1>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/new" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Start Analysis
          </Link>
          <Link href="/draft" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Draft Document
          </Link>
          <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            About
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter text-primary sm:text-5xl xl:text-6xl/none font-headline">
                    Your AI-Powered Legal Co-Pilot for Indian Law
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    LexEase is a highly capable AI legal assistant designed for Indian legal professionals, equipped with a comprehensive, up-to-date knowledge base and advanced analytical capabilities.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/new">
                      Start Your Legal Analysis
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative hidden lg:block">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-3xl opacity-20"></div>
                 <Scale className="relative w-48 h-48 mx-auto text-primary opacity-60"/>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Key Capabilities</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-primary">
                  Designed for the Modern Indian Legal Professional
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  LexEase integrates powerful AI with a deep understanding of India's legal landscape to provide unparalleled support.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-12">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border shadow-none hover:shadow-lg transition-shadow bg-background/50">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-accent/10 p-3 rounded-full">
                            <feature.icon className="h-6 w-6 text-accent" />
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary font-headline">
                Streamline Your Legal Workflow Today
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Leverage the power of AI to conduct faster research, draft more efficiently, and build stronger arguments. Get started with LexEase.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/new">
                  Analyze Your First Document
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 LexEase. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
