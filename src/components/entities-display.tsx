import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyEntityRecognitionOutput } from "@/ai/flows/key-entity-recognition";
import { Users, Calendar, MapPin, Landmark, DollarSign, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EntitiesDisplayProps {
  entities: KeyEntityRecognitionOutput["entities"];
}

const entityIcons: { [key: string]: LucideIcon } = {
  party: Users,
  date: Calendar,
  location: MapPin,
  jurisdiction: Landmark,
  amount: DollarSign,
  default: FileText,
};

const getIconForType = (type: string) => {
  const lowerType = type.toLowerCase();
  for (const key in entityIcons) {
    if (lowerType.includes(key)) {
      return entityIcons[key];
    }
  }
  return entityIcons.default;
};


export default function EntitiesDisplay({ entities }: EntitiesDisplayProps) {

  const groupedEntities = entities.reduce((acc, entity) => {
    const type = entity.type || 'Uncategorized';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(entity.value);
    return acc;
  }, {} as Record<string, string[]>);


  if (!entities || entities.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">Key Entities</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No key entities were identified in the document.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Key Entities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedEntities).map(([type, values]) => {
          const Icon = getIconForType(type);
          return (
            <div key={type} className="space-y-2">
              <h3 className="flex items-center gap-2 text-md font-semibold font-headline">
                <Icon className="h-5 w-5 text-primary" />
                {type}
              </h3>
              <div className="flex flex-wrap gap-2">
                {values.map((value, index) => (
                    <Badge key={index} variant="secondary" className="font-normal font-body text-sm">
                        {value}
                    </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
