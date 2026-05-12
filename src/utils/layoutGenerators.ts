import type { Topology, Sensor } from '../types/topology';
import { autoGenerateEdges } from './edgeAutoGen';

export function generateGrid(rows: number, cols: number, spacing: number): Topology {
  const sensors: Sensor[] = [];
  let id = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isWall =
        r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
      sensors.push({
        id: id++,
        x: c * spacing,
        y: r * spacing,
        isExit: false,
        isWall,
      });
    }
  }

  // Mark 4 exits (inner corners of the border)
  const exitPositions = [
    1 * cols + 1,
    1 * cols + (cols - 2),
    (rows - 2) * cols + 1,
    (rows - 2) * cols + (cols - 2),
  ];
  exitPositions.forEach(idx => {
    if (sensors[idx]) {
      sensors[idx].isExit = true;
      sensors[idx].isWall = false;
    }
  });

  const edges = autoGenerateEdges(sensors, 'orthogonal');

  // Place 4 APs in quadrants
  const gW = (cols - 1) * spacing;
  const gH = (rows - 1) * spacing;
  const aps = [
    { id: 0, x: parseFloat((gW * 0.25).toFixed(1)), y: parseFloat((gH * 0.25).toFixed(1)) },
    { id: 1, x: parseFloat((gW * 0.75).toFixed(1)), y: parseFloat((gH * 0.25).toFixed(1)) },
    { id: 2, x: parseFloat((gW * 0.25).toFixed(1)), y: parseFloat((gH * 0.75).toFixed(1)) },
    { id: 3, x: parseFloat((gW * 0.75).toFixed(1)), y: parseFloat((gH * 0.75).toFixed(1)) },
  ];

  return {
    sensors,
    edges,
    aps,
    infra: {
      bs: { x: parseFloat((gW / 2).toFixed(1)), y: parseFloat((gH / 2).toFixed(1)) },
      wlc: { x: parseFloat((gW / 2 + spacing).toFixed(1)), y: parseFloat((gH / 2).toFixed(1)) },
    },
  };
}

export function generateLShapedCorridor(spacing: number): Topology {
  const sensors: Sensor[] = [];
  let id = 0;

  // Horizontal arm: 12 wide x 4 tall
  // Vertical arm: 4 wide x 10 tall, attached at right end going down
  const hW = 12, hH = 4;
  const vW = 4, vH = 10;

  for (let r = 0; r < hH; r++) {
    for (let c = 0; c < hW; c++) {
      const isWall = r === 0 || r === hH - 1 || c === 0;
      sensors.push({ id: id++, x: c * spacing, y: r * spacing, isExit: false, isWall });
    }
  }

  // Vertical arm starts at right edge of horizontal arm
  const vStartX = (hW - vW) * spacing;
  for (let r = hH; r < hH + vH - 1; r++) {
    for (let c = 0; c < vW; c++) {
      const isWall = c === 0 || c === vW - 1 || (r === hH + vH - 2);
      const x = vStartX + c * spacing;
      const y = r * spacing;
      // Avoid duplicate with horizontal arm
      if (!sensors.find(s => Math.abs(s.x - x) < 0.1 && Math.abs(s.y - y) < 0.1)) {
        sensors.push({ id: id++, x, y, isExit: false, isWall });
      }
    }
  }

  // Add exits
  const exitCandidates = sensors.filter(s => s.isWall);
  [exitCandidates[1], exitCandidates[exitCandidates.length - 2]].forEach(s => {
    if (s) { s.isExit = true; s.isWall = false; }
  });

  const edges = autoGenerateEdges(sensors, 'orthogonal');
  const xs = sensors.map(s => s.x);
  const ys = sensors.map(s => s.y);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;

  return {
    sensors,
    edges,
    aps: [
      { id: 0, x: parseFloat((cx * 0.4).toFixed(1)), y: parseFloat((spacing * 1.5).toFixed(1)) },
      { id: 1, x: parseFloat((cx * 1.5).toFixed(1)), y: parseFloat((cy * 0.8).toFixed(1)) },
    ],
    infra: {
      bs: { x: parseFloat(cx.toFixed(1)), y: parseFloat(cy.toFixed(1)) },
      wlc: { x: parseFloat((cx + spacing).toFixed(1)), y: parseFloat(cy.toFixed(1)) },
    },
  };
}

export function generateCrossShape(armLength: number, spacing: number): Topology {
  const sensors: Sensor[] = [];
  let id = 0;
  const arm = armLength;
  const center = arm;
  const size = arm * 2 + 1;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inH = r >= center - 1 && r <= center + 1;
      const inV = c >= center - 1 && c <= center + 1;
      if (!(inH || inV)) continue;
      const isEdge =
        (inH && !inV && (c === 0 || c === size - 1 || r === center - 1 || r === center + 1)) ||
        (inV && !inH && (r === 0 || r === size - 1 || c === center - 1 || c === center + 1)) ||
        (inH && inV && (r === center - 1 || r === center + 1 || c === center - 1 || c === center + 1));
      sensors.push({ id: id++, x: c * spacing, y: r * spacing, isExit: false, isWall: isEdge });
    }
  }

  // Mark tips as exits
  const tipCandidates = [
    sensors.find(s => Math.abs(s.x - 0) < 0.1 && Math.abs(s.y - center * spacing) < 0.1),
    sensors.find(s => Math.abs(s.x - (size - 1) * spacing) < 0.1 && Math.abs(s.y - center * spacing) < 0.1),
    sensors.find(s => Math.abs(s.y - 0) < 0.1 && Math.abs(s.x - center * spacing) < 0.1),
    sensors.find(s => Math.abs(s.y - (size - 1) * spacing) < 0.1 && Math.abs(s.x - center * spacing) < 0.1),
  ];
  tipCandidates.forEach(s => { if (s) { s.isExit = true; s.isWall = false; } });

  const edges = autoGenerateEdges(sensors, 'orthogonal');
  const mid = center * spacing;

  return {
    sensors,
    edges,
    aps: [
      { id: 0, x: parseFloat((mid * 0.5).toFixed(1)), y: parseFloat(mid.toFixed(1)) },
      { id: 1, x: parseFloat((mid * 1.5).toFixed(1)), y: parseFloat(mid.toFixed(1)) },
    ],
    infra: {
      bs: { x: parseFloat(mid.toFixed(1)), y: parseFloat(mid.toFixed(1)) },
      wlc: { x: parseFloat((mid + spacing).toFixed(1)), y: parseFloat(mid.toFixed(1)) },
    },
  };
}
