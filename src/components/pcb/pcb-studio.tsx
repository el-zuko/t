"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/shims/navigation";
import {
  CircuitBoard,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  Wand2,
  FileCode2,
  Layers,
  Calculator,
  ListTree,
  Table,
  Cpu,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Sliders,
  Box,
  Flame,
  Store,
  ShieldCheck,
  Settings,
  Share2,
  BookOpen,
  Atom,
  Terminal,
} from "lucide-react";

import {
  PRESET_ESP32_IOT_GATEWAY,
  PRESET_BUCK_CONVERTER,
  PRESET_ROBOTICS_MOTOR_CONTROLLER,
  PRESET_FLIGHT_CONTROLLER_AVIONICS,
  PRESET_SEWER_INSPECTION_ROBOT,
} from "@/lib/pcb/presets";
import { verifyPcbBoard, autoFixPcbBoard } from "@/lib/pcb/engine";
import {
  generateKiCadPcb,
  generateBomCsv,
  generateGerberPreview,
  downloadFile,
} from "@/lib/pcb/exporter";
import { generatePcbWithAi } from "@/lib/pcb/ai-service";
import { PcbCanvas } from "./pcb-canvas";
import { Astra6Visualizer } from "./astra6-visualizer";
import { DurabilityLab } from "./durability-lab";
import { MaterialsShop } from "./materials-shop";
import { FluxPcbModule } from "./flux-pcb-module";
import { EngineeringSuite } from "./engineering-suite";
import { KnowledgeGraphDashboard } from "@/components/brain/knowledge-graph-dashboard";
import { DocumentReadingAgent } from "@/components/brain/document-reading-agent";
import { NoItWorkflow } from "@/components/brain/no-it-workflow";
import type { PcbBoard } from "@/lib/pcb/types";
import { toast } from "@/components/ui/toast";
import { NoMark } from "@/components/no-logo";

