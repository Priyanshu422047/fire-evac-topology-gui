import React from 'react';
import {
  MousePointer2, Plus, DoorOpen, Blocks, Wifi, Radio,
  Trash2, Undo2, Redo2, Server
} from 'lucide-react';
import { useTopologyStore } from '../../store/topologyStore';
import type { ToolMode } from '../../types/topology';

const tools: { id: ToolMode; icon: React.ReactNode; label: string; short: string; color?: string }[] = [
  { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select / Move', short: 'Select' },
  { id: 'addSensor', icon: <Plus size={18} />, label: 'Add Sensor', short: 'Sensor' },
  { id: 'addExitSensor', icon: <DoorOpen size={18} />, label: 'Add Exit Sensor', short: 'Exit', color: '#22C55E' },
  { id: 'addWallSensor', icon: <Blocks size={18} />, label: 'Add Wall Sensor', short: 'Wall', color: '#6B7280' },
  { id: 'addAP', icon: <Wifi size={18} />, label: 'Add Access Point', short: 'AP', color: '#F59E0B' },
  { id: 'moveBS', icon: <Server size={18} />, label: 'Place Base Station', short: 'BS', color: '#EF4444' },
  { id: 'moveWLC', icon: <Radio size={18} />, label: 'Place WLC', short: 'WLC', color: '#8B5CF6' },
  { id: 'addEdge', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, label: 'Draw Edge', short: 'Edge', color: '#3B82F6' },
  { id: 'delete', icon: <Trash2 size={18} />, label: 'Delete', short: 'Delete', color: '#EF4444' },
];

export function LeftToolbar() {
  const tool = useTopologyStore(s => s.tool);
  const setTool = useTopologyStore(s => s.setTool);
  const undo = useTopologyStore(s => s.undo);
  const redo = useTopologyStore(s => s.redo);
  const historyLen = useTopologyStore(s => s.history.length);
  const futureLen = useTopologyStore(s => s.future.length);

  return (
    <div className="flex flex-col items-center gap-1 py-3 px-2"
      style={{
        width: 72,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        userSelect: 'none',
      }}>

      {/* Tool buttons */}
      {tools.map(t => (
        <div key={t.id} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className={`tool-btn ${tool === t.id ? 'active' : ''}`}
            title={t.label}
            style={{
              flexDirection: 'column',
              height: 52,
              width: 64,
              ...(tool === t.id && t.color ? {
                background: `${t.color}25`,
                color: t.color,
                boxShadow: `0 0 0 1px ${t.color}60`,
              } : t.color && tool !== t.id ? { color: t.color } : {})
            }}
            onClick={() => setTool(t.id)}
          >
            {t.icon}
            <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: 500 }}>{t.short}</span>
          </button>
        </div>
      ))}

      {/* Divider */}
      <div className="divider" style={{ margin: '8px 4px' }} />

      {/* Undo/Redo */}
      <button
        type="button"
        className="tool-btn"
        title="Undo (Ctrl+Z)"
        disabled={historyLen === 0}
        style={{ opacity: historyLen === 0 ? 0.3 : 1 }}
        onClick={undo}
      >
        <Undo2 size={16} />
      </button>
      <button
        type="button"
        className="tool-btn"
        title="Redo (Ctrl+Y)"
        disabled={futureLen === 0}
        style={{ opacity: futureLen === 0 ? 0.3 : 1 }}
        onClick={redo}
      >
        <Redo2 size={16} />
      </button>

      {/* Legend at bottom */}
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.8, paddingBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', margin: '0 auto 2px' }} />
        <div>Sensor</div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', margin: '4px auto 2px' }} />
        <div>Exit</div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6B7280', margin: '4px auto 2px' }} />
        <div>Wall</div>
        <div style={{ width: 8, height: 8, background: '#F59E0B', margin: '4px auto 2px', transform: 'rotate(45deg)', borderRadius: 1 }} />
        <div>AP</div>
        <div style={{ width: 8, height: 8, background: '#EF4444', margin: '4px auto 2px', borderRadius: 1 }} />
        <div>BS</div>
        <div style={{ width: 8, height: 8, background: '#8B5CF6', margin: '4px auto 2px', borderRadius: 1 }} />
        <div>WLC</div>
      </div>
    </div>
  );
}
