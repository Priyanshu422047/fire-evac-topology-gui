import React, { useState } from 'react';
import { useTopologyStore } from '../../store/topologyStore';
import { validateTopology } from '../../utils/validate';
import { Trash2, Link, Info, DoorOpen, Blocks, Wifi, Server } from 'lucide-react';

export function NodeInspector() {
  const topology = useTopologyStore(s => s.topology);
  const selected = useTopologyStore(s => s.selected);
  const updateSensor = useTopologyStore(s => s.updateSensor);
  const deleteSensor = useTopologyStore(s => s.deleteSensor);
  const updateAP = useTopologyStore(s => s.updateAP);
  const deleteAP = useTopologyStore(s => s.deleteAP);
  const updateBS = useTopologyStore(s => s.updateBS);
  const updateWLC = useTopologyStore(s => s.updateWLC);
  const deleteEdge = useTopologyStore(s => s.deleteEdge);
  const [localVals, setLocalVals] = useState<Record<string, string>>({});

  const errors = validateTopology(topology);

  if (!selected) {
    // Summary panel
    const exits = topology.sensors.filter(s => s.isExit).length;
    const walls = topology.sensors.filter(s => s.isWall).length;
    const normal = topology.sensors.length - exits - walls;
    return (
      <div className="p-4 scroll-panel" style={{ height: '100%', overflowY: 'auto' }}>
        <div className="section-label">Topology Summary</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <StatRow icon="🔵" label="Sensors (total)" value={topology.sensors.length} />
          <StatRow icon="🟢" label="Exits" value={exits} />
          <StatRow icon="⬜" label="Walls" value={walls} />
          <StatRow icon="🔷" label="Normal" value={normal} />
          <StatRow icon="📡" label="Access Points" value={topology.aps.length} />
          <StatRow icon="🔗" label="Edges" value={topology.edges.length} />
          <StatRow icon="🏠" label="Base Station" value={topology.infra.bs ? `(${topology.infra.bs.x.toFixed(2)}, ${topology.infra.bs.y.toFixed(2)})` : 'Not placed'} />
          <StatRow icon="🌐" label="WLC" value={topology.infra.wlc ? `(${topology.infra.wlc.x.toFixed(2)}, ${topology.infra.wlc.y.toFixed(2)})` : 'Not placed'} />
        </div>

        {errors.length > 0 && (
          <>
            <div className="divider" />
            <div className="section-label">Validation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {errors.map(e => (
                <div key={e.id} className={`badge ${e.severity === 'error' ? 'badge-red' : 'badge-amber'}`}
                  style={{ borderRadius: 6, padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                  <span>{e.severity === 'error' ? '❌' : '⚠️'}</span>
                  <span>{e.message}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="divider" />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <div>Select a node to edit its properties.</div>
          <div>Drag nodes on the canvas to reposition them.</div>
        </div>
      </div>
    );
  }

  // SENSOR inspector
  if (selected.type === 'sensor') {
    const s = topology.sensors.find(s => s.id === selected.id);
    if (!s) return null;

    const update = (field: string, val: string | boolean) => {
      if (typeof val === 'boolean') {
        if (field === 'isExit' && val) updateSensor(s.id, { isExit: true, isWall: false });
        else if (field === 'isWall' && val) updateSensor(s.id, { isWall: true, isExit: false });
        else updateSensor(s.id, { [field]: val });
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) updateSensor(s.id, { [field]: num });
      }
    };

    return (
      <div className="p-4 scroll-panel" style={{ height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🔵</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Sensor {s.id}</div>
            <div className={`badge ${s.isExit ? 'badge-green' : s.isWall ? 'badge-blue' : 'badge-blue'}`} style={{ marginTop: 2 }}>
              {s.isExit ? '🚪 EXIT' : s.isWall ? '🧱 WALL' : '• NORMAL'}
            </div>
          </div>
        </div>

        <div className="section-label">Position</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <CoordInput label="X" value={s.x} onChange={v => update('x', v)} />
          <CoordInput label="Y" value={s.y} onChange={v => update('y', v)} />
        </div>

        <div className="section-label">Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <ToggleRow label="🚪 Exit Sensor" checked={s.isExit} onChange={v => update('isExit', v)} />
          <ToggleRow label="🧱 Wall / Obstacle" checked={s.isWall} onChange={v => update('isWall', v)} />
        </div>

        <div className="divider" />
        <button type="button" className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => deleteSensor(s.id)}>
          <Trash2 size={14} /> Delete Sensor
        </button>
      </div>
    );
  }

  // AP inspector
  if (selected.type === 'ap') {
    const ap = topology.aps.find(a => a.id === selected.id);
    if (!ap) return null;

    // Show nearest sensors
    const nearest = [...topology.sensors]
      .map(s => ({ ...s, dist: Math.hypot(s.x - ap.x, s.y - ap.y) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);

    return (
      <div className="p-4 scroll-panel" style={{ height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>📡</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Access Point {ap.id}</div>
            <div className="badge badge-amber" style={{ marginTop: 2 }}>AP</div>
          </div>
        </div>

        <div className="section-label">Position</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <CoordInput label="X" value={ap.x} onChange={v => {
            const num = parseFloat(v); if (!isNaN(num)) useTopologyStore.getState().updateAP(ap.id, { x: num });
          }} />
          <CoordInput label="Y" value={ap.y} onChange={v => {
            const num = parseFloat(v); if (!isNaN(num)) useTopologyStore.getState().updateAP(ap.id, { y: num });
          }} />
        </div>

        <div className="section-label">Nearest Sensors</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {nearest.map(s => (
            <div key={s.id} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Sensor {s.id}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{s.dist.toFixed(1)}m</span>
            </div>
          ))}
        </div>

        <div className="divider" />
        <button type="button" className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => deleteAP(ap.id)}>
          <Trash2 size={14} /> Delete AP
        </button>
      </div>
    );
  }

  // BS inspector
  if (selected.type === 'bs') {
    const { bs } = topology.infra;
    if (!bs) return null;
    return (
      <div className="p-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Base Station</div>
            <div className="badge badge-red" style={{ marginTop: 2 }}>BS</div>
          </div>
        </div>
        <div className="section-label">Position</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <CoordInput label="X" value={bs.x} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateBS(n, bs.y); }} />
          <CoordInput label="Y" value={bs.y} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateBS(bs.x, n); }} />
        </div>
        <div className="divider" />
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>The Base Station processes sensor data and runs the Dijkstra evacuation algorithm.</p>
      </div>
    );
  }

  // WLC inspector
  if (selected.type === 'wlc') {
    const { wlc } = topology.infra;
    if (!wlc) return null;
    return (
      <div className="p-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🌐</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Wireless LAN Controller</div>
            <div className="badge" style={{ marginTop: 2, background: 'rgba(139,92,246,0.2)', color: '#8B5CF6' }}>WLC</div>
          </div>
        </div>
        <div className="section-label">Position</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <CoordInput label="X" value={wlc.x} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateWLC(n, wlc.y); }} />
          <CoordInput label="Y" value={wlc.y} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) updateWLC(wlc.x, n); }} />
        </div>
        <div className="divider" />
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>The WLC bridges wireless traffic between APs and the Base Station.</p>
      </div>
    );
  }

  // Edge inspector
  if (selected.type === 'edge') {
    return (
      <div className="p-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Link size={18} style={{ color: 'var(--text-secondary)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Edge</div>
            <div className="badge badge-blue" style={{ marginTop: 2 }}>Connection</div>
          </div>
        </div>
        <div style={{ fontSize: 13, marginBottom: 12, fontFamily: 'JetBrains Mono, monospace',
          background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 6,
          wordBreak: 'break-all' }}>
          {selected.from} ↔ {selected.to}
        </div>
        <button type="button" className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => deleteEdge(selected.from, selected.to)}>
          <Trash2 size={14} /> Delete Edge
        </button>
      </div>
    );
  }

  return null;
}

function StatRow({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
      <span style={{ color: 'var(--text-secondary)', display: 'flex', gap: 6 }}>
        <span>{icon}</span>{label}
      </span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function CoordInput({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <input className="input-field"
        type="number" step="0.5"
        defaultValue={value}
        key={value}
        onBlur={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onChange((e.target as HTMLInputElement).value); }}
      />
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
