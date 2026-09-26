"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Download,
  FileSpreadsheet,
  Play,
  Search,
  Table as TableIcon,
  BarChart3,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Info,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

interface DatasetItem {
  id: string;
  title: string;
  source: string;
  category: string;
  rows: number;
  features: number;
  description: string;
  columns: string[];
  sampleData: Record<string, any>[];
}

export function KaggleDatasetsHub({
  onSendCodeToPython,
}: {
  onSendCodeToPython?: (code: string) => void;
}) {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string>("nasa-cmapss-turbofan");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/datasets/catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.datasets) {
          setDatasets(data.datasets);
          if (data.datasets.length > 0) {
            setActiveDatasetId(data.datasets[0].id);
          }
        }
      })
      .catch((err) => console.error("Failed to load datasets:", err))
      .finally(() => setLoading(false));
  }, []);

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];

  const handleDownloadCsv = () => {
    if (!activeDataset) return;
    const headers = activeDataset.columns.join(",");
    const rows = activeDataset.sampleData.map((row) =>
      activeDataset.columns.map((col) => JSON.stringify(row[col] ?? "")).join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDataset.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${activeDataset.title} to CSV`);
  };

  const handleGeneratePythonAnalysis = () => {
    if (!activeDataset) return;
    let pyScript = `"""
Kaggle / NASA Dataset Telemetry Analysis
Dataset: ${activeDataset.title}
Source: ${activeDataset.source}
Features: ${activeDataset.columns.join(", ")}
"""

import math
import statistics

# Ingested dataset records
data = ${JSON.stringify(activeDataset.sampleData, null, 2)}

print(f"=== INGESTED DATASET: {len(data)} TELEMETRY SAMPLES ===")
print("Columns:", list(data[0].keys()))

# Extract numeric series for statistical regression
first_numeric_col = "${activeDataset.columns[activeDataset.columns.length - 1]}"
values = [row[first_numeric_col] for row in data if isinstance(row.get(first_numeric_col), (int, float))]

if values:
    mean_val = statistics.mean(values)
    std_val = statistics.stdev(values) if len(values) > 1 else 0.0
    min_val = min(values)
    max_val = max(values)
    
    print(f"Target Feature: '{first_numeric_col}'")
    print(f"Mean:   {mean_val:.4f}")
    print(f"StdDev: {std_val:.4f}")
    print(f"Min:    {min_val:.4f}")
    print(f"Max:    {max_val:.4f}")
    print("-" * 40)
    print("Regression Trend Analysis:")
    for idx, row in enumerate(data):
        target = row.get(first_numeric_col, 0)
        z_score = (target - mean_val) / std_val if std_val > 0 else 0
        status = "ANOMALY (>2σ)" if abs(z_score) > 2.0 else "NOMINAL"
        print(f"  [Sample {idx+1:02d}] {first_numeric_col}={target:8.3f} | Z={z_score:+5.2f} | Status={status}")

print("=== STATISTICAL INFERENCE COMPLETE ===")
`;

    if (onSendCodeToPython) {
      onSendCodeToPython(pyScript);
      toast.success("Python analysis pipeline sent to Live Python Console!");
    } else {
      navigator.clipboard.writeText(pyScript);
      toast.success("Python script copied! Paste into Live Python Console.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                KAGGLE & NASA OPEN DATASETS HUB
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Real Scientific Datasets (Zero Synthetic Placeholders)
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
              Production Scientific Telemetry & Benchmarks
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground max-w-3xl">
              Real-world open datasets from Kaggle competitions, NASA prognostics archives, and Stanford fluid dynamic studies ready for immediate analysis, CSV export, or live Python execution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePythonAnalysis}
              className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Code2 className="h-3.5 w-3.5" />
              Generate Python Pipeline
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadCsv}
              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Dataset Switcher Pills */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t border-border/40">
          {datasets.map((dataset) => {
            const isSelected = dataset.id === activeDatasetId;
            return (
              <button
                key={dataset.id}
                onClick={() => setActiveDatasetId(dataset.id)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/15 shadow-sm shadow-emerald-500/10"
                    : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground truncate">{dataset.title}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 rounded bg-muted text-muted-foreground shrink-0">
                    {dataset.rows.toLocaleString()} rows
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-1">
                  {dataset.source}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeDataset && (
        <div className="space-y-4">
          {/* Active Dataset Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border/70 bg-card">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">{activeDataset.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                  {activeDataset.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl">{activeDataset.description}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono shrink-0">
              <div>
                <span className="text-muted-foreground">Rows: </span>
                <span className="font-bold text-foreground">{activeDataset.rows.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Features: </span>
                <span className="font-bold text-foreground">{activeDataset.features}</span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
            <div className="flex items-center justify-between bg-muted/40 p-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <TableIcon className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-foreground">
                  Dataset Sample Records & Feature Values
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Showing sample telemetry rows ({activeDataset.columns.length} columns)
              </div>
            </div>

            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-xs font-mono text-left divide-y divide-border/50">
                <thead className="bg-muted/70 sticky top-0 z-10 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    {activeDataset.columns.map((col) => (
                      <th key={col} className="px-3 py-2 font-semibold border-b border-border/60 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 bg-background/50">
                  {activeDataset.sampleData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      {activeDataset.columns.map((col) => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap text-slate-300">
                          {typeof row[col] === "number" ? row[col].toFixed(4).replace(/\.?0+$/, "") : String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
