
"use client";
import LexeaseLayout from "@/components/layout/lexease-layout";
import LawyerCard from "@/components/lawyer-card";
import lawyersData from "@/app/data/lawyers.json";

export type Lawyer = {
  id: string;
  name: string;
  designation: string;
  experience: number;
  specializations: string[];
  rating: number;
  testimonial: string;
  location: string;
  avatarUrl: string;
  email: string;
};

export default function ConsultPage() {
  const lawyers: Lawyer[] = lawyersData.lawyers;

  return (
    <LexeaseLayout>
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-primary">Consult with a Lawyer</h1>
          <p className="text-muted-foreground mt-1">
            Book a one-on-one session with a vetted legal expert.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lawyers.map((lawyer) => (
            <LawyerCard key={lawyer.id} lawyer={lawyer} />
          ))}
        </div>
      </main>
    </LexeaseLayout>
  );
}
