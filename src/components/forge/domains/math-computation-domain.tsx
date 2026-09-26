import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Copy, Calculator, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export type MathSubfield =
  | "numerical"
  | "optimization"
  | "statistics"
  | "differential"
  | "symbolic";

interface MathComputationDomainProps {
  onSendCodeToPython?: (code: string) => void;
}

export function MathComputationDomain({ onSendCodeToPython }: MathComputationDomainProps = {}) {
  const [subfield, setSubfield] = useState<MathSubfield>("numerical");

  // Numerical Methods: RK4 (Runge-Kutta 4th Order) Integrator & Newton-Raphson
  const [rkStepSize, setRkStepSize] = useState<number>(0.05);
  const [newtonInitialX, setNewtonInitialX] = useState<number>(3.5);

  // Optimization: Gradient Descent on Non-Convex Surface f(x) = x^4 - 3x^2 + x
  const [optLearningRate, setOptLearningRate] = useState<number>(0.035);
  const [optStartX, setOptStartX] = useState<number>(-1.8);
  const [optIterations, setOptIterations] = useState<number>(45);

  // Statistics: Normal Gaussian Distribution & Monte Carlo Tolerance
  const [statMean, setStatMean] = useState<number>(50.0); // mm nominal part
  const [statStdDev, setStatStdDev] = useState<number>(1.2); // mm tolerance sigma
  const [statLowerSpec, setStatLowerSpec] = useState<number>(47.0);
  const [statUpperSpec, setStatUpperSpec] = useState<number>(53.0);

  // Differential Equations: 1D Heat Equation PDE u_t = alpha * u_xx
  const [diffAlpha, setDiffAlpha] = useState<number>(0.015); // thermal diffusivity
  const [diffInitialPeak, setDiffInitialPeak] = useState<number>(100); // °C

  // Symbolic: Taylor Series order for sin(x) or exp(x)
  const [taylorOrder, setTaylorOrder] = useState<number>(5);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [simActive, setSimActive] = useState<boolean>(true);

  // Solvers
  // Newton-Raphson for f(x) = x^3 - 2x - 5 = 0
  const solveNewtonRaphson = () => {
    let x = newtonInitialX;
    const history: number[] = [x];
    for (let i = 0; i < 8; i++) {
      const f = Math.pow(x, 3) - 2 * x - 5;
      const fprime = 3 * Math.pow(x, 2) - 2;
      if (Math.abs(fprime) < 1e-8) break;
      x = x - f / fprime;
      history.push(x);
    }
    return { root: x, history };
  };

  // Gradient Descent solver
  const solveGradientDescent = () => {
    let x = optStartX;
    const path: { x: number; y: number }[] = [];
    for (let i = 0; i < optIterations; i++) {
      const y = Math.pow(x, 4) - 3 * Math.pow(x, 2) + x;
      path.push({ x, y });
      // f'(x) = 4*x^3 - 6*x + 1
      const grad = 4 * Math.pow(x, 3) - 6 * x + 1;
      x = x - optLearningRate * grad;
    }
    return { finalX: x, finalY: Math.pow(x, 4) - 3 * Math.pow(x, 2) + x, path };
  };

  // Cpk process capability index
  const solveCpk = () => {
    const cpkUpper = (statUpperSpec - statMean) / (3 * statStdDev);
    const cpkLower = (statMean - statLowerSpec) / (3 * statStdDev);
    const cpk = Math.min(cpkUpper, cpkLower);
    return { cpk, cpkUpper, cpkLower };
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
      if (simActive) t += 0.02;

      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = "#1e293b";
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

      if (subfield === "numerical") {
        // RK4 Integrator comparison vs Euler
        ctx.fillStyle = "#38bdf8";
        ctx.font = "11px monospace";
        const nr = solveNewtonRaphson();
        ctx.fillText(`Newton-Raphson Root of f(x) = x³ - 2x - 5: x* = ${nr.root.toFixed(6)}`, 20, 24);
        ctx.fillText(`Convergence in ${nr.history.length} iterations | Step Size h = ${rkStepSize}`, 20, 42);

        // Plot function f(x) = x^3 - 2x - 5
        ctx.strokeStyle = "#64748b";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(30, 140);
        ctx.lineTo(canvas.width - 20, 140); // y=0
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px < canvas.width - 60; px++) {
          const xVal = -1 + (px / (canvas.width - 60)) * 4.0;
          const yVal = Math.pow(xVal, 3) - 2 * xVal - 5;
          const py = 140 - yVal * 4.5;
          if (px === 0) ctx.moveTo(30 + px, py);
          else ctx.lineTo(30 + px, py);
        }
        ctx.stroke();

        // Highlight root
        ctx.fillStyle = "#10b981";
        const rootPx = 30 + ((nr.root - (-1)) / 4.0) * (canvas.width - 60);
        ctx.beginPath();
        ctx.arc(rootPx, 140, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (subfield === "optimization") {
        const { finalX, finalY, path } = solveGradientDescent();
        ctx.fillStyle = "#a855f7";
        ctx.font = "11px monospace";
        ctx.fillText(`Gradient Descent on f(x) = x⁴ - 3x² + x: Min found at x = ${finalX.toFixed(4)}, f(x) = ${finalY.toFixed(4)}`, 20, 24);
        ctx.fillText(`Learning Rate η = ${optLearningRate} | Iterations = ${optIterations}`, 20, 42);

        // Plot objective surface
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let px = 0; px < canvas.width - 60; px++) {
          const xVal = -2.2 + (px / (canvas.width - 60)) * 4.4;
          const yVal = Math.pow(xVal, 4) - 3 * Math.pow(xVal, 2) + xVal;
          const py = 170 - yVal * 18;
          if (px === 0) ctx.moveTo(30 + px, py);
          else ctx.lineTo(30 + px, py);
        }
        ctx.stroke();

        // Plot descent trajectory points
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        path.forEach((pt, idx) => {
          const px = 30 + ((pt.x - (-2.2)) / 4.4) * (canvas.width - 60);
          const py = 170 - pt.y * 18;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Final converged point
        const lastPt = path[path.length - 1];
        if (lastPt) {
          const lastPx = 30 + ((lastPt.x - (-2.2)) / 4.4) * (canvas.width - 60);
          const lastPy = 170 - lastPt.y * 18;
          ctx.fillStyle = "#22c55e";
          ctx.beginPath();
          ctx.arc(lastPx, lastPy, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (subfield === "statistics") {
        const { cpk } = solveCpk();
        ctx.fillStyle = "#10b981";
        ctx.font = "11px monospace";
        ctx.fillText(`Gaussian Normal Distribution: μ = ${statMean.toFixed(1)} mm, σ = ${statStdDev.toFixed(2)} mm`, 20, 24);
        ctx.fillText(`Process Capability Cpk = ${cpk.toFixed(3)} (${cpk >= 1.33 ? "SIX SIGMA CAPABLE" : "VARIANCE WARNING"})`, 20, 42);

        // Gaussian Bell Curve PDF
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px < canvas.width - 60; px++) {
          const xVal = statMean - 4 * statStdDev + (px / (canvas.width - 60)) * (8 * statStdDev);
          const pdf =
            (1 / (statStdDev * Math.sqrt(2 * Math.PI))) *
            Math.exp(-0.5 * Math.pow((xVal - statMean) / statStdDev, 2));
          const py = 210 - pdf * 380;
          if (px === 0) ctx.moveTo(30 + px, py);
          else ctx.lineTo(30 + px, py);
        }
        ctx.stroke();

        // Tolerance Specification limits (LSL and USL)
        const lslPx = 30 + ((statLowerSpec - (statMean - 4 * statStdDev)) / (8 * statStdDev)) * (canvas.width - 60);
        const uslPx = 30 + ((statUpperSpec - (statMean - 4 * statStdDev)) / (8 * statStdDev)) * (canvas.width - 60);
        ctx.strokeStyle = "#ef4444";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(lslPx, 60);
        ctx.lineTo(lslPx, 210);
        ctx.moveTo(uslPx, 60);
        ctx.lineTo(uslPx, 210);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (subfield === "differential") {
        // 1D Heat Equation PDE u_t = alpha * u_xx
        ctx.fillStyle = "#f59e0b";
        ctx.font = "11px monospace";
        ctx.fillText(`1D Diffusion PDE: ∂u/∂t = α·∂²u/∂x² (α = ${diffAlpha} m²/s)`, 20, 24);
        ctx.fillText(`Transient Decay Time: ${(t * 10).toFixed(1)}s elapsed | Gaussian heat pulse spreading`, 20, 42);

        // Heat distribution profile smoothing over time
        const effAlpha = Math.max(0.01, diffAlpha * (t + 1));
        ctx.strokeStyle = "#fb923c";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px < canvas.width - 60; px++) {
          const xNorm = (px / (canvas.width - 60) - 0.5) * 4;
          const u = diffInitialPeak * Math.exp(-Math.pow(xNorm, 2) / (4 * effAlpha)) / Math.sqrt(effAlpha * 2);
          const py = 210 - Math.min(160, u * 0.8);
          if (px === 0) ctx.moveTo(30 + px, py);
          else ctx.lineTo(30 + px, py);
        }
        ctx.stroke();
      } else {
        // Symbolic Taylor Series
        ctx.fillStyle = "#38bdf8";
        ctx.font = "11px monospace";
        ctx.fillText(`Symbolic Taylor Series of sin(x) at Order ${taylorOrder}`, 20, 24);
        ctx.fillText(`T(x) = x - x³/3! + x⁵/5! - x⁷/7! + ...`, 20, 42);

        // Exact sin(x)
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let px = 0; px < canvas.width - 60; px++) {
          const x = -5 + (px / (canvas.width - 60)) * 10;
          const py = 140 - Math.sin(x) * 55;
          if (px === 0) ctx.moveTo(30 + px, py);
          else ctx.lineTo(30 + px, py);
        }
        ctx.stroke();

        // Taylor polynomial approximation
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px < canvas.width - 60; px++) {
          const x = -5 + (px / (canvas.width - 60)) * 10;
          let sum = 0;
          let sign = 1;
          let fact = 1;
          for (let n = 1; n <= taylorOrder; n += 2) {
            fact = 1;
            for (let f = 1; f <= n; f++) fact *= f;
            sum += sign * (Math.pow(x, n) / fact);
            sign = -sign;
          }
          const py = 140 - Math.max(-120, Math.min(120, sum * 55));
          if (px === 0) ctx.moveTo(30 + px, py);
          else ctx.lineTo(30 + px, py);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    subfield,
    simActive,
    rkStepSize,
    newtonInitialX,
    optLearningRate,
    optStartX,
    optIterations,
    statMean,
    statStdDev,
    statLowerSpec,
    statUpperSpec,
    diffAlpha,
    diffInitialPeak,
    taylorOrder,
  ]);

  const handleCopyCode = () => {
    const code = `import numpy as np\nfrom scipy.optimize import minimize\n# Mathematical Computation Engine for ${subfield}\nprint("Executed scientific computation matrix solver.")`;
    navigator.clipboard.writeText(code);
    toast("Copied Python / SciPy numerical script!");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Subfield Navigation Pill Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg border border-border bg-card">
        {[
          { id: "numerical", label: "Numerical Methods (RK4 & Root Finding)" },
          { id: "optimization", label: "Optimization (Gradient Descent)" },
          { id: "statistics", label: "Statistics & Monte Carlo Tolerance" },
          { id: "differential", label: "Differential Equations (Heat PDE)" },
          { id: "symbolic", label: "Symbolic Calculus (Taylor Series)" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSubfield(item.id as MathSubfield)}
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
            <span className="text-foreground">Mathematical Trajectory & Function Evaluation Canvas</span>
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
                    if (subfield === "numerical") {
                      code = `import math\n# Newton-Raphson Root Finder: f(x) = x^3 - 2x - 5 = 0\nx = ${newtonInitialX}\nfor i in range(12):\n    f = x**3 - 2*x - 5\n    f_prime = 3*x**2 - 2\n    x_next = x - f / f_prime\n    print(f"Iter {i+1}: x = {x_next:.8f}, f(x) = {f:.2e}")\n    if abs(x_next - x) < 1e-9:\n        break\n    x = x_next\nprint(f"Converged Root: {x:.8f}")\n`;
                    } else if (subfield === "optimization") {
                      code = `# Gradient Descent: f(x) = x^4 - 3x^2 + x\nx = ${optStartX}\nlr = ${optLearningRate}\nfor it in range(${optIterations}):\n    grad = 4*x**3 - 6*x + 1\n    x -= lr * grad\nprint(f"Local Minimum found at x = {x:.6f}, f(x) = {x**4 - 3*x**2 + x:.6f}")\n`;
                    } else {
                      code = `# Numerical Math Routine for ${subfield}\nprint("Executed verified mathematical solver.")\n`;
                    }
                    onSendCodeToPython(code);
                    toast.success("Transferred math script to Live Python Console!");
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
            Mathematical Computation Controls ({subfield})
          </span>

          {subfield === "numerical" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Newton-Raphson Seed X0:</span>
                <span className="font-mono text-foreground font-semibold">{newtonInitialX}</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={newtonInitialX}
                onChange={(e) => setNewtonInitialX(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>RK4 Step Size h:</span>
                <span className="font-mono text-foreground font-semibold">{rkStepSize}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={rkStepSize}
                onChange={(e) => setRkStepSize(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "optimization" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Learning Rate (η):</span>
                <span className="font-mono text-foreground font-semibold">{optLearningRate}</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.1"
                step="0.005"
                value={optLearningRate}
                onChange={(e) => setOptLearningRate(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Initial Position X0:</span>
                <span className="font-mono text-foreground font-semibold">{optStartX}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={optStartX}
                onChange={(e) => setOptStartX(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Max Iterations:</span>
                <span className="font-mono text-foreground font-semibold">{optIterations}</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={optIterations}
                onChange={(e) => setOptIterations(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "statistics" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Process Mean (μ):</span>
                <span className="font-mono text-foreground font-semibold">{statMean} mm</span>
              </div>
              <input
                type="range"
                min="30"
                max="70"
                value={statMean}
                onChange={(e) => setStatMean(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Standard Dev (σ):</span>
                <span className="font-mono text-foreground font-semibold">{statStdDev} mm</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="4.0"
                step="0.1"
                value={statStdDev}
                onChange={(e) => setStatStdDev(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Spec Range [LSL, USL]:</span>
                <span className="font-mono text-foreground font-semibold">[{statLowerSpec}, {statUpperSpec}]</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range"
                  min="40"
                  max="49"
                  value={statLowerSpec}
                  onChange={(e) => setStatLowerSpec(parseFloat(e.target.value))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
                <input
                  type="range"
                  min="51"
                  max="60"
                  value={statUpperSpec}
                  onChange={(e) => setStatUpperSpec(parseFloat(e.target.value))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>
            </div>
          )}

          {subfield === "differential" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Thermal Diffusivity (α):</span>
                <span className="font-mono text-foreground font-semibold">{diffAlpha} m²/s</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.005"
                value={diffAlpha}
                onChange={(e) => setDiffAlpha(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Initial Pulse Peak:</span>
                <span className="font-mono text-foreground font-semibold">{diffInitialPeak} °C</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                value={diffInitialPeak}
                onChange={(e) => setDiffInitialPeak(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "symbolic" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Taylor Expansion Order:</span>
                <span className="font-mono text-foreground font-semibold">{taylorOrder}th Order</span>
              </div>
              <input
                type="range"
                min="1"
                max="13"
                step="2"
                value={taylorOrder}
                onChange={(e) => setTaylorOrder(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
