
"use client";

import { Suspense } from 'react';
import LexeaseLayout from "@/components/layout/lexease-layout";
import { useSearchParams } from "next/navigation";
import lawyersData from "@/app/data/lawyers.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Video, Calendar, Clock } from "lucide-react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const lawyerId = searchParams.get("lawyerId");
  const lawyer = lawyersData.lawyers.find((l) => l.id === lawyerId);

  if (!lawyer) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-destructive">Lawyer not found.</h2>
        <p className="text-muted-foreground mt-2">
          Please go back and select a lawyer to book a consultation.
        </p>
        <Button asChild className="mt-6">
          <Link href="/consult">Back to Lawyers</Link>
        </Button>
      </div>
    );
  }
  
  // Placeholder date/time for demonstration
  const meetingTime = new Date();
  meetingTime.setHours(meetingTime.getHours() + 24);
  const formattedDate = meetingTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = meetingTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-2xl mx-auto">
        <Card className="bg-white shadow-lg border-green-200">
            <CardHeader className="text-center items-center pb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <CardTitle className="text-2xl font-bold text-primary">Consultation Booked!</CardTitle>
                <p className="text-muted-foreground pt-2">
                Your session with {lawyer.name} has been confirmed.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-background p-4 rounded-lg flex items-center gap-4">
                    <Image
                        src={lawyer.avatarUrl}
                        alt={lawyer.name}
                        width={60}
                        height={60}
                        className="rounded-full"
                    />
                    <div>
                        <h3 className="font-semibold text-lg text-foreground">{lawyer.name}</h3>
                        <p className="text-sm text-muted-foreground">{lawyer.designation}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-background p-4 rounded-lg flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold text-foreground">Date</p>
                            <p className="text-muted-foreground">{formattedDate}</p>
                        </div>
                    </div>
                     <div className="bg-background p-4 rounded-lg flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold text-foreground">Time</p>
                            <p className="text-muted-foreground">{formattedTime}</p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-muted-foreground mb-2">Your meeting link is ready:</p>
                    <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                        <a href="https://meet.google.com/lookup/placeholder" target="_blank" rel="noopener noreferrer">
                            <Video className="mr-2 h-5 w-5"/>
                            Join Google Meet
                        </a>
                    </Button>
                </div>
                
                <p className="text-xs text-center text-muted-foreground px-4">
                    A confirmation email with all the details has been sent to you and to {lawyer.email}. Please check your inbox.
                </p>

                 <div className="text-center pt-4">
                    <Button asChild variant="outline">
                        <Link href="/">Back to Dashboard</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

export default function ConfirmationPage() {
    return (
        <LexeaseLayout>
            <main className="flex-1 p-10 overflow-y-auto flex items-center justify-center">
                <Suspense fallback={<div>Loading...</div>}>
                    <ConfirmationContent />
                </Suspense>
            </main>
        </LexeaseLayout>
    );
}
