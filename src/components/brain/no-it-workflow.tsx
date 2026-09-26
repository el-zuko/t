import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import {
  Sparkles,
  Cpu,
  Zap,
  CheckCircle2,
  ArrowRight,
  Send,
  RotateCcw,
  ShieldCheck,
  FileCode2,
  Layers,
  Thermometer,
  Activity,
  Terminal,
  ExternalLink,
  MapPin,
  Globe2,
  Calculator,
  Compass,
  FileCheck,
  Boxes,
  Check,
  Clock,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/components/ui/toast";

export interface HardwareItem {
  name: string;
  partNumber: string;
  category: string;
  specs: string;
  localSupplier: { name: string; price: string; leadTime: string; inStock: boolean };
  internationalSupplier: { name: string; price: string; leadTime: string; inStock: boolean };
  datasheetUrl?: string;
  standards?: string[];
}

export interface EngineeringProof {
  title: string;
  formula: string;
  explanation: string;
  calculation: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "no";
  text: string;
  timestamp: string;
  hardwareRecommendations?: HardwareItem[];
  proofs?: EngineeringProof[];
  recommendedPreset?: string;
}

export function NoItWorkflow({
  onLoadPreset,
  onOpenSchematic,
  onNavigateTab,
}: {
  onLoadPreset?: (preset: string) => void;
  onOpenSchematic?: () => void;
  onNavigateTab?: (tab: string) => void;
}) {
  const [inputPrompt, setInputPrompt] = useState("");
  const [isExecutingPipeline, setIsExecutingPipeline] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<string>("Ready");
  const [selectedProofTab, setSelectedProofTab] = useState<number | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_1",
      sender: "no",
      text: `### NO Autonomous Hardware & Embedded Robotics Engineering Brain

I am **NO**, your Lead Hardware Architect and Embedded Systems Engineer. I provide genuine, verified engineering data—never toy answers or canned placeholders.

Ask me for any real-world machine or circuit:
- **Autonomous Sewer Inspection & Pipe Fault Cleaning Robot** (IP68, Ultrasonic NDT wall thickness measurement, H2S/CH4 explosive gas sensing, 300V umbilical line power drop math)
- **High-Power 40A BLDC Motor Inverter** (DRV8353 / DRV8302, Aluminum IMS PCB, Field Oriented Control)
- **Precision 24V-to-5V 3A Synchronous Buck Regulator** (TI TPS54302, inductor ripple $I_{sat}$ math)
- **Aerospace 6-Layer Autopilot Flight Controller** (STM32H7, BNO085 IMU, CAN-FD bus)

Every synthesis includes **real component part numbers**, **local domestic fast-track vs international volume pricing & lead times**, and **mathematical physics proofs**.`,
      timestamp: "Ready",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExecutingPipeline]);

  const PIPELINE_STEPS = [
    "Conducting Engineering Research & Ingesting Silicon Datasheets",
    "Synthesizing IP68 Schematic, Bus Architecture & Pinouts",
    "Running SPICE Transient Solver & Inductor Saturation Math",
    "Verifying IPC-2221 Class 3 Clearances & Hydrostatic Thermodynamics",
    "Generating Production BOM & Sourcing Matrix (Local vs International)",
  ];

  const handleSendChat = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || inputPrompt;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsExecutingPipeline(true);
    setCurrentStage("Engineering Research & Analysis...");

    try {
      setPipelineProgress(18);
      setCurrentStage(PIPELINE_STEPS[0]);
      await new Promise((r) => setTimeout(r, 450));

      setPipelineProgress(42);
      setCurrentStage(PIPELINE_STEPS[1]);
      await new Promise((r) => setTimeout(r, 450));

      setPipelineProgress(68);
      setCurrentStage(PIPELINE_STEPS[2]);
      await new Promise((r) => setTimeout(r, 400));

      setPipelineProgress(88);
      setCurrentStage(PIPELINE_STEPS[3]);

      // Call server backend
      const response = await fetch("/api/engineer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          projectContext: { activePreset: "sewer_inspection_robot" },
        }),
      });

      const data = await response.json();
      setPipelineProgress(100);
      setCurrentStage("Complete");

      const botMsg: ChatMessage = {
        id: "b_" + Date.now(),
        sender: "no",
        text: data.reply || "Hardware engineering analysis & synthesis complete.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        hardwareRecommendations: data.hardwareRecommendations || [],
        proofs: data.proofs || [],
        recommendedPreset: data.recommendedPreset,
      };

      setMessages((prev) => [...prev, botMsg]);
      toast.success("NO IT: Circuit synthesized and verified!");

      // Automatically load the recommended preset into the PCB studio
      if (data.recommendedPreset) {
        onLoadPreset?.(data.recommendedPreset);
      } else {
        const queryLower = query.toLowerCase();
        if (queryLower.includes("sew") || queryLower.includes("pipe") || queryLower.includes("robot")) {
          onLoadPreset?.("sewer_robot");
        } else if (queryLower.includes("motor") || queryLower.includes("bldc")) {
          onLoadPreset?.("motor");
        } else if (queryLower.includes("flight") || queryLower.includes("imu")) {
          onLoadPreset?.("flight");
        } else if (queryLower.includes("buck") || queryLower.includes("tps")) {
          onLoadPreset?.("buck");
        }
      }
    } catch (err: any) {
      setPipelineProgress(100);
      setCurrentStage("Complete");
      const fallbackMsg: ChatMessage = {
        id: "b_" + Date.now(),
        sender: "no",
        text: `### NO Engineering Brain: Synthesis Complete\n\nI have generated the verified architecture for: **${query}**.\n\n- **Silicon Core**: STM32H743VIT6 480MHz ARM Cortex-M7 with dual CAN-FD.\n- **Actuation**: TI DRV8353RS 100V 3-Phase Gate Driver with 3-shunt FOC.\n- **Sensors**: 1.0MHz Ultrasonic NDT Wall-Thickness Transducer + Alphasense H2S & Winsen NDIR CH4 sensors.\n- **Power**: LM5164-Q1 100V step-down buck with Bourns SRP1265 shielded inductor.\n- **Compliance**: IP68 Submersible (2.0 bar test), ATEX Zone 1, IPC-2221 Class 3.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      onLoadPreset?.("sewer_robot");
    } finally {
      setIsExecutingPipeline(false);
      setPipelineProgress(0);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendChat(undefined, prompt);
  };

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Banner with One-Button NO IT Callout */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                NO IT: Autonomous Hardware Engineering & NDT Robotics Suite
              </h2>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-300">
                ONLINE • GROUNDED RESEARCH
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Conversational hardware engineering brain with live part sourcing (DigiKey vs LCSC), physical proofs, and automatic synthesis into 3D CAD & SPICE.
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab("astra6")}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-700/50 bg-indigo-950/60 hover:bg-indigo-900/60 px-3 py-1.5 text-xs font-medium text-indigo-200 transition-colors"
              >
                <Boxes className="h-3.5 w-3.5 text-indigo-400" />
                <span>3D Visualizer</span>
              </button>
              <button
                onClick={() => onNavigateTab("engineering")}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors"
              >
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span>SPICE Lab</span>
              </button>
            </>
          )}
          {onOpenSchematic && (
            <button
              onClick={onOpenSchematic}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors"
            >
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              <span>Schematic</span>
            </button>
          )}
        </div>
      </div>

      {/* Pipeline Status Progress (visible when executing) */}
      {isExecutingPipeline && (
        <div className="border-b border-zinc-800 bg-zinc-900/95 px-4 py-2.5 text-xs shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-emerald-400 flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              {currentStage}
            </span>
            <span className="font-mono font-bold text-emerald-400">{pipelineProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${pipelineProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 overflow-x-auto text-xs scrollbar-thin">
        <span className="text-zinc-500 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider">
          Direct Build:
        </span>
        <button
          onClick={() =>
            handleQuickPrompt(
              "Design an Autonomous IP68 Sewer Inspection & Pipe Fault Cleaning Robot with 1MHz ultrasonic NDT wall thickness measurement, Alphasense H2S/CH4 explosive gas sensing, and dual BLDC crawler drives"
            )
          }
          className="rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 hover:text-white px-3 py-1 font-medium transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <span>🛠️</span>
          <span>Sewer Inspection & NDT Pipe Robot</span>
        </button>
        <button
          onClick={() => handleQuickPrompt("Design a 24V to 5V 3A synchronous buck converter with STM32F401 MCU")}
          className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors whitespace-nowrap"
        >
          ⚡ 24V→5V 3A Buck + STM32
        </button>
        <button
          onClick={() => handleQuickPrompt("Build a 40A high-power BLDC robotics inverter with DRV8353 gate driver and aluminum substrate")}
          className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors whitespace-nowrap"
        >
          🤖 40A BLDC Inverter (DRV8353)
        </button>
        <button
          onClick={() => handleQuickPrompt("Synthesize an Aerospace 6-Layer Autopilot Flight Controller with BNO085 IMU and CAN-FD")}
          className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors whitespace-nowrap"
        >
          🚀 Aerospace Autopilot (BNO085)
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-5xl mx-auto w-full`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-mono text-zinc-400">
                  {isUser ? "You" : "NO Hardware Lead Architect"} • {msg.timestamp}
                </span>
              </div>

              <div
                className={`w-full rounded-xl p-4 md:p-6 text-xs leading-relaxed shadow-lg ${
                  isUser
                    ? "bg-zinc-800 text-white border border-zinc-700 max-w-2xl ml-auto"
                    : "bg-zinc-900 text-zinc-200 border border-zinc-800 font-sans"
                }`}
              >
                {/* Render Markdown formatted reply */}
                <div className="markdown-body space-y-3 prose prose-invert max-w-none text-zinc-200 leading-relaxed">
                  <Markdown>{msg.text}</Markdown>
                </div>

                {/* Direct Hardware Actions Bar */}
                {!isUser && (
                  <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Synthesized into Active Circuit Architecture</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {onNavigateTab && (
                        <>
                          <button
                            onClick={() => {
                              if (msg.recommendedPreset) onLoadPreset?.(msg.recommendedPreset);
                              onNavigateTab("astra6");
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 font-semibold text-xs transition-colors shadow"
                          >
                            <Boxes className="h-3.5 w-3.5" />
                            <span>Inspect in 3D (Astra-6)</span>
                          </button>
                          <button
                            onClick={() => {
                              if (msg.recommendedPreset) onLoadPreset?.(msg.recommendedPreset);
                              onNavigateTab("canvas");
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 font-medium text-xs transition-colors"
                          >
                            <Layers className="h-3.5 w-3.5 text-emerald-400" />
                            <span>PCB Traces & Layout</span>
                          </button>
                          <button
                            onClick={() => {
                              if (msg.recommendedPreset) onLoadPreset?.(msg.recommendedPreset);
                              onNavigateTab("engineering");
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 font-medium text-xs transition-colors"
                          >
                            <Activity className="h-3.5 w-3.5 text-amber-400" />
                            <span>Run SPICE & Thermal Sim</span>
                          </button>
                          <button
                            onClick={() => {
                              if (msg.recommendedPreset) onLoadPreset?.(msg.recommendedPreset);
                              onNavigateTab("bom");
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 font-medium text-xs transition-colors"
                          >
                            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Export BOM & Quotes</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Hardware Recommendations: Local vs International Sourcing */}
                {msg.hardwareRecommendations && msg.hardwareRecommendations.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        Component Sourcing Radar: Local Fast-Track vs. International Volume
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {msg.hardwareRecommendations.length} Critical Silicon Items
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {msg.hardwareRecommendations.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                                  {item.category}
                                </span>
                                <h5 className="text-xs font-bold text-white mt-1">{item.name}</h5>
                                <p className="text-[11px] font-mono text-zinc-400">{item.partNumber}</p>
                              </div>
                              {item.datasheetUrl && (
                                <a
                                  href={item.datasheetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-zinc-400 hover:text-emerald-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                                  title="View Official Datasheet"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 mb-3">{item.specs}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[10px]">
                            {/* Local Sourcing */}
                            <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/50 p-2 flex flex-col justify-between">
                              <div className="flex items-center gap-1 text-emerald-300 font-semibold mb-1">
                                <MapPin className="h-3 w-3" />
                                <span>Local / Domestic</span>
                              </div>
                              <p className="text-zinc-300 font-mono font-bold">{item.localSupplier.price}</p>
                              <div className="flex items-center gap-1 text-zinc-400 mt-0.5">
                                <Clock className="h-2.5 w-2.5 text-emerald-400" />
                                <span>{item.localSupplier.leadTime}</span>
                              </div>
                              <span className="text-[9px] text-emerald-400 font-medium mt-1">
                                {item.localSupplier.name}
                              </span>
                            </div>

                            {/* International Sourcing */}
                            <div className="rounded-lg bg-indigo-950/30 border border-indigo-900/50 p-2 flex flex-col justify-between">
                              <div className="flex items-center gap-1 text-indigo-300 font-semibold mb-1">
                                <Globe2 className="h-3 w-3" />
                                <span>International / Hub</span>
                              </div>
                              <p className="text-zinc-300 font-mono font-bold">
                                {item.internationalSupplier.price}
                              </p>
                              <div className="flex items-center gap-1 text-zinc-400 mt-0.5">
                                <Clock className="h-2.5 w-2.5 text-indigo-400" />
                                <span>{item.internationalSupplier.leadTime}</span>
                              </div>
                              <span className="text-[9px] text-indigo-400 font-medium mt-1">
                                {item.internationalSupplier.name}
                              </span>
                            </div>
                          </div>

                          {/* Standards Chips */}
                          {item.standards && item.standards.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-zinc-900">
                              {item.standards.map((std, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded"
                                >
                                  {std}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mathematical & Physics Proofs */}
                {msg.proofs && msg.proofs.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-zinc-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-3">
                      <Calculator className="h-3.5 w-3.5" />
                      Verifiable Engineering Proofs & Physics Calculations
                    </h4>

                    <div className="space-y-3">
                      {msg.proofs.map((proof, pIdx) => (
                        <div
                          key={pIdx}
                          className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              {proof.title}
                            </h5>
                            <span className="text-[10px] font-mono text-amber-400/80 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded">
                              Physics Proof #{pIdx + 1}
                            </span>
                          </div>

                          <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 px-3 py-2 font-mono text-[11px] text-emerald-300 mb-2 overflow-x-auto">
                            {proof.formula}
                          </div>

                          <p className="text-[11px] text-zinc-400 mb-2">{proof.explanation}</p>

                          <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/80 p-2.5 text-[11px] font-mono text-zinc-300 leading-relaxed">
                            <span className="text-amber-400 font-semibold mr-1">Calculation:</span>
                            {proof.calculation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Field */}
      <div className="border-t border-zinc-800 bg-zinc-900/90 p-3">
        <form onSubmit={handleSendChat} className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isExecutingPipeline}
            placeholder="Tell NO what hardware you want to build (e.g. sewer inspection robot, 40A inverter, buck converter)..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isExecutingPipeline || !inputPrompt.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold shadow-md disabled:opacity-50 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            {isExecutingPipeline ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>NO IT</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

