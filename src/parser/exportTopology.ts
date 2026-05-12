import type { Topology } from '../types/topology';

export function exportTopology(topo: Topology): string {
  const lines: string[] = [];

  // SENSORS
  lines.push('# SYNTAX: SENSORS <total_count>');
  lines.push('# ID  X_Coord  Y_Coord   IsExit   IsWall (0 or 1)');
  lines.push(`SENSORS ${topo.sensors.length}`);
  for (const s of topo.sensors) {
    lines.push(
      `${s.id} ${s.x.toFixed(1)} ${s.y.toFixed(1)} ${s.isExit ? 1 : 0} ${s.isWall ? 1 : 0}`
    );
  }

  lines.push('');

  // EDGES
  lines.push('# SYNTAX: EDGES <total_connections>');
  lines.push(`EDGES ${topo.edges.length}`);
  for (const e of topo.edges) {
    lines.push(`${e.from} ${e.to}`);
  }

  lines.push('');

  // APS
  lines.push('# SYNTAX: APS <total_count>');
  lines.push(`APS ${topo.aps.length}`);
  for (const ap of topo.aps) {
    lines.push(`${ap.id} ${ap.x.toFixed(1)} ${ap.y.toFixed(1)}`);
  }

  lines.push('');

  // INFRASTRUCTURE
  lines.push('# SYNTAX: INFRASTRUCTURE (BS_X BS_Y WLC_X WLC_Y)');
  const bsX = topo.infra.bs ? topo.infra.bs.x.toFixed(1) : '0.0';
  const bsY = topo.infra.bs ? topo.infra.bs.y.toFixed(1) : '0.0';
  const wlcX = topo.infra.wlc ? topo.infra.wlc.x.toFixed(1) : '0.0';
  const wlcY = topo.infra.wlc ? topo.infra.wlc.y.toFixed(1) : '0.0';
  lines.push(`INFRASTRUCTURE ${bsX} ${bsY} ${wlcX} ${wlcY}`);
  lines.push('');

  return lines.join('\n');
}

export function downloadTopology(topo: Topology, filename = 'topology.txt') {
  const content = exportTopology(topo);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 250);
}

export function exportJSON(topo: Topology): string {
  return JSON.stringify(topo, null, 2);
}

export function downloadJSON(topo: Topology, filename = 'topology.json') {
  const blob = new Blob([exportJSON(topo)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 250);
}
