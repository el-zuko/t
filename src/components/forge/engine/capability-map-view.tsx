"use client";

import React, { useState } from "react";
import {
  ENGINEERING_CAPABILITY_MAP,
  DomainCapability,
} from "./capability-map-data";
import {
  Zap,
  Wrench,
  Wind,
  FlaskConical,
  Cpu,
  Search,
  CheckCircle2,
  ExternalLink,
  FileCode,
  Download,
  Copy,
  Check,
  Play,
  Layers,
  Database,
  ShieldCheck,
  Binary,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export function CapabilityMapView({
  onSendCodeToPython,
}: {
  onSendCodeToPython?: (code: string) => void;
}) {
  const [selectedDomainId, setSelectedDomainId] = useState<string>("electrical");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedArtifact, setCopiedArtifact] = useState<boolean>(false);

  const activeDomain =
    ENGINEERING_CAPABILITY_MAP.find((d) => d.id === selectedDomainId) ||
    ENGINEERING_CAPABILITY_MAP[0];

  const filteredDomains = ENGINEERING_CAPABILITY_MAP.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const inName = d.domainName.toLowerCase().includes(q);
    const inTools = d.tools.some(
      (t) => t.name.toLowerCase().includes(q) || t.primaryCapability.toLowerCase().includes(q)
    );
    const inStandards = d.standards.some(
      (s) => s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
    );
    return inName || inTools || inStandards;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedArtifact(true);
    toast.success("Copied simulation deck to clipboard!");
    setTimeout(() => setCopiedArtifact(false), 2000);
  };

  const handleDownloadCode = (filename: string, code: string) => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <div className="space-y-4">
      {/* Search & Domain Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search software (KiCad, OpenFOAM, CalculiX, Cantera, RDKit, ngspice) or standards (IPC, ASME, ISO)..."
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>5 Domains • 24 Verified Engines • 100% Real Software</span>
        </div>
      </div>

      {/* Domain Cards Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {filteredDomains.map((domain) => {
          const isSelected = domain.id === activeDomain.id;
          return (
            <button
              key={domain.id}
              onClick={() => setSelectedDomainId(domain.id)}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                  : "border-border/70 bg-card hover:border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-foreground truncate">{domain.domainName}</span>
                {domain.id === "electrical" && <Zap className="h-4 w-4 text-amber-400 shrink-0" />}
                {domain.id === "mechanical_fea" && <Wrench className="h-4 w-4 text-blue-400 shrink-0" />}
                {domain.id === "fluid_cfd" && <Wind className="h-4 w-4 text-cyan-400 shrink-0" />}
                {domain.id === "chemistry_process" && <FlaskConical className="h-4 w-4 text-purple-400 shrink-0" />}
                {domain.id === "robotics_multibody" && <Cpu className="h-4 w-4 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                {domain.tagline}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {domain.tools.slice(0, 3).map((t) => (
                  <span key={t.name} className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground">
                    {t.name}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Domain Deep Dive */}
      <div className="space-y-4">
        {/* Banner with Governing Physics */}
        <div className="rounded-xl border border-border bg-gradient-to-r from-slate-900 to-indigo-950/40 p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-foreground">{activeDomain.domainName}</h3>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary border border-primary/30">
                  REAL COMPUTATIONAL ENGINE MATRIX
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{activeDomain.tagline}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase font-bold text-blue-400">
                Governing Differential & Physical Laws:
              </span>
              <ul className="space-y-1 text-slate-300">
                {activeDomain.governingPhysics.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-400">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase font-bold text-amber-400">
                Certified Industry Codes & Standards:
              </span>
              <div className="space-y-1.5">
                {activeDomain.standards.map((s) => (
                  <div key={s.code} className="text-[11px] bg-black/40 p-1.5 rounded border border-border/50">
                    <span className="font-mono font-bold text-amber-300">{s.code} ({s.organization}): </span>
                    <span className="text-slate-300">{s.title} — </span>
                    <span className="text-muted-foreground">{s.relevance}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real Software & Open-Source Tools Grid */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-primary" />
              Verified Open-Source & Industry Software Suite ({activeDomain.tools.length} Tools)
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">Direct CLI & API Integrations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeDomain.tools.map((tool) => (
              <div
                key={tool.name}
                className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      {tool.name}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {tool.license}
                      </span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {tool.category}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {tool.primaryCapability}
                  </p>

                  <div className="mt-2.5 p-1.5 bg-black/60 rounded text-[11px] font-mono text-slate-300 border border-border/40">
                    <div className="text-[9px] uppercase text-muted-foreground font-mono">CLI Invocations:</div>
                    <code className="text-emerald-400">{tool.cliOrApi}</code>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-1 flex-wrap">
                    {tool.supportedFormats.map((fmt) => (
                      <span key={fmt} className="text-[10px] font-mono px-1 rounded bg-muted/60 text-muted-foreground">
                        {fmt}
                      </span>
                    ))}
                  </div>
                  <a
                    href={tool.githubOrSite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                  >
                    Repository <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Standard File Formats & Authoritative Datasets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* File Formats */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Binary className="h-3.5 w-3.5 text-blue-400" />
              Standard Interchange File Formats
            </div>
            <div className="space-y-2">
              {activeDomain.fileFormats.map((fmt) => (
                <div key={fmt.ext} className="p-2 rounded-lg bg-muted/30 border border-border/60 flex items-start gap-2.5">
                  <span className="px-2 py-1 rounded bg-black/60 font-mono text-xs font-bold text-sky-400 shrink-0">
                    {fmt.ext}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-foreground">{fmt.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{fmt.purpose}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Authoritative Datasets & APIs */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              Grounded Reference Datasets & APIs
            </div>
            <div className="space-y-2">
              {activeDomain.datasets.map((ds) => (
                <div key={ds.name} className="p-2 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{ds.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {ds.curator}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <span className="text-muted-foreground font-mono">Data: </span>
                    {ds.dataType}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <span className="text-emerald-400 font-mono">Relevance: </span>
                    {ds.relevance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real Production Simulation Deck Artifact */}
        <div className="rounded-xl border border-border bg-black/90 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-muted/40 border-b border-border/60">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" />
              <div>
                <span className="text-xs font-mono font-bold text-foreground">
                  {activeDomain.sampleArtifact.filename} ({activeDomain.sampleArtifact.format})
                </span>
                <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                  — {activeDomain.sampleArtifact.title}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeDomain.sampleArtifact.format.includes("Python") && onSendCodeToPython && (
                <Button
                  size="sm"
                  onClick={() => onSendCodeToPython(activeDomain.sampleArtifact.code)}
                  className="h-7 text-xs gap-1 bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Send to Live Python
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyCode(activeDomain.sampleArtifact.code)}
                className="h-7 text-xs gap-1"
              >
                {copiedArtifact ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copiedArtifact ? "Copied" : "Copy Deck"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadCode(activeDomain.sampleArtifact.filename, activeDomain.sampleArtifact.code)}
                className="h-7 text-xs gap-1"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </div>
          </div>

          <div className="p-4 font-mono text-xs overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed">
            <pre className="text-slate-200">
              <code>{activeDomain.sampleArtifact.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
