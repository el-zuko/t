import { useState, useMemo } from "react";
import {
  Share2,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Info,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sliders,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface GraphNode {
  id: string;
  label: string;
  group: "requirement" | "component" | "standard" | "simulation";
  status: "Verified" | "Learned" | "Ingested";
  details: string;
  x: number;
  y: number;
  specs?: Record<string, string>;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  metric: string;
}

const INITIAL_NODES: GraphNode[] = [
  // Requirements
  { id: "req_power", label: "24V Power In (18-28V)", group: "requirement", status: "Verified", details: "Main battery / DC bus power rail with transient suppression", x: 120, y: 120, specs: { Voltage: "24V nominal", Current: "3.5A peak", Ripple: "<100mV" } },
  { id: "req_logic", label: "3.3V Logic Bus", group: "requirement", status: "Verified", details: "Core logic and sensor power rail", x: 420, y: 120, specs: { Voltage: "3.3V ±2%", Ripple: "<25mV p-p", Current: "200mA" } },
  { id: "req_control", label: "ARM M4 84MHz Loop", group: "requirement", status: "Verified", details: "Real-time FOC sensor fusion execution at 25kHz", x: 680, y: 120, specs: { Architecture: "Cortex-M4F", Clock: "84MHz", Flash: "256KB" } },
  { id: "req_thermal", label: "Thermal Max <85°C", group: "requirement", status: "Verified", details: "Safe enclosure ambient operation under full load", x: 120, y: 380, specs: { Ambient: "25°C", Enclosure: "IP65", MaxTj: "125°C" } },
  { id: "req_telemetry", label: "I2C / CAN Telemetry", group: "requirement", status: "Verified", details: "Real-time sensor telemetry broadcast to avionics", x: 680, y: 380, specs: { Protocol: "I2C 400kHz", CAN: "1Mbps", Termination: "120Ω" } },

  // Ingested Components
  { id: "comp_tps54302", label: "TPS54302 (Buck 24V→5V)", group: "component", status: "Verified", details: "TI Synch Step-Down Regulator 3A with 0.596V Vref", x: 260, y: 220, specs: { Package: "SOT-23-6", Eff: "93.2%", ThetaJA: "42.5°C/W" } },
  { id: "comp_inductor", label: "6.8µH Power Inductor", group: "component", status: "Verified", details: "Shielded ferrite core with 4.1A saturation current", x: 400, y: 220, specs: { Inductance: "6.8µH", DCR: "35mΩ", Isat: "4.1A" } },
  { id: "comp_ldo", label: "AMS1117-3.3 (LDO)", group: "component", status: "Verified", details: "Low-dropout linear regulator for clean 3.3V analog rail", x: 540, y: 220, specs: { Dropout: "1.1V", PSRR: "65dB", Current: "800mA" } },
  { id: "comp_stm32", label: "STM32F401CCU6 (MCU)", group: "component", status: "Learned", details: "STMicro ARM Cortex-M4 with DSP and FPU", x: 680, y: 250, specs: { Package: "UFQFPN-48", IO: "5V Tolerant", ESD: "2kV" } },
  { id: "comp_bno085", label: "BNO085 (9-DoF IMU)", group: "component", status: "Learned", details: "Hillcrest Labs sensor fusion SiP for attitude heading", x: 820, y: 340, specs: { Supply: "3.3V", Interface: "I2C/SPI", Gyro: "±2000 dps" } },
  { id: "comp_drv8302", label: "DRV8302 (Gate Driver)", group: "component", status: "Learned", details: "Texas Instruments 3-phase BLDC pre-driver + shunt amps", x: 820, y: 160, specs: { GateDrive: "1.7A", ShuntGain: "20 V/V", Vmax: "60V" } },

  // Standards
  { id: "std_ipc2221", label: "IPC-2221B Class 3", group: "standard", status: "Verified", details: "Standard on Printed Board Design (trace width, spacing & thermal derating)", x: 260, y: 460, specs: { Clearance: "0.25mm", TempRise: "10°C", CurrentDerate: "75%" } },
  { id: "std_iso26262", label: "ISO-26262 ASIL-B", group: "standard", status: "Verified", details: "Functional safety for road vehicle electronic control units", x: 500, y: 460, specs: { DiagnosticCoverage: ">90%", SafetyGoal: "ASIL-B" } },
  { id: "std_iec61000", label: "IEC 61000-4-2 (ESD)", group: "standard", status: "Verified", details: "Electrostatic discharge immunity testing (8kV contact / 15kV air)", x: 740, y: 460, specs: { ContactESD: "8kV", AirESD: "15kV", TVSClamping: "<32V" } },
];

const INITIAL_EDGES: GraphEdge[] = [
  { source: "req_power", target: "comp_tps54302", relationship: "satisfied_by", metric: "24V In -> 5V Out @ 3A" },
  { source: "comp_tps54302", target: "comp_inductor", relationship: "switches_into", metric: "6.8µH / 4.1A pk" },
  { source: "comp_inductor", target: "comp_ldo", relationship: "supplies", metric: "5.0V clean bus" },
  { source: "comp_ldo", target: "req_logic", relationship: "delivers", metric: "3.3V ±1%" },
  { source: "comp_ldo", target: "comp_stm32", relationship: "powers_mcu", metric: "3.3V / 45mA" },
  { source: "comp_ldo", target: "comp_bno085", relationship: "powers_imu", metric: "3.3V / 18mA" },
  { source: "comp_stm32", target: "req_control", relationship: "fulfills", metric: "FOC @ 25kHz" },
  { source: "comp_stm32", target: "comp_drv8302", relationship: "drives_pwm", metric: "6x Complementary PWM" },
  { source: "comp_stm32", target: "comp_bno085", relationship: "reads_telemetry", metric: "I2C Fast Mode 400kHz" },
  { source: "comp_bno085", target: "req_telemetry", relationship: "satisfies", metric: "Roll/Pitch/Yaw 100Hz" },
  { source: "std_ipc2221", target: "comp_tps54302", relationship: "trace_governance", metric: "2.5mm copper pour" },
  { source: "std_ipc2221", target: "req_thermal", relationship: "enforces", metric: "Tj < 125°C headroom" },
  { source: "std_iso26262", target: "comp_drv8302", relationship: "fault_monitoring", metric: "OCTW & FAULT gates" },
  { source: "std_iec61000", target: "req_power", relationship: "esd_clamp", metric: "TVS diode 28V clamp" },
];

export function KnowledgeGraphDashboard() {
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [edges] = useState<GraphEdge[]>(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("comp_tps54302");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterGroup, setFilterGroup] = useState<string>("all");

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || nodes[0],
    [nodes, selectedNodeId]
  );

  const relatedEdges = useMemo(() => {
    return edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [edges, selectedNodeId]);

  const groupMetrics = useMemo(() => {
    return [
      { name: "Requirements", count: nodes.filter((n) => n.group === "requirement").length, fill: "#38bdf8" },
      { name: "Datasheets / Components", count: nodes.filter((n) => n.group === "component").length, fill: "#10b981" },
      { name: "Standards", count: nodes.filter((n) => n.group === "standard").length, fill: "#f59e0b" },
    ];
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (filterGroup === "all") return nodes;
    return nodes.filter((n) => n.group === filterGroup);
  }, [nodes, filterGroup]);

  // Color mapping
  const getNodeColor = (node: GraphNode) => {
    if (node.group === "requirement") return "#38bdf8"; // cyan
    if (node.group === "component") return "#10b981"; // emerald
    if (node.group === "standard") return "#f59e0b"; // amber
    return "#a855f7"; // purple
  };

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">
              NO Engineering Brain Knowledge Graph (3D / Dynamic Node Matrix)
            </h2>
            <p className="text-xs text-zinc-400">
              Interactive relationship network connecting project requirements, learned component datasheets, and engineering standards.
            </p>
          </div>
        </div>

        {/* Filter and Zoom controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-xs">
            <button
              onClick={() => setFilterGroup("all")}
              className={`px-2 py-1 rounded ${filterGroup === "all" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              All ({nodes.length})
            </button>
            <button
              onClick={() => setFilterGroup("requirement")}
              className={`px-2 py-1 rounded ${filterGroup === "requirement" ? "bg-cyan-950/40 text-cyan-300 font-medium" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Requirements
            </button>
            <button
              onClick={() => setFilterGroup("component")}
              className={`px-2 py-1 rounded ${filterGroup === "component" ? "bg-emerald-950/40 text-emerald-300 font-medium" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Components
            </button>
            <button
              onClick={() => setFilterGroup("standard")}
              className={`px-2 py-1 rounded ${filterGroup === "standard" ? "bg-amber-950/40 text-amber-300 font-medium" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Standards
            </button>
          </div>

          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-1 hover:text-white text-zinc-400"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 text-[11px] font-mono text-zinc-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.1))}
              className="p-1 hover:text-white text-zinc-400"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph View & Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
        {/* Graph Canvas */}
        <div className="lg:col-span-8 relative bg-zinc-950 flex items-center justify-center overflow-hidden border-r border-zinc-800">
          {/* Subtle Grid */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#3f3f46 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <svg
            className="w-full h-full cursor-crosshair select-none"
            viewBox="0 0 1000 600"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center" }}
          >
            {/* Edges */}
            <g>
              {edges.map((edge, idx) => {
                const src = nodes.find((n) => n.id === edge.source);
                const tgt = nodes.find((n) => n.id === edge.target);
                if (!src || !tgt) return null;
                const isConnected =
                  edge.source === selectedNodeId || edge.target === selectedNodeId;

                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;

                return (
                  <g key={idx}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={isConnected ? "#10b981" : "#3f3f46"}
                      strokeWidth={isConnected ? 2.5 : 1}
                      strokeDasharray={isConnected ? "none" : "3,3"}
                      opacity={isConnected ? 1 : 0.4}
                    />
                    {isConnected && (
                      <text
                        x={midX}
                        y={midY - 4}
                        fill="#6ee7b7"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                        className="pointer-events-none bg-zinc-900"
                      >
                        {edge.metric}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {filteredNodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                const color = getNodeColor(node);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    {/* Outer Glow on Selected */}
                    {isSelected && (
                      <circle
                        r={28}
                        fill={color}
                        opacity={0.2}
                        className="animate-pulse"
                      />
                    )}

                    {/* Node Core */}
                    <circle
                      r={18}
                      fill="#18181b"
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />

                    {/* Inner status dot */}
                    <circle r={5} fill={color} />

                    {/* Label */}
                    <text
                      y={30}
                      textAnchor="middle"
                      fill={isSelected ? "#ffffff" : "#d4d4d8"}
                      fontSize="10"
                      fontWeight={isSelected ? "bold" : "normal"}
                      className="pointer-events-none"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Graph Legend */}
          <div className="absolute bottom-3 left-3 rounded-lg border border-zinc-800 bg-zinc-900/90 p-2.5 backdrop-blur text-xs flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              Requirement
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Verified Component
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Standard Rule
            </span>
          </div>
        </div>

        {/* Right Inspector & Quantitative Analytics */}
        <div className="lg:col-span-4 flex flex-col min-h-0 bg-zinc-900/40 p-4 overflow-y-auto space-y-4">
          {/* Selected Node Details Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                  {selectedNode.group} Node
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedNode.label}</h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-mono font-semibold text-emerald-400">
                {selectedNode.status}
              </span>
            </div>

            <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
              {selectedNode.details}
            </p>

            {/* Node Specifications */}
            {selectedNode.specs && (
              <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1.5">
                  Verified Ingested Specifications
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedNode.specs).map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                      <span className="text-[10px] text-zinc-500">{k}</span>
                      <span className="font-mono text-emerald-400 font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Connections / Edges */}
            <div className="mt-3">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1.5">
                Connected Knowledge Relationships ({relatedEdges.length})
              </span>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {relatedEdges.map((e, idx) => {
                  const otherId = e.source === selectedNode.id ? e.target : e.source;
                  const otherNode = nodes.find((n) => n.id === otherId);
                  const isOutgoing = e.source === selectedNode.id;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedNodeId(otherId)}
                      className="cursor-pointer flex items-center justify-between rounded border border-zinc-800/80 bg-zinc-950/60 p-2 text-xs hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-mono text-[10px]">
                          {isOutgoing ? "→" : "←"} {e.relationship}
                        </span>
                        <span className="text-zinc-200 font-medium">{otherNode?.label}</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-400">{e.metric}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Knowledge Density Bar Chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Knowledge Graph Entity Distribution
            </h4>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupMetrics} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" stroke="#71717a" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={10} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", fontSize: 11 }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {groupMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
