import React, { useEffect } from 'react';
import { TopBar } from './components/Panels/TopBar';
import { LeftToolbar } from './components/Toolbar/LeftToolbar';
import { TopologyCanvas } from './components/Canvas/TopologyCanvas';
import { NodeInspector } from './components/Inspector/NodeInspector';
import { useTopologyStore } from './store/topologyStore';

export default function App() {
  const undo = useTopologyStore(s => s.undo);
  const redo = useTopologyStore(s => s.redo);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === 'Escape') useTopologyStore.getState().setTool('select');
      if (e.key === 's' && !e.ctrlKey) useTopologyStore.getState().setTool('select');
      if (e.key === 'a') useTopologyStore.getState().setTool('addSensor');
      if (e.key === 'd') useTopologyStore.getState().setTool('delete');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Bar */}
      <TopBar />

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Toolbar */}
        <LeftToolbar />

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <TopologyCanvas />
        </div>

        {/* Right Inspector Panel */}
        <div style={{
          width: 256,
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Inspector
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <NodeInspector />
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div style={{
        position: 'fixed', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-muted)',
        background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)',
        padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(51,65,85,0.4)',
        pointerEvents: 'none', zIndex: 5,
      }}>
        <span><kbd>S</kbd> Select</span>
        <span><kbd>A</kbd> Add Sensor</span>
        <span><kbd>D</kbd> Delete</span>
        <span><kbd>Ctrl+Z</kbd> Undo</span>
        <span><kbd>Scroll</kbd> Zoom</span>
      </div>
    </div>
  );
}
