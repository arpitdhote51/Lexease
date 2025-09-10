import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface RisksDisplayProps {
  risks: string[];
}

export default function RisksDisplay({ risks }: RisksDisplayProps) {

    if (!risks || risks.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Risk Flags</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No potential risks or unusual clauses were flagged in the document.</p>
                </CardContent>
            </Card>
        );
    }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Potential Risk Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {risks.map((risk, index) => (
          <Alert key={index} variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Potential Risk Identified</AlertTitle>
            <AlertDescription className="font-body">{risk}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
