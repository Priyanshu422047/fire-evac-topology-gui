import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Topology,
  Sensor,
  AP,
  Edge,
  ToolMode,
  SelectedEntity,
  LayerVisibility,
  CanvasView,
} from '../types/topology';
import { generateGrid } from '../utils/layoutGenerators';
import { autoGenerateEdges } from '../utils/edgeAutoGen';

const DEFAULT_TOPOLOGY: Topology = {
  sensors: [],
  edges: [],
  aps: [],
  infra: { bs: null, wlc: null },
};

interface TopologyState {
  topology: Topology;
  history: Topology[];
  future: Topology[];
  tool: ToolMode;
  selected: SelectedEntity;
  layers: LayerVisibility;
  view: CanvasView;
  gridSpacing: number;
  snapToGrid: boolean;
  edgeMode: 'orthogonal' | 'diagonal' | 'both' | 'none';
  edgeDrawStart: string | null;

  // Actions
  setTopology: (t: Topology) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  setTool: (t: ToolMode) => void;
  setSelected: (s: SelectedEntity) => void;
  setView: (v: Partial<CanvasView>) => void;
  setLayers: (l: Partial<LayerVisibility>) => void;
  setGridSpacing: (v: number) => void;
  setSnapToGrid: (v: boolean) => void;
  setEdgeMode: (v: 'orthogonal' | 'diagonal' | 'both' | 'none') => void;
  setEdgeDrawStart: (id: string | null) => void;

  // Sensor operations
  addSensor: (x: number, y: number, isExit: boolean, isWall: boolean) => void;
  updateSensor: (id: number, patch: Partial<Sensor>) => void;
  deleteSensor: (id: number) => void;

  // AP operations
  addAP: (x: number, y: number) => void;
  updateAP: (id: number, patch: Partial<AP>) => void;
  deleteAP: (id: number) => void;

  // Edge operations
  addEdge: (from: string, to: string) => void;
  deleteEdge: (from: string, to: string) => void;
  autoGenEdges: () => void;

  // Infrastructure
  updateBS: (x: number, y: number) => void;
  updateWLC: (x: number, y: number) => void;

  // Layout
  applyLayout: (t: Topology) => void;
}

function snapValue(v: number, spacing: number, snap: boolean): number {
  if (!snap) return v;
  return Math.round(v / spacing) * spacing;
}

