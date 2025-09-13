import LexeaseLayout from "@/components/layout/lexease-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <LexeaseLayout>
        <main className="flex-1 p-10 overflow-y-auto">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-primary">Contact Us</h1>
                <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
                    We're here to help. Reach out to us with your questions, feedback, or inquiries.
                </p>
            </header>

            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-white shadow-none border-border">
                        <CardHeader className="flex-row items-center gap-4">
                            <Mail className="h-8 w-8 text-primary"/>
                            <div>
                                <CardTitle className="text-lg">Email</CardTitle>
                                <CardDescription>support@lexease.com</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                     <Card className="bg-white shadow-none border-border">
                        <CardHeader className="flex-row items-center gap-4">
                            <Phone className="h-8 w-8 text-primary"/>
                             <div>
                                <CardTitle className="text-lg">Phone</CardTitle>
                                <CardDescription>+1 (555) 123-4567</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                     <Card className="bg-white shadow-none border-border">
                        <CardHeader className="flex-row items-center gap-4">
                            <MapPin className="h-8 w-8 text-primary"/>
                             <div>
                                <CardTitle className="text-lg">Office</CardTitle>
                                <CardDescription>123 Legal Tech Avenue, Silicon Valley, CA</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="bg-white shadow-lg border-border">
                        <CardHeader>
                            <CardTitle className="text-2xl">Send us a Message</CardTitle>
                            <CardDescription>We'll get back to you as soon as possible.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-foreground">Full Name</Label>
                                        <Input id="name" name="name" placeholder="John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-foreground">Email Address</Label>
                                        <Input id="email" name="email" type="email" placeholder="john.doe@example.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject" className="text-foreground">Subject</Label>
                                    <Input id="subject" name="subject" placeholder="Feedback on AI Analysis" />
                                </div>
                                <div className="spacey-2">
                                    <Label htmlFor="message" className="text-foreground">Message</Label>
                                    <Textarea id="message" name="message" placeholder="Please type your message here..." rows={6} />
                                </div>
                                <Button type="submit" className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent/90">
                                    Send Message
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </LexeaseLayout>
  );
}
