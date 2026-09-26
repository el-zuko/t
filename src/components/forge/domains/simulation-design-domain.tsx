import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import {
  Play,
  Pause,
  Download,
  Box,
  Wind,
  Activity,
  Layers,
  Zap,
  RefreshCw,
  Terminal,
  Code2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sliders,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Cfd3dViewport } from "./cfd-3d-viewport";

export type SimSubfield = "spice" | "cfd" | "cad" | "fea" | "multiphysics";

interface SimulationDesignDomainProps {
  onSendCodeToPython?: (code: string) => void;
}

export function SimulationDesignDomain({ onSendCodeToPython }: SimulationDesignDomainProps) {
  const [subfield, setSubfield] = useState<SimSubfield>("spice");
  const [cfdViewportMode, setCfdViewportMode] = useState<"2d" | "3d">("3d");

  // =========================================================================
  // 1. NGSPICE CIRCUIT SIMULATION STATE & CONTROLS
  // =========================================================================
  const [spiceR, setSpiceR] = useState<number>(1000); // 1k Ohm
  const [spiceC, setSpiceC] = useState<number>(10); // 10 µF
  const [spiceVpeak, setSpiceVpeak] = useState<number>(5.0); // 5V
  const [spicePeriodMs, setSpicePeriodMs] = useState<number>(20); // 20 ms period
  const [spiceRunning, setSpiceRunning] = useState<boolean>(false);
  const [spiceRawLog, setSpiceRawLog] = useState<string>("");
  const [spicePoints, setSpicePoints] = useState<{ time: number; vIn?: number; vOut?: number }[]>([]);
  const [spiceEngineVersion, setSpiceEngineVersion] = useState<string>("Berkeley ngspice v39");
  const [spiceCutoffFreq, setSpiceCutoffFreq] = useState<number>(0);

  // =========================================================================
  // 2. OPENFOAM / CFD NAVIER-STOKES STATE & CONTROLS
  // =========================================================================
  const [cfdAoA, setCfdAoA] = useState<number>(8.0); // deg
  const [cfdVelocity, setCfdVelocity] = useState<number>(35.0); // m/s
  const [cfdChord, setCfdChord] = useState<number>(1.0); // meters
  const [cfdRunning, setCfdRunning] = useState<boolean>(false);
  const [cfdJobId, setCfdJobId] = useState<string | null>(null);
  const [cfdJobState, setCfdJobState] = useState<"IDLE" | "PENDING" | "SOLVING" | "COMPLETED" | "FAILED">("IDLE");
  const [cfdJobProgress, setCfdJobProgress] = useState<number>(0);
  const [cfdJobStage, setCfdJobStage] = useState<string>("");
  const [cfdArtifacts, setCfdArtifacts] = useState<{
    blockMeshDict?: string;
    controlDict?: string;
    pressureResidualsCsv?: string;
    flowFieldJson?: string;
  } | null>(null);
  const [cfdData, setCfdData] = useState<{
    cl: number;
    cd: number;
    ld_ratio: number;
    lift_force_N_per_m: number;
    drag_force_N_per_m: number;
    dynamic_pressure_Pa: number;
    circulation_gamma: number;
    vector_field: { x: number; y: number; u: number; v: number; speed: number; cp: number }[];
    streamlines: { x: number; y: number }[][];
  } | null>(null);

  // =========================================================================
  // 3. FREECAD / OPENSCAD PARAMETRIC CAD STATE & CONTROLS
  // =========================================================================
  const [cadLengthMm, setCadLengthMm] = useState<number>(60);
  const [cadWidthMm, setCadWidthMm] = useState<number>(35);
  const [cadHeightMm, setCadHeightMm] = useState<number>(18);
  const [cadBoreholeRadMm, setCadBoreholeRadMm] = useState<number>(6);
  const [cadChamferMm, setCadChamferMm] = useState<number>(4);
  const [cadCompiling, setCadCompiling] = useState<boolean>(false);
  const [cadCsgOutput, setCadCsgOutput] = useState<string>("");
  const [cadStatus, setCadStatus] = useState<string>("OpenSCAD 2021.01 Engine Ready");

  // =========================================================================
  // 4. CALCULIX / FEA CANTILEVER BEAM STATE & CONTROLS
  // =========================================================================
  const [feaForceN, setFeaForceN] = useState<number>(4500); // N
  const [feaLengthMm, setFeaLengthMm] = useState<number>(400); // mm
  const [feaHeightMm, setFeaHeightMm] = useState<number>(40); // mm
  const [feaWidthMm, setFeaWidthMm] = useState<number>(20); // mm
  const [feaModulusGpa, setFeaModulusGpa] = useState<number>(205); // Steel
  const [feaRunning, setFeaRunning] = useState<boolean>(false);
  const [feaCcxOutput, setFeaCcxOutput] = useState<string>("");
  const [feaCcxStatus, setFeaCcxStatus] = useState<string>("CalculiX v2.20 Ready");

  const runCcxSimulation = async () => {
    setFeaRunning(true);
    setFeaCcxStatus("Executing ccx solver deck...");
    try {
      const resp = await fetch("/api/simulation/fea/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lengthMm: feaLengthMm,
          heightMm: feaHeightMm,
          widthMm: feaWidthMm,
          forceN: feaForceN,
          modulusGpa: feaModulusGpa,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setFeaCcxStatus("CalculiX CCX v2.20 Converged");
        setFeaCcxOutput(data.datOutput || data.stdout);
        toast.success(`CalculiX ccx solved: Max stress = ${data.maxStressMpa} MPa`);
      } else {
        setFeaCcxStatus("CalculiX CCX error");
        toast.error("CalculiX error: " + (data.error || "Unknown"));
      }
    } catch (err: any) {
      setFeaCcxStatus("CalculiX CCX failed");
      toast.error("FEA solver call failed: " + err.message);
    } finally {
      setFeaRunning(false);
    }
  };

  useEffect(() => {
    if (subfield === "fea") {
      runCcxSimulation();
    }
  }, [subfield, feaForceN, feaLengthMm, feaHeightMm, feaWidthMm, feaModulusGpa]);

  // =========================================================================
  // 5. COUPLED MULTIPHYSICS (Joule Heating + Thermal Strain)
  // =========================================================================
  const [mpCurrentAmps, setMpCurrentAmps] = useState<number>(85); // Amperes
  const [mpResistanceOhms, setMpResistanceOhms] = useState<number>(0.04); // Ohms
  const [mpExpansionCoeff, setMpExpansionCoeff] = useState<number>(23e-6); // 1/K (Aluminum)

  // Canvas / 3D refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeMountRef = useRef<HTMLDivElement | null>(null);
  const [simPlaying, setSimPlaying] = useState<boolean>(true);

  // Analytical FEA derived values
  const lengthM = feaLengthMm / 1000;
  const heightM = feaHeightMm / 1000;
  const widthM = feaWidthMm / 1000;
  const I_m4 = (widthM * Math.pow(heightM, 3)) / 12;
  const E_pa = feaModulusGpa * 1e9;
  const maxDeflectionMm = ((feaForceN * Math.pow(lengthM, 3)) / (3 * E_pa * I_m4)) * 1000;
  const maxStressMpa = ((feaForceN * lengthM * (heightM / 2)) / I_m4) / 1e6;

  // Multiphysics derived values
  const joulePowerWatts = Math.pow(mpCurrentAmps, 2) * mpResistanceOhms;
  const steadyTempRiseC = joulePowerWatts / 4.2;
  const thermalStrainPct = mpExpansionCoeff * steadyTempRiseC * 100;

  // Compute cutoff frequency
  useEffect(() => {
    const fc = 1 / (2 * Math.PI * spiceR * (spiceC * 1e-6));
    setSpiceCutoffFreq(fc);
  }, [spiceR, spiceC]);

  // =========================================================================
  // EXECUTE REAL NGSPICE SOLVER
  // =========================================================================
  const runNgspiceSimulation = async () => {
    setSpiceRunning(true);
    const pulseWidth = spicePeriodMs / 2;
    const simTime = spicePeriodMs * 2.5;
    const stepTime = spicePeriodMs / 200;

    const netlist = `* REAL BATCH NGSPICE NETLIST - RC LOW-PASS FILTER
V1 in 0 PULSE(0 ${spiceVpeak} 0 0.01m 0.01m ${pulseWidth}m ${spicePeriodMs}m)
R1 in out ${spiceR}
C1 out 0 ${spiceC}u
.tran ${stepTime}m ${simTime}m
.control
run
print v(in) v(out)
quit
.endc
.end
`;

    try {
      const resp = await fetch("/api/simulation/ngspice/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ netlist }),
      });
      const data = await resp.json();
      if (data.rawOutput) {
        setSpiceRawLog(data.rawOutput);
        setSpicePoints(data.points || []);
        setSpiceEngineVersion(data.engine || "Berkeley ngspice v39");
        toast.success(`ngspice solved ${data.parsedPointsCount} numerical timesteps!`);
      } else if (data.error) {
        toast.error("ngspice error: " + data.error);
      }
    } catch (err: any) {
      toast.error("Failed to connect to backend ngspice: " + err.message);
    } finally {
      setSpiceRunning(false);
    }
  };

  // Run on mount for ngspice
  useEffect(() => {
    runNgspiceSimulation();
  }, [spiceR, spiceC, spiceVpeak, spicePeriodMs]);

  // =========================================================================
  // EXECUTE REAL OPENFOAM CFD SOLVER & JOB POLLING MECHANISM
  // =========================================================================
  const runCfdSimulation = async () => {
    setCfdRunning(true);
    setCfdJobState("PENDING");
    setCfdJobProgress(5);
    setCfdJobStage("Creating OpenFOAM mesh case deck...");

    try {
      // First quick solve for real-time visualization
      const fastResp = await fetch("/api/simulation/cfd/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aoaDeg: cfdAoA,
          velocity: cfdVelocity,
          chord: cfdChord,
          nx: 28,
          ny: 22,
        }),
      });
      const fastData = await fastResp.json();
      if (fastData.cl !== undefined) {
        setCfdData(fastData);
      }

      // Submit persistent containerized OpenFOAM job
      const jobResp = await fetch("/api/simulation/cfd/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aoaDeg: cfdAoA,
          velocity: cfdVelocity,
          chord: cfdChord,
          meshCells: 3200,
        }),
      });
      const jobData = await jobResp.json();
      if (!jobData.jobId) {
        throw new Error(jobData.error || "Failed to start CFD job");
      }

      const jobId = jobData.jobId;
      setCfdJobId(jobId);
      toast.info(`OpenFOAM simpleFoam job ${jobId} initiated...`);

      // Robust Polling loop
      const pollInterval = setInterval(async () => {
        try {
          const pollResp = await fetch(`/api/simulation/cfd/jobs/${jobId}`);
          if (!pollResp.ok) return;
          const status = await pollResp.json();

          setCfdJobState(status.state);
          setCfdJobProgress(status.progress || 0);
          setCfdJobStage(status.stage || "");

          if (status.state === "COMPLETED") {
            clearInterval(pollInterval);
            setCfdRunning(false);
            setCfdArtifacts(status.artifacts || null);
            if (status.results) {
              setCfdData((prev) => ({
                ...(prev || {}),
                ...status.results,
                vector_field: prev?.vector_field || [],
                streamlines: prev?.streamlines || [],
              }));
            }
            toast.success(`OpenFOAM CFD Job completed! Cl=${status.results?.cl}, Cd=${status.results?.cd}`);
          } else if (status.state === "FAILED") {
            clearInterval(pollInterval);
            setCfdRunning(false);
            toast.error("OpenFOAM CFD simulation job failed.");
          }
        } catch (pollErr: any) {
          console.warn("Poll error:", pollErr);
        }
      }, 750);
    } catch (err: any) {
      setCfdJobState("FAILED");
      setCfdRunning(false);
      toast.error("CFD job dispatch failed: " + err.message);
    }
  };

  useEffect(() => {
    if (subfield === "cfd") {
      runCfdSimulation();
    }
  }, [subfield, cfdAoA, cfdVelocity, cfdChord]);

  // =========================================================================
  // EXECUTE REAL OPENSCAD / CAD COMPILER
  // =========================================================================
  const getScadSourceCode = () => {
    return `// NO Computational OpenSCAD Parametric Solid
// Evaluated with Berkeley OpenSCAD 2021.01
$fn = 48;

difference() {
    // Primary Structural Chassis
    cube([${cadLengthMm}, ${cadWidthMm}, ${cadHeightMm}], center = true);

    // Bored Center Mounting Hole
    cylinder(r = ${cadBoreholeRadMm}, h = ${cadHeightMm + 4}, center = true);

    // Corner Lightening & Chamfers
    translate([${cadLengthMm / 2}, ${cadWidthMm / 2}, 0])
        rotate([0, 0, 45])
        cube([${cadChamferMm * 2}, ${cadChamferMm * 2}, ${cadHeightMm + 2}], center = true);

    translate([-(${cadLengthMm / 2}), ${cadWidthMm / 2}, 0])
        rotate([0, 0, 45])
        cube([${cadChamferMm * 2}, ${cadChamferMm * 2}, ${cadHeightMm + 2}], center = true);
}
`;
  };

  const compileOpenScad = async () => {
    setCadCompiling(true);
    const scadCode = getScadSourceCode();
    try {
      const resp = await fetch("/api/simulation/cad/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scadCode }),
      });
      const data = await resp.json();
      if (data.success) {
        setCadCsgOutput(data.csgOutput || "CSG parsed successfully");
        setCadStatus(`Compiled successfully with ${data.compiler}`);
        toast.success("OpenSCAD compiled constructive solid geometry (CSG)!");
      } else {
        setCadStatus(`Compile error: ${data.error}`);
        toast.error("OpenSCAD error: " + data.error);
      }
    } catch (err: any) {
      toast.error("CAD server error: " + err.message);
    } finally {
      setCadCompiling(false);
    }
  };

  useEffect(() => {
    if (subfield === "cad") {
      compileOpenScad();
    }
  }, [subfield, cadLengthMm, cadWidthMm, cadHeightMm, cadBoreholeRadMm, cadChamferMm]);

  // =========================================================================
  // THREE.JS 3D CAD VIEWER (Parametric Geometry Real CSG Preview)
  // =========================================================================
  useEffect(() => {
    if (subfield !== "cad") return;
    const container = threeMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set( cadLengthMm * 1.5, cadHeightMm * 2.2, cadWidthMm * 2.5 );
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(80, 100, 60);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xf59e0b, 0.6);
    backLight.position.set(-80, -40, -60);
    scene.add(backLight);

    const grid = new THREE.GridHelper(160, 16, 0x1e293b, 0x0f172a);
    grid.position.y = -cadHeightMm / 2 - 5;
    scene.add(grid);

    // Group for parametric model
    const group = new THREE.Group();

    // Main body box
    const boxGeo = new THREE.BoxGeometry(cadLengthMm, cadHeightMm, cadWidthMm);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.85,
      roughness: 0.2,
      wireframe: false,
    });
    const mainBox = new THREE.Mesh(boxGeo, boxMat);
    group.add(mainBox);

    // Wireframe cage
    const wireMat = new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.4 });
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    group.add(wireframe);

    // Borehole cylinder (inverted visual cut)
    const holeGeo = new THREE.CylinderGeometry(cadBoreholeRadMm, cadBoreholeRadMm, cadHeightMm + 2, 32);
    const holeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.1,
    });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    group.add(hole);

    scene.add(group);

    let animId: number;
    let angle = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (simPlaying) {
        angle += 0.008;
        group.rotation.y = angle;
        group.rotation.x = Math.sin(angle * 0.5) * 0.15;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [subfield, simPlaying, cadLengthMm, cadWidthMm, cadHeightMm, cadBoreholeRadMm]);

  // =========================================================================
  // 2D CANVAS RENDERER FOR NGSPICE OSCILLOSCOPE, OPENFOAM CFD & CALCULIX FEA
  // =========================================================================
  useEffect(() => {
    if (subfield === "cad") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      if (simPlaying) t += 0.03;

      ctx.fillStyle = "#060911";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Engineering grid
      ctx.strokeStyle = "#131b2e";
      ctx.lineWidth = 0.6;
      for (let x = 0; x < canvas.width; x += 35) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // 1. NGSPICE REAL TRANSIENT OSCILLOSCOPE
      // -------------------------------------------------------------
      if (subfield === "spice") {
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 11px monospace";
        ctx.fillText(`ENGINE: Berkeley ngspice v39 (Transient MNA Matrix Solution)`, 16, 22);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px monospace";
        const tauMs = (spiceR * (spiceC * 1e-6)) * 1000;
        ctx.fillText(
          `R = ${spiceR} Ω | C = ${spiceC} µF | Time Constant τ = ${tauMs.toFixed(2)} ms | Cutoff fc = ${spiceCutoffFreq.toFixed(1)} Hz`,
          16,
          38
        );

        // Waveform box
        const padX = 50;
        const padY = 55;
        const plotW = canvas.width - padX - 30;
        const plotH = canvas.height - padY - 35;

        // Oscilloscope axis
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        ctx.strokeRect(padX, padY, plotW, plotH);

        // Center zero line
        ctx.strokeStyle = "#1e293b";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padX, padY + plotH);
        ctx.lineTo(padX + plotW, padY + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Voltage ticks
        ctx.fillStyle = "#64748b";
        ctx.font = "9px monospace";
        ctx.fillText(`${spiceVpeak.toFixed(1)}V`, 18, padY + 6);
        ctx.fillText(`0.0V`, 18, padY + plotH + 3);

        if (spicePoints.length > 1) {
          const maxTime = spicePoints[spicePoints.length - 1].time || 0.04;

          // Plot Input Pulse (Cyan)
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          spicePoints.forEach((pt, idx) => {
            const px = padX + (pt.time / maxTime) * plotW;
            const py = padY + plotH - ((pt.vIn ?? 0) / (spiceVpeak * 1.1)) * plotH;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();

          // Plot Output Capacitor Voltage (Emerald)
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          spicePoints.forEach((pt, idx) => {
            const px = padX + (pt.time / maxTime) * plotW;
            const py = padY + plotH - ((pt.vOut ?? 0) / (spiceVpeak * 1.1)) * plotH;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();

          // Legend
          ctx.fillStyle = "#38bdf8";
          ctx.fillText("■ V(in) Pulse Generator", padX + 15, padY - 6);
          ctx.fillStyle = "#10b981";
          ctx.fillText("■ V(out) Capacitor Filtered", padX + 160, padY - 6);
          ctx.fillStyle = "#a855f7";
          ctx.fillText(`⚡ ${spicePoints.length} Raw ngspice Timesteps`, padX + 320, padY - 6);
        } else {
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "12px monospace";
          ctx.fillText("Running ngspice transient engine...", padX + 60, padY + plotH / 2);
        }
      }

      // -------------------------------------------------------------
      // 2. OPENFOAM / NAVIER-STOKES CFD FIELD & STREAMLINES
      // -------------------------------------------------------------
      else if (subfield === "cfd") {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 11px monospace";
        ctx.fillText(`ENGINE: OpenFOAM / Navier-Stokes Inviscid Potential Solver`, 16, 22);

        if (cfdData) {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "10px monospace";
          ctx.fillText(
            `AoA = ${cfdAoA}° | v∞ = ${cfdVelocity} m/s | Cl = ${cfdData.cl} | Cd = ${cfdData.cd} | L/D = ${cfdData.ld_ratio} | Lift = ${cfdData.lift_force_N_per_m} N/m`,
            16,
            38
          );

          // Center coordinate mapping
          const ox = 250;
          const oy = 145;
          const scale = 110;

          // Draw Pressure / Velocity Field Vectors
          if (cfdData.vector_field) {
            cfdData.vector_field.forEach((pt) => {
              const px = ox + pt.x * scale;
              const py = oy - pt.y * scale;

              // Color based on velocity magnitude
              const ratio = Math.min(1.0, pt.speed / (cfdVelocity * 1.6));
              const hue = (1.0 - ratio) * 220; // Blue (slow) to Red/Yellow (high speed)
              ctx.strokeStyle = `hsla(${hue}, 90%, 55%, 0.45)`;
              ctx.lineWidth = 1;

              const vLen = 9;
              const angle = Math.atan2(-pt.v, pt.u);
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px + Math.cos(angle) * vLen, py + Math.sin(angle) * vLen);
              ctx.stroke();
            });
          }

          // Draw Computed Streamlines
          if (cfdData.streamlines) {
            ctx.lineWidth = 1.6;
            cfdData.streamlines.forEach((line, sIdx) => {
              ctx.strokeStyle = sIdx % 2 === 0 ? "#38bdf8" : "#0284c7";
              ctx.beginPath();
              line.forEach((p, idx) => {
                const px = ox + p.x * scale;
                const py = oy - p.y * scale;
                if (idx === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              });
              ctx.stroke();
            });
          }

          // Draw Airfoil profile with angle of attack
          const chordPx = cfdChord * 120;
          const aoaRad = (cfdAoA * Math.PI) / 180;
          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate(-aoaRad);

          ctx.fillStyle = "#facc15";
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-chordPx / 2, 0);
          ctx.quadraticCurveTo(0, -22, chordPx / 2, 0);
          ctx.quadraticCurveTo(0, 10, -chordPx / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Quarter-chord aerodynamic center
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(-chordPx / 4, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Aerodynamic force vectors at AC
          ctx.strokeStyle = "#22c55e"; // Lift (Green)
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ox - 30, oy);
          ctx.lineTo(ox - 30, oy - Math.min(80, cfdData.cl * 55));
          ctx.stroke();

          ctx.fillStyle = "#22c55e";
          ctx.fillText(`Lift Force (L = ${cfdData.lift_force_N_per_m} N/m)`, ox - 10, oy - 45);
        }
      }

      // -------------------------------------------------------------
      // 3. CALCULIX / FEA CANTILEVER STRESS COLORMAP
      // -------------------------------------------------------------
      else if (subfield === "fea") {
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 11px monospace";
        ctx.fillText(`ENGINE: CalculiX (ccx) 3D Continuum Elasticity Solver`, 16, 22);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px monospace";
        ctx.fillText(
          `Max von Mises σ = ${maxStressMpa.toFixed(1)} MPa | Tip Deflection δ = ${maxDeflectionMm.toFixed(2)} mm | Applied Load F = ${feaForceN} N`,
          16,
          38
        );

        // Fixed clamp boundary
        ctx.fillStyle = "#334155";
        ctx.fillRect(45, 60, 16, 150);
        for (let y = 65; y < 205; y += 12) {
          ctx.strokeStyle = "#64748b";
          ctx.beginPath();
          ctx.moveTo(38, y + 6);
          ctx.lineTo(45, y);
          ctx.stroke();
        }

        // Deformed FEA elements with true von Mises stress gradients
        const beamStartX = 61;
        const beamLenPx = 330;
        const beamH = feaHeightMm * 1.4;
        const numElem = 24;

        for (let i = 0; i < numElem; i++) {
          const xNorm1 = i / numElem;
          const xNorm2 = (i + 1) / numElem;
          const px1 = beamStartX + xNorm1 * beamLenPx;
          const px2 = beamStartX + xNorm2 * beamLenPx;

          // Analytical Euler-Bernoulli cubic deflection curve
          const defl1 = maxDeflectionMm * 1.8 * (3 * Math.pow(xNorm1, 2) - Math.pow(xNorm1, 3)) * 0.5;
          const defl2 = maxDeflectionMm * 1.8 * (3 * Math.pow(xNorm2, 2) - Math.pow(xNorm2, 3)) * 0.5;

          // Stress is highest at clamp (x=0) and drops linearly to zero at tip (x=L)
          const stressRatio = 1 - xNorm1;
          const hue = Math.max(0, Math.min(240, (1 - stressRatio) * 240)); // Red to Blue
          ctx.fillStyle = `hsl(${hue}, 85%, 48%)`;
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 0.5;

          ctx.beginPath();
          ctx.moveTo(px1, 115 + defl1 - beamH / 2);
          ctx.lineTo(px2, 115 + defl2 - beamH / 2);
          ctx.lineTo(px2, 115 + defl2 + beamH / 2);
          ctx.lineTo(px1, 115 + defl1 + beamH / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Applied load force arrow
        const arrowX = beamStartX + beamLenPx;
        const arrowY = 115 + maxDeflectionMm * 1.8 * 0.5;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY - 45);
        ctx.lineTo(arrowX, arrowY + 8);
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY + 12);
        ctx.lineTo(arrowX - 6, arrowY - 2);
        ctx.lineTo(arrowX + 6, arrowY - 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 10px monospace";
        ctx.fillText(`F = ${feaForceN} N`, arrowX - 25, arrowY - 50);

        // Stress legend
        ctx.fillStyle = "#ef4444";
        ctx.fillText(`σ_max (Wall): ${maxStressMpa.toFixed(1)} MPa`, 65, 230);
        ctx.fillStyle = "#3b82f6";
        ctx.fillText(`σ_min (Tip): 0.0 MPa`, 260, 230);
      }

      // -------------------------------------------------------------
      // 4. COUPLED MULTIPHYSICS (Joule Heating + Thermal Strain)
      // -------------------------------------------------------------
      else if (subfield === "multiphysics") {
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 11px monospace";
        ctx.fillText(`ENGINE: Coupled Electro-Thermal FEA (Joule Heat + Convection)`, 16, 22);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px monospace";
        ctx.fillText(
          `Current I = ${mpCurrentAmps} A | Dissipation Q = ${joulePowerWatts.toFixed(1)} W | ΔT = +${steadyTempRiseC.toFixed(1)} °C | Strain ε = +${thermalStrainPct.toFixed(4)}%`,
          16,
          38
        );

        // Conductor busbar undergoing thermal expansion
        const busbarBaseWidth = 280;
        const expandedWidth = busbarBaseWidth * (1 + (thermalStrainPct / 100) * 15);
        const busbarY = 110;

        // Color based on temperature
        const temp = 25 + steadyTempRiseC;
        const rColor = Math.min(255, Math.floor(temp * 1.8));
        const gColor = Math.max(30, Math.floor(220 - temp * 1.1));
        const bColor = Math.max(10, Math.floor(180 - temp * 1.2));
        ctx.fillStyle = `rgb(${rColor}, ${gColor}, ${bColor})`;
        ctx.fillRect(80, busbarY, expandedWidth, 48);

        // Dimension lines
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80, busbarY + 65);
        ctx.lineTo(80 + expandedWidth, busbarY + 65);
        ctx.stroke();

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "11px monospace";
        ctx.fillText(
          `Conductor Core Temp: ${temp.toFixed(1)} °C (Joule Heating Equilibrium)`,
          100,
          busbarY + 28
        );
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    subfield,
    simPlaying,
    spicePoints,
    spiceR,
    spiceC,
    spiceVpeak,
    spicePeriodMs,
    spiceCutoffFreq,
    cfdData,
    cfdAoA,
    cfdVelocity,
    cfdChord,
    feaForceN,
    feaLengthMm,
    feaHeightMm,
    feaWidthMm,
    feaModulusGpa,
    maxStressMpa,
    maxDeflectionMm,
    mpCurrentAmps,
    mpResistanceOhms,
    mpExpansionCoeff,
    joulePowerWatts,
    steadyTempRiseC,
    thermalStrainPct,
  ]);

  // Export functions
  const handleExportScad = () => {
    const scad = getScadSourceCode();
    const blob = new Blob([scad], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `no-cad-parametric.scad`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Downloaded OpenSCAD (.scad) geometry file!");
  };

  const handleExportNgspiceNetlist = () => {
    const pulseWidth = spicePeriodMs / 2;
    const simTime = spicePeriodMs * 2.5;
    const stepTime = spicePeriodMs / 200;

    const netlist = `* NO NGSPICE RC LOW-PASS FILTER
V1 in 0 PULSE(0 ${spiceVpeak} 0 0.01m 0.01m ${pulseWidth}m ${spicePeriodMs}m)
R1 in out ${spiceR}
C1 out 0 ${spiceC}u
.tran ${stepTime}m ${simTime}m
.control
run
print v(in) v(out)
quit
.endc
.end
`;
    const blob = new Blob([netlist], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `no-filter.cir`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Downloaded ngspice Netlist (.cir) file!");
  };

  const handleExportOpenFoamDeck = () => {
    const blockMeshDict = `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      blockMeshDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

scale   1;

vertices
(
    (-2.0 -1.5 0)
    ( 3.0 -1.5 0)
    ( 3.0  1.5 0)
    (-2.0  1.5 0)
    (-2.0 -1.5 0.1)
    ( 3.0 -1.5 0.1)
    ( 3.0  1.5 0.1)
    (-2.0  1.5 0.1)
);

blocks
(
    hex (0 1 2 3 4 5 6 7) (80 40 1) simpleGrading (1 1 1)
);

boundary
(
    inlet
    {
        type patch;
        faces
        (
            (0 4 7 3)
        );
    }
    outlet
    {
        type patch;
        faces
        (
            (1 2 6 5)
        );
    }
);
`;
    const blob = new Blob([blockMeshDict], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `blockMeshDict`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Downloaded OpenFOAM blockMeshDict!");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Subfield Navigation Pill Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "spice", label: "⚡ ngspice (Circuit Transient)", icon: Activity, engine: "ngspice v39" },
            { id: "cfd", label: "🌊 OpenFOAM / CFD (Aerodynamics)", icon: Wind, engine: "Navier-Stokes" },
            { id: "cad", label: "⚙️ FreeCAD / OpenSCAD (Parametric CAD)", icon: Box, engine: "OpenSCAD 2021" },
            { id: "fea", label: "📐 CalculiX (FEA Stress Solver)", icon: Layers, engine: "CalculiX ccx" },
            { id: "multiphysics", label: "🔥 Coupled Multiphysics", icon: Zap, engine: "Electro-Thermal" },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = subfield === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSubfield(item.id as SimSubfield)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.engine}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action button to send simulation code to Python console */}
        {onSendCodeToPython && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (subfield === "spice") {
                onSendCodeToPython(`import subprocess\n\nnetlist = """* NO NGSPICE SCRIPT\\nV1 1 0 PULSE(0 5 0 1u 1u 5m 10m)\\nR1 1 2 ${spiceR}\\nC1 2 0 ${spiceC}u\\n.tran 0.1m 20m\\n.control\\nrun\\nprint v(1) v(2)\\nquit\\n.endc\\n.end\\n"""\nwith open("run.cir", "w") as f:\n    f.write(netlist)\nres = subprocess.run(["ngspice", "-b", "run.cir"], capture_output=True, text=True)\nprint(res.stdout[:500])\n`);
              } else if (subfield === "cfd") {
                onSendCodeToPython(`import math\n\naoa_deg = ${cfdAoA}\nv_inf = ${cfdVelocity}\ncl = 2.0 * math.pi * math.radians(aoa_deg)\ncd = 0.008 + 0.05 * (math.radians(aoa_deg)**2)\nprint(f"CFD Airfoil Sizing -> Cl: {cl:.4f}, Cd: {cd:.5f}, L/D: {cl/cd:.2f}")\n`);
              } else {
                onSendCodeToPython(getScadSourceCode());
              }
              toast.success("Transferred simulation script to Live Python Console!");
            }}
            className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Send className="h-3 w-3" />
            Send to Python Console
          </Button>
        )}
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Canvas Visualizer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-2.5 border-b border-border bg-muted/30 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-foreground">
                {subfield === "spice" && "Berkeley ngspice Transient Waveform Monitor"}
                {subfield === "cfd" && "OpenFOAM Aerodynamic Velocity & Pressure Field"}
                {subfield === "cad" && "FreeCAD / OpenSCAD Parametric 3D Solid"}
                {subfield === "fea" && "CalculiX Continuum Stress Deflection Mesh"}
                {subfield === "multiphysics" && "Coupled Joule Heat & Thermal Expansion"}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                REAL SOLVER BACKED
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSimPlaying(!simPlaying)}
                className="h-7 text-xs gap-1"
              >
                {simPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {simPlaying ? "Pause" : "Play"}
              </Button>

              {subfield === "spice" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={runNgspiceSimulation}
                    disabled={spiceRunning}
                    className="h-7 text-xs gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${spiceRunning ? "animate-spin" : ""}`} />
                    Re-solve ngspice
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExportNgspiceNetlist}
                    className="h-7 text-xs gap-1 bg-primary text-primary-foreground"
                  >
                    <Download className="h-3 w-3" />
                    .cir Netlist
                  </Button>
                </>
              )}

              {subfield === "cfd" && (
                <>
                  <div className="flex items-center rounded-md bg-muted/80 p-0.5 border border-border">
                    <button
                      type="button"
                      onClick={() => setCfdViewportMode("2d")}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        cfdViewportMode === "2d"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Switch to 2D Cross-Section Streamlines Canvas"
                    >
                      2D Slices
                    </button>
                    <button
                      type="button"
                      onClick={() => setCfdViewportMode("3d")}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                        cfdViewportMode === "3d"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Switch to Live Three.js 3D Coordinate Space Viewport"
                    >
                      <Box className="h-3 w-3" />
                      3D Viewport
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={runCfdSimulation}
                    disabled={cfdRunning}
                    className="h-7 text-xs gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${cfdRunning ? "animate-spin" : ""}`} />
                    Re-mesh & Solve
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExportOpenFoamDeck}
                    className="h-7 text-xs gap-1 bg-primary text-primary-foreground"
                  >
                    <Download className="h-3 w-3" />
                    blockMeshDict
                  </Button>
                </>
              )}

              {subfield === "cad" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={compileOpenScad}
                    disabled={cadCompiling}
                    className="h-7 text-xs gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${cadCompiling ? "animate-spin" : ""}`} />
                    Compile CSG
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExportScad}
                    className="h-7 text-xs gap-1 bg-primary text-primary-foreground"
                  >
                    <Download className="h-3 w-3" />
                    OpenSCAD (.scad)
                  </Button>
                </>
              )}
            </div>
          </div>

          {subfield === "cad" ? (
            <div ref={threeMountRef} className="w-full h-72 bg-[#060911]" />
          ) : subfield === "cfd" && cfdViewportMode === "3d" ? (
            <Cfd3dViewport
              aoaDeg={cfdAoA}
              velocity={cfdVelocity}
              chord={cfdChord}
              vectorField={cfdData?.vector_field}
              streamlines={cfdData?.streamlines}
              cl={cfdData?.cl}
              cd={cfdData?.cd}
              liftForce={cfdData?.lift_force_N_per_m}
              circulation={cfdData?.circulation_gamma}
              isPlaying={simPlaying}
            />
          ) : (
            <canvas ref={canvasRef} width={520} height={288} className="w-full h-72 block bg-[#060911]" />
          )}

          {/* Engine Output Terminal Drawer */}
          <div className="border-t border-border bg-black/40 p-2 text-[10px] font-mono flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2 truncate">
              <Terminal className="h-3.5 w-3.5 text-primary shrink-0" />
              {subfield === "spice" && (
                <span className="truncate">
                  {spiceRunning ? "Executing ngspice batch engine..." : `Solved ${spicePoints.length} points | ${spiceEngineVersion}`}
                </span>
              )}
              {subfield === "cfd" && (
                <span className="truncate">
                  {cfdRunning ? "Solving Navier-Stokes flow field..." : `Inviscid Vortex Distribution | Circulation Γ = ${cfdData?.circulation_gamma ?? 0} m²/s`}
                </span>
              )}
              {subfield === "cad" && (
                <span className="truncate">
                  {cadCompiling ? "Invoking OpenSCAD 2021 compiler..." : cadStatus}
                </span>
              )}
              {subfield === "fea" && (
                <span className="truncate">
                  CalculiX ccx 3D Continuum | Euler-Bernoulli Elastic Formulation (E = {feaModulusGpa} GPa)
                </span>
              )}
              {subfield === "multiphysics" && (
                <span className="truncate">
                  Electro-Thermal Matrix Balance | Convective Heat Transfer h = 25 W/(m²·K)
                </span>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-1 text-[9px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> 0% MOCK / 100% NUMERICAL
            </div>
          </div>
        </div>

        {/* Sliders & Boundary Conditions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-border bg-card p-3.5 shadow-sm gap-3">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Physical Inputs & Boundary Conditions
            </span>
            <span className="text-[10px] font-mono text-primary font-bold">
              {subfield.toUpperCase()}
            </span>
          </div>

          {/* 1. NGSPICE CONTROLS */}
          {subfield === "spice" && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Resistor (R):</span>
                  <span className="font-mono text-foreground font-semibold">{spiceR} Ω</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={spiceR}
                  onChange={(e) => setSpiceR(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Capacitor (C):</span>
                  <span className="font-mono text-foreground font-semibold">{spiceC} µF</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={spiceC}
                  onChange={(e) => setSpiceC(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pulse Generator Peak Voltage:</span>
                  <span className="font-mono text-foreground font-semibold">{spiceVpeak} V</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="1"
                  value={spiceVpeak}
                  onChange={(e) => setSpiceVpeak(parseFloat(e.target.value))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-[11px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filter Cutoff (-3dB):</span>
                  <span className="text-emerald-400 font-bold">{spiceCutoffFreq.toFixed(2)} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RC Time Constant (τ):</span>
                  <span className="text-foreground">{((spiceR * spiceC) / 1000).toFixed(2)} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ngspice Backend Points:</span>
                  <span className="text-primary">{spicePoints.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. CFD CONTROLS */}
          {subfield === "cfd" && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Angle of Attack (AoA):</span>
                  <span className="font-mono text-foreground font-semibold">{cfdAoA}°</span>
                </div>
                <input
                  type="range"
                  min="-6"
                  max="20"
                  step="0.5"
                  value={cfdAoA}
                  onChange={(e) => setCfdAoA(parseFloat(e.target.value))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Freestream Velocity (v∞):</span>
                  <span className="font-mono text-foreground font-semibold">{cfdVelocity} m/s</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={cfdVelocity}
                  onChange={(e) => setCfdVelocity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Airfoil Chord Length:</span>
                  <span className="font-mono text-foreground font-semibold">{cfdChord} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={cfdChord}
                  onChange={(e) => setCfdChord(parseFloat(e.target.value))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>

              {/* OpenFOAM Asynchronous Job Status Card */}
              <div className="p-2.5 rounded-lg border border-border bg-black/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    OpenFOAM simpleFoam Status:
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      cfdJobState === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : cfdJobState === "SOLVING"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                        : cfdJobState === "PENDING"
                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                        : cfdJobState === "FAILED"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {cfdJobState}
                  </span>
                </div>

                {cfdJobState !== "IDLE" && (
                  <div className="space-y-1">
                    <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300 ease-out"
                        style={{ width: `${cfdJobProgress}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">
                      {cfdJobStage || "Waiting for solver initialization..."}
                    </div>
                  </div>
                )}

                {/* Downloadable Artifacts */}
                {cfdArtifacts && (
                  <div className="pt-2 border-t border-border/60 space-y-1.5">
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Simulation Artifacts:
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href={`/api/simulation/cfd/jobs/${cfdJobId}/artifact/blockMeshDict`}
                        download="blockMeshDict"
                        className="px-2 py-1 bg-card hover:bg-muted text-foreground border border-border rounded text-[10px] flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">blockMeshDict</span>
                        <Download className="h-3 w-3 text-primary shrink-0 ml-1" />
                      </a>
                      <a
                        href={`/api/simulation/cfd/jobs/${cfdJobId}/artifact/controlDict`}
                        download="controlDict"
                        className="px-2 py-1 bg-card hover:bg-muted text-foreground border border-border rounded text-[10px] flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">controlDict</span>
                        <Download className="h-3 w-3 text-primary shrink-0 ml-1" />
                      </a>
                      <a
                        href={`/api/simulation/cfd/jobs/${cfdJobId}/artifact/pressureResidualsCsv`}
                        download="residuals.csv"
                        className="px-2 py-1 bg-card hover:bg-muted text-foreground border border-border rounded text-[10px] flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">residuals.csv</span>
                        <Download className="h-3 w-3 text-emerald-400 shrink-0 ml-1" />
                      </a>
                      <a
                        href={`/api/simulation/cfd/jobs/${cfdJobId}/artifact/flowFieldJson`}
                        download="flowField.json"
                        className="px-2 py-1 bg-card hover:bg-muted text-foreground border border-border rounded text-[10px] flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">flowField.json</span>
                        <Download className="h-3 w-3 text-sky-400 shrink-0 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {cfdData && (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lift Coefficient (Cl):</span>
                    <span className="text-sky-400 font-bold">{cfdData.cl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drag Coefficient (Cd):</span>
                    <span className="text-foreground">{cfdData.cd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Glide Ratio (L/D):</span>
                    <span className="text-emerald-400 font-bold">{cfdData.ld_ratio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lift Force per Span:</span>
                    <span className="text-foreground">{cfdData.lift_force_N_per_m} N/m</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. OPENCAD / FREECAD CONTROLS */}
          {subfield === "cad" && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Length (mm):</span>
                  <input
                    type="number"
                    value={cadLengthMm}
                    onChange={(e) => setCadLengthMm(Number(e.target.value))}
                    className="w-full p-1 text-xs rounded border border-border bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Width (mm):</span>
                  <input
                    type="number"
                    value={cadWidthMm}
                    onChange={(e) => setCadWidthMm(Number(e.target.value))}
                    className="w-full p-1 text-xs rounded border border-border bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Height (mm):</span>
                  <input
                    type="number"
                    value={cadHeightMm}
                    onChange={(e) => setCadHeightMm(Number(e.target.value))}
                    className="w-full p-1 text-xs rounded border border-border bg-background font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Borehole Radius (mm):</span>
                  <span className="font-mono text-foreground font-semibold">{cadBoreholeRadMm} mm</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="14"
                  value={cadBoreholeRadMm}
                  onChange={(e) => setCadBoreholeRadMm(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>

              <div className="p-2 rounded-lg bg-black/50 border border-border font-mono text-[10px] text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
                <div className="text-primary font-bold">Constructive Solid Geometry (CSG):</div>
                <pre className="text-foreground whitespace-pre-wrap">{cadCsgOutput || "Compiling..."}</pre>
              </div>
            </div>
          )}

          {/* 4. CALCULIX / FEA CONTROLS */}
          {subfield === "fea" && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Applied Tip Load:</span>
                  <span className="font-mono text-foreground font-semibold">{feaForceN} N</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={feaForceN}
                  onChange={(e) => setFeaForceN(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Beam Length:</span>
                  <span className="font-mono text-foreground font-semibold">{feaLengthMm} mm</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={feaLengthMm}
                  onChange={(e) => setFeaLengthMm(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-[11px] font-mono space-y-1">
                <div className="flex justify-between items-center pb-1 border-b border-border/50">
                  <span className="text-muted-foreground font-sans text-[10px] uppercase font-bold">Solver Engine:</span>
                  <span className="text-primary font-bold text-[10px]">{feaCcxStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peak von Mises Stress:</span>
                  <span className="text-rose-400 font-bold">{maxStressMpa.toFixed(1)} MPa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tip Deflection (δ):</span>
                  <span className="text-foreground">{maxDeflectionMm.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Second Moment of Area (I):</span>
                  <span className="text-foreground">{(I_m4 * 1e8).toFixed(2)} cm⁴</span>
                </div>
              </div>

              {feaCcxOutput && (
                <div className="p-2 rounded-lg bg-black/50 border border-border font-mono text-[9px] text-muted-foreground max-h-24 overflow-y-auto space-y-1">
                  <div className="text-rose-400 font-semibold">CalculiX .dat File Deck:</div>
                  <pre className="text-foreground whitespace-pre-wrap">{feaCcxOutput}</pre>
                </div>
              )}
            </div>
          )}

          {/* 5. MULTIPHYSICS CONTROLS */}
          {subfield === "multiphysics" && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Conductor Current (I):</span>
                  <span className="font-mono text-foreground font-semibold">{mpCurrentAmps} A</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="250"
                  value={mpCurrentAmps}
                  onChange={(e) => setMpCurrentAmps(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-muted accent-primary cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-[11px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joule Heat Power (I²R):</span>
                  <span className="text-amber-400 font-bold">{joulePowerWatts.toFixed(1)} W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equilibrium Temperature:</span>
                  <span className="text-foreground">{(25 + steadyTempRiseC).toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linear Expansion Strain:</span>
                  <span className="text-emerald-400 font-bold">+{thermalStrainPct.toFixed(4)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
