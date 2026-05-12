import React, { useState } from 'react';
import { RegularPolygon, Circle, Text, Group } from 'react-konva';
import type { AP, Sensor, ToolMode } from '../../types/topology';

interface Props {
  ap: AP;
  isSelected: boolean;
  showId: boolean;
  showCoverage: boolean;
  sensors: Sensor[];
  tool: ToolMode;
  scale: number;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTooltip: (content: string | null, px: number, py: number) => void;
}

export function APNode({ ap, isSelected, showId, showCoverage, sensors, tool, scale, onSelect, onDragEnd, onTooltip }: Props) {
  const [hovered, setHovered] = useState(false);
  const isDraggable = tool === 'select';
  const color = hovered ? '#FBBF24' : '#F59E0B';

  // Estimate coverage radius as distance to farthest nearest sensor
  const coverageRadius = (() => {
    if (!showCoverage || sensors.length === 0) return 0;
    const dists = sensors.map(s => Math.hypot(s.x - ap.x, s.y - ap.y));
    return Math.min(...dists) * 1.8;
  })();

  return (
    <Group
      x={ap.x}
      y={ap.y}
      draggable={isDraggable}
      onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}
      onClick={e => { e.cancelBubble = true; onSelect(); }}
      onMouseEnter={e => {
        setHovered(true);
        const pos = e.target.getStage()?.getPointerPosition();
        onTooltip(`AP ${ap.id}\n(${ap.x.toFixed(1)}, ${ap.y.toFixed(1)})`, pos?.x ?? 0, pos?.y ?? 0);
      }}
      onMouseLeave={() => { setHovered(false); onTooltip(null, 0, 0); }}
    >
      {/* Coverage circle */}
      {showCoverage && coverageRadius > 0 && (
        <Circle radius={coverageRadius}
          fill="rgba(245,158,11,0.06)"
          stroke="rgba(245,158,11,0.25)"
          strokeWidth={0.08}
          listening={false}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <RegularPolygon sides={6} radius={0.7}
          fill="rgba(245,158,11,0.2)"
          stroke="rgba(245,158,11,0.8)"
          strokeWidth={0.12}
        />
      )}

      {/* Hexagon body */}
      <RegularPolygon
        sides={6}
        radius={0.5}
        fill={color}
        shadowColor={color}
        shadowBlur={hovered || isSelected ? 8 : 0}
        shadowOpacity={0.5}
      />

      {/* WiFi icon (3 arcs simulated with small circles) */}
      <Circle radius={0.12} fill="rgba(255,255,255,0.9)" />

      {/* Label */}
      {showId && (
        <Text
          text={`AP${ap.id}`}
          fontSize={0.28}
          fill="white"
          fontStyle="bold"
          offsetX={0.22}
          offsetY={0.14}
          listening={false}
        />
      )}
    </Group>
  );
}
