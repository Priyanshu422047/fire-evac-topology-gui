import React from 'react';

interface Props {
  x: number;
  y: number;
  content: string;
}

export function Tooltip({ x, y, content }: Props) {
  const lines = content.split('\n');
  return (
    <div
      className="node-tooltip animate-fadeIn"
      style={{ left: x + 14, top: y - 10 }}
    >
      {lines.map((line, i) => (
        <div key={i} style={{ lineHeight: '1.6', whiteSpace: 'nowrap' }}>
          {line}
        </div>
      ))}
    </div>
  );
}
