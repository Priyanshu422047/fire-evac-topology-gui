import React, { useState } from 'react';
import { Line, Group } from 'react-konva';
import type { Sensor, ToolMode } from '../../types/topology';

interface Props {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isSelected: boolean;
  tool: ToolMode;
  onDelete: () => void;
  onSelect: () => void;
}

export function EdgeLine({ from, to, isSelected, tool, onDelete, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);

  const isInteractable = tool === 'select' || tool === 'delete';
  const color = isSelected
    ? '#3B82F6'
    : hovered
    ? tool === 'delete' ? '#EF4444' : '#60A5FA'
    : 'rgba(100,116,139,0.6)';

  return (
    <Group>
      {/* Wide invisible hit area */}
      <Line
        points={[from.x, from.y, to.x, to.y]}
        stroke="transparent"
        strokeWidth={0.5}
        listening={isInteractable}
        onClick={e => {
          e.cancelBubble = true;
          if (tool === 'delete') onDelete();
          else onSelect();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* Visible line */}
      <Line
        points={[from.x, from.y, to.x, to.y]}
        stroke={color}
        strokeWidth={isSelected || hovered ? 0.12 : 0.07}
        listening={false}
      />
    </Group>
  );
}
