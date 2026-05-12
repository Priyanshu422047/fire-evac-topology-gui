import React from 'react';
import { X } from 'lucide-react';
import { useTopologyStore } from '../../store/topologyStore';

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { layers, setLayers, gridSpacing, setGridSpacing, snapToGrid, setSnapToGrid } = useTopologyStore();

  return (
    <div className="glass-panel animate-fadeIn"
      style={{
        position: 'fixed', top: 60, right: 268, zIndex: 200,
        width: 280, padding: 16,
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>⚙️ Settings</div>
        <button type="button" className="tool-btn" style={{ width: 24, height: 24 }} onClick={onClose}><X size={14} /></button>
      </div>

      <div className="section-label">Canvas</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <ToggleRow label="Snap to Grid" checked={snapToGrid} onChange={setSnapToGrid} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Grid Spacing (m)</span>
          <input className="input-field" type="number" min={0.5} max={20} step={0.5}
            defaultValue={gridSpacing} key={gridSpacing}
            style={{ width: 72 }}
            onBlur={e => setGridSpacing(parseFloat(e.target.value) || 5)}
            onKeyDown={e => { if (e.key === 'Enter') setGridSpacing(parseFloat((e.target as HTMLInputElement).value) || 5); }}
          />
        </div>
      </div>

      <div className="section-label">Layer Visibility</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ToggleRow label="🔵 Sensors" checked={layers.sensors} onChange={v => setLayers({ sensors: v })} />
        <ToggleRow label="📡 Access Points" checked={layers.aps} onChange={v => setLayers({ aps: v })} />
        <ToggleRow label="🏠 BS / WLC" checked={layers.infra} onChange={v => setLayers({ infra: v })} />
        <ToggleRow label="🔗 Edges" checked={layers.edges} onChange={v => setLayers({ edges: v })} />
        <ToggleRow label="📐 Grid" checked={layers.grid} onChange={v => setLayers({ grid: v })} />
        <ToggleRow label="🏷️ Node IDs" checked={layers.nodeIds} onChange={v => setLayers({ nodeIds: v })} />
        <ToggleRow label="📶 AP Coverage Circles" checked={layers.apCoverage} onChange={v => setLayers({ apCoverage: v })} />
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}
