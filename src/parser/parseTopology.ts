import type { Topology } from '../types/topology';

export function parseTopology(text: string): Topology {
  const lines = text.split(/\r?\n/);
  const topology: Topology = {
    sensors: [],
    edges: [],
    aps: [],
    infra: { bs: null, wlc: null },
  };

  let i = 0;

  const nextContentLine = (): string | null => {
    while (i < lines.length) {
      const line = lines[i].trim();
      i++;
      if (line && !line.startsWith('#')) return line;
    }
    return null;
  };

  while (i < lines.length) {
    const line = lines[i].trim();
    i++;

    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    const keyword = parts[0].toUpperCase();

    if (keyword === 'SENSORS') {
      const count = parseInt(parts[1], 10);
      for (let s = 0; s < count; s++) {
        const sLine = nextContentLine();
        if (!sLine) break;
        const sp = sLine.split(/\s+/);
        topology.sensors.push({
          id: parseInt(sp[0], 10),
          x: parseFloat(sp[1]),
          y: parseFloat(sp[2]),
          isExit: sp[3] === '1',
          isWall: sp[4] === '1',
        });
      }
    } else if (keyword === 'EDGES') {
      const count = parseInt(parts[1], 10);
      for (let e = 0; e < count; e++) {
        const eLine = nextContentLine();
        if (!eLine) break;
        const ep = eLine.split(/\s+/);
        topology.edges.push({
          from: ep[0],
          to: ep[1],
        });
      }
    } else if (keyword === 'APS') {
      const count = parseInt(parts[1], 10);
      for (let a = 0; a < count; a++) {
        const aLine = nextContentLine();
        if (!aLine) break;
        const ap = aLine.split(/\s+/);
        topology.aps.push({
          id: parseInt(ap[0], 10),
          x: parseFloat(ap[1]),
          y: parseFloat(ap[2]),
        });
      }
    } else if (keyword === 'INFRASTRUCTURE') {
      topology.infra = {
        bs: { x: parseFloat(parts[1]), y: parseFloat(parts[2]) },
        wlc: { x: parseFloat(parts[3]), y: parseFloat(parts[4]) },
      };
    }
  }

  return topology;
}
