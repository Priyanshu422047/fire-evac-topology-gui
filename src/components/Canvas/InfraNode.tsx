import React, { useState } from 'react';
import { Rect, Text, Group } from 'react-konva';
import type { ToolMode } from '../../types/topology';

interface Props {
  x: number;
  y: number;
  label: string;
  color: string;
  isSelected: boolean;
  showId: boolean;
  scale: number;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTooltip: (content: string | null, px: number, py: number) => void;
}

export function InfraNode({ x, y, label, color, isSelected, showId, scale, onSelect, onDragEnd, onTooltip }: Props) {
  const [hovered, setHovered] = useState(false);
  const size = 0.7;

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}
      onClick={e => { e.cancelBubble = true; onSelect(); }}
      onMouseEnter={e => {
        setHovered(true);
        const pos = e.target.getStage()?.getPointerPosition();
        onTooltip(`${label}\n(${x.toFixed(1)}, ${y.toFixed(1)})`, pos?.x ?? 0, pos?.y ?? 0);
      }}
      onMouseLeave={() => { setHovered(false); onTooltip(null, 0, 0); }}
    >
      {/* Selection glow */}
      {isSelected && (
        <Rect
          x={-size / 2 - 0.12} y={-size / 2 - 0.12}
          width={size + 0.24} height={size + 0.24}
          cornerRadius={0.12}
          fill={`${color}33`}
          stroke={color}
          strokeWidth={0.1}
        />
      )}

      {/* Main square */}
      <Rect
        x={-size / 2} y={-size / 2}
        width={size} height={size}
        fill={color}
        cornerRadius={0.1}
        shadowColor={color}
        shadowBlur={hovered || isSelected ? 10 : 0}
        shadowOpacity={0.6}
      />

      {/* Label */}
      <Text
        text={label}
        fontSize={0.26}
        fill="white"
        fontStyle="bold"
        offsetX={label.length * 0.075}
        offsetY={0.13}
        listening={false}
      />
    </Group>
  );
}
