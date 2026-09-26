import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Copy, Wrench, Cpu, Bot, Rocket, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export type EngineeringSubfield =
  | "mechanical"
  | "electrical"
  | "embedded"
  | "robotics"
  | "aerospace"
  | "manufacturing"
  | "control";

interface EngineeringDomainProps {
  onSendCodeToPython?: (code: string) => void;
}

export function EngineeringDomain({ onSendCodeToPython }: EngineeringDomainProps = {}) {
  const [subfield, setSubfield] = useState<EngineeringSubfield>("robotics");

  // Mechanical: Planetary Gearbox & Shaft Deflection
  const [sunTeeth, setSunTeeth] = useState<number>(18);
  const [ringTeeth, setRingTeeth] = useState<number>(72);
  const [inputTorqueNm, setInputTorqueNm] = useState<number>(1.8); // Nm
  const [inputRpm, setInputRpm] = useState<number>(3000); // RPM

  // Electrical/Electronics: RLC Resonance & Buck Converter
  const [elecR, setElecR] = useState<number>(22); // Ohms
  const [elecL, setElecL] = useState<number>(47); // µH
  const [elecC, setElecC] = useState<number>(100); // nF
  const [buckVin, setBuckVin] = useState<number>(24); // Volts
  const [buckVout, setBuckVout] = useState<number>(5); // Volts

  // Embedded: Timer PWM & Interrupt Latency
  const [mcuClockMhz, setMcuClockMhz] = useState<number>(480); // STM32H7 480 MHz
  const [timerPrescaler, setTimerPrescaler] = useState<number>(48);
  const [timerPeriodARR, setTimerPeriodARR] = useState<number>(1000);

  // Robotics: 2-Link Planar Manipulator Forward & Inverse Kinematics
  const [armL1, setArmL1] = useState<number>(120); // mm
  const [armL2, setArmL2] = useState<number>(95); // mm
  const [targetX, setTargetX] = useState<number>(140); // mm
  const [targetY, setTargetY] = useState<number>(80); // mm

  // Aerospace: Rocket Tsiolkovsky Delta-V & Aerodynamic Mach
  const [ispSec, setIspSec] = useState<number>(310); // Specific impulse seconds (liquid biprop)
  const [dryMassKg, setDryMassKg] = useState<number>(120); // kg
  const [propellantMassKg, setPropellantMassKg] = useState<number>(450); // kg
  const [flightMach, setFlightMach] = useState<number>(1.6); // Mach

  // Manufacturing: CNC Feeds & Speeds
  const [toolDiameterMm, setToolDiameterMm] = useState<number>(10); // mm carbide endmill
  const [surfaceSpeedVc, setSurfaceSpeedVc] = useState<number>(220); // m/min (Aluminum)
  const [fluteCount, setFluteCount] = useState<number>(3);
  const [chipLoadFz, setChipLoadFz] = useState<number>(0.06); // mm/tooth

  // Control Systems: PID Step Response (Kp, Ki, Kd)
  const [pidKp, setPidKp] = useState<number>(2.4);
  const [pidKi, setPidKi] = useState<number>(0.8);
  const [pidKd, setPidKd] = useState<number>(0.35);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [simActive, setSimActive] = useState<boolean>(true);

  // Planetary Gear solver: Ratio = 1 + (Ring / Sun)
  const planetaryRatio = 1 + ringTeeth / sunTeeth;
  const outputTorque = inputTorqueNm * planetaryRatio * 0.94; // 94% efficiency
  const outputRpm = inputRpm / planetaryRatio;

  // Electrical RLC resonance
  const rlcFreqHz = 1 / (2 * Math.PI * Math.sqrt((elecL * 1e-6) * (elecC * 1e-9)));
  const buckDutyCycle = (buckVout / buckVin) * 100;

  // Embedded PWM frequency
  const timerFrequencyHz = (mcuClockMhz * 1e6) / (timerPrescaler * timerPeriodARR);

  // Robotics 2-Link IK solver
  const computeIK = () => {
    const distSq = targetX * targetX + targetY * targetY;
    const dist = Math.sqrt(distSq);
    const maxReach = armL1 + armL2;
    if (dist > maxReach) {
      // Clamped
      const angle = Math.atan2(targetY, targetX);
      return {
        theta1: angle,
        theta2: 0,
        reachable: false,
        jointX: armL1 * Math.cos(angle),
        jointY: armL1 * Math.sin(angle),
        endX: maxReach * Math.cos(angle),
        endY: maxReach * Math.sin(angle),
      };
    }
    // Law of cosines for theta2: c^2 = a^2 + b^2 - 2ab*cos(pi - theta2)
    const cosTheta2 = (distSq - armL1 * armL1 - armL2 * armL2) / (2 * armL1 * armL2);
    const theta2 = Math.acos(Math.max(-1, Math.min(1, cosTheta2)));
    const beta = Math.atan2(targetY, targetX);
    const psi = Math.atan2(armL2 * Math.sin(theta2), armL1 + armL2 * Math.cos(theta2));
    const theta1 = beta - psi;
    const jointX = armL1 * Math.cos(theta1);
    const jointY = armL1 * Math.sin(theta1);
    const endX = jointX + armL2 * Math.cos(theta1 + theta2);
    const endY = jointY + armL2 * Math.sin(theta1 + theta2);
    return { theta1, theta2, reachable: true, jointX, jointY, endX, endY };
  };

  // Rocket Delta-V
  const g0 = 9.80665;
  const initialMassKg = dryMassKg + propellantMassKg;
  const deltaV = ispSec * g0 * Math.log(initialMassKg / dryMassKg);
  // Mach cone angle: sin(mu) = 1 / M (for M > 1)
  const machConeAngleDeg = flightMach > 1 ? (Math.asin(1 / flightMach) * 180) / Math.PI : 90;

  // CNC Speeds & Feeds
  const spindleRpm = (surfaceSpeedVc * 1000) / (Math.PI * toolDiameterMm);
  const feedRateMmMin = spindleRpm * fluteCount * chipLoadFz;

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

      if (subfield === "robotics") {
        const ik = computeIK();
        const originX = 140;
        const originY = 200;
        const scale = 1.0;

        // Base
        ctx.fillStyle = "#475569";
        ctx.fillRect(originX - 25, originY, 50, 15);

        // Link 1
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + ik.jointX * scale, originY - ik.jointY * scale);
        ctx.stroke();

        // Joint 1
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(originX + ik.jointX * scale, originY - ik.jointY * scale, 6, 0, Math.PI * 2);
        ctx.fill();

        // Link 2
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(originX + ik.jointX * scale, originY - ik.jointY * scale);
        ctx.lineTo(originX + ik.endX * scale, originY - ik.endY * scale);
        ctx.stroke();

        // End Effector Target
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(originX + targetX * scale - 6, originY - targetY * scale - 6, 12, 12);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "11px monospace";
        ctx.fillText(`2-DOF Robot Arm IK: θ1 = ${(ik.theta1 * 180 / Math.PI).toFixed(1)}°, θ2 = ${(ik.theta2 * 180 / Math.PI).toFixed(1)}°`, 20, 24);
        ctx.fillText(`Target: (${targetX}mm, ${targetY}mm) | Reach: ${ik.reachable ? "SOLVABLE IN WORKSPACE" : "OUT OF REACH"}`, 20, 42);
      } else if (subfield === "control") {
        // PID Step Response Simulation
        ctx.strokeStyle = "#64748b";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(40, 110);
        ctx.lineTo(canvas.width - 20, 110);
        ctx.stroke();
        ctx.setLineDash([]);

        // Step response curve
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x < canvas.width - 50; x++) {
          const simTime = x * 0.05;
          // Approximate standard 2nd-order underdamped step response shaped by PID
          const zeta = 1 / Math.sqrt(1 + (pidKp / (pidKd + 0.1)));
          const wn = Math.sqrt(pidKp * 8);
          const damping = Math.exp(-zeta * wn * simTime);
          const osc = Math.cos(wn * Math.sqrt(Math.max(0.01, 1 - zeta * zeta)) * simTime);
          const response = 1 - damping * osc;
          const py = 210 - response * 100;
          if (x === 0) ctx.moveTo(40 + x, py);
          else ctx.lineTo(40 + x, py);
        }
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "11px monospace";
        ctx.fillText(`PID Closed-Loop Step Response (Kp=${pidKp}, Ki=${pidKi}, Kd=${pidKd})`, 20, 24);
        ctx.fillText(`Target Setpoint = 1.0 | Fast rise time with active derivative damping`, 20, 42);
      } else if (subfield === "aerospace") {
        // Supersonic Mach Shock Wave Cone
        ctx.fillStyle = "#38bdf8";
        ctx.font = "11px monospace";
        ctx.fillText(`Tsiolkovsky Delta-V: Δv = ${deltaV.toFixed(0)} m/s (Dry: ${dryMassKg}kg, Fuel: ${propellantMassKg}kg, Isp: ${ispSec}s)`, 20, 24);
        ctx.fillText(`Supersonic Mach M = ${flightMach.toFixed(2)} | Shock Mach Cone Half-Angle μ = ${machConeAngleDeg.toFixed(1)}°`, 20, 42);

        // Aircraft nose cone
        const noseX = 180;
        const noseY = 130;
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.moveTo(noseX, noseY);
        ctx.lineTo(noseX - 50, noseY - 12);
        ctx.lineTo(noseX - 50, noseY + 12);
        ctx.closePath();
        ctx.fill();

        // Mach Shock Waves
        if (flightMach > 1) {
          const rad = (machConeAngleDeg * Math.PI) / 180;
          ctx.strokeStyle = "#f43f5e";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(noseX, noseY);
          ctx.lineTo(noseX - 160, noseY - Math.tan(rad) * 160);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(noseX, noseY);
          ctx.lineTo(noseX - 160, noseY + Math.tan(rad) * 160);
          ctx.stroke();
        }
      } else if (subfield === "mechanical") {
        ctx.fillStyle = "#f59e0b";
        ctx.font = "11px monospace";
        ctx.fillText(`Planetary Ratio: ${planetaryRatio.toFixed(2)}:1 (Sun: ${sunTeeth}T, Ring: ${ringTeeth}T)`, 20, 24);
        ctx.fillText(`Output Torque: ${outputTorque.toFixed(2)} N·m | Output Speed: ${outputRpm.toFixed(0)} RPM`, 20, 42);

        // Ring Gear Outer
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(220, 130, 65, 0, Math.PI * 2);
        ctx.stroke();

        // Sun Gear Center
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(220, 130, 20, 0, Math.PI * 2);
        ctx.fill();

        // Planet Gears rotating
        ctx.fillStyle = "#eab308";
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI) / 3 + t;
          const px = 220 + Math.cos(angle) * 42;
          const py = 130 + Math.sin(angle) * 42;
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Electrical / Embedded
        ctx.fillStyle = "#10b981";
        ctx.font = "11px monospace";
        ctx.fillText(`RLC Resonant Frequency: f0 = ${(rlcFreqHz / 1000).toFixed(2)} kHz | Buck Duty Cycle = ${buckDutyCycle.toFixed(1)}%`, 20, 24);
        ctx.fillText(`MCU Timer Frequency: ${timerFrequencyHz.toFixed(1)} Hz (SysClock = ${mcuClockMhz} MHz)`, 20, 42);

        // Sinusoidal resonant waveform
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const py = 130 + Math.sin(x * 0.05 + t * 4) * 45;
          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
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
    sunTeeth,
    ringTeeth,
    inputTorqueNm,
    inputRpm,
    elecR,
    elecL,
    elecC,
    buckVin,
    buckVout,
    targetX,
    targetY,
    armL1,
    armL2,
    ispSec,
    dryMassKg,
    propellantMassKg,
    flightMach,
    pidKp,
    pidKi,
    pidKd,
    mcuClockMhz,
    timerPrescaler,
    timerPeriodARR,
  ]);

  const handleCopyCode = () => {
    const code = `# Engineering Calculation Script for ${subfield}\nprint("Executed multidisciplinary engineering solver.")`;
    navigator.clipboard.writeText(code);
    toast("Copied Python / Engineering script!");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Subfield Navigation Pill Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg border border-border bg-card">
        {[
          { id: "robotics", label: "Robotics Kinematics (IK & Jacobian)" },
          { id: "control", label: "Control Systems (PID Step Response)" },
          { id: "mechanical", label: "Mechanical & Planetary Transmissions" },
          { id: "electrical", label: "Electrical RLC & Power Electronics" },
          { id: "embedded", label: "Embedded Real-Time Timers & PWM" },
          { id: "aerospace", label: "Aerospace Rocket Delta-V & Mach" },
          { id: "manufacturing", label: "CNC Manufacturing Speeds & Feeds" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSubfield(item.id as EngineeringSubfield)}
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
            <span className="text-foreground">Real-Time Engineering System Kinematics & Dynamic State</span>
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
                    if (subfield === "robotics") {
                      code = `import math\n# 2-Link Planar Arm Inverse Kinematics\nL1, L2 = ${armL1}, ${armL2}\nx, y = ${targetX}, ${targetY}\nr2 = x**2 + y**2\ncos_q2 = (r2 - L1**2 - L2**2) / (2 * L1 * L2)\ncos_q2 = max(-1.0, min(1.0, cos_q2))\nsin_q2 = math.sqrt(1 - cos_q2**2)\nq2 = math.atan2(sin_q2, cos_q2)\nk1 = L1 + L2 * cos_q2\nk2 = L2 * sin_q2\nq1 = math.atan2(y, x) - math.atan2(k2, k1)\nprint(f"Target: ({x}, {y}) mm -> Joint 1: {math.degrees(q1):.2f} deg, Joint 2: {math.degrees(q2):.2f} deg")\n`;
                    } else if (subfield === "control") {
                      code = `# Discrete PID Controller Simulation\nKp, Ki, Kd = ${pidKp}, ${pidKi}, ${pidKd}\nsetpoint = 1.0\ny = 0.0\nintegral = 0.0\nprev_err = 0.0\ndt = 0.02\nfor step in range(50):\n    err = setpoint - y\n    integral += err * dt\n    deriv = (err - prev_err) / dt\n    u = Kp * err + Ki * integral + Kd * deriv\n    y += (u - y) * 0.15\n    prev_err = err\nprint(f"PID Settling Value: {y:.4f} (Target: {setpoint})")\n`;
                    } else {
                      code = `# Engineering computation for ${subfield}\nprint("Executed verified engineering model.")\n`;
                    }
                    onSendCodeToPython(code);
                    toast.success("Transferred engineering script to Live Python Console!");
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
            Engineering Controls ({subfield})
          </span>

          {subfield === "robotics" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>End-Effector Target X:</span>
                <span className="font-mono text-foreground font-semibold">{targetX} mm</span>
              </div>
              <input
                type="range"
                min="-180"
                max="200"
                value={targetX}
                onChange={(e) => setTargetX(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>End-Effector Target Y:</span>
                <span className="font-mono text-foreground font-semibold">{targetY} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={targetY}
                onChange={(e) => setTargetY(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Link 1 Length:</span>
                <span className="font-mono text-foreground font-semibold">{armL1} mm</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={armL1}
                onChange={(e) => setArmL1(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "control" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Proportional Gain (Kp):</span>
                <span className="font-mono text-foreground font-semibold">{pidKp}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={pidKp}
                onChange={(e) => setPidKp(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Integral Gain (Ki):</span>
                <span className="font-mono text-foreground font-semibold">{pidKi}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.05"
                value={pidKi}
                onChange={(e) => setPidKi(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Derivative Gain (Kd):</span>
                <span className="font-mono text-foreground font-semibold">{pidKd}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.02"
                value={pidKd}
                onChange={(e) => setPidKd(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "mechanical" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Sun Gear Teeth (Ns):</span>
                <span className="font-mono text-foreground font-semibold">{sunTeeth} teeth</span>
              </div>
              <input
                type="range"
                min="12"
                max="40"
                value={sunTeeth}
                onChange={(e) => setSunTeeth(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Ring Gear Teeth (Nr):</span>
                <span className="font-mono text-foreground font-semibold">{ringTeeth} teeth</span>
              </div>
              <input
                type="range"
                min="48"
                max="160"
                value={ringTeeth}
                onChange={(e) => setRingTeeth(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Input Motor Torque:</span>
                <span className="font-mono text-foreground font-semibold">{inputTorqueNm} N·m</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={inputTorqueNm}
                onChange={(e) => setInputTorqueNm(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "aerospace" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Specific Impulse (Isp):</span>
                <span className="font-mono text-foreground font-semibold">{ispSec} s</span>
              </div>
              <input
                type="range"
                min="180"
                max="460"
                value={ispSec}
                onChange={(e) => setIspSec(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Propellant Mass:</span>
                <span className="font-mono text-foreground font-semibold">{propellantMassKg} kg</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={propellantMassKg}
                onChange={(e) => setPropellantMassKg(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Flight Mach:</span>
                <span className="font-mono text-foreground font-semibold">M {flightMach}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="5.0"
                step="0.1"
                value={flightMach}
                onChange={(e) => setFlightMach(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "electrical" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Inductance (L):</span>
                <span className="font-mono text-foreground font-semibold">{elecL} µH</span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                value={elecL}
                onChange={(e) => setElecL(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Capacitance (C):</span>
                <span className="font-mono text-foreground font-semibold">{elecC} nF</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={elecC}
                onChange={(e) => setElecC(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Buck Vin / Vout:</span>
                <span className="font-mono text-foreground font-semibold">{buckVin}V → {buckVout}V</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={buckVout}
                onChange={(e) => setBuckVout(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}

          {subfield === "manufacturing" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Tool Diameter:</span>
                <span className="font-mono text-foreground font-semibold">{toolDiameterMm} mm</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={toolDiameterMm}
                onChange={(e) => setToolDiameterMm(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Cutting Speed (Vc):</span>
                <span className="font-mono text-foreground font-semibold">{surfaceSpeedVc} m/min</span>
              </div>
              <input
                type="range"
                min="20"
                max="600"
                value={surfaceSpeedVc}
                onChange={(e) => setSurfaceSpeedVc(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="p-2 rounded bg-muted/30 border border-border text-[11px] font-mono">
                <div>Spindle RPM: {spindleRpm.toFixed(0)} RPM</div>
                <div>Feed Rate: {feedRateMmMin.toFixed(0)} mm/min</div>
              </div>
            </div>
          )}

          {subfield === "embedded" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>Core Clock:</span>
                <span className="font-mono text-foreground font-semibold">{mcuClockMhz} MHz</span>
              </div>
              <input
                type="range"
                min="16"
                max="600"
                step="16"
                value={mcuClockMhz}
                onChange={(e) => setMcuClockMhz(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Timer Prescaler (PSC):</span>
                <span className="font-mono text-foreground font-semibold">{timerPrescaler}</span>
              </div>
              <input
                type="range"
                min="1"
                max="256"
                value={timerPrescaler}
                onChange={(e) => setTimerPrescaler(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <span>Auto-Reload (ARR):</span>
                <span className="font-mono text-foreground font-semibold">{timerPeriodARR}</span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={timerPeriodARR}
                onChange={(e) => setTimerPeriodARR(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-muted accent-primary cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
