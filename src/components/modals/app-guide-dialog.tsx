import React from "react";
import { Sparkles, X, Box, CircuitBoard, Cpu, Layers, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppGuideDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-bold text-foreground">NO Studio Quick Guide</h3>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              <Box className="h-4 w-4 text-primary" />
              1. Universal Hardware Synthesis
            </h4>
            <p>
              Type ANY hardware, robot, drone, solar inverter, or medical wearable into the prompt bar to generate complete 3D solid assemblies, real LCSC BOMs, and governing mathematical physics.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              <CircuitBoard className="h-4 w-4 text-sky-400" />
              2. Direct Fabrication & Gerber Package
            </h4>
            <p>
              Download 4-layer Gerber RS-274X archives, Excellon drill decks, and JLCPCB/PCBWay centroid (CPL) files with automated rotation offset alignment.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-400" />
              3. Virtual Oscilloscope & Live Probing
            </h4>
            <p>
              Probe high-frequency PWM switch nodes, 3.3V DC rails, motor phase coils, and ultrasonic echoes with animated CRT waveforms and FFT spectrum analyzers.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button size="sm" onClick={() => onOpenChange(false)} className="font-bold">
            Got it, Let's Build
          </Button>
        </div>
      </div>
    </div>
  );
}
