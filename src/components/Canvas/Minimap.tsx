import React, { useMemo } from 'react';
import type { Topology, LayerVisibility, CanvasView } from '../../types/topology';

interface Props {
  topology: Topology;
  view: CanvasView;
  canvasSize: { w: number; h: number };
  layers: LayerVisibility;
}

const MM_W = 160;
const MM_H = 100;

export function Minimap({ topology, view, canvasSize, layers }: Props) {
  const { sensors, aps, infra } = topology;

  const bounds = useMemo(() => {
    const all = [
      ...sensors.map(s => ({ x: s.x, y: s.y })),
      ...aps.map(a => ({ x: a.x, y: a.y })),
    ];
    if (infra.bs) all.push({ x: infra.bs.x, y: infra.bs.y });
    if (infra.wlc) all.push({ x: infra.wlc.x, y: infra.wlc.y });
    if (all.length === 0) return { minX: 0, minY: 0, maxX: 50, maxY: 50 };
    const minX = Math.min(...all.map(p => p.x)) - 5;
    const minY = Math.min(...all.map(p => p.y)) - 5;
    const maxX = Math.max(...all.map(p => p.x)) + 5;
    const maxY = Math.max(...all.map(p => p.y)) + 5;
    return { minX, minY, maxX, maxY };
  }, [sensors, aps, infra]);

  const toMM = (x: number, y: number) => ({
    px: ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * MM_W,
    py: ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * MM_H,
  });

  const getNodeCoords = (id: string) => {
    if (id.startsWith('s-')) {
      const sid = parseInt(id.slice(2), 10);
      const s = sensors.find(x => x.id === sid);
      return s ? { x: s.x, y: s.y } : null;
    } else if (id.startsWith('a-')) {
      const aid = parseInt(id.slice(2), 10);
      const a = aps.find(x => x.id === aid);
      return a ? { x: a.x, y: a.y } : null;
    } else if (id === 'bs') {
      return infra.bs;
    } else if (id === 'wlc') {
      return infra.wlc;
    }
    return null;
  };

  // Viewport rect in topo coords
  const vpLeft = -view.x / view.scale;
  const vpTop = -view.y / view.scale;
  const vpW = canvasSize.w / view.scale;
  const vpH = canvasSize.h / view.scale;
  const vp = {
    x: ((vpLeft - bounds.minX) / (bounds.maxX - bounds.minX)) * MM_W,
    y: ((vpTop - bounds.minY) / (bounds.maxY - bounds.minY)) * MM_H,
    w: (vpW / (bounds.maxX - bounds.minX)) * MM_W,
    h: (vpH / (bounds.maxY - bounds.minY)) * MM_H,
  };

  return (
    <div className="absolute bottom-6 left-6 rounded-lg overflow-hidden"
      style={{
        width: MM_W, height: MM_H,
        background: 'rgba(11,17,32,0.92)',
        border: '1px solid rgba(51,65,85,0.6)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
      <svg width={MM_W} height={MM_H}>
        {/* Edges */}
        {layers.edges && topology.edges.map(e => {
          const from = getNodeCoords(e.from);
          const to = getNodeCoords(e.to);
          if (!from || !to) return null;
          const f = toMM(from.x, from.y);
          const t = toMM(to.x, to.y);
          return <line key={`mm-e-${e.from}-${e.to}`}
            x1={f.px} y1={f.py} x2={t.px} y2={t.py}
            stroke="rgba(100,116,139,0.4)" strokeWidth={0.5} />;
        })}

        {/* Sensors */}
        {layers.sensors && sensors.map(s => {
          const { px, py } = toMM(s.x, s.y);
          const fill = s.isExit ? '#22C55E' : s.isWall ? '#6B7280' : '#3B82F6';
          return <circle key={`mm-s-${s.id}`} cx={px} cy={py} r={1.5} fill={fill} />;
        })}

        {/* APs */}
        {layers.aps && aps.map(a => {
          const { px, py } = toMM(a.x, a.y);
          return <rect key={`mm-ap-${a.id}`} x={px - 2} y={py - 2} width={4} height={4}
            fill="#F59E0B" transform={`rotate(45, ${px}, ${py})`} />;
        })}

        {/* BS */}
        {layers.infra && infra.bs && (() => {
          const { px, py } = toMM(infra.bs.x, infra.bs.y);
          return <rect x={px - 2.5} y={py - 2.5} width={5} height={5} fill="#EF4444" rx={1} />;
        })()}

        {/* WLC */}
        {layers.infra && infra.wlc && (() => {
          const { px, py } = toMM(infra.wlc.x, infra.wlc.y);
          return <rect x={px - 2.5} y={py - 2.5} width={5} height={5} fill="#8B5CF6" rx={1} />;
        })()}

        {/* Viewport rect */}
        <rect
          x={Math.max(0, vp.x)} y={Math.max(0, vp.y)}
          width={Math.min(MM_W, vp.w)} height={Math.min(MM_H, vp.h)}
          fill="rgba(59,130,246,0.08)"
          stroke="rgba(59,130,246,0.5)"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}
