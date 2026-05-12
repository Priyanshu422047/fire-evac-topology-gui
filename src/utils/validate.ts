import type { Topology } from '../types/topology';

export interface ValidationError {
  id: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateTopology(topo: Topology): ValidationError[] {
  const errors: ValidationError[] = [];
  const sensorIds = new Set(topo.sensors.map(s => s.id));

  if (topo.sensors.length === 0) {
    errors.push({ id: 'no-sensors', message: 'No sensors defined', severity: 'error' });
  }

  const exits = topo.sensors.filter(s => s.isExit);
  if (exits.length === 0) {
    errors.push({ id: 'no-exits', message: 'At least one exit sensor required', severity: 'error' });
  }

  if (topo.aps.length === 0) {
    errors.push({ id: 'no-aps', message: 'No access points (APs) defined', severity: 'error' });
  }

  if (!topo.infra.bs) {
    errors.push({ id: 'no-bs', message: 'Base Station not placed', severity: 'error' });
  }

  if (!topo.infra.wlc) {
    errors.push({ id: 'no-wlc', message: 'WLC not placed', severity: 'error' });
  }

  // Check both+exit
  const conflicts = topo.sensors.filter(s => s.isExit && s.isWall);
  if (conflicts.length > 0) {
    errors.push({
      id: 'exit-wall-conflict',
      message: `${conflicts.length} sensor(s) marked as both exit and wall`,
      severity: 'error',
    });
  }

  // Duplicate IDs
  const idCounts = new Map<number, number>();
  for (const s of topo.sensors) {
    idCounts.set(s.id, (idCounts.get(s.id) || 0) + 1);
  }
  const dupes = [...idCounts.entries()].filter(([, c]) => c > 1);
  if (dupes.length > 0) {
    errors.push({
      id: 'duplicate-ids',
      message: `Duplicate sensor IDs: ${dupes.map(([id]) => id).join(', ')}`,
      severity: 'error',
    });
  }

  const apIds = new Set(topo.aps.map(a => a.id));

  const checkEndpoint = (id: string) => {
    if (id.startsWith('s-')) return sensorIds.has(parseInt(id.slice(2), 10));
    if (id.startsWith('a-')) return apIds.has(parseInt(id.slice(2), 10));
    if (id === 'bs') return topo.infra.bs !== null;
    if (id === 'wlc') return topo.infra.wlc !== null;
    return false;
  };

  // Edge references
  for (const e of topo.edges) {
    if (!checkEndpoint(e.from) || !checkEndpoint(e.to)) {
      errors.push({
        id: `bad-edge-${e.from}-${e.to}`,
        message: `Edge ${e.from}↔${e.to} references non-existent node`,
        severity: 'error',
      });
    }
  }

  // Warnings
  if (topo.sensors.length > 500) {
    errors.push({ id: 'large-topology', message: 'Large topology (>500 nodes) may be slow', severity: 'warning' });
  }

  if (topo.aps.length > 16) {
    errors.push({ id: 'many-aps', message: 'Many APs (>16) may exceed NS-3 channel limit', severity: 'warning' });
  }

  return errors;
}

export function isValid(topo: Topology): boolean {
  return validateTopology(topo).filter(e => e.severity === 'error').length === 0;
}
