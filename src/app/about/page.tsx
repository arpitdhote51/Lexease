import LexeaseLayout from "@/components/layout/lexease-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Target, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <LexeaseLayout>
        <main className="flex-1 p-10 overflow-y-auto">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-primary">About LexEase</h1>
                <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
                    Simplifying legal complexity with the power of artificial intelligence, making law accessible to everyone.
                </p>
            </header>

            <div className="max-w-4xl mx-auto">
                <Card className="bg-white shadow-lg border-border">
                    <CardContent className="p-10 space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3"><Building className="text-primary"/>Our Company</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                LexEase was founded by a team of legal professionals and AI experts who recognized a critical gap in the legal landscape: accessibility. We believe that understanding legal documents shouldn't require a law degree. Our mission is to empower individuals and businesses by transforming dense legal jargon into clear, actionable insights. We're dedicated to building tools that foster transparency, reduce risk, and save valuable time and resources for our users.
                            </p>
                        </section>

                         <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3"><Target className="text-primary"/>Our Mission</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Our core mission is to democratize legal information. We strive to provide an intuitive platform that not only summarizes and analyzes legal texts but also educates users, helping them navigate contracts, agreements, and other legal documents with confidence. By flagging potential risks and identifying key entities, we aim to be an indispensable co-pilot for anyone dealing with legal matters, from laypersons to seasoned lawyers.
                            </p>
                        </section>
                        
                         <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3"><Users className="text-primary"/>Our Team</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We are a passionate group of innovators, thinkers, and problem-solvers. Our diverse team brings together expertise from the fields of law, artificial intelligence, software engineering, and user experience design. We thrive on collaboration and are united by a shared goal: to build a smarter, more accessible legal future for everyone.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </main>
    </LexeaseLayout>
  );
}
