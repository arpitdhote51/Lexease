import { Scale } from "lucide-react";

export default function Header() {
  return (
    <header className="p-4 border-b bg-card">
      <div className="container mx-auto flex items-center gap-2">
        <Scale className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline text-foreground">
          LexEase
        </h1>
      </div>
    </header>
  );
}