export function PcbStudio() {
  const router = useRouter();
  // Active board state
  const [board, setBoard] = useState<PcbBoard>(PRESET_ESP32_IOT_GATEWAY);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "no-it" | "flux" | "graph" | "datasheet-agent" | "canvas" | "astra6" | "engineering" | "durability" | "shop" | "proofs" | "schematic" | "bom" | "export"
  >("no-it");
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.1-flash-lite");

  // Run deep physics DRC verification
  const verificationReport = useMemo(() => {
    return verifyPcbBoard(board);
  }, [board]);

  // Handle Preset Switching
  const handleSelectPreset = (presetKey: string) => {
    if (presetKey === "esp32") {
      setBoard(PRESET_ESP32_IOT_GATEWAY);
      toast.success("Loaded ESP32-S3 IoT Gateway Reference Circuit");
    } else if (presetKey === "buck") {
      setBoard(PRESET_BUCK_CONVERTER);
      toast.success("Loaded 12V/24V to 5V 3A Synchronous Buck Regulator");
    } else if (presetKey === "motor") {
      setBoard(PRESET_ROBOTICS_MOTOR_CONTROLLER);
      toast.success("Loaded 40A High-Power BLDC Robotics Inverter (Aluminum IMS)");
    } else if (presetKey === "flight") {
      setBoard(PRESET_FLIGHT_CONTROLLER_AVIONICS);
      toast.success("Loaded Aerospace 6-Layer Autopilot Flight Controller");
    } else if (presetKey === "sewer_robot" || presetKey === "sewer") {
      setBoard(PRESET_SEWER_INSPECTION_ROBOT);
      toast.success("Loaded Astra-Pipe IP68 Sewer Crawler & NDT Inspection Circuit");
    }
    setSelectedElement(null);
  };

  // Handle AI Generation
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) {
      toast.error("Please enter hardware instructions for the AI.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generatePcbWithAi({
        prompt: aiPrompt,
        modelTier: selectedModel as any,
      });
      setBoard(result.board);
      toast.success("Synthesized circuit schematic & PCB routing!");
      setActiveTab("canvas");
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle 1-Click Auto-Fix
  const handleAutoFix = () => {
    const fixedBoard = autoFixPcbBoard(board);
    setBoard(fixedBoard);
    toast.success("AI Auto-Fix Applied: Widened power traces, added ground stitching vias, and matched differential lengths.");
  };

  // Export handlers
  const handleDownloadKiCad = () => {
    const kicadText = generateKiCadPcb(board);
    downloadFile(kicadText, `${board.id}.kicad_pcb`, "text/plain");
    toast.success("Downloaded KiCad v8 PCB layout file.");
  };

  const handleDownloadBom = () => {
    const bomCsv = generateBomCsv(board);
    downloadFile(bomCsv, `${board.id}_BOM.csv`, "text/csv");
    toast.success("Downloaded Bill of Materials CSV.");
  };

  const handleDownloadGerber = () => {
    const gerber = generateGerberPreview(board);
    downloadFile(gerber, `${board.id}_F_Cu.gbr`, "text/plain");
    toast.success("Downloaded RS-274X Gerber preview.");
  };

  const totalCost = useMemo(() => {
    return board.components.reduce((sum, c) => sum + c.unitCostUsd, 0);
  }, [board.components]);

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Studio Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm">
            <NoMark className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-white">{board.title}</h1>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 border border-zinc-700">
                {board.layersCount}L • {board.substrate || "FR-4"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 line-clamp-1 max-w-xl">{board.description}</p>
          </div>
        </div>

        {/* Quality Gate Status Badge & Actions */}
        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-400 hidden sm:inline">Preset:</span>
            <select
              value={
                board.id.includes("flight")
                  ? "flight"
                  : board.id.includes("robotics")
                  ? "motor"
                  : board.id.includes("buck")
                  ? "buck"
                  : "esp32"
              }
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="esp32">ESP32-S3 IoT Gateway (Wi-Fi/BLE + USB-C)</option>
              <option value="buck">Sync Buck Converter (12V→5V @ 3A)</option>
              <option value="motor">40A BLDC Robotics Inverter (Aluminum IMS)</option>
              <option value="flight">Aerospace 6-Layer Autopilot (Dual IMU)</option>
            </select>
          </div>

          {/* Quick NO IT Autonomous One-Button Launcher */}
          <button
            onClick={() => setActiveTab("no-it")}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold shadow transition-colors"
            title="Launch NO IT Autonomous Hardware Engineering Pipeline"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>NO IT</span>
          </button>

          {/* Unlimited Board Specs Customizer Button */}
          <button
            onClick={() => setShowArchitectureModal(true)}
            className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
            title="Configure unlimited layers, dimensions, and substrate materials"
          >
            <Settings className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Board Specs</span>
          </button>

          {/* Quality DRC Score Pill */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
              verificationReport.criticalCount === 0
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            }`}
            title={verificationReport.summary}
          >
            {verificationReport.criticalCount === 0 ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
            )}
            <span>
              {verificationReport.score}% Physics DRC {verificationReport.criticalCount === 0 ? "PASSED" : "FLAW DETECTED"}
            </span>
          </div>

          {/* 1-Click Auto-Fix */}
          {verificationReport.criticalCount > 0 && (
            <button
              onClick={handleAutoFix}
              className="flex items-center gap-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 px-2.5 py-1 text-xs font-semibold shadow transition-colors animate-pulse"
              title="Automatically fix trace widths, capacitor locations, and differential lengths"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Auto-Fix Flaws</span>
            </button>
          )}

          {/* Cross-Module Quick Links */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 transition-colors"
              title="Open NO Omniverse Unified Scientific Superstation & Anti-Mock Reasoner"
            >
              <Atom className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Omniverse</span>
            </button>
            <button
              onClick={() => router.push("/product")}
              className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              title="View Complete Physical Mechatronic Product: CNC Enclosure, Motors, Seals, Fluidics & Full BOM"
            >
              <Box className="h-3.5 w-3.5" />
              <span>Full Product BOM</span>
            </button>
            <button
              onClick={() => router.push("/ide")}
              className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
              title="Open Hardware Firmware IDE for bare-metal C STM32/ESP32 programming"
            >
              <Terminal className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Firmware</span>
            </button>
            <button
              onClick={handleDownloadKiCad}
              className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
              title="Download KiCad PCB layout"
            >
              <Download className="h-3.5 w-3.5" />
              <span>KiCad</span>
            </button>
            <button
              onClick={handleDownloadBom}
              className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
              title="Download Bill of Materials CSV"
            >
              <Table className="h-3.5 w-3.5" />
              <span>BOM</span>
            </button>
          </div>
        </div>
      </header>

      {/* AI Prompt Input Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 p-2.5">
        <form onSubmit={handleGenerate} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold pl-1">
            <Sparkles className="h-4 w-4 text-zinc-400" />
            <span className="hidden sm:inline">PCB AI:</span>
          </div>

          <div className="relative flex-1 min-w-[280px]">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Design an ESP32-S3 board with USB-C PD, LiPo charger, and WS2812 status LED with verified 90-ohm differential traces..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Fast Hardware Synthesis)</option>
            <option value="gemini-3.8-flash">Gemini 3.8 Flash (STEM Math & DRC)</option>
          </select>

          <button
            type="submit"
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1.5 text-xs font-semibold shadow disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Cpu className="h-3.5 w-3.5" />
                <span>Generate PCB</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-4 text-xs overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("no-it")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "no-it"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>NO IT Brain</span>
          </button>

          <button
            onClick={() => setActiveTab("flux")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "flux"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CircuitBoard className="h-3.5 w-3.5 text-emerald-400" />
            <span>Flux Generative PCB</span>
          </button>

          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "graph"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Share2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Knowledge Graph</span>
          </button>

          <button
            onClick={() => setActiveTab("datasheet-agent")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "datasheet-agent"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>Datasheet OCR Agent</span>
          </button>

          <button
            onClick={() => setActiveTab("canvas")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "canvas"
                ? "border-zinc-200 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>2D Board Layout</span>
          </button>

          <button
            onClick={() => setActiveTab("astra6")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "astra6"
                ? "border-zinc-200 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Box className="h-3.5 w-3.5 text-zinc-300" />
            <span>Astra-6 True 3D</span>
          </button>

          <button
            onClick={() => setActiveTab("engineering")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "engineering"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            <span>Engineering Lab & SPICE</span>
          </button>

          <button
            onClick={() => setActiveTab("durability")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "durability"
                ? "border-zinc-200 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-zinc-300" />
            <span>What-If Durability</span>
          </button>

          <button
            onClick={() => setActiveTab("shop")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "shop"
                ? "border-zinc-200 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Store className="h-3.5 w-3.5 text-zinc-300" />
            <span>Shop Materials</span>
          </button>

          <button
            onClick={() => setActiveTab("proofs")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "proofs"
                ? "border-zinc-200 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Calculator className="h-3.5 w-3.5 text-zinc-300" />
            <span>Physics Proofs & DRC</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                verificationReport.criticalCount > 0
                  ? "bg-rose-500/20 text-rose-300 font-bold"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {verificationReport.physicsProofs.length} Checks
            </span>
          </button>

          <button
            onClick={() => setActiveTab("schematic")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "schematic"
                ? "border-zinc-200 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ListTree className="h-3.5 w-3.5 text-zinc-300" />
            <span>Netlist ({board.nets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("bom")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "bom"
                ? "border-zinc-200 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Table className="h-3.5 w-3.5 text-zinc-300" />
            <span>BOM (${totalCost.toFixed(2)})</span>
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "export"
                ? "border-zinc-200 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5 text-zinc-300" />
            <span>Gerber & KiCad</span>
          </button>
        </div>

        {/* Selected element badge */}
        {selectedElement && (
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <span>Selected:</span>
            <span className="font-mono font-semibold text-indigo-300 bg-zinc-800 px-1.5 py-0.5 rounded">
              {selectedElement}
            </span>
            <button
              onClick={() => setSelectedElement(null)}
              className="text-zinc-500 hover:text-zinc-300 ml-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "no-it" && (
          <NoItWorkflow
            onLoadPreset={handleSelectPreset}
            onOpenSchematic={() => setActiveTab("flux")}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === "flux" && <FluxPcbModule />}

        {activeTab === "graph" && <KnowledgeGraphDashboard />}

        {activeTab === "datasheet-agent" && (
          <DocumentReadingAgent onSelectComponent={() => setActiveTab("flux")} />
        )}

        {activeTab === "canvas" && (
          <PcbCanvas
            board={board}
            drcItems={verificationReport.items}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
          />
        )}

        {activeTab === "astra6" && (
          <div className="h-full overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto">
            <Astra6Visualizer
              board={board}
              selectedComponentId={selectedElement}
              onSelectComponent={setSelectedElement}
            />
          </div>
        )}

        {activeTab === "engineering" && (
          <div className="h-full overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto">
            <EngineeringSuite board={board} />
          </div>
        )}

        {activeTab === "durability" && (
          <div className="h-full overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto">
            <DurabilityLab board={board} onUpdateBoard={setBoard} />
          </div>
        )}

        {activeTab === "shop" && (
          <div className="h-full overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto">
            <MaterialsShop board={board} />
          </div>
        )}

        {activeTab === "proofs" && (
          <div className="h-full overflow-y-auto p-5 space-y-6 max-w-6xl mx-auto">
            {/* Summary card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-indigo-400" />
                    Physics & Engineering Verification ("Why It Works & Proven By What")
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400 max-w-2xl leading-relaxed">
                    Every trace width, decoupling capacitor, and differential impedance is validated
                    against fundamental Maxwell laws, IPC-2152 thermal equations, and transmission line theory.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {verificationReport.score}%
                  </div>
                  <div className="text-xs text-zinc-500">Integrity Score</div>
                </div>
              </div>

              {/* DRC Flaws summary if any */}
              {verificationReport.items.length > 0 && (
                <div className="mt-4 rounded-lg border border-rose-800/40 bg-rose-950/30 p-3">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    <span>Identified Flaws & Recommended Fixes:</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {verificationReport.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded border border-rose-900/50 bg-zinc-950/60 p-2.5 text-xs text-zinc-300"
                      >
                        <div className="flex items-center justify-between font-semibold text-rose-400">
                          <span>{item.rule}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded">
                            {item.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-zinc-300 text-xs">{item.description}</p>
                        <div className="mt-1.5 text-zinc-400 text-[11px] bg-zinc-900/90 p-2 rounded border border-zinc-800">
                          <strong className="text-amber-400">Why it fails in the real world: </strong>
                          {item.flawExplanation}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-xs text-emerald-400">
                          <span>
                            <strong>Recommended Fix: </strong> {item.fixRecommendation}
                          </span>
                          {item.autoFixAvailable && (
                            <button
                              onClick={handleAutoFix}
                              className="rounded bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
                            >
                              Auto-Fix
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* List of Physics & Mathematical Proofs */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300">
                Mathematical Proofs & Engineering Verification Records
              </h3>

              {verificationReport.physicsProofs.map((proof) => (
                <div
                  key={proof.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition-all hover:border-zinc-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          proof.status === "verified" ? "bg-emerald-400" : "bg-rose-400 animate-pulse"
                        }`}
                      />
                      <h4 className="text-sm font-medium text-white">{proof.title}</h4>
                      <span className="text-[10px] rounded bg-zinc-800 px-2 py-0.5 text-zinc-400 font-mono">
                        {proof.subsystem}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
                        proof.status === "verified"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      Safety Margin: +{proof.safetyMarginPct}%
                    </span>
                  </div>

                  {/* Mathematical Formula Banner */}
                  <div className="mt-2.5 rounded bg-zinc-950 px-3 py-2 font-mono text-xs text-indigo-300 border border-zinc-800 flex items-center justify-between">
                    <span>Formula: {proof.formula}</span>
                    <span className="text-[10px] text-zinc-500 font-sans">
                      Proven by: {proof.provenBy}
                    </span>
                  </div>

                  {/* Variables Table */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {Object.entries(proof.variables).map(([k, v]) => (
                      <div key={k} className="rounded bg-zinc-950/60 p-2 border border-zinc-800/80">
                        <div className="text-[10px] text-zinc-500 line-clamp-1">{k}</div>
                        <div className="mt-0.5 font-mono font-medium text-zinc-200">{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Rationale / Physics explanation */}
                  <p className="mt-3 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/60 pt-2.5">
                    {proof.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "schematic" && (
          <div className="h-full overflow-y-auto p-5 max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Schematic Netlist Table</h3>
                <p className="text-xs text-zinc-400">
                  Logical net connections, operating voltages, and estimated current profiles.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-400">Total Nets: {board.nets.length}</span>
            </div>

            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="px-3 py-2.5">Net Name</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5">Voltage</th>
                    <th className="px-3 py-2.5">Current (Est)</th>
                    <th className="px-3 py-2.5">Impedance Target</th>
                    <th className="px-3 py-2.5">Connected Nodes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
                  {board.nets.map((net) => (
                    <tr
                      key={net.id}
                      className="hover:bg-zinc-900/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedElement(net.name);
                        setActiveTab("canvas");
                      }}
                    >
                      <td className="px-3 py-2 font-mono font-semibold text-indigo-300">
                        {net.name}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase font-mono text-zinc-300">
                          {net.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-200">
                        {net.voltage !== undefined ? `${net.voltage.toFixed(1)} V` : "N/A"}
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-200">
                        {net.currentEstA.toFixed(2)} A
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-400">
                        {net.targetImpedance ? `${net.targetImpedance} Ω` : "Standard"}
                      </td>
                      <td className="px-3 py-2 text-zinc-400 font-mono text-[11px]">
                        {net.pins.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "bom" && (
          <div className="h-full overflow-y-auto p-5 max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Bill of Materials (BOM)</h3>
                <p className="text-xs text-zinc-400">
                  Complete components list with footprints, values, and LCSC part numbers.
                </p>
              </div>
              <button
                onClick={handleDownloadBom}
                className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="px-3 py-2.5">Designator</th>
                    <th className="px-3 py-2.5">Part Name</th>
                    <th className="px-3 py-2.5">Package</th>
                    <th className="px-3 py-2.5">Value</th>
                    <th className="px-3 py-2.5">LCSC Part #</th>
                    <th className="px-3 py-2.5">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
                  {board.components.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-900/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedElement(c.ref);
                        setActiveTab("canvas");
                      }}
                    >
                      <td className="px-3 py-2 font-mono font-bold text-white">{c.ref}</td>
                      <td className="px-3 py-2 text-zinc-200">{c.name}</td>
                      <td className="px-3 py-2 font-mono text-zinc-400">{c.package}</td>
                      <td className="px-3 py-2 font-mono text-emerald-400">{c.value || "—"}</td>
                      <td className="px-3 py-2 font-mono text-cyan-400">
                        {c.lcscPartNumber || "N/A"}
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-300">
                        ${c.unitCostUsd.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "export" && (
          <div className="h-full overflow-y-auto p-5 max-w-5xl mx-auto space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Fabrication & CAD Exporter</h3>
              <p className="text-xs text-zinc-400">
                Direct export to KiCad v8 (`.kicad_pcb`), RS-274X Gerbers, and SMT pick-and-place files.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <CircuitBoard className="h-4 w-4 text-indigo-400" />
                  <span>KiCad v8 PCB</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Native format compatible with KiCad 7 and 8. Contains board outline, copper traces, and footprints.
                </p>
                <button
                  onClick={handleDownloadKiCad}
                  className="w-full rounded bg-indigo-600 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Download .kicad_pcb
                </button>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Table className="h-4 w-4 text-emerald-400" />
                  <span>JLCPCB / PCBWay BOM</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Formatted CSV with designators, package footprints, and verified LCSC part codes.
                </p>
                <button
                  onClick={handleDownloadBom}
                  className="w-full rounded bg-zinc-800 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
                >
                  Download BOM CSV
                </button>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FileCode2 className="h-4 w-4 text-purple-400" />
                  <span>RS-274X Gerbers</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Industry standard manufacturing files for photoplotting and CNC drilling.
                </p>
                <button
                  onClick={handleDownloadGerber}
                  className="w-full rounded bg-zinc-800 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
                >
                  Download Gerbers
                </button>
              </div>
            </div>

            {/* KiCad code snippet preview */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono">KiCad Output Preview</span>
                <span>Format: S-Expression v20221018</span>
              </div>
              <pre className="max-h-60 overflow-y-auto rounded bg-zinc-900 p-3 font-mono text-[11px] text-zinc-300">
                {generateKiCadPcb(board).slice(0, 1200)}...
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Unlimited Hardware Architecture & Specs Modal */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-zinc-300" />
                <h3 className="text-base font-bold text-white font-mono">
                  Unlimited Hardware Specs & Stackup
                </h3>
              </div>
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Layer Count</label>
                <select
                  value={board.layersCount}
                  onChange={(e) =>
                    setBoard({ ...board, layersCount: Number(e.target.value) })
                  }
                  className="w-full rounded bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 font-mono"
                >
                  <option value="2">2 Layers (Standard IoT)</option>
                  <option value="4">4 Layers (Internal Power/GND Planes)</option>
                  <option value="6">6 Layers (High Speed Digital & RF)</option>
                  <option value="8">8 Layers (Dense BGA & High-Z)</option>
                  <option value="12">12 Layers (Server & DSP Accelerator)</option>
                  <option value="16">16 Layers (Advanced Avionics)</option>
                  <option value="32">32 Layers (Supercomputing)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Substrate Material</label>
                <select
                  value={board.substrate || "FR-4 Standard"}
                  onChange={(e) =>
                    setBoard({ ...board, substrate: e.target.value })
                  }
                  className="w-full rounded bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 font-mono"
                >
                  <option value="FR-4 Standard">FR-4 Standard (Tg 130°C)</option>
                  <option value="High-Tg Isola 370HR (Tg 180°C)">High-Tg Isola 370HR (Tg 180°C)</option>
                  <option value="Rogers RO4350B (High Frequency RF)">Rogers RO4350B (High Frequency RF)</option>
                  <option value="Aluminum Insulated Metal Substrate (IMS)">Aluminum IMS (2.5 W/m-K)</option>
                  <option value="Kapton Polyimide Flex">Kapton Polyimide Flex</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Copper Weight (Outer)</label>
                <select
                  value={board.copperThicknessOz || 1}
                  onChange={(e) =>
                    setBoard({ ...board, copperThicknessOz: Number(e.target.value) })
                  }
                  className="w-full rounded bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 font-mono"
                >
                  <option value="0.5">0.5 oz (18µm - Fine pitch BGA)</option>
                  <option value="1">1.0 oz (35µm - Standard)</option>
                  <option value="2">2.0 oz (70µm - High current)</option>
                  <option value="3">3.0 oz (105µm - Power conversion)</option>
                  <option value="4">4.0 oz (140µm - Motor inverter)</option>
                  <option value="6">6.0 oz (210µm - Extreme EV bus)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Enclosure Alloy</label>
                <select
                  value={board.enclosureMaterial || "aluminum-6061"}
                  onChange={(e) =>
                    setBoard({ ...board, enclosureMaterial: e.target.value as any })
                  }
                  className="w-full rounded bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 font-mono"
                >
                  <option value="aluminum-6061">CNC Billet 6061-T6 Aluminum</option>
                  <option value="carbon-fiber">Carbon Fiber Composite</option>
                  <option value="polycarbonate">Optical Clear Polycarbonate</option>
                  <option value="stainless-316L">Marine 316L Stainless Steel</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Board Width (mm)</label>
                <input
                  type="number"
                  value={board.dimensions.widthMm}
                  onChange={(e) =>
                    setBoard({
                      ...board,
                      dimensions: { ...board.dimensions, widthMm: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Board Height (mm)</label>
                <input
                  type="number"
                  value={board.dimensions.heightMm}
                  onChange={(e) =>
                    setBoard({
                      ...board,
                      dimensions: { ...board.dimensions, heightMm: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded bg-zinc-900 border border-zinc-800 p-2 text-zinc-100 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  setShowArchitectureModal(false);
                  toast.success("Updated board physical architecture specs!");
                }}
                className="bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-4 py-2 rounded text-xs transition-colors"
              >
                Save Architecture Specs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
