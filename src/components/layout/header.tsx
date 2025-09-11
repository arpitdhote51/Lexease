"use client";

import { useAuth } from "@/hooks/use-auth";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

    const handleNewAnalysis = () => {
        router.push("/new");
    };

  return (
    <header className="flex justify-between items-center p-4">
      <div>
        {/* Placeholder for breadcrumbs or page title if needed */}
      </div>
    </header>
  );
}
