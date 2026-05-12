export interface Sensor {
  id: number;
  x: number;
  y: number;
  isExit: boolean;
  isWall: boolean;
}

export interface AP {
  id: number;
  x: number;
  y: number;
}

export interface Edge {
  from: string;
  to: string;
}

export interface Infrastructure {
  bs: { x: number; y: number } | null;
  wlc: { x: number; y: number } | null;
}

export interface Topology {
  sensors: Sensor[];
  edges: Edge[];
  aps: AP[];
  infra: Infrastructure;
}

export type ToolMode =
  | 'select'
  | 'addSensor'
  | 'addExitSensor'
  | 'addWallSensor'
  | 'addAP'
  | 'moveBS'
  | 'moveWLC'
  | 'addEdge'
  | 'delete';

export type SelectedEntity =
  | { type: 'sensor'; id: number }
  | { type: 'ap'; id: number }
  | { type: 'bs' }
  | { type: 'wlc' }
  | { type: 'edge'; from: string; to: string }
  | null;

export interface LayerVisibility {
  sensors: boolean;
  aps: boolean;
  infra: boolean;
  edges: boolean;
  grid: boolean;
  nodeIds: boolean;
  apCoverage: boolean;
}

export interface CanvasView {
  x: number;
  y: number;
  scale: number;
}
