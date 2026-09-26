"use client";

import React, { useState, useEffect } from "react";
import {
  GitBranch,
  Star,
  GitFork,
  AlertCircle,
  Folder,
  FileText,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Play,
  Terminal,
  RefreshCw,
  BookOpen,
  Code2,
  Share2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

interface CuratedRepo {
  owner: string;
  repo: string;
  title: string;
  category: "Science" | "Chemistry" | "Electronics" | "Aerospace" | "Math" | "CAD/EDA";
  description: string;
  highlightFiles: string[];
}

const CURATED_REPOS: CuratedRepo[] = [
  {
    owner: "scipy",
    repo: "scipy",
    title: "SciPy Core Scientific Library",
    category: "Science",
    description: "Fundamental algorithms for scientific computing in Python: numerical integration, ODE solvers, optimization, linear algebra, and signal processing.",
    highlightFiles: ["scipy/integrate", "scipy/optimize", "scipy/signal"],
  },
  {
    owner: "rdkit",
    repo: "rdkit",
    title: "RDKit Cheminformatics",
    category: "Chemistry",
    description: "Open-source cheminformatics and machine learning for molecular descriptors, 2D/3D chemical geometry, fingerprinting, and reaction modeling.",
    highlightFiles: ["rdkit/Chem", "rdkit/SimDivFilters", "Code/GraphMol"],
  },
  {
    owner: "sympy",
    repo: "sympy",
    title: "SymPy Symbolic Mathematics",
    category: "Math",
    description: "Full-featured computer algebra system (CAS) for symbolic calculus, ODE/PDE solutions, matrix algebra, quantum physics, and equation simplification.",
    highlightFiles: ["sympy/calculus", "sympy/solvers", "sympy/physics"],
  },
  {
    owner: "circuitjs",
    repo: "circuitjs1",
    title: "CircuitJS1 Electronic Simulator Engine",
    category: "Electronics",
    description: "The complete source code of the famous electronic circuit simulator, including SPICE matrix solvers, scope engines, and semiconductor models.",
    highlightFiles: ["src/com/lushprojects/circuitjs1/client"],
  },
  {
    owner: "nasa",
    repo: "cFS",
    title: "NASA Core Flight System (cFS)",
    category: "Aerospace",
    description: "NASA's open-source flight software framework used across real deep space satellites, CubeSats, and planetary rovers.",
    highlightFiles: ["cfe", "osal", "apps"],
  },
  {
    owner: "deepchem",
    repo: "deepchem",
    title: "DeepChem Drug Discovery & Materials",
    category: "Chemistry",
    description: "Democratizing deep learning for molecular property prediction, crystal graph convolutional networks, and quantum chemistry.",
    highlightFiles: ["deepchem/models", "deepchem/feat", "deepchem/data"],
  },
  {
    owner: "KiCad",
    repo: "kicad-source-mirror",
    title: "KiCad EDA PCB Design Suite",
    category: "CAD/EDA",
    description: "The world's leading open-source schematic capture and printed circuit board (PCB) layout software suite.",
    highlightFiles: ["pcbnew", "eeschema", "common"],
  },
  {
    owner: "OpenFOAM",
    repo: "OpenFOAM-dev",
    title: "OpenFOAM Computational Fluid Dynamics",
    category: "Science",
    description: "The premier free open source CFD software for continuum mechanics, compressible aerodynamics, and multiphase combustion.",
    highlightFiles: ["src/finiteVolume", "applications/solvers"],
  },
];

interface FileItem {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  download_url: string;
}

interface RepoDetails {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stars: number;
  forks: number;
  open_issues: number;
  language: string;
  default_branch: string;
  updated_at: string;
  license: string;
  topics: string[];
}

export function GithubStealerHub({
  onSendCodeToPython,
}: {
  onSendCodeToPython?: (code: string) => void;
}) {
  const [repoInput, setRepoInput] = useState<string>("scipy/scipy");
  const [currentOwner, setCurrentOwner] = useState<string>("scipy");
  const [currentRepo, setCurrentRepo] = useState<string>("scipy");
  const [repoDetails, setRepoDetails] = useState<RepoDetails | null>(null);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string; path: string } | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [viewTab, setViewTab] = useState<"files" | "readme" | "code">("files");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Load repo info
  const loadRepo = async (owner: string, repo: string) => {
    setLoading(true);
    setErrorMsg("");
    setSelectedFile(null);
    setCurrentPath("");
    try {
      const [repoRes, treeRes, readmeRes] = await Promise.all([
        fetch(`/api/github/repo?owner=${owner}&repo=${repo}`),
        fetch(`/api/github/contents?owner=${owner}&repo=${repo}&path=`),
        fetch(`/api/github/readme?owner=${owner}&repo=${repo}`),
      ]);

      if (!repoRes.ok) {
        throw new Error(`Failed to load repo ${owner}/${repo}: ${repoRes.statusText}`);
      }

      const repoData = await repoRes.json();
      setRepoDetails(repoData);

      if (treeRes.ok) {
        const treeData = await treeRes.json();
        if (treeData.type === "dir") {
          setFileList(treeData.items || []);
        }
      }

      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        setReadmeContent(readmeData.readme || "");
      } else {
        setReadmeContent("No README found or rate limit reached.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to fetch repository from GitHub");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepo(currentOwner, currentRepo);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = repoInput.trim();
    if (cleaned.startsWith("https://github.com/")) {
      cleaned = cleaned.replace("https://github.com/", "");
    }
    const parts = cleaned.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1];
      setCurrentOwner(owner);
      setCurrentRepo(repo);
      loadRepo(owner, repo);
    } else {
      toast.error("Please enter a valid GitHub repository in the format 'owner/repo' or URL");
    }
  };

  const handleSelectCurated = (curated: CuratedRepo) => {
    setRepoInput(`${curated.owner}/${curated.repo}`);
    setCurrentOwner(curated.owner);
    setCurrentRepo(curated.repo);
    loadRepo(curated.owner, curated.repo);
  };

  const handleNavigatePath = async (path: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/github/contents?owner=${currentOwner}&repo=${currentRepo}&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.type === "dir") {
        setCurrentPath(path);
        setFileList(data.items || []);
        setViewTab("files");
      } else if (data.type === "file") {
        setSelectedFile({
          name: data.name,
          content: data.content,
          path: data.path,
        });
        setViewTab("code");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load directory");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split("/");
    parts.pop();
    const parentPath = parts.join("/");
    handleNavigatePath(parentPath);
  };

  const handleCopyCode = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${selectedFile.name}`);
  };

  const handleRunInPython = () => {
    if (!selectedFile) return;
    if (onSendCodeToPython) {
      onSendCodeToPython(selectedFile.content);
      toast.success("Loaded into Live Python Console!");
    } else {
      navigator.clipboard.writeText(selectedFile.content);
      toast.success("Code copied! Paste into Live Python Console.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-purple-500/20 px-2 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/30">
                GITHUB REPO STEALER & LIVE IMPORTER
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Real Live GitHub API (No Mock Data)
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
              Direct Open-Source Repository Integration & Code Extraction
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground max-w-3xl">
              Inspect, browse, and extract real source code, mathematical algorithms, and scientific implementations directly from public GitHub repositories—or paste any custom repo link.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="owner/repo (e.g. sympy/sympy)"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                className="pl-9 h-9 text-xs font-mono bg-background/80"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 px-4 text-xs font-semibold gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Fetch
            </Button>
          </form>
        </div>

        {/* Curated Repo Quick-Picks */}
        <div className="mt-4 pt-3 border-t border-border/40">
          <div className="text-[11px] font-mono text-muted-foreground uppercase mb-2">
            Top Curated Science & Engineering Repositories (1-Click Inspect):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
            {CURATED_REPOS.map((c) => {
              const active = c.owner === currentOwner && c.repo === currentRepo;
              return (
                <button
                  key={`${c.owner}/${c.repo}`}
                  onClick={() => handleSelectCurated(c)}
                  className={`p-1.5 rounded border text-left transition-all ${
                    active
                      ? "border-purple-500 bg-purple-500/20 text-foreground font-bold shadow-sm"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <div className="text-[11px] truncate font-mono">{c.repo}</div>
                  <div className="text-[9px] uppercase text-muted-foreground truncate">{c.category}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg border border-red-500/50 bg-red-950/30 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Repo Details Header Card */}
      {repoDetails && (
        <div className="rounded-lg border border-border/70 bg-card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground font-mono">{repoDetails.full_name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
                  {repoDetails.license}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                  {repoDetails.language || "Multi-lingual"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-3xl">{repoDetails.description}</p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <span>{repoDetails.stars.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <GitFork className="h-3.5 w-3.5" />
                <span>{repoDetails.forks.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" />
                <span>{repoDetails.default_branch}</span>
              </div>
              <a
                href={repoDetails.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub
              </a>
            </div>
          </div>

          {/* Sub-tabs: Files / Code / Readme */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <button
              onClick={() => setViewTab("files")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                viewTab === "files" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              File Tree {currentPath && `(/${currentPath})`}
            </button>
            <button
              onClick={() => setViewTab("readme")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                viewTab === "readme" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              README.md
            </button>
            {selectedFile && (
              <button
                onClick={() => setViewTab("code")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                  viewTab === "code" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Selected File: {selectedFile.name}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
        {/* VIEW TAB 1: FILE TREE */}
        {viewTab === "files" && (
          <div className="p-4 space-y-3">
            {/* Breadcrumb path */}
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded border border-border/50 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-foreground font-bold">{currentRepo}</span>
                <span>/</span>
                <span>{currentPath || "root"}</span>
              </div>
              {currentPath && (
                <Button variant="ghost" size="sm" onClick={handleNavigateUp} className="h-6 text-xs">
                  ↑ Parent Directory
                </Button>
              )}
            </div>

            {/* File List Grid */}
            <div className="divide-y divide-border/40 border border-border/60 rounded-md overflow-hidden max-h-[500px] overflow-y-auto font-mono text-xs">
              {fileList.length === 0 && !loading && (
                <div className="p-6 text-center text-muted-foreground">No files in this directory.</div>
              )}
              {fileList.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigatePath(item.path)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-muted/50 text-left transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    {item.type === "dir" ? (
                      <Folder className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
                    ) : (
                      <FileText className="h-4 w-4 text-slate-400 group-hover:text-foreground" />
                    )}
                    <span className={item.type === "dir" ? "font-bold text-foreground" : "text-muted-foreground group-hover:text-foreground"}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                    {item.size > 0 && <span>{(item.size / 1024).toFixed(1)} KB</span>}
                    <span className="text-[10px] uppercase">{item.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW TAB 2: CODE VIEWER */}
        {viewTab === "code" && selectedFile && (
          <div className="space-y-0">
            {/* Action Bar */}
            <div className="flex items-center justify-between bg-muted/40 p-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono font-bold text-foreground">{selectedFile.path}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedFile.name.endsWith(".py") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRunInPython}
                    className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Play className="h-3 w-3 fill-emerald-400" />
                    Send to Python Runner
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleCopyCode} className="h-7 text-xs gap-1">
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy Code"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadFile} className="h-7 text-xs gap-1">
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 bg-black/90 font-mono text-xs overflow-x-auto max-h-[600px] overflow-y-auto leading-relaxed">
              <pre className="text-slate-200">
                <code>{selectedFile.content || "(Empty file)"}</code>
              </pre>
            </div>
          </div>
        )}

        {/* VIEW TAB 3: README VIEWER */}
        {viewTab === "readme" && (
          <div className="p-5 max-h-[600px] overflow-y-auto space-y-4">
            <div className="text-xs font-mono text-muted-foreground uppercase pb-2 border-b border-border/40 flex items-center justify-between">
              <span>Official Repository Documentation (README.md)</span>
              <a
                href={repoDetails?.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs flex items-center gap-1"
              >
                View on GitHub <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-xs font-sans leading-relaxed whitespace-pre-wrap text-slate-300">
              {readmeContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