export const useTopologyStore = create<TopologyState>()(
  persist(
    (set, get) => ({
  topology: DEFAULT_TOPOLOGY,
  history: [],
  future: [],
  tool: 'select',
  selected: null,
  layers: {
    sensors: true,
    aps: true,
    infra: true,
    edges: true,
    grid: true,
    nodeIds: true,
    apCoverage: false,
  },
  view: { x: 50, y: 50, scale: 12 },
  gridSpacing: 5.0,
  snapToGrid: false,
  edgeMode: 'orthogonal',
  edgeDrawStart: null,

  pushHistory: () => {
    const cur = get().topology;
    set(s => ({
      history: [...s.history.slice(-49), JSON.parse(JSON.stringify(cur))],
      future: [],
    }));
  },

  setTopology: (t) => {
    get().pushHistory();
    set({ topology: t, selected: null });
  },

  undo: () => {
    const { history, topology, future } = get();
    if (!history.length) return;
    const prev = history[history.length - 1];
    set({
      topology: prev,
      history: history.slice(0, -1),
      future: [JSON.parse(JSON.stringify(topology)), ...future.slice(0, 49)],
      selected: null,
    });
  },

  redo: () => {
    const { history, topology, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      topology: next,
      history: [...history.slice(-49), JSON.parse(JSON.stringify(topology))],
      future: future.slice(1),
      selected: null,
    });
  },

  setTool: (tool) => set({ tool, edgeDrawStart: null }),
  setSelected: (selected) => set({ selected }),
  setView: (v) => set(s => ({ view: { ...s.view, ...v } })),
  setLayers: (l) => set(s => ({ layers: { ...s.layers, ...l } })),
  setGridSpacing: (v) => set({ gridSpacing: v }),
  setSnapToGrid: (v) => set({ snapToGrid: v }),
  setEdgeMode: (v) => set({ edgeMode: v }),
  setEdgeDrawStart: (id) => set({ edgeDrawStart: id }),

  addSensor: (x, y, isExit, isWall) => {
    const { topology, gridSpacing, snapToGrid } = get();
    get().pushHistory();
    const sx = snapValue(x, gridSpacing, snapToGrid);
    const sy = snapValue(y, gridSpacing, snapToGrid);
    const newId = topology.sensors.length > 0
      ? Math.max(...topology.sensors.map(s => s.id)) + 1
      : 0;

    set(s => ({
      topology: {
        ...s.topology,
        sensors: [...s.topology.sensors, { id: newId, x: sx, y: sy, isExit, isWall }],
      },
    }));
  },

  updateSensor: (id, patch) => {
    get().pushHistory();
    set(s => ({
      topology: {
        ...s.topology,
        sensors: s.topology.sensors.map(sensor =>
          sensor.id === id ? { ...sensor, ...patch } : sensor
        ),
      },
    }));
  },

  deleteSensor: (id) => {
    get().pushHistory();
    set(s => ({
      topology: {
        ...s.topology,
        sensors: s.topology.sensors.filter(sensor => sensor.id !== id),
        edges: s.topology.edges.filter(e => e.from !== `s-${id}` && e.to !== `s-${id}`),
      },
      selected: null,
    }));
  },

  addAP: (x, y) => {
    const { topology, gridSpacing, snapToGrid } = get();
    get().pushHistory();
    const sx = snapValue(x, gridSpacing, snapToGrid);
    const sy = snapValue(y, gridSpacing, snapToGrid);
    const newId = topology.aps.length > 0
      ? Math.max(...topology.aps.map(a => a.id)) + 1
      : 0;
    set(s => ({
      topology: {
        ...s.topology,
        aps: [...s.topology.aps, { id: newId, x: sx, y: sy }],
      },
    }));
  },

  updateAP: (id, patch) => {
    get().pushHistory();
    set(s => ({
      topology: {
        ...s.topology,
        aps: s.topology.aps.map(ap => ap.id === id ? { ...ap, ...patch } : ap),
      },
    }));
  },

  deleteAP: (id) => {
    get().pushHistory();
    set(s => ({
      topology: {
        ...s.topology,
        aps: s.topology.aps.filter(ap => ap.id !== id),
        edges: s.topology.edges.filter(e => e.from !== `a-${id}` && e.to !== `a-${id}`),
      },
      selected: null,
    }));
  },

  addEdge: (from, to) => {
    const { topology } = get();
    const exists = topology.edges.some(
      e => (e.from === from && e.to === to) || (e.from === to && e.to === from)
    );
    if (exists || from === to) return;
    get().pushHistory();
    set(s => ({
      topology: { ...s.topology, edges: [...s.topology.edges, { from, to }] },
    }));
  },

  deleteEdge: (from, to) => {
    get().pushHistory();
    set(s => ({
      topology: {
        ...s.topology,
        edges: s.topology.edges.filter(
          e => !((e.from === from && e.to === to) || (e.from === to && e.to === from))
        ),
      },
      selected: null,
    }));
  },

  autoGenEdges: () => {
    const { topology, edgeMode } = get();
    get().pushHistory();
    const edges = autoGenerateEdges(topology.sensors, edgeMode);
    set(s => ({ topology: { ...s.topology, edges } }));
  },

  updateBS: (x, y) => {
    get().pushHistory();
    set(s => ({
      topology: { ...s.topology, infra: { ...s.topology.infra, bs: { x, y } } },
    }));
  },

  updateWLC: (x, y) => {
    get().pushHistory();
    set(s => ({
      topology: { ...s.topology, infra: { ...s.topology.infra, wlc: { x, y } } },
    }));
  },

  applyLayout: (t) => {
    get().pushHistory();
    set({ topology: t, selected: null });
  },
}), {
  name: 'topology-storage',
  partialize: (state) => ({
    topology: state.topology,
    layers: state.layers,
    view: state.view,
    gridSpacing: state.gridSpacing,
    snapToGrid: state.snapToGrid,
    edgeMode: state.edgeMode,
  })
}));
