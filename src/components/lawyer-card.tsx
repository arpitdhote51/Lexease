"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star } from "lucide-react";
import type { Lawyer } from "@/app/consult/page";

interface LawyerCardProps {
  lawyer: Lawyer;
}

export default function LawyerCard({ lawyer }: LawyerCardProps) {
  const router = useRouter();

  const handleBookConsultation = () => {
    router.push(`/consult/confirmation?lawyerId=${lawyer.id}`);
  };

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-start gap-5">
          <Image
            src={lawyer.avatarUrl}
            alt={lawyer.name}
            width={80}
            height={80}
            className="rounded-full border-4 border-background"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-foreground">{lawyer.name}</h3>
                <p className="text-sm text-muted-foreground">{lawyer.designation}</p>
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-bold text-sm">{lawyer.rating.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-sm text-foreground mt-1">{lawyer.experience} years of experience</p>
          </div>
        </div>

        <div className="mt-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Specializations</h4>
            <div className="flex flex-wrap gap-2">
                {lawyer.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="font-normal">{spec}</Badge>
                ))}
            </div>
        </div>

        <div className="mt-4 p-4 bg-background rounded-lg">
            <p className="text-sm italic text-foreground/80">"{lawyer.testimonial}"</p>
        </div>

         <p className="text-xs text-muted-foreground mt-4 text-right">Jurisdiction: {lawyer.location}</p>

      </div>
       <div className="bg-background/50 p-4">
            <Button onClick={handleBookConsultation} className="w-full bg-accent text-white font-semibold rounded-lg hover:bg-accent/90">
                Book Consultation
            </Button>
       </div>
    </div>
  );
}
