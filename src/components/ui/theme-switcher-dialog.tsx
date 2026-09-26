"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Monitor,
  Sun,
  Moon,
  Compass,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export type UIThemeId =
  | "dark"
  | "theme-clean-precision"
  | "theme-aerospace-hud"
  | "theme-amber-terminal"
  | "theme-cyberpunk";

export interface UIThemeOption {
  id: UIThemeId;
  name: string;
  tagline: string;
  previewBg: string;
  previewCard: string;
  previewBorder: string;
  previewAccent: string;
  previewText: string;
  isOriginal?: boolean;
}

export const THEME_OPTIONS: UIThemeOption[] = [
  {
    id: "dark",
    name: "NO Obsidian Titanium (Current Default)",
    tagline: "Industrial aerospace dark mode with cool steel accents and low glare.",
    previewBg: "#090d16",
    previewCard: "#131b2c",
    previewBorder: "#27354f",
    previewAccent: "#93c5fd",
    previewText: "#e2e8f0",
    isOriginal: true,
  },
  {
    id: "theme-clean-precision",
    name: "Swiss Precision White",
    tagline: "High-contrast architectural white with crisp sapphire blue accents for daytime engineering.",
    previewBg: "#f4f6fa",
    previewCard: "#ffffff",
    previewBorder: "#d1d9e6",
    previewAccent: "#2563eb",
    previewText: "#0f172a",
  },
  {
    id: "theme-aerospace-hud",
    name: "Aerospace Tactical HUD",
    tagline: "Deep space avionics cockpit with luminous cyan telemetry and grid markers.",
    previewBg: "#030712",
    previewCard: "#081024",
    previewBorder: "#0c4a6e",
    previewAccent: "#0284c7",
    previewText: "#bae6fd",
  },
  {
    id: "theme-amber-terminal",
    name: "Apollo Guidance Amber CRT",
    tagline: "Classic NASA mission control amber phosphor CRT monochrome palette.",
    previewBg: "#0f0904",
    previewCard: "#1f1408",
    previewBorder: "#452a0a",
    previewAccent: "#f59e0b",
    previewText: "#fde68a",
  },
  {
    id: "theme-cyberpunk",
    name: "Electric Matrix Neon",
    tagline: "High-voltage violet obsidian with glowing laser-emerald hardware diagnostics.",
    previewBg: "#090514",
    previewCard: "#170e2b",
    previewBorder: "#4c1d95",
    previewAccent: "#10b981",
    previewText: "#d1fae5",
  },
];

const THEME_STORAGE_KEY = "no_studio_theme_v2";

export function applyThemeClass(themeId: UIThemeId) {
  const root = document.documentElement;
  // Remove existing theme classes
  THEME_OPTIONS.forEach((t) => {
    if (t.id === "dark") {
      root.classList.remove("dark");
    } else {
      root.classList.remove(t.id);
    }
  });

  // Apply new theme class
  if (themeId === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.add(themeId);
    if (themeId !== "theme-clean-precision") {
      root.classList.add("dark");
    }
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (err) {
    // localStorage might be blocked or private browsing
  }
}

export function ThemeSwitcherDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentTheme, setCurrentTheme] = useState<UIThemeId>("dark");
  const [selectedTheme, setSelectedTheme] = useState<UIThemeId>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as UIThemeId | null;
      if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
        setCurrentTheme(saved);
        setSelectedTheme(saved);
        applyThemeClass(saved);
      } else {
        applyThemeClass("dark");
      }
    } catch {
      applyThemeClass("dark");
    }
  }, []);

  if (!open) return null;

  const handleApply = (themeId: UIThemeId) => {
    setSelectedTheme(themeId);
    setCurrentTheme(themeId);
    applyThemeClass(themeId);
    const chosen = THEME_OPTIONS.find((t) => t.id === themeId);
    toast.success(`UI Theme changed to: ${chosen?.name}`);
    onOpenChange(false);
  };

  const handleKeepCurrent = () => {
    applyThemeClass(currentTheme);
    toast.info(`Keeping current UI theme: ${THEME_OPTIONS.find((t) => t.id === currentTheme)?.name}`);
    onOpenChange(false);
  };

  const handleResetToOriginal = () => {
    handleApply("dark");
    toast.success("Restored original NO Obsidian Titanium dark UI!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-card p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Studio Appearance & UI Theme
              </h2>
              <p className="text-xs text-muted-foreground">
                Switch the entire studio interface to an alternate aesthetic, or keep the original.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Theme Options Cards */}
        <div className="flex flex-col gap-2.5">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            const isCurrentlyActive = currentTheme === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`flex items-start justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                    : "border-border hover:border-border/80 hover:bg-muted/40"
                }`}
              >
                {/* Visual Swatch Preview */}
                <div
                  className="w-14 h-14 rounded-md border flex flex-col p-1 gap-1 shrink-0 overflow-hidden shadow-inner"
                  style={{
                    backgroundColor: theme.previewBg,
                    borderColor: theme.previewBorder,
                  }}
                >
                  <div
                    className="w-full h-2 rounded-xs"
                    style={{ backgroundColor: theme.previewAccent }}
                  />
                  <div
                    className="w-full flex-1 rounded-xs p-0.5 flex flex-col gap-0.5"
                    style={{ backgroundColor: theme.previewCard }}
                  >
                    <div
                      className="w-3/4 h-1 rounded-xs"
                      style={{ backgroundColor: theme.previewText, opacity: 0.8 }}
                    />
                    <div
                      className="w-1/2 h-1 rounded-xs"
                      style={{ backgroundColor: theme.previewAccent, opacity: 0.6 }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground">
                      {theme.name}
                    </span>
                    {theme.isOriginal && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        ORIGINAL
                      </span>
                    )}
                    {isCurrentlyActive && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {theme.tagline}
                  </p>
                </div>

                {/* Selection Radio / Action */}
                <div className="shrink-0 flex items-center pt-1">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions: Keep Current vs Apply */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 mt-1">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleKeepCurrent}
              className="text-xs gap-1.5 font-semibold"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Keep This One
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToOriginal}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Original
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleApply(selectedTheme)}
              className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              <Palette className="h-3.5 w-3.5" />
              Apply UI Theme
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
