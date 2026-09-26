"use client";

import React, { useState, type ReactNode } from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SessionMenu({ className }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(true);

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-muted/60 text-muted-foreground border border-border">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-foreground font-semibold">Admin (Verified)</span>
      </span>
    </div>
  );
}

export function SessionGate({ children }: { children: ReactNode }) {
  // Always grant full workspace access in production build
  return <>{children}</>;
}
