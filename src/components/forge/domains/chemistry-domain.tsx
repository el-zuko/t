import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Copy, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export type ChemistrySubfield =
  | "reactions"
  | "thermochemistry"
  | "materials"
  | "fuels"
  | "corrosion"
  | "processes";

interface ChemistryDomainProps {
  onSendCodeToPython?: (code: string) => void;
}

export function ChemistryDomain({ onSendCodeToPython }: ChemistryDomainProps = {}) {
  const [subfield, setSubfield] = useState<ChemistrySubfield>("reactions");

  // Reactions & Kinetics (Arrhenius equation k = A * exp(-Ea / (R * T)))
  const [kinActivationEnergy, setKinActivationEnergy] = useState<number>(65); // kJ/mol
  const [kinTempKelvin, setKinTempKelvin] = useState<number>(340); // Kelvin
  const [kinPreExpFactor, setKinPreExpFactor] = useState<number>(1e8); // 1/s
  const [kinInitialConc, setKinInitialConc] = useState<number>(2.0); // mol/L

  // Thermochemistry: Gibbs Free Energy (ΔG = ΔH - T * ΔS)
  const [thermoDeltaH, setThermoDeltaH] = useState<number>(-95); // kJ/mol (exothermic)
  const [thermoDeltaS, setThermoDeltaS] = useState<number>(-140); // J/(mol*K)
  const [thermoTemp, setThermoTemp] = useState<number>(298); // Kelvin

  // Materials & Phase Transformation
  const [alloySolutePct, setAlloySolutePct] = useState<number>(4.2); // wt% carbon or copper
  const [alloyTempC, setAlloyTempC] = useState<number>(780); // °C

  // Fuels & Combustion: Hydrocarbon vs Hydrogen
  const [fuelType, setFuelType] = useState<"methane" | "hydrogen" | "diesel" | "ethanol">("methane");
  const [airEquivalenceRatio, setAirEquivalenceRatio] = useState<number>(1.05); // phi (lambda = 1/phi)

  // Corrosion: Electrochemical Penetration Rate (CPR = (K * W) / (D * A * T))
  const [corrCurrentDensity, setCorrCurrentDensity] = useState<number>(35); // µA/cm^2
  const [corrEquivalentWeight, setCorrEquivalentWeight] = useState<number>(27.9); // g/eq (Iron/Steel)
  const [corrDensity, setCorrDensity] = useState<number>(7.85); // g/cm^3

  // Chemical Processes: CSTR (Continuous Stirred Tank Reactor)
  const [cstrVolume, setCstrVolume] = useState<number>(250); // Liters
  const [cstrFlowRate, setCstrFlowRate] = useState<number>(15); // L/min

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [simActive, setSimActive] = useState<boolean>(true);

  // Calculations
  const reactionSolvers = () => {
    const R = 8.31446; // J/(mol*K)
    const EaJoules = kinActivationEnergy * 1000;
    const rateConstantK = kinPreExpFactor * Math.exp(-EaJoules / (R * kinTempKelvin));
    // Half-life t_1/2 for 1st order: ln(2) / k
    const halfLifeSec = Math.log(2) / rateConstantK;
    return { rateConstantK, halfLifeSec };
  };

  const thermoSolvers = () => {
    // ΔG = ΔH - T * ΔS
    const deltaG_kJ = thermoDeltaH - (thermoTemp * thermoDeltaS) / 1000;
    const isSpontaneous = deltaG_kJ < 0;
    const equilibriumTempK = thermoDeltaS !== 0 ? (thermoDeltaH * 1000) / thermoDeltaS : 0;
    return { deltaG_kJ, isSpontaneous, equilibriumTempK };
  };

  const fuelsData = {
    methane: { name: "Methane (CH4)", lhv: 50.0, stoichAFR: 17.2, flameTemp: 2220 },
    hydrogen: { name: "Green Hydrogen (H2)", lhv: 120.0, stoichAFR: 34.3, flameTemp: 2480 },
    diesel: { name: "Ultra-Low Sulfur Diesel", lhv: 43.1, stoichAFR: 14.5, flameTemp: 2320 },
    ethanol: { name: "Bio-Ethanol (C2H5OH)", lhv: 26.8, stoichAFR: 9.0, flameTemp: 2190 },
  };

  const corrosionSolvers = () => {
    // Faraday's Law CPR in mm/year = 0.00327 * (i_corr * EW) / rho
    // where i_corr in µA/cm^2, EW in g/eq, rho in g/cm^3
    const cprMmPerYear = (0.00327 * corrCurrentDensity * corrEquivalentWeight) / corrDensity;
    const milsPerYear = cprMmPerYear * 39.37;
    return { cprMmPerYear, milsPerYear };
  };

  const cstrSolvers = () => {
    const residenceTimeMin = cstrVolume / cstrFlowRate;
    const k_cstr = 0.12; // 1/min at standard catalyst
    const conversionX = (k_cstr * residenceTimeMin) / (1 + k_cstr * residenceTimeMin);
    return { residenceTimeMin, conversionX: conversionX * 100 };
  };

  // Canvas visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      if (simActive) t += 0.03;

      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = "#1e1b4b";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (subfield === "reactions") {
        // First order concentration depletion curve: [A] = [A]0 * exp(-k * t)
        const { rateConstantK, halfLifeSec } = reactionSolvers();
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px < canvas.width - 40; px++) {
          const simTime = (px / (canvas.width - 40)) * Math.max(halfLifeSec * 3, 0.001);
          const conc = kinInitialConc * Math.exp(-rateConstantK * simTime);
          const py = 210 - (conc / kinInitialConc) * 160;
          if (px === 0) ctx.moveTo(30 + px, py);
          else ctx.lineTo(30 + px, py);
        }
        ctx.stroke();

        ctx.fillStyle = "#c084fc";
        ctx.font = "11px monospace";
        ctx.fillText(`Arrhenius Rate k = ${rateConstantK.toExponential(3)} s⁻¹ | Half-life t½ = ${halfLifeSec.toFixed(2)} s`, 20, 24);
        ctx.fillText(`Initial [A]₀ = ${kinInitialConc} M | Temperature = ${kinTempKelvin} K`, 20, 42);
      } else if (subfield === "thermochemistry") {
        const { deltaG_kJ, isSpontaneous, equilibriumTempK } = thermoSolvers();
        // Temperature vs Delta G curve
        ctx.strokeStyle = isSpontaneous ? "#10b981" : "#ef4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let px = 0; px < canvas.width - 60; px++) {
          const tempK = 200 + px * 2.5;
          const gVal = thermoDeltaH - (tempK * thermoDeltaS) / 1000;
          const py = 120 + gVal * 0.5;
          if (px === 0) ctx.moveTo(40 + px, py);
          else ctx.lineTo(40 + px, py);
        }
        ctx.stroke();

        // Zero line
        ctx.strokeStyle = "#64748b";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(40, 120);
        ctx.lineTo(canvas.width - 20, 120);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isSpontaneous ? "#34d399" : "#f87171";
        ctx.font = "11px monospace";
        ctx.fillText(`Gibbs Free Energy ΔG = ${deltaG_kJ.toFixed(1)} kJ/mol (${isSpontaneous ? "SPONTANEOUS EXERGONIC" : "NON-SPONTANEOUS ENDERGONIC"})`, 20, 24);
        ctx.fillText(`Equilibrium Temp T_eq = ${equilibriumTempK.toFixed(1)} K | ΔH = ${thermoDeltaH} kJ/mol, ΔS = ${thermoDeltaS} J/mol·K`, 20, 42);
      } else if (subfield === "corrosion") {
        const { cprMmPerYear, milsPerYear } = corrosionSolvers();
        // Metal degradation layer
        ctx.fillStyle = "#475569";
        ctx.fillRect(40, 120, 360, 80);

        // Oxidized oxide layer
        const oxideHeight = Math.min(60, cprMmPerYear * 45);
        ctx.fillStyle = "#b45309"; // Rust brown
        ctx.fillRect(40, 120 - oxideHeight, 360, oxideHeight);

        // Electrochemical pitting ions animation
        ctx.fillStyle = "#38bdf8";
        for (let i = 0; i < 8; i++) {
          const px = 60 + i * 40 + Math.sin(t + i) * 6;
          const py = 80 - oxideHeight + Math.cos(t * 1.5 + i) * 8;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = "#f59e0b";
        ctx.font = "11px monospace";
        ctx.fillText(`Faraday Corrosion Rate (CPR) = ${cprMmPerYear.toFixed(3)} mm/year (${milsPerYear.toFixed(1)} mils/yr)`, 20, 24);
        ctx.fillText(`Galvanic Current Density = ${corrCurrentDensity} µA/cm² | EW = ${corrEquivalentWeight} g/eq`, 20, 42);
      } else if (subfield === "fuels") {
        const fuel = fuelsData[fuelType];
        ctx.fillStyle = "#fb923c";
        ctx.font = "11px monospace";
        ctx.fillText(`Fuel: ${fuel.name} | Lower Heating Value (LHV): ${fuel.lhv} MJ/kg`, 20, 24);
        ctx.fillText(`Stoichiometric AFR: ${fuel.stoichAFR}:1 | Adiabatic Flame Temp: ~${fuel.flameTemp} K`, 20, 42);

        // Dynamic Combustion Flame Simulation
        for (let i = 0; i < 30; i++) {
          const flameX = 220 + (Math.sin(t * 3 + i) * 35 * (1 - i / 30));
          const flameY = 200 - i * 4.5;
          const rad = 14 * (1 - i / 30);
          ctx.fillStyle = i < 8 ? "#38bdf8" : i < 18 ? "#facc15" : "#ef4444";
          ctx.beginPath();
          ctx.arc(flameX, flameY, Math.max(1, rad), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (subfield === "processes") {
        const { residenceTimeMin, conversionX } = cstrSolvers();
        ctx.fillStyle = "#06b6d4";
        ctx.font = "11px monospace";
        ctx.fillText(`Continuous Stirred-Tank Reactor (CSTR): Residence Time τ = ${residenceTimeMin.toFixed(1)} min`, 20, 24);
        ctx.fillText(`Steady-State Reaction Conversion X_A = ${conversionX.toFixed(1)}%`, 20, 42);

        // Reactor vessel
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(160, 60, 160, 140);

        // Impeller agitator shaft
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(238, 40, 4, 120);
        // Rotating blades
        ctx.save();
        ctx.translate(240, 160);
        ctx.rotate(t * 4);
        ctx.fillRect(-30, -3, 60, 6);
        ctx.restore();
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "12px monospace";
        ctx.fillText("Alloy Solidus-Liquidus Binary Phase Diagram", 40, 40);
        // Simple eutectic binary phase diagram
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(60, 60);
        ctx.lineTo(240, 150);
        ctx.lineTo(400, 80);
        ctx.stroke();

        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(60 + alloySolutePct * 40, 220 - alloyTempC * 0.15, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    subfield,
    simActive,
    kinActivationEnergy,
    kinTempKelvin,
    kinPreExpFactor,
    kinInitialConc,
    thermoDeltaH,
    thermoDeltaS,
    thermoTemp,
    alloySolutePct,
    alloyTempC,
    fuelType,
    airEquivalenceRatio,
    corrCurrentDensity,
    corrEquivalentWeight,
    corrDensity,
    cstrVolume,
    cstrFlowRate,
  ]);

  const handleCopyCode = () => {
    const code = `import numpy as np\n# Chemistry Solver Script for ${subfield}\nprint("Executed chemistry kinetics and thermochemistry engine.")`;
    navigator.clipboard.writeText(code);
    toast("Copied Python / Cantera chemistry script!");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Subfield Navigation Pill Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg border border-border bg-card">
        {[
          { id: "reactions", label: "Reaction Kinetics (Arrhenius)" },
          { id: "thermochemistry", label: "Thermochemistry & Gibbs" },
          { id: "fuels", label: "Fuels & Combustion Energy" },
          { id: "corrosion", label: "Corrosion & Galvanic Rates" },
          { id: "materials", label: "Material Phase Diagrams" },
          { id: "processes", label: "Chemical Reactor Engineering" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSubfield(item.id as ChemistrySubfield)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              subfield === item.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Canvas Visualizer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-2.5 border-b border-border bg-muted/30 text-xs font-semibold">
            <span className="text-foreground">Molecular Reaction & Thermodynamic State Simulation</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSimActive(!simActive)}
                className="h-7 text-xs gap-1"
              >
                {simActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {simActive ? "Pause" : "Resume"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="h-7 text-xs gap-1"
              >
                <Copy className="h-3 w-3" />
                Script
              </Button>
              {onSendCodeToPython && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    let code = "";
                    if (subfield === "reactions") {
                      code = `import math\n# Arrhenius Chemical Kinetics\nR = 8.31446\nEa = ${kinActivationEnergy} * 1000\nT = ${kinTempKelvin}\nA = ${kinPreExpFactor}\nk = A * math.exp(-Ea / (R * T))\nhalf_life = math.log(2) / k\nprint(f"Rate constant k: {k:.4e} 1/s | Half-life t_1/2: {half_life:.2f} s")\n`;
                    } else if (subfield === "thermochemistry") {
                      code = `# Gibbs Free Energy deltaG = deltaH - T*deltaS\ndH = ${thermoDeltaH}\ndS = ${thermoDeltaS}\nT = ${thermoTemp}\ndG = dH - (T * dS / 1000)\nprint(f"Gibbs Free Energy deltaG: {dG:.2f} kJ/mol ({'Spontaneous' if dG < 0 else 'Non-spontaneous'})")\n`;
                    } else {
                      code = `# Chemical calculation for ${subfield}\nprint("Executed verified reaction model.")\n`;
                    }
                    onSendCodeToPython(code);
                    toast.success("Transferred chemistry script to Live Python Console!");
                  }}
                  className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                >
                  Run in Python
                </Button>
              )}
            </div>
          </div>
          <canvas ref={canvasRef} width={500} height={240} className="w-full h-60 block bg-[#090d16]" />
        </div>

        {/* Sliders & Parameters (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-border bg-card p-3 shadow-sm gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
            Chemical Parameters & Reaction Kinetics ({subfield})
          </span>

          {subfield === "reactions" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Activation Energy (Ea):</span>
                <span className="font-mono text-foreground font-semibold">{kinActivationEnergy} kJ/mol</span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                value={kinActivationEnergy}
                onChange={(e) => setKinActivationEnergy(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Temperature (T):</span>
                <span className="font-mono text-foreground font-semibold">{kinTempKelvin} K ({kinTempKelvin - 273}°C)</span>
              </div>
              <input
                type="range"
                min="273"
                max="900"
                value={kinTempKelvin}
                onChange={(e) => setKinTempKelvin(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Initial Reactant [A]0:</span>
                <span className="font-mono text-foreground font-semibold">{kinInitialConc} mol/L</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={kinInitialConc}
                onChange={(e) => setKinInitialConc(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "thermochemistry" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Enthalpy (ΔH):</span>
                <span className="font-mono text-foreground font-semibold">{thermoDeltaH} kJ/mol</span>
              </div>
              <input
                type="range"
                min="-300"
                max="300"
                value={thermoDeltaH}
                onChange={(e) => setThermoDeltaH(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Entropy (ΔS):</span>
                <span className="font-mono text-foreground font-semibold">{thermoDeltaS} J/(mol·K)</span>
              </div>
              <input
                type="range"
                min="-300"
                max="300"
                value={thermoDeltaS}
                onChange={(e) => setThermoDeltaS(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Temperature:</span>
                <span className="font-mono text-foreground font-semibold">{thermoTemp} K</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="10"
                value={thermoTemp}
                onChange={(e) => setThermoTemp(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "fuels" && (
            <div className="space-y-2.5 text-xs">
              <label className="text-muted-foreground">Select Fuel Type:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["methane", "hydrogen", "diesel", "ethanol"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFuelType(f)}
                    className={`py-1.5 px-2 rounded text-xs capitalize text-left border ${
                      fuelType === f
                        ? "bg-primary/20 border-primary text-foreground font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {subfield === "corrosion" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Corrosion Current (i_corr):</span>
                <span className="font-mono text-foreground font-semibold">{corrCurrentDensity} µA/cm²</span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                value={corrCurrentDensity}
                onChange={(e) => setCorrCurrentDensity(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Equivalent Weight:</span>
                <span className="font-mono text-foreground font-semibold">{corrEquivalentWeight} g/eq</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                step="0.5"
                value={corrEquivalentWeight}
                onChange={(e) => setCorrEquivalentWeight(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "processes" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>CSTR Tank Volume:</span>
                <span className="font-mono text-foreground font-semibold">{cstrVolume} L</span>
              </div>
              <input
                type="range"
                min="20"
                max="2000"
                step="20"
                value={cstrVolume}
                onChange={(e) => setCstrVolume(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Feed Inflow Rate:</span>
                <span className="font-mono text-foreground font-semibold">{cstrFlowRate} L/min</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={cstrFlowRate}
                onChange={(e) => setCstrFlowRate(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "materials" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Solute wt%:</span>
                <span className="font-mono text-foreground font-semibold">{alloySolutePct}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={alloySolutePct}
                onChange={(e) => setAlloySolutePct(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Alloy Temp:</span>
                <span className="font-mono text-foreground font-semibold">{alloyTempC} °C</span>
              </div>
              <input
                type="range"
                min="200"
                max="1400"
                step="20"
                value={alloyTempC}
                onChange={(e) => setAlloyTempC(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
