import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import {
  Eye,
  RotateCcw,
  Layers,
  Sparkles,
  Maximize2,
  Wind,
  Compass,
  Gauge,
  Sliders,
  Play,
  Pause,
  Box,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CfdVectorPoint {
  x: number;
  y: number;
  u: number;
  v: number;
  speed: number;
  cp: number;
}

export interface Cfd3dViewportProps {
  aoaDeg: number;
  velocity: number;
  chord: number;
  vectorField?: CfdVectorPoint[];
  streamlines?: { x: number; y: number }[][];
  cl?: number;
  cd?: number;
  liftForce?: number;
  circulation?: number;
  isPlaying?: boolean;
}

type ColorFieldMode = "speed" | "cp" | "u" | "v";
type CameraPreset = "iso" | "side" | "top" | "inlet";

export function Cfd3dViewport({
  aoaDeg,
  velocity,
  chord,
  vectorField,
  streamlines,
  cl = 0.85,
  cd = 0.042,
  liftForce = 620,
  circulation = 4.2,
  isPlaying = true,
}: Cfd3dViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Viewport display controls
  const [colorField, setColorField] = useState<ColorFieldMode>("speed");
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showStreamlines, setShowStreamlines] = useState<boolean>(true);
  const [showWing, setShowWing] = useState<boolean>(true);
  const [showPressureCloud, setShowPressureCloud] = useState<boolean>(true);
  const [showGridAxes, setShowGridAxes] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [vectorDensity, setVectorDensity] = useState<number>(1); // 1 = normal, 0.5 = sparse, 1.5 = dense
  const [spanMultiplier, setSpanMultiplier] = useState<number>(1.2); // wingspan relative to chord

  // Live Hover Probe state
  const [probeData, setProbeData] = useState<{
    x: number;
    y: number;
    z: number;
    u: number;
    v: number;
    speed: number;
    cp: number;
    region: string;
  } | null>(null);

  // References to Three.js instances to allow smooth runtime updates without re-instantiating the canvas
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsGroupRef = useRef<THREE.Group | null>(null);
  const wingGroupRef = useRef<THREE.Group | null>(null);
  const vectorsGroupRef = useRef<THREE.Group | null>(null);
  const streamlinesGroupRef = useRef<THREE.Group | null>(null);
  const pressureCloudGroupRef = useRef<THREE.Group | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);
  const probeMarkerRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Particles along streamlines
  const particleSystemRef = useRef<{
    points: THREE.Points;
    offsets: Float32Array;
    curves: THREE.CatmullRomCurve3[];
    speeds: Float32Array;
  } | null>(null);

  // Interactive Orbit state
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const sphericalRef = useRef({ radius: 4.8, phi: Math.PI / 3.2, theta: Math.PI / 4.2 });

  // Update camera position from spherical coordinates
  const updateCameraFromSpherical = useCallback(() => {
    if (!cameraRef.current) return;
    const { radius, phi, theta } = sphericalRef.current;
    const target = cameraTargetRef.current;

    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  }, []);

  const setCameraPreset = (preset: CameraPreset) => {
    cameraTargetRef.current.set(0, 0, 0);
    const c = Math.max(1, chord);
    if (preset === "iso") {
      sphericalRef.current = { radius: c * 4.2, phi: Math.PI / 3.4, theta: Math.PI / 4.5 };
    } else if (preset === "side") {
      sphericalRef.current = { radius: c * 3.6, phi: Math.PI / 2.01, theta: Math.PI / 2 };
    } else if (preset === "top") {
      sphericalRef.current = { radius: c * 4.0, phi: 0.05, theta: 0 };
    } else if (preset === "inlet") {
      sphericalRef.current = { radius: c * 4.0, phi: Math.PI / 2.2, theta: Math.PI };
    }
    updateCameraFromSpherical();
  };

  // Color mapping helper: returns Three.js Color
  const getColormapColor = useCallback((val: number, min: number, max: number): THREE.Color => {
    const norm = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));
    const color = new THREE.Color();
    // Jet / Turbo-like aerodynamic palette:
    // 0.0 = deep blue, 0.25 = cyan, 0.5 = green, 0.75 = amber/orange, 1.0 = crimson red
    if (norm < 0.25) {
      const t = norm / 0.25;
      color.setRGB(0, t * 0.8, 1);
    } else if (norm < 0.5) {
      const t = (norm - 0.25) / 0.25;
      color.setRGB(0, 0.8 + t * 0.2, 1 - t * 0.8);
    } else if (norm < 0.75) {
      const t = (norm - 0.5) / 0.25;
      color.setRGB(t, 1 - t * 0.15, 0.2 * (1 - t));
    } else {
      const t = (norm - 0.75) / 0.25;
      color.setRGB(1, 0.85 * (1 - t * 0.7), 0);
    }
    return color;
  }, []);

  // Compute color range for selected mode
  const { minVal, maxVal, unitLabel } = useMemo(() => {
    if (colorField === "speed") {
      return { minVal: 0, maxVal: velocity * 1.8, unitLabel: "m/s" };
    } else if (colorField === "cp") {
      return { minVal: -2.0, maxVal: 1.0, unitLabel: "Cp" };
    } else if (colorField === "u") {
      return { minVal: 0, maxVal: velocity * 1.6, unitLabel: "m/s" };
    } else {
      return { minVal: -velocity * 0.4, maxVal: velocity * 0.4, unitLabel: "m/s" };
    }
  }, [colorField, velocity]);

  // =========================================================================
  // INITIALIZE THREE.JS SCENE
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    sceneRef.current = scene;

    // Atmospheric Fog
    scene.fog = new THREE.FogExp2(0x060911, 0.04);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 500);
    cameraRef.current = camera;
    updateCameraFromSpherical();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    keyLight.position.set(20, 30, 25);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.9);
    rimLight.position.set(-25, -15, -20);
    scene.add(rimLight);

    const topSoftLight = new THREE.DirectionalLight(0xffffff, 0.5);
    topSoftLight.position.set(0, 40, 0);
    scene.add(topSoftLight);

    // Parent groups for clean dynamic updating
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);
    gridGroupRef.current = gridGroup;

    const wingGroup = new THREE.Group();
    scene.add(wingGroup);
    wingGroupRef.current = wingGroup;

    const vectorsGroup = new THREE.Group();
    scene.add(vectorsGroup);
    vectorsGroupRef.current = vectorsGroup;

    const streamlinesGroup = new THREE.Group();
    scene.add(streamlinesGroup);
    streamlinesGroupRef.current = streamlinesGroup;

    const pressureCloudGroup = new THREE.Group();
    scene.add(pressureCloudGroup);
    pressureCloudGroupRef.current = pressureCloudGroup;

    // Probe marker reticle
    const probeGeo = new THREE.SphereGeometry(0.045 * chord, 16, 16);
    const probeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const probeMesh = new THREE.Mesh(probeGeo, probeMat);
    probeMesh.visible = false;
    scene.add(probeMesh);
    probeMarkerRef.current = probeMesh;

    // Responsive resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = 360;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    // Interactive Orbit Event Handlers
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true;
        isPanningRef.current = e.shiftKey;
      } else if (e.button === 2) {
        isPanningRef.current = true;
      }
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle 3D probe hovering
      if (!isDraggingRef.current && !isPanningRef.current && cameraRef.current && vectorField && vectorField.length > 0) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

        // Find closest vector point in 3D
        let closestPt: CfdVectorPoint | null = null;
        let closestDist = Infinity;
        let probeZ = 0;

        const wingspan = chord * spanMultiplier;
        const testPoints = vectorField;

        for (let i = 0; i < testPoints.length; i += 2) {
          const pt = testPoints[i];
          const pt3D = new THREE.Vector3(pt.x * chord, pt.y * chord, 0);
          const dist = raycaster.ray.distanceToPoint(pt3D);
          if (dist < closestDist && dist < 0.35 * chord) {
            closestDist = dist;
            closestPt = pt;
            probeZ = 0;
          }
        }

        if (closestPt) {
          const ptX = closestPt.x * chord;
          const ptY = closestPt.y * chord;
          if (probeMarkerRef.current) {
            probeMarkerRef.current.position.set(ptX, ptY, probeZ);
            probeMarkerRef.current.visible = true;
          }
          let region = "Freestream Potential Flow";
          if (closestPt.cp < -0.6) region = "Upper Suction Zone (Low P)";
          else if (closestPt.cp > 0.4) region = "Leading Edge Stagnation";
          else if (closestPt.x > 0.8) region = "Trailing Wake Boundary";

          setProbeData({
            x: ptX,
            y: ptY,
            z: probeZ,
            u: closestPt.u,
            v: closestPt.v,
            speed: closestPt.speed,
            cp: closestPt.cp,
            region,
          });
        } else {
          if (probeMarkerRef.current) probeMarkerRef.current.visible = false;
        }
      }

      // Handle Orbit Drag
      if (isDraggingRef.current) {
        const dx = e.clientX - prevMousePosRef.current.x;
        const dy = e.clientY - prevMousePosRef.current.y;
        prevMousePosRef.current = { x: e.clientX, y: e.clientY };

        if (isPanningRef.current) {
          // Pan camera
          const panSpeed = 0.003 * sphericalRef.current.radius;
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
          cameraTargetRef.current.addScaledVector(right, -dx * panSpeed);
          cameraTargetRef.current.addScaledVector(up, dy * panSpeed);
        } else {
          // Orbit rotate
          sphericalRef.current.theta -= dx * 0.008;
          sphericalRef.current.phi = Math.max(0.08, Math.min(Math.PI - 0.08, sphericalRef.current.phi - dy * 0.008));
        }
        updateCameraFromSpherical();
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      isPanningRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalRef.current.radius = Math.max(0.6 * chord, Math.min(15 * chord, sphericalRef.current.radius * (e.deltaY > 0 ? 1.08 : 0.92)));
      updateCameraFromSpherical();
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domElement.addEventListener("wheel", onWheel, { passive: false });
    domElement.addEventListener("contextmenu", (e) => e.preventDefault());

    // Main Animation Loop
    let time = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (isPlaying) {
        time += 0.015;

        // Auto-rotation if enabled
        if (autoRotate && !isDraggingRef.current) {
          sphericalRef.current.theta += 0.003;
          updateCameraFromSpherical();
        }

        // Animate particles along 3D streamlines
        const ps = particleSystemRef.current;
        if (ps && ps.curves.length > 0) {
          const positions = ps.points.geometry.attributes.position.array as Float32Array;
          const numParticlesPerCurve = 16;
          let pIdx = 0;

          for (let c = 0; c < ps.curves.length; c++) {
            const curve = ps.curves[c];
            const curveSpeed = ps.speeds[c] || 1.0;

            for (let i = 0; i < numParticlesPerCurve; i++) {
              let t = (ps.offsets[pIdx] + time * curveSpeed * 0.22) % 1.0;
              const pt = curve.getPoint(t);

              positions[pIdx * 3] = pt.x;
              positions[pIdx * 3 + 1] = pt.y;
              positions[pIdx * 3 + 2] = pt.z;
              pIdx++;
            }
          }
          ps.points.geometry.attributes.position.needsUpdate = true;
        }

        // Pulse probe marker
        if (probeMarkerRef.current && probeMarkerRef.current.visible) {
          const s = 1.0 + Math.sin(time * 6) * 0.15;
          probeMarkerRef.current.scale.set(s, s, s);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domElement.removeEventListener("wheel", onWheel);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, []);

  // =========================================================================
  // REBUILD 3D AIRFOIL GEOMETRY
  // =========================================================================
  useEffect(() => {
    const group = wingGroupRef.current;
    if (!group) return;

    // Clear old geometry
    while (group.children.length > 0) {
      const obj = group.children.pop();
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }

    if (!showWing) return;

    const c = Math.max(0.5, chord);
    const span = c * spanMultiplier;
    const aoaRad = (aoaDeg * Math.PI) / 180;

    // NACA 4-digit symmetric/cambered airfoil profile (NACA 2412 realistic aerodynamic wing)
    const points: THREE.Vector2[] = [];
    const numChordSteps = 48;

    // Generate upper and lower surfaces
    const upperPoints: THREE.Vector2[] = [];
    const lowerPoints: THREE.Vector2[] = [];

    const m = 0.02; // max camber
    const p = 0.4;  // location of max camber
    const t = 0.12; // thickness 12%

    for (let i = 0; i <= numChordSteps; i++) {
      // Cosine spacing clustering at leading edge
      const beta = (i / numChordSteps) * Math.PI;
      const xc = (1 - Math.cos(beta)) / 2; // 0 to 1

      // Thickness equation
      const yt =
        5 *
        t *
        (0.2969 * Math.sqrt(Math.max(0, xc)) -
          0.126 * xc -
          0.3516 * Math.pow(xc, 2) +
          0.2843 * Math.pow(xc, 3) -
          0.1015 * Math.pow(xc, 4));

      // Camber line and gradient
      let yc = 0;
      let dyc_dx = 0;
      if (xc < p) {
        yc = (m / Math.pow(p, 2)) * (2 * p * xc - Math.pow(xc, 2));
        dyc_dx = ((2 * m) / Math.pow(p, 2)) * (p - xc);
      } else {
        yc = (m / Math.pow(1 - p, 2)) * (1 - 2 * p + 2 * p * xc - Math.pow(xc, 2));
        dyc_dx = ((2 * m) / Math.pow(1 - p, 2)) * (p - xc);
      }
      const thetaAngle = Math.atan(dyc_dx);

      const xu = (xc - yt * Math.sin(thetaAngle) - 0.25) * c; // center around 25% chord AC
      const yu = (yc + yt * Math.cos(thetaAngle)) * c;

      const xl = (xc + yt * Math.sin(thetaAngle) - 0.25) * c;
      const yl = (yc - yt * Math.cos(thetaAngle)) * c;

      upperPoints.push(new THREE.Vector2(xu, yu));
      lowerPoints.push(new THREE.Vector2(xl, yl));
    }

    // Connect into closed polygon outline
    for (let i = 0; i < upperPoints.length; i++) {
      points.push(upperPoints[i]);
    }
    for (let i = lowerPoints.length - 1; i >= 0; i--) {
      points.push(lowerPoints[i]);
    }

    const shape = new THREE.Shape(points);
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: span,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 2,
      bevelSize: 0.015 * c,
      bevelThickness: 0.015 * c,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); // Center at origin

    // Aeronautical composite skin material
    const material = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      wireframe: false,
    });

    const wingMesh = new THREE.Mesh(geometry, material);
    // Apply pitch rotation according to Angle of Attack (AoA) around spanwise Z axis
    wingMesh.rotation.z = aoaRad;
    group.add(wingMesh);

    // Subtle edge / rib wireframe
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
    });
    const wireGeo = new THREE.WireframeGeometry(geometry);
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    wireframe.rotation.z = aoaRad;
    group.add(wireframe);

    // Aerodynamic Center (quarter-chord) indicator line along wingspan
    const acLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -span / 2),
      new THREE.Vector3(0, 0, span / 2),
    ]);
    const acLineMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    const acLine = new THREE.Line(acLineGeo, acLineMat);
    group.add(acLine);

    // Wingtip Endplate Fins (Aero Winglets)
    const finHeight = 0.25 * c;
    const finGeo = new THREE.BoxGeometry(0.5 * c, finHeight, 0.012 * c);
    const finMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 });

    const leftFin = new THREE.Mesh(finGeo, finMat);
    leftFin.position.set(0.1 * c, finHeight / 2, -span / 2);
    leftFin.rotation.z = aoaRad;
    group.add(leftFin);

    const rightFin = new THREE.Mesh(finGeo, finMat);
    rightFin.position.set(0.1 * c, finHeight / 2, span / 2);
    rightFin.rotation.z = aoaRad;
    group.add(rightFin);
  }, [chord, aoaDeg, spanMultiplier, showWing]);

  // =========================================================================
  // REBUILD 3D CFD VELOCITY VECTOR FIELD
  // =========================================================================
  useEffect(() => {
    const group = vectorsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const obj = group.children.pop();
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry.dispose();
      }
    }

    if (!showVectors || !vectorField || vectorField.length === 0) return;

    const c = Math.max(0.5, chord);
    const span = c * spanMultiplier;
    const aoaRad = (aoaDeg * Math.PI) / 180;

    // We distribute vector field across 5 spanwise planes (z slices)
    const zSlices = [-span * 0.45, -span * 0.22, 0, span * 0.22, span * 0.45];
    const stride = vectorDensity >= 1.5 ? 1 : vectorDensity <= 0.5 ? 3 : 2;

    const baseArrowLen = 0.16 * c;
    const coneRadius = 0.018 * c;
    const coneHeight = 0.045 * c;

    // Single shared cone geometry for efficiency
    const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
    coneGeo.rotateX(Math.PI / 2); // align pointing along +Z for quaternion lookAt

    for (let s = 0; s < zSlices.length; s++) {
      const zPos = zSlices[s];
      const spanNorm = Math.abs(zPos / (span * 0.5)); // 0 at center, 1 at tip

      for (let i = 0; i < vectorField.length; i += stride) {
        const pt = vectorField[i];

        // 3D position
        const posX = pt.x * c;
        const posY = pt.y * c;
        const posZ = zPos;

        // Skip vectors that penetrate inside the wing
        const distFromAC = Math.hypot(posX, posY);
        if (distFromAC < 0.12 * c && Math.abs(posX) < 0.45 * c) continue;

        // Calculate flow velocity components including 3D spanwise downwash
        let u = pt.u;
        let v = pt.v;
        // Wingtip vortex induced spanwise velocity (outward on lower side, inward on upper side)
        let w = (posY < 0 ? 1 : -1) * (zPos > 0 ? 1 : -1) * spanNorm * (velocity * 0.15) * Math.sin(aoaRad);

        const speed = Math.hypot(u, v, w);
        if (speed < 0.01) continue;

        // Determine color
        let colorVal = speed;
        if (colorField === "cp") colorVal = pt.cp;
        else if (colorField === "u") colorVal = u;
        else if (colorField === "v") colorVal = v;

        const color = getColormapColor(colorVal, minVal, maxVal);

        // Vector length scaled by velocity
        const len = Math.min(0.35 * c, (speed / (velocity * 1.4 || 1)) * baseArrowLen);
        const dir = new THREE.Vector3(u, v, w).normalize();

        const endPos = new THREE.Vector3(posX, posY, posZ).addScaledVector(dir, len);

        // Line shaft
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(posX, posY, posZ),
          endPos,
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.65,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        group.add(line);

        // Cone arrowhead
        const coneMat = new THREE.MeshBasicMaterial({ color: color });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.copy(endPos);
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        group.add(cone);
      }
    }
  }, [
    vectorField,
    chord,
    spanMultiplier,
    showVectors,
    colorField,
    minVal,
    maxVal,
    vectorDensity,
    aoaDeg,
    velocity,
    getColormapColor,
  ]);

  // =========================================================================
  // REBUILD 3D STREAMLINES & ANIMATED PARTICLES
  // =========================================================================
  useEffect(() => {
    const group = streamlinesGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const obj = group.children.pop();
      if (obj instanceof THREE.Line || obj instanceof THREE.Points) {
        obj.geometry.dispose();
      }
    }

    if (!showStreamlines || !streamlines || streamlines.length === 0) {
      particleSystemRef.current = null;
      return;
    }

    const c = Math.max(0.5, chord);
    const span = c * spanMultiplier;
    const curves: THREE.CatmullRomCurve3[] = [];
    const curveSpeeds: number[] = [];

    const zSpans = [-span * 0.4, -span * 0.2, 0, span * 0.2, span * 0.4];

    zSpans.forEach((zVal, zIdx) => {
      streamlines.forEach((line, sIdx) => {
        if (line.length < 3) return;

        const points3D: THREE.Vector3[] = [];
        const isUpper = sIdx > streamlines.length / 2;

        line.forEach((p) => {
          // Add 3D spanwise camber deformation and wingtip vortex curl
          let zOffset = zVal;
          if (p.x > 0.6 * c) {
            // Wake roll-up downstream
            const wakeFactor = (p.x - 0.6 * c) / (2.0 * c);
            zOffset += (zVal > 0 ? -1 : 1) * wakeFactor * 0.15 * span;
          }
          points3D.push(new THREE.Vector3(p.x * c, p.y * c, zOffset));
        });

        const curve = new THREE.CatmullRomCurve3(points3D);
        curves.push(curve);
        curveSpeeds.push(isUpper ? 1.35 : 0.95);

        // Render static translucent streamline ribbon
        const sampledPoints = curve.getPoints(45);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(sampledPoints);
        const lineMat = new THREE.LineBasicMaterial({
          color: isUpper ? 0x38bdf8 : 0x0284c7,
          transparent: true,
          opacity: 0.35,
        });
        const streamLine = new THREE.Line(lineGeo, lineMat);
        group.add(streamLine);
      });
    });

    // Add trailing edge wingtip vortex helical streamlines
    [-span / 2, span / 2].forEach((tipZ) => {
      const vortexPoints: THREE.Vector3[] = [];
      const numTurns = 5;
      const vRadius = 0.08 * c;
      const startX = 0.5 * c;

      for (let t = 0; t <= 50; t++) {
        const prog = t / 50;
        const x = startX + prog * (2.5 * c);
        const angle = prog * numTurns * Math.PI * 2 * (tipZ > 0 ? 1 : -1);
        const r = vRadius * Math.sqrt(prog + 0.1);
        const y = Math.sin(angle) * r - 0.05 * c * prog;
        const z = tipZ + Math.cos(angle) * r;
        vortexPoints.push(new THREE.Vector3(x, y, z));
      }

      const vortexCurve = new THREE.CatmullRomCurve3(vortexPoints);
      curves.push(vortexCurve);
      curveSpeeds.push(1.6);

      const vLineGeo = new THREE.BufferGeometry().setFromPoints(vortexCurve.getPoints(60));
      const vLineMat = new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.5 });
      group.add(new THREE.Line(vLineGeo, vLineMat));
    });

    // Setup animated particle tracer system
    const numParticlesPerCurve = 16;
    const totalParticles = curves.length * numParticlesPerCurve;
    const particlePositions = new Float32Array(totalParticles * 3);
    const particleOffsets = new Float32Array(totalParticles);

    for (let cIdx = 0; cIdx < curves.length; cIdx++) {
      for (let i = 0; i < numParticlesPerCurve; i++) {
        const pIdx = cIdx * numParticlesPerCurve + i;
        particleOffsets[pIdx] = i / numParticlesPerCurve;
        const pt = curves[cIdx].getPoint(particleOffsets[pIdx]);
        particlePositions[pIdx * 3] = pt.x;
        particlePositions[pIdx * 3 + 1] = pt.y;
        particlePositions[pIdx * 3 + 2] = pt.z;
      }
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.06 * c,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    particleSystemRef.current = {
      points: particles,
      offsets: particleOffsets,
      curves: curves,
      speeds: new Float32Array(curveSpeeds),
    };
  }, [streamlines, chord, spanMultiplier, showStreamlines]);

  // =========================================================================
  // REBUILD 3D PRESSURE VOLUMETRIC CLOUD / ISO-SURFACE
  // =========================================================================
  useEffect(() => {
    const group = pressureCloudGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const obj = group.children.pop();
      if (obj instanceof THREE.Mesh) obj.geometry.dispose();
    }

    if (!showPressureCloud) return;

    const c = Math.max(0.5, chord);
    const span = c * spanMultiplier;
    const aoaRad = (aoaDeg * Math.PI) / 180;

    // 1. Upper Suction Bubble (Low pressure core envelope, Cyan / Violet)
    const suctionGeo = new THREE.SphereGeometry(1, 24, 16);
    suctionGeo.scale(0.42 * c, 0.16 * c * (1 + aoaDeg * 0.04), span * 0.48);

    const suctionMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    const suctionMesh = new THREE.Mesh(suctionGeo, suctionMat);
    suctionMesh.position.set(-0.02 * c, 0.14 * c, 0);
    suctionMesh.rotation.z = aoaRad * 0.6;
    group.add(suctionMesh);

    // 2. High Pressure Stagnation Zone (Amber / Orange below leading edge)
    const stagGeo = new THREE.SphereGeometry(1, 20, 14);
    stagGeo.scale(0.22 * c, 0.1 * c, span * 0.45);

    const stagMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.16,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    const stagMesh = new THREE.Mesh(stagGeo, stagMat);
    stagMesh.position.set(-0.24 * c, -0.08 * c, 0);
    stagMesh.rotation.z = aoaRad * 0.5;
    group.add(stagMesh);
  }, [chord, spanMultiplier, aoaDeg, showPressureCloud]);

  // =========================================================================
  // REBUILD 3D COORDINATE METRIC GRID & AXES
  // =========================================================================
  useEffect(() => {
    const group = gridGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const obj = group.children.pop();
      if (obj instanceof THREE.GridHelper || obj instanceof THREE.AxesHelper) {
        obj.dispose();
      }
    }

    if (!showGridAxes) return;

    const c = Math.max(0.5, chord);
    const gridSize = c * 4.5;
    const gridDivisions = 18;

    // Floor metric grid
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x1e293b, 0x0f172a);
    grid.position.y = -0.75 * c;
    group.add(grid);

    // Coordinate Frame Axes (Red: X/Streamwise, Green: Y/Lift, Blue: Z/Span)
    const axes = new THREE.AxesHelper(0.8 * c);
    axes.position.set(-0.25 * c, 0, 0);
    group.add(axes);
  }, [chord, showGridAxes]);

  return (
    <div className="relative w-full flex flex-col bg-[#060911] rounded-lg overflow-hidden select-none border border-border">
      {/* 3D Viewport Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-zinc-950/80 backdrop-blur-md border-b border-border/70 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-[11px] font-bold">
            <Box className="h-3 w-3" />
            3D COORDINATE SPACE
          </div>
          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
            OpenFOAM v2312 Navier-Stokes 3D Mesh
          </span>
        </div>

        {/* Camera Presets & Layer Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center rounded-md bg-zinc-900 border border-border/80 p-0.5 text-[10px]">
            {(["iso", "side", "top", "inlet"] as CameraPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setCameraPreset(p)}
                className="px-2 py-0.5 rounded uppercase font-mono font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                title={`Set camera angle to ${p.toUpperCase()}`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Color field selector */}
          <div className="flex items-center rounded-md bg-zinc-900 border border-border/80 p-0.5 text-[10px] font-mono">
            {(
              [
                { id: "speed", label: "|U|" },
                { id: "cp", label: "Cp" },
                { id: "u", label: "Ux" },
                { id: "v", label: "Uy" },
              ] as { id: ColorFieldMode; label: string }[]
            ).map((cf) => (
              <button
                key={cf.id}
                onClick={() => setColorField(cf.id)}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  colorField === cf.id
                    ? "bg-primary text-primary-foreground"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
                title={`Color field by ${cf.label}`}
              >
                {cf.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`h-6 px-2 text-[10px] gap-1 font-mono ${
              autoRotate ? "border-primary text-primary bg-primary/10" : "text-zinc-400"
            }`}
            title="Toggle 3D Orbit Auto-Rotation"
          >
            <RotateCcw className={`h-2.5 w-2.5 ${autoRotate ? "animate-spin" : ""}`} />
            Turntable
          </Button>
        </div>
      </div>

      {/* Main Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-80 sm:h-96 relative cursor-grab active:cursor-grabbing overflow-hidden"
      />

      {/* 3D Scientific Colormap Legend HUD */}
      <div className="absolute top-12 left-3 z-10 bg-zinc-950/85 backdrop-blur-md border border-border/80 rounded-md p-2 text-[10px] font-mono pointer-events-auto shadow-lg space-y-1 max-w-[170px]">
        <div className="flex items-center justify-between text-zinc-300 font-bold border-b border-border/50 pb-1">
          <span>{colorField === "speed" ? "Velocity |U|" : colorField === "cp" ? "Pressure Cp" : `Field ${colorField.toUpperCase()}`}</span>
          <span className="text-[9px] text-zinc-400">{unitLabel}</span>
        </div>
        <div className="h-2 w-full rounded-sm bg-gradient-to-r from-blue-600 via-emerald-400 via-amber-400 to-rose-600 border border-white/20" />
        <div className="flex justify-between text-[9px] text-zinc-400">
          <span>{minVal.toFixed(1)}</span>
          <span>{((minVal + maxVal) / 2).toFixed(1)}</span>
          <span className="text-rose-400">{maxVal.toFixed(1)}</span>
        </div>
        <div className="text-[9px] text-zinc-400 pt-0.5 flex justify-between border-t border-border/40">
          <span>Cl: <strong className="text-sky-400">{cl.toFixed(3)}</strong></span>
          <span>Cd: <strong className="text-zinc-300">{cd.toFixed(4)}</strong></span>
        </div>
      </div>

      {/* 3D Layer Toggles Overlay (Bottom Left) */}
      <div className="absolute bottom-2 left-3 z-10 flex flex-wrap items-center gap-1 bg-zinc-950/85 backdrop-blur-md border border-border/80 rounded-md p-1 text-[10px] font-mono shadow-md">
        <button
          onClick={() => setShowVectors(!showVectors)}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
            showVectors ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "text-zinc-500 hover:text-zinc-300"
          }`}
          title="Toggle 3D Vector Quiver Field"
        >
          Vectors
        </button>
        <button
          onClick={() => setShowStreamlines(!showStreamlines)}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
            showStreamlines ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-zinc-500 hover:text-zinc-300"
          }`}
          title="Toggle 3D Flow Streamlines"
        >
          Streamlines
        </button>
        <button
          onClick={() => setShowPressureCloud(!showPressureCloud)}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
            showPressureCloud ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-zinc-500 hover:text-zinc-300"
          }`}
          title="Toggle Pressure Iso-surfaces"
        >
          Iso-P Cloud
        </button>
        <button
          onClick={() => setShowWing(!showWing)}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
            showWing ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-zinc-500 hover:text-zinc-300"
          }`}
          title="Toggle Wing Solid"
        >
          Wing
        </button>
        <button
          onClick={() => setShowGridAxes(!showGridAxes)}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
            showGridAxes ? "bg-zinc-700/60 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
          }`}
          title="Toggle Metric Grid & XYZ Axes"
        >
          Grid/Axes
        </button>
      </div>

      {/* Live 3D Spatial Probe HUD (Top Right) */}
      {probeData && (
        <div className="absolute top-12 right-3 z-10 bg-zinc-950/90 backdrop-blur-md border border-sky-500/40 rounded-md p-2.5 text-[10px] font-mono shadow-xl space-y-1.5 max-w-[210px] animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-sky-400 font-bold border-b border-border/60 pb-1">
            <Gauge className="h-3 w-3 text-sky-400 animate-pulse" />
            <span>3D PROBE SENSOR</span>
          </div>
          <div className="space-y-0.5 text-zinc-300 text-[9px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">Position (X,Y,Z):</span>
              <span className="text-foreground">{probeData.x.toFixed(2)}, {probeData.y.toFixed(2)}, {probeData.z.toFixed(2)} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Local Speed |U|:</span>
              <span className="text-emerald-400 font-bold">{probeData.speed.toFixed(1)} m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Velocity (u, v):</span>
              <span className="text-zinc-200">{probeData.u.toFixed(1)}, {probeData.v.toFixed(1)} m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Pressure Coeff (Cp):</span>
              <span className={probeData.cp < 0 ? "text-sky-400 font-bold" : "text-amber-400 font-bold"}>
                {probeData.cp.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Local Mach Est:</span>
              <span className="text-zinc-200">{(probeData.speed / 343).toFixed(3)} M</span>
            </div>
          </div>
          <div className="pt-1 border-t border-border/40 text-[8.5px] text-zinc-400 truncate">
            {probeData.region}
          </div>
        </div>
      )}

      {/* Axis Marker Compass (Bottom Right) */}
      <div className="absolute bottom-2 right-3 z-10 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md border border-border/80 rounded px-2 py-1 text-[9px] font-mono text-zinc-400 pointer-events-none">
        <span className="text-rose-400 font-bold">X: Flow</span>
        <span className="text-emerald-400 font-bold">Y: Lift</span>
        <span className="text-sky-400 font-bold">Z: Span</span>
        <span>| Drag to Rotate / Scroll to Zoom</span>
      </div>
    </div>
  );
}
