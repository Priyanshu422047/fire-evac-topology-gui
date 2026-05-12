import type { Sensor, Edge } from '../types/topology';

export function autoGenerateEdges(
  sensors: Sensor[],
  mode: 'orthogonal' | 'diagonal' | 'both' | 'none'
): Edge[] {
  if (mode === 'none') return [];

  const edges: Edge[] = [];
  const sensorMap = new Map<string, number>();

  // Build coordinate key → id map
  for (const s of sensors) {
    sensorMap.set(`${s.x},${s.y}`, s.id);
  }

  // Determine spacing (find the minimum non-zero dx/dy between sensors)
  const xCoords = [...new Set(sensors.map(s => s.x))].sort((a, b) => a - b);
  const yCoords = [...new Set(sensors.map(s => s.y))].sort((a, b) => a - b);
  const dx = xCoords.length > 1 ? xCoords[1] - xCoords[0] : 5;
  const dy = yCoords.length > 1 ? yCoords[1] - yCoords[0] : 5;

  const added = new Set<string>();

  for (const s of sensors) {
    const neighbors: [number, number][] = [];

    if (mode === 'orthogonal' || mode === 'both') {
      neighbors.push([s.x + dx, s.y], [s.x, s.y + dy]);
    }
    if (mode === 'diagonal' || mode === 'both') {
      neighbors.push([s.x + dx, s.y + dy], [s.x + dx, s.y - dy]);
    }

    for (const [nx, ny] of neighbors) {
      const nid = sensorMap.get(`${nx},${ny}`);
      if (nid === undefined) continue;
      const key = `${Math.min(s.id, nid)}-${Math.max(s.id, nid)}`;
      if (!added.has(key)) {
        added.add(key);
        edges.push({ from: `s-${s.id}`, to: `s-${nid}` });
      }
    }
  }

  return edges;
}
