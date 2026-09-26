export interface PcbPin {
  number: string | number;
  name: string;
  net: string;
  relX: number;
  relY: number;
}

export interface PcbComponent {
  id: string;
  ref: string;
  name: string;
  category: "mcu" | "connector" | "ic" | "passive" | "sensor" | "diode" | "power" | "other" | string;
  package: string;
  x: number;
  y: number;
  rotation: number;
  layer: "top" | "bottom" | "F.Cu" | "B.Cu" | string;
  widthMm: number;
  heightMm: number;
  value: string;
  description: string;
  lcscPartNumber?: string;
  unitCostUsd?: number;
  pins: PcbPin[];
}

export interface PcbTraceSegment {
  id?: string;
  net?: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  widthMm: number;
  layer: "top" | "bottom" | "in1" | "in2" | "F.Cu" | "B.Cu" | string;
}

export interface PcbNet {
  id: string;
  name: string;
  type?: string;
  color?: string;
  voltage?: string | number;
  currentEstA?: number;
  targetImpedance?: string | number;
  pins?: (string | number)[];
  nodes?: string[];
  traceWidthMm?: number;
  segments?: PcbTraceSegment[];
}

export interface PcbVia {
  id: string;
  net: string;
  x: number;
  y: number;
  drillMm: number;
  diameterMm?: number;
  padMm?: number;
}

export interface PcbDimension {
  widthMm: number;
  heightMm: number;
  cornerRadiusMm: number;
}

export interface PcbBoard {
  id: string;
  title: string;
  version: string;
  author: string;
  description: string;
  dimensions: PcbDimension;
  layersCount: number;
  copperThicknessOz: number;
  substrate: string;
  enclosureMaterial?: string;
  components: PcbComponent[];
  nets?: PcbNet[];
  vias?: PcbVia[];
  traces?: PcbTraceSegment[];
}
