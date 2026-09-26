"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "@/shims/navigation";
import {
  Search,
  X,
  ArrowRight,
  Layers,
  Calculator,
  Code2,
  FileSpreadsheet,
  Activity,
  Cpu,
  CircuitBoard,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { synthesizeAndSetActive, setActiveProduct } from "@/lib/hardware/hardware-state";
import { HARDWARE_CATALOG } from "@/lib/hardware/hardware-archetypes";

export interface SearchIndexItem {
  id: string;
  title: string;
  category: "Hardware & CAD" | "Mathematical Proofs" | "Production Code" | "Fabrication & Gerber" | "Simulators & Tools" | "Navigation";
  description: string;
  actionHref?: string;
  hardwareId?: string;
  tags: string[];
}

export const BASE_SEARCH_INDEX: SearchIndexItem[] = [
  // Products
  {
    id: "hw_astra_pipe",
    title: "Astra-Pipe Autonomous Sewer Inspection Crawler",
    category: "Hardware & CAD",
    description: "IP68 submersible robot with twin caterpillar tracks, 4K sapphire dome, and 2.25 MHz ultrasonic NDT probe.",
    actionHref: "/product",
    hardwareId: "astra_pipe",
    tags: ["crawler", "robot", "submersible", "cad", "chassis", "sewer", "astra", "tracks", "assembly", "3d", "ndt"],
  },
  {
    id: "hw_aerox_drone",
    title: "AeroX-4 Autonomous Quadcopter & Flight Controller",
    category: "Hardware & CAD",
    description: "3K carbon fiber quadcopter with 4x 2207 BLDC motors, 4-in-1 ESC, STM32H7 flight computer, and RTK GPS.",
    actionHref: "/product",
    hardwareId: "aerox_4_drone",
    tags: ["drone", "quadcopter", "uav", "flight", "carbon", "motor", "propeller", "esc", "bldc", "3d"],
  },
  {
    id: "hw_helios_mppt",
    title: "Helios-48V 60A Synchronous MPPT Solar Charge Controller",
    category: "Hardware & CAD",
    description: "3kW high-efficiency photovoltaic inverter with Perturb & Observe DSP and interleaved buck topology.",
    actionHref: "/product",
    hardwareId: "helios_mppt",
    tags: ["solar", "mppt", "inverter", "charger", "power", "electronics", "buck", "photovoltaic", "3d"],
  },
  {
    id: "hw_bionic_hand",
    title: "Bionic-5 Tendon-Actuated Myoelectric Prosthetic Hand",
    category: "Hardware & CAD",
    description: "Anatomical 5-digit prosthesis with coreless micro-gearmotors, Dyneema tendons, and differential EMG.",
    actionHref: "/product",
    hardwareId: "bionic_hand",
    tags: ["bionic", "hand", "prosthetic", "tendon", "emg", "biomedical", "servo", "fingers", "3d"],
  },

  // Components & ICs
  {
    id: "comp_tmc2209",
    title: "TMC2209 SilentStepStick Stepper Motor Driver",
    category: "Hardware & CAD",
    description: "StealthChop2 silent microstepping motor driver with StallGuard4 sensorless homing (1.2A RMS).",
    actionHref: "/product",
    tags: ["tmc2209", "motor", "stepper", "driver", "powertrain", "actuation", "lcsc", "c292469"],
  },
  {
    id: "comp_stm32h7",
    title: "STM32H743VIT6 480MHz ARM Cortex-M7 Core",
    category: "Hardware & CAD",
    description: "High-performance avionics processor running real-time FreeRTOS threads and sensor DSP.",
    actionHref: "/product",
    tags: ["stm32", "mcu", "microcontroller", "arm", "cortex", "processor", "electronics", "brain"],
  },
  {
    id: "comp_pzt_ndt",
    title: "PZT Piezoceramic 2.25 MHz Ultrasonic NDT Transducer",
    category: "Hardware & CAD",
    description: "High-frequency acoustic echo probe with brass wear shoe for pipeline wall thickness measurement.",
    actionHref: "/product",
    tags: ["ndt", "ultrasonic", "pzt", "piezo", "probe", "thickness", "sensors", "acoustics"],
  },

  // Proofs & Equations
  {
    id: "proof_euler_bernoulli",
    title: "Euler-Bernoulli Elastic Cantilever Deflection & Stress Proof",
    category: "Mathematical Proofs",
    description: "Exact 4th-order ODE derivation: δ = (F·L³)/(3·E·I). Analytical residual |LHS-RHS| = 0.00000000.",
    actionHref: "/product",
    tags: ["euler", "bernoulli", "cantilever", "deflection", "stress", "proof", "math", "beam", "fea"],
  },
  {
    id: "proof_kutta_joukowski",
    title: "Kutta-Joukowski Aerodynamic Circulation & Lift Theorem",
    category: "Mathematical Proofs",
    description: "Blasius complex potential contour integration proving Lift L' = ρ_∞ · v_∞ · Γ with zero profile drag.",
    actionHref: "/product",
    tags: ["kutta", "joukowski", "aerodynamics", "circulation", "lift", "navier", "stokes", "airfoil", "math"],
  },
  {
    id: "proof_barlow_ip68",
    title: "Barlow Equation & Lamé Hydrostatic Ingress Proof (IP68)",
    category: "Mathematical Proofs",
    description: "Hoop stress derivation σ_h = (P·D_o)/(2·t) with ASME 3.0x safety factor verification.",
    actionHref: "/product",
    tags: ["barlow", "hydrostatic", "pressure", "ip68", "stress", "proof", "vessel", "math"],
  },
  {
    id: "proof_buck_volt_sec",
    title: "Synchronous Buck Converter Volt-Second Balance & Ripple Proof",
    category: "Mathematical Proofs",
    description: "Inductor Faraday volt-second integration proving duty cycle D = V_out / V_in and 5.25mV output ripple.",
    actionHref: "/product",
    tags: ["buck", "converter", "volt", "second", "ripple", "power", "electronics", "math", "proof"],
  },

  // Production Tools & Fabrication
  {
    id: "fab_gerber_suite",
    title: "Direct Gerber RS-274X & Drill File Exporter",
    category: "Fabrication & Gerber",
    description: "One-click ready-to-fabricate 6-layer production archives with copper, solder masks, and Excellon drill files.",
    actionHref: "/product",
    tags: ["gerber", "fabrication", "drill", "pcb", "excellon", "rs274x", "manufacturing"],
  },
  {
    id: "fab_jlcpcb_cpl",
    title: "JLCPCB / PCBWay Pick-and-Place (CPL) Centroid Exporter",
    category: "Fabrication & Gerber",
    description: "Centroid files with feeder rotation offsets (Δθ) and LCSC part numbers for automated SMT assembly.",
    actionHref: "/product",
    tags: ["cpl", "pick", "place", "centroid", "jlcpcb", "pcbway", "smt", "assembly"],
  },
  {
    id: "tool_webserial_flasher",
    title: "WebSerial 1-Click Firmware USB Flasher",
    category: "Simulators & Tools",
    description: "Flash compiled firmware binaries directly to connected ESP32-S3, STM32H7, or RP2040 microcontrollers over USB.",
    actionHref: "/product",
    tags: ["flasher", "webserial", "firmware", "usb", "flash", "esp32", "stm32", "rp2040"],
  },
  {
    id: "tool_scope_probing",
    title: "In-Browser Oscilloscope Probing & FFT Spectrum Analyzer",
    category: "Simulators & Tools",
    description: "Interactive node probing on schematics for voltage waveforms, branch currents, and harmonic FFTs.",
    actionHref: "/product",
    tags: ["oscilloscope", "probe", "scope", "fft", "waveforms", "voltage", "current", "spectrum"],
  },

  // Navigation
  {
    id: "nav_product",
    title: "Full Product Mechatronics & 3D Assembly Studio",
    category: "Navigation",
    description: "Interactive 3D WebGL CAD, multi-disciplinary BOM, physical solvers, and direct fabrication.",
    actionHref: "/product",
    tags: ["mechatronics", "3d", "cad", "bom", "hardware", "product"],
  },
  {
    id: "nav_ide",
    title: "Hardware Code IDE & AI Driver Synthesizer",
    category: "Navigation",
    description: "Embedded firmware editor, register definitions, bare-metal C drivers, and register bitfield maps.",
    actionHref: "/ide",
    tags: ["ide", "embedded", "c", "firmware", "code", "driver", "registers"],
  },
  {
    id: "nav_forge",
    title: "NO Omniverse Unified Science & Engineering Forge",
    category: "Navigation",
    description: "Physics, chemistry, math, Kaggle datasets, GitHub hub, and live Python 3.10 console.",
    actionHref: "/",
    tags: ["omniverse", "forge", "physics", "chemistry", "math", "python", "kaggle"],
  },
];

export function GlobalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter items matching query
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return BASE_SEARCH_INDEX.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCategory || matchTags;
    }).slice(0, 7);
  }, [query]);

  // Keyboard shortcut (⌘K or Ctrl+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSynthesizeDirect = (promptText: string) => {
    setIsOpen(false);
    setQuery("");
    const synth = synthesizeAndSetActive(promptText);
    toast.success(`Synthesized hardware package for: ${synth.name}`);
    router.push("/product");
  };

  const handleSelectItem = (item: SearchIndexItem) => {
    setIsOpen(false);
    setQuery("");
    if (item.hardwareId) {
      const catalogMatch = HARDWARE_CATALOG.find((p) => p.id === item.hardwareId);
      if (catalogMatch) {
        setActiveProduct(catalogMatch);
      }
    }
    if (item.actionHref) {
      router.push(item.actionHref);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !query.trim()) return;

    // Total options = 1 (Synthesize action card) + filteredResults.length
    const totalOptions = 1 + filteredResults.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex === 0) {
        handleSynthesizeDirect(query);
      } else {
        const item = filteredResults[selectedIndex - 1];
        if (item) {
          handleSelectItem(item);
        } else {
          handleSynthesizeDirect(query);
        }
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
      {/* Live Input Field */}
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search or synthesize any hardware, part, proof..."
          className="w-full h-8 pl-8 pr-14 text-xs rounded-md bg-muted/50 border border-border focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/70 transition-colors"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 p-0.5 rounded text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-background rounded border border-border/80 pointer-events-none">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Autocomplete & Synthesis Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-lg border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in duration-150 max-h-[460px] flex flex-col">
          {/* Header */}
          <div className="px-3 py-1.5 bg-muted/40 border-b border-border/60 text-[10px] font-mono font-semibold text-muted-foreground flex items-center justify-between">
            <span>Query: "{query}"</span>
            <span className="text-primary font-bold">1 Synthesizer + {filteredResults.length} Matches</span>
          </div>

          <div className="overflow-y-auto divide-y divide-border/40">
            {/* 1. TOP DYNAMIC SYNTHESIZER ACTION (Always available for ANY typed hardware) */}
            <div
              onClick={() => handleSynthesizeDirect(query)}
              onMouseEnter={() => setSelectedIndex(0)}
              className={`p-3 cursor-pointer flex items-start gap-2.5 transition-all ${
                selectedIndex === 0
                  ? "bg-sky-500/20 text-foreground border-l-4 border-sky-400"
                  : "bg-sky-950/20 hover:bg-sky-900/30 text-foreground"
              }`}
            >
              <div className="p-1.5 rounded-md bg-sky-500 text-black shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="h-4 w-4 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    Synthesize Hardware: "{query}"
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-500/20 text-sky-300 font-bold shrink-0">
                    ↵ ENTER TO CREATE
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  Generate 3D CAD Assembly, Multi-Layer PCB, Gerber RS-274X, Pick & Place CPL, BOM & Physics Proofs.
                </p>
              </div>
            </div>

            {/* 2. MATCHED CATALOG, PARTS, PROOFS & CODE */}
            {filteredResults.map((item, idx) => {
              const itemIdx = idx + 1;
              const isSelected = selectedIndex === itemIdx;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(itemIdx)}
                  className={`p-2.5 cursor-pointer flex items-start gap-2.5 transition-colors ${
                    isSelected ? "bg-primary/15 text-foreground" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-muted text-primary shrink-0 mt-0.5">
                    {item.category === "Hardware & CAD" && <Layers className="h-3.5 w-3.5 text-sky-400" />}
                    {item.category === "Mathematical Proofs" && <Calculator className="h-3.5 w-3.5 text-emerald-400" />}
                    {item.category === "Production Code" && <Code2 className="h-3.5 w-3.5 text-sky-400" />}
                    {item.category === "Fabrication & Gerber" && <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400" />}
                    {item.category === "Simulators & Tools" && <Activity className="h-3.5 w-3.5 text-purple-400" />}
                    {item.category === "Navigation" && <ArrowRight className="h-3.5 w-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-foreground truncate">
                        {item.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-muted text-muted-foreground shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Footer Hint */}
          <div className="px-3 py-1.5 bg-black/40 border-t border-border text-[10px] font-mono text-muted-foreground flex items-center justify-between">
            <span>Use ↑↓ to navigate • ↵ to select or synthesize</span>
            <span>ESC to dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
}
