import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface RisksDisplayProps {
  risks: string[];
}

export default function RisksDisplay({ risks }: RisksDisplayProps) {

    if (!risks || risks.length === 0) {
        return (
            <Card className="mt-4 bg-white border-border shadow-none">
                <CardHeader>
                    <CardTitle className="font-bold text-lg text-foreground">Risk Flags</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No potential risks or unusual clauses were flagged in the document.</p>
                </CardContent>
            </Card>
        );
    }


  return (
    <Card className="mt-4 bg-white border-border shadow-none">
      <CardHeader>
        <CardTitle className="font-bold text-lg text-foreground">Potential Risk Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {risks.map((risk, index) => (
          <Alert key={index} variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Potential Risk Identified</AlertTitle>
            <AlertDescription className="font-body text-red-700">{risk}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
