import React from "react";
import { Cpu } from "lucide-react";

export function NoMark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 font-bold tracking-wider font-mono ${className || ""}`}>
      <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
        <Cpu className="h-3.5 w-3.5" />
      </div>
      <span className="text-foreground text-sm font-extrabold">NO</span>
    </div>
  );
}
