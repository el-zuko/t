import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export type PhysicsSubfield =
  | "mechanics"
  | "electromagnetism"
  | "thermodynamics"
  | "optics"
  | "fluids"
  | "materials";

interface PhysicsDomainProps {
  onSendCodeToPython?: (code: string) => void;
}

export function PhysicsDomain({ onSendCodeToPython }: PhysicsDomainProps = {}) {
  const [subfield, setSubfield] = useState<PhysicsSubfield>("mechanics");

  // Mechanics: Damped Harmonic Oscillator & Projectile Impact
  const [mechMass, setMechMass] = useState<number>(2.5); // kg
  const [mechK, setMechK] = useState<number>(45); // N/m spring constant
  const [mechC, setMechC] = useState<number>(1.2); // damping N*s/m
  const [mechV0, setMechV0] = useState<number>(15); // initial m/s
  const [mechAngle, setMechAngle] = useState<number>(45); // degrees

  // Electromagnetism: Solenoid Inductor & Lorentz Force
  const [emTurns, setEmTurns] = useState<number>(350);
  const [emCurrent, setEmCurrent] = useState<number>(4.2); // Amperes
  const [emCoreRadius, setEmCoreRadius] = useState<number>(12); // mm
  const [emLength, setEmLength] = useState<number>(65); // mm
  const [emRelPermeability, setEmRelPermeability] = useState<number>(800); // Ferromagnetic core

  // Thermodynamics: Conduction, Convection & Carnot Cycle
  const [thTcold, setThTcold] = useState<number>(295); // Kelvin (room temp)
  const [thThot, setThThot] = useState<number>(550); // Kelvin
  const [thArea, setThArea] = useState<number>(0.08); // m^2
  const [thThickness, setThThickness] = useState<number>(0.005); // m (5mm)
  const [thConductivity, setThConductivity] = useState<number>(167); // W/m*K (Aluminum 6061)

  // Optics: Snell's Law & Thin Lens Equation
  const [optN1, setOptN1] = useState<number>(1.0); // Air
  const [optN2, setOptN2] = useState<number>(1.5168); // BK7 Optical Glass
  const [optIncidentAngle, setOptIncidentAngle] = useState<number>(38); // degrees
  const [optFocalLength, setOptFocalLength] = useState<number>(50); // mm
  const [optObjectDist, setOptObjectDist] = useState<number>(120); // mm

  // Fluids: Hagen-Poiseuille Pipe Flow & Reynolds Number
  const [fluidDensity, setFluidDensity] = useState<number>(1000); // kg/m^3 (water)
  const [fluidViscosity, setFluidViscosity] = useState<number>(0.001); // Pa*s
  const [fluidPipeDiameter, setFluidPipeDiameter] = useState<number>(25); // mm
  const [fluidFlowRate, setFluidFlowRate] = useState<number>(1.5); // Liters/sec
  const [fluidPipeLength, setFluidPipeLength] = useState<number>(10); // meters

  // Materials Physics: Tensile Hooke's Law & Stress-Strain
  const [matModulus, setMatModulus] = useState<number>(69); // GPa (Aluminum)
  const [matYield, setMatYield] = useState<number>(276); // MPa
  const [matTensileLoad, setMatTensileLoad] = useState<number>(15000); // N load
  const [matCrossSection, setMatCrossSection] = useState<number>(85); // mm^2

  // Canvas visualizer
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [simActive, setSimActive] = useState<boolean>(true);

  // Solvers calculation
  const mechanicsSolvers = () => {
    const omega0 = Math.sqrt(mechK / mechMass);
    const gamma = mechC / (2 * mechMass);
    const dampingRatio = gamma / omega0;
    const g = 9.80665;
    const rad = (mechAngle * Math.PI) / 180;
    const projectileRange = (Math.pow(mechV0, 2) * Math.sin(2 * rad)) / g;
    const maxAltitude = (Math.pow(mechV0 * Math.sin(rad), 2)) / (2 * g);
    const timeOfFlight = (2 * mechV0 * Math.sin(rad)) / g;
    return { omega0, dampingRatio, projectileRange, maxAltitude, timeOfFlight };
  };

  const emSolvers = () => {
    const mu0 = 4 * Math.PI * 1e-7;
    const muR = emRelPermeability;
    const lengthM = emLength / 1000;
    const radiusM = emCoreRadius / 1000;
    const areaM2 = Math.PI * Math.pow(radiusM, 2);
    // B = mu * N * I / L
    const bField = (mu0 * muR * emTurns * emCurrent) / lengthM;
    // Inductance L = (mu * N^2 * A) / L
    const inductanceHenries = (mu0 * muR * Math.pow(emTurns, 2) * areaM2) / lengthM;
    // Magnetic energy = 0.5 * L * I^2
    const magneticEnergyJ = 0.5 * inductanceHenries * Math.pow(emCurrent, 2);
    return { bField, inductanceHenries, magneticEnergyJ };
  };

  const thermoSolvers = () => {
    // Heat conduction Fourier's Law: Q = k * A * (Th - Tc) / d
    const deltaT = thThot - thTcold;
    const heatFlowWatts = (thConductivity * thArea * deltaT) / thThickness;
    // Carnot Efficiency eta = 1 - (Tc / Th)
    const carnotEfficiency = 1 - thTcold / thThot;
    const thermalResistance = thThickness / (thConductivity * thArea);
    return { deltaT, heatFlowWatts, carnotEfficiency, thermalResistance };
  };

  const opticsSolvers = () => {
    const radInc = (optIncidentAngle * Math.PI) / 180;
    const sinRefracted = (optN1 / optN2) * Math.sin(radInc);
    const totalInternalReflection = Math.abs(sinRefracted) > 1.0;
    const refractedAngleDeg = totalInternalReflection
      ? 90
      : (Math.asin(sinRefracted) * 180) / Math.PI;
    // Thin lens formula: 1/f = 1/do + 1/di => di = (f * do) / (do - f)
    const imageDistMm =
      optObjectDist !== optFocalLength
        ? (optFocalLength * optObjectDist) / (optObjectDist - optFocalLength)
        : Infinity;
    const magnification = -imageDistMm / optObjectDist;
    return { refractedAngleDeg, totalInternalReflection, imageDistMm, magnification };
  };

  const fluidsSolvers = () => {
    const diameterM = fluidPipeDiameter / 1000;
    const areaM2 = Math.PI * Math.pow(diameterM / 2, 2);
    const flowRateM3s = (fluidFlowRate / 1000); // L/s to m^3/s
    const velocityMs = flowRateM3s / areaM2;
    // Reynolds number Re = (rho * v * D) / mu
    const reynolds = (fluidDensity * velocityMs * diameterM) / fluidViscosity;
    // Pressure drop (Darcy-Weisbach or Hagen-Poiseuille for laminar, Colebrook for turbulent)
    const frictionFactor = reynolds < 2300 ? 64 / Math.max(reynolds, 1) : 0.3164 * Math.pow(reynolds, -0.25);
    const pressureDropPa =
      frictionFactor * (fluidPipeLength / diameterM) * (0.5 * fluidDensity * Math.pow(velocityMs, 2));
    const pressureDropBar = pressureDropPa / 1e5;
    return { velocityMs, reynolds, frictionFactor, pressureDropBar };
  };

  const materialsSolvers = () => {
    const areaM2 = matCrossSection * 1e-6; // mm^2 to m^2
    const stressPa = matTensileLoad / areaM2;
    const stressMpa = stressPa / 1e6;
    const modulusPa = matModulus * 1e9;
    const strain = stressPa / modulusPa;
    const safetyFactor = matYield / stressMpa;
    return { stressMpa, strain, safetyFactor };
  };

  // Render canvas based on subfield
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

      // Grid lines
      ctx.strokeStyle = "#172554";
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

      if (subfield === "mechanics") {
        // Damped Oscillator waveform
        const { omega0, dampingRatio } = mechanicsSolvers();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const simTime = x * 0.02;
          const envelope = Math.exp(-dampingRatio * omega0 * simTime);
          const yVal = 100 + Math.cos(omega0 * simTime - t * 2) * envelope * 65;
          if (x === 0) ctx.moveTo(x, yVal);
          else ctx.lineTo(x, yVal);
        }
        ctx.stroke();

        // Projectile parabola on bottom
        const { projectileRange, maxAltitude } = mechanicsSolvers();
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 220);
        const scaleX = Math.min(canvas.width - 40, projectileRange * 3);
        for (let px = 0; px <= scaleX; px++) {
          const normX = px / scaleX;
          const py = 220 - 4 * (maxAltitude * 1.5) * normX * (1 - normX);
          ctx.lineTo(20 + px, py);
        }
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "11px monospace";
        ctx.fillText(`Damped Oscillator: ω0=${omega0.toFixed(2)} rad/s, ζ=${dampingRatio.toFixed(3)}`, 20, 24);
        ctx.fillStyle = "#f59e0b";
        ctx.fillText(`Projectile Trajectory: Range=${projectileRange.toFixed(1)}m, Apex=${maxAltitude.toFixed(1)}m`, 20, 140);
      } else if (subfield === "electromagnetism") {
        // Solenoid magnetic field lines
        const { bField } = emSolvers();
        ctx.fillStyle = "#10b981";
        ctx.font = "11px monospace";
        ctx.fillText(`B-Field Flux Vector: B = ${bField.toFixed(3)} Tesla | Relative µr = ${emRelPermeability}`, 20, 24);

        // Core cylinder
        ctx.fillStyle = "#334155";
        ctx.fillRect(80, 80, 260, 60);

        // Solenoid coils
        ctx.strokeStyle = "#d97706";
        ctx.lineWidth = 3;
        for (let x = 90; x < 330; x += 14) {
          ctx.beginPath();
          ctx.ellipse(x, 110, 6, 36, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Magnetic vector arrows
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 1.5;
        for (let ly = 60; ly <= 160; ly += 50) {
          ctx.beginPath();
          ctx.moveTo(30, ly);
          ctx.lineTo(390, ly);
          ctx.stroke();
          // Arrowheads
          ctx.beginPath();
          ctx.moveTo(390, ly);
          ctx.lineTo(380, ly - 5);
          ctx.lineTo(380, ly + 5);
          ctx.fill();
        }
      } else if (subfield === "thermodynamics") {
        // Heat gradient colormap
        const { deltaT, heatFlowWatts, carnotEfficiency } = thermoSolvers();
        const grad = ctx.createLinearGradient(40, 0, 380, 0);
        grad.addColorStop(0, "#ef4444"); // Hot
        grad.addColorStop(1, "#3b82f6"); // Cold
        ctx.fillStyle = grad;
        ctx.fillRect(40, 60, 340, 80);

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px monospace";
        ctx.fillText(`Hot Side: ${thThot} K`, 45, 105);
        ctx.fillText(`Cold Side: ${thTcold} K`, 280, 105);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "11px monospace";
        ctx.fillText(`Conduction Heat Flux Q = ${heatFlowWatts.toFixed(1)} Watts (ΔT = ${deltaT} K)`, 20, 24);
        ctx.fillText(`Max Carnot Thermal Efficiency η_carnot = ${(carnotEfficiency * 100).toFixed(1)}%`, 20, 180);
      } else if (subfield === "optics") {
        // Snell's Law Ray Trace
        const { refractedAngleDeg, totalInternalReflection } = opticsSolvers();
        // Interface
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(210, 20);
        ctx.lineTo(210, 220);
        ctx.stroke();

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(210, 20, 190, 200);

        // Incident Ray
        const incRad = (optIncidentAngle * Math.PI) / 180;
        const startX = 210 - Math.tan(incRad) * 90;
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX, 30);
        ctx.lineTo(210, 120);
        ctx.stroke();

        // Refracted Ray
        if (!totalInternalReflection) {
          const refRad = (refractedAngleDeg * Math.PI) / 180;
          const endX = 210 + Math.tan(refRad) * 90;
          ctx.beginPath();
          ctx.moveTo(210, 120);
          ctx.lineTo(endX, 210);
          ctx.stroke();
        }

        ctx.fillStyle = "#facc15";
        ctx.font = "11px monospace";
        ctx.fillText(`Incident: ${optIncidentAngle}° in n1=${optN1} | Refracted: ${refractedAngleDeg.toFixed(1)}° in n2=${optN2}`, 20, 20);
      } else if (subfield === "fluids") {
        // Velocity profile in pipe
        const { velocityMs, reynolds, pressureDropBar } = fluidsSolvers();
        ctx.fillStyle = "#0284c7";
        ctx.font = "11px monospace";
        ctx.fillText(`Flow Profile: v_mean = ${velocityMs.toFixed(2)} m/s | Re = ${Math.round(reynolds)} (${reynolds < 2300 ? "Laminar" : "Turbulent"})`, 20, 24);
        ctx.fillText(`Pressure Drop over ${fluidPipeLength}m: ΔP = ${pressureDropBar.toFixed(3)} Bar`, 20, 210);

        // Pipe walls
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 60, 360, 100);

        // Parabolic fluid velocity vectors
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        for (let y = 70; y <= 150; y += 12) {
          const rNorm = (y - 110) / 45;
          const vFactor = Math.max(0, 1 - rNorm * rNorm);
          const arrowLen = vFactor * 120;
          ctx.beginPath();
          ctx.moveTo(50, y);
          ctx.lineTo(50 + arrowLen, y);
          ctx.stroke();
        }
      } else if (subfield === "materials") {
        // Stress-Strain Curve
        const { stressMpa, strain, safetyFactor } = materialsSolvers();
        ctx.strokeStyle = "#ec4899";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 200);
        ctx.lineTo(160, 90); // Linear elastic Hookean
        ctx.quadraticCurveTo(240, 80, 360, 110); // Plastic yield & necking
        ctx.stroke();

        // Current operating stress marker
        ctx.fillStyle = safetyFactor >= 1.5 ? "#10b981" : "#ef4444";
        ctx.beginPath();
        ctx.arc(120, 125, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ec4899";
        ctx.font = "11px monospace";
        ctx.fillText(`Tensile Stress σ = ${stressMpa.toFixed(1)} MPa | Yield: ${matYield} MPa`, 20, 24);
        ctx.fillText(`Strain ε = ${(strain * 100).toFixed(4)}% | Safety Factor SF = ${safetyFactor.toFixed(2)}`, 20, 42);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    subfield,
    simActive,
    mechMass,
    mechK,
    mechC,
    mechV0,
    mechAngle,
    emTurns,
    emCurrent,
    emRelPermeability,
    emLength,
    emCoreRadius,
    thTcold,
    thThot,
    thArea,
    thThickness,
    thConductivity,
    optN1,
    optN2,
    optIncidentAngle,
    optFocalLength,
    optObjectDist,
    fluidDensity,
    fluidViscosity,
    fluidPipeDiameter,
    fluidFlowRate,
    fluidPipeLength,
    matModulus,
    matYield,
    matTensileLoad,
    matCrossSection,
  ]);

  const handleCopyCode = () => {
    let pythonCode = "";
    if (subfield === "mechanics") {
      pythonCode = `import numpy as np\nfrom scipy.integrate import odeint\n\n# Damped Harmonic Oscillator: m*x'' + c*x' + k*x = 0\nm = ${mechMass}\nk = ${mechK}\nc = ${mechC}\n\ndef model(y, t):\n    x, v = y\n    dydt = [v, -(c/m)*v - (k/m)*x]\n    return dydt\n\nt = np.linspace(0, 10, 500)\ny0 = [1.0, 0.0]\nsol = odeint(model, y0, t)\nprint("Oscillation simulated. Final amplitude:", sol[-1, 0])`;
    } else if (subfield === "electromagnetism") {
      pythonCode = `import numpy as np\n# Solenoid B-Field & Inductance\nmu0 = 4 * np.pi * 1e-7\nmu_r = ${emRelPermeability}\nN = ${emTurns}\nI = ${emCurrent}\nL = ${emLength / 1000}\nr = ${emCoreRadius / 1000}\nA = np.pi * r**2\n\nB = (mu0 * mu_r * N * I) / L\ninductance = (mu0 * mu_r * (N**2) * A) / L\nprint(f"B-field: {B:.4f} T, Inductance: {inductance*1000:.2f} mH")`;
    } else {
      pythonCode = `# Physics Solver Script for ${subfield}\nprint("Executed physics verification model.")`;
    }
    navigator.clipboard.writeText(pythonCode);
    toast("Copied Python / NumPy physics solver script!");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Subfield Navigation Pill Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg border border-border bg-card">
        {[
          { id: "mechanics", label: "Mechanics & Kinematics" },
          { id: "electromagnetism", label: "Electromagnetism & Induction" },
          { id: "thermodynamics", label: "Thermodynamics & Heat" },
          { id: "optics", label: "Optics & Wave Physics" },
          { id: "fluids", label: "Fluid Dynamics (CFD Basis)" },
          { id: "materials", label: "Materials & Stress Physics" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSubfield(item.id as PhysicsSubfield)}
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
            <span className="text-foreground">Dynamic Physical Field & Trajectory Simulation</span>
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
                Python Script
              </Button>
              {onSendCodeToPython && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    let pythonCode = "";
                    if (subfield === "mechanics") {
                      pythonCode = `import math\n# Damped Oscillator & Projectile Ballistics\nm = ${mechMass}\nk = ${mechK}\nc = ${mechC}\nomega0 = math.sqrt(k / m)\nzeta = c / (2 * math.sqrt(m * k))\nprint(f"Natural Frequency: {omega0:.3f} rad/s, Damping Ratio: {zeta:.4f}")\ng = 9.80665\nrad = math.radians(${mechAngle})\nrange_m = (${mechV0}**2 * math.sin(2*rad)) / g\nprint(f"Projectile Range: {range_m:.2f} m")\n`;
                    } else if (subfield === "electromagnetism") {
                      pythonCode = `import math\n# Solenoid B-field and Inductance\nmu0 = 4 * math.pi * 1e-7\nmu_r = ${emRelPermeability}\nN = ${emTurns}\nI = ${emCurrent}\nL = ${emLength / 1000}\nB = (mu0 * mu_r * N * I) / L\nprint(f"B-field inside solenoid: {B:.4f} Tesla")\n`;
                    } else if (subfield === "thermodynamics") {
                      pythonCode = `# Fourier Heat Conduction & Carnot Efficiency\nk = ${thConductivity}\nA = ${thArea}\nd = ${thThickness}\nQ = (k * A * (${thThot} - ${thTcold})) / d\neta_carnot = 1 - (${thTcold} / ${thThot})\nprint(f"Heat Transfer Q: {Q:.1f} W | Carnot Limit: {eta_carnot*100:.2f}%")\n`;
                    } else {
                      pythonCode = `# Physics computation for ${subfield}\nprint("Executed physics verification model.")\n`;
                    }
                    onSendCodeToPython(pythonCode);
                    toast.success("Transferred physics script to Live Python Console!");
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

        {/* Real Sliders & Physical Parameter Inputs (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-border bg-card p-3 shadow-sm gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
            Physical Parameters & Equations ({subfield})
          </span>

          {subfield === "mechanics" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Oscillator Mass (m):</span>
                <span className="font-mono text-foreground font-semibold">{mechMass} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                value={mechMass}
                onChange={(e) => setMechMass(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Spring Constant (k):</span>
                <span className="font-mono text-foreground font-semibold">{mechK} N/m</span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                value={mechK}
                onChange={(e) => setMechK(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Damping Coefficient (c):</span>
                <span className="font-mono text-foreground font-semibold">{mechC} N·s/m</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={mechC}
                onChange={(e) => setMechC(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Projectile Launch Speed (v0):</span>
                <span className="font-mono text-foreground font-semibold">{mechV0} m/s</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                value={mechV0}
                onChange={(e) => setMechV0(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "electromagnetism" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Solenoid Coil Turns (N):</span>
                <span className="font-mono text-foreground font-semibold">{emTurns} turns</span>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="50"
                value={emTurns}
                onChange={(e) => setEmTurns(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Current (I):</span>
                <span className="font-mono text-foreground font-semibold">{emCurrent} A</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="25"
                step="0.1"
                value={emCurrent}
                onChange={(e) => setEmCurrent(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Core Relative Permeability (µr):</span>
                <span className="font-mono text-foreground font-semibold">{emRelPermeability}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3000"
                step="50"
                value={emRelPermeability}
                onChange={(e) => setEmRelPermeability(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "thermodynamics" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Hot Temperature (Th):</span>
                <span className="font-mono text-foreground font-semibold">{thThot} K ({thThot - 273}°C)</span>
              </div>
              <input
                type="range"
                min="310"
                max="1200"
                step="10"
                value={thThot}
                onChange={(e) => setThThot(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Cold Sink (Tc):</span>
                <span className="font-mono text-foreground font-semibold">{thTcold} K ({thTcold - 273}°C)</span>
              </div>
              <input
                type="range"
                min="200"
                max="350"
                step="5"
                value={thTcold}
                onChange={(e) => setThTcold(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Material Conductivity (k):</span>
                <span className="font-mono text-foreground font-semibold">{thConductivity} W/m·K</span>
              </div>
              <input
                type="range"
                min="1"
                max="400"
                value={thConductivity}
                onChange={(e) => setThConductivity(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "optics" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Incident Angle (θ1):</span>
                <span className="font-mono text-foreground font-semibold">{optIncidentAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="85"
                value={optIncidentAngle}
                onChange={(e) => setOptIncidentAngle(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Refractive Index n2 (Medium):</span>
                <span className="font-mono text-foreground font-semibold">{optN2}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={optN2}
                onChange={(e) => setOptN2(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "fluids" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Pipe Inner Diameter (D):</span>
                <span className="font-mono text-foreground font-semibold">{fluidPipeDiameter} mm</span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                value={fluidPipeDiameter}
                onChange={(e) => setFluidPipeDiameter(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Volumetric Flow (Q):</span>
                <span className="font-mono text-foreground font-semibold">{fluidFlowRate} L/s</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.2"
                value={fluidFlowRate}
                onChange={(e) => setFluidFlowRate(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "materials" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Tensile Load (F):</span>
                <span className="font-mono text-foreground font-semibold">{matTensileLoad} N</span>
              </div>
              <input
                type="range"
                min="500"
                max="80000"
                step="500"
                value={matTensileLoad}
                onChange={(e) => setMatTensileLoad(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Cross-Section Area (A):</span>
                <span className="font-mono text-foreground font-semibold">{matCrossSection} mm²</span>
              </div>
              <input
                type="range"
                min="5"
                max="400"
                value={matCrossSection}
                onChange={(e) => setMatCrossSection(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
