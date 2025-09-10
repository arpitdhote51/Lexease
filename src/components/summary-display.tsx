import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryDisplayProps {
  summary: string;
}

export default function SummaryDisplay({ summary }: SummaryDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Plain Language Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap font-body leading-relaxed text-foreground/90">
          {summary}
        </p>
      </CardContent>
    </Card>
  );
}
