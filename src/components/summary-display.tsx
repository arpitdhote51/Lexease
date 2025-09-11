import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryDisplayProps {
  summary: string;
}

export default function SummaryDisplay({ summary }: SummaryDisplayProps) {
  return (
    <Card className="mt-4 bg-white border-border shadow-none">
      <CardHeader>
        <CardTitle className="font-bold text-lg text-foreground">Plain Language Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap font-body leading-relaxed text-foreground/90">
          {summary}
        </p>
      </CardContent>
    </Card>
  );
}
