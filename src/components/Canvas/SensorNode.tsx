import React, { useState } from 'react';
import { Circle, Text, Group, Ring } from 'react-konva';
import type { Sensor, ToolMode } from '../../types/topology';

interface Props {
  sensor: Sensor;
  isSelected: boolean;
  showId: boolean;
  tool: ToolMode;
  scale: number;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTooltip: (content: string | null, px: number, py: number) => void;
}

const SENSOR_RADIUS = 0.35;

function getSensorColor(sensor: Sensor, hovered: boolean): string {
  if (sensor.isExit) return hovered ? '#4ADE80' : '#22C55E';
  if (sensor.isWall) return hovered ? '#9CA3AF' : '#6B7280';
  return hovered ? '#60A5FA' : '#3B82F6';
}

export function SensorNode({ sensor, isSelected, showId, tool, scale, onSelect, onDragEnd, onTooltip }: Props) {
  const [hovered, setHovered] = useState(false);
  const isDraggable = tool === 'select';
  const color = getSensorColor(sensor, hovered);
  const radius = SENSOR_RADIUS;

  const label = sensor.isExit ? 'EXIT' : sensor.isWall ? 'WALL' : '';

  return (
    <Group
      x={sensor.x}
      y={sensor.y}
      draggable={isDraggable}
      onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}
      onClick={e => { e.cancelBubble = true; onSelect(); }}
      onMouseEnter={e => {
        setHovered(true);
        const pos = e.target.getStage()?.getPointerPosition();
        const content = `Sensor ${sensor.id}\n(${sensor.x.toFixed(1)}, ${sensor.y.toFixed(1)})${sensor.isExit ? '\n🚪 EXIT' : sensor.isWall ? '\n🧱 WALL' : ''}`;
        onTooltip(content, pos?.x ?? 0, pos?.y ?? 0);
      }}
      onMouseLeave={() => { setHovered(false); onTooltip(null, 0, 0); }}
    >
      {/* Selection ring */}
      {isSelected && (
        <Ring innerRadius={radius + 0.05} outerRadius={radius + 0.2}
          fill="rgba(59,130,246,0.6)" />
      )}

      {/* Main circle */}
      <Circle
        radius={radius}
        fill={color}
        shadowColor={color}
        shadowBlur={hovered || isSelected ? 6 : 0}
        shadowOpacity={0.6}
      />

      {/* Exit indicator — diamond shape via additional ring */}
      {sensor.isExit && (
        <Circle radius={radius * 0.4} fill="white" opacity={0.9} />
      )}

      {/* Node ID label */}
      {showId && (
        <Text
          text={String(sensor.id)}
          fontSize={0.3}
          fill="white"
          opacity={0.85}
          offsetX={0.15 * String(sensor.id).length}
          offsetY={0.15}
          listening={false}
        />
      )}
    </Group>
  );
}
