import React, { useRef, useState } from 'react';
import {
  Upload, Download, FileJson, FolderOpen, ChevronDown,
  CheckCircle2, XCircle, AlertTriangle, Grid3x3, LayoutGrid, GitBranch
} from 'lucide-react';
import { useTopologyStore } from '../../store/topologyStore';
import { parseTopology } from '../../parser/parseTopology';
import { downloadTopology, downloadJSON } from '../../parser/exportTopology';
import { validateTopology } from '../../utils/validate';
import { generateGrid, generateLShapedCorridor, generateCrossShape } from '../../utils/layoutGenerators';
import { SettingsPanel } from './SettingsPanel';

export function TopBar() {
  const topology = useTopologyStore(s => s.topology);
  const setTopology = useTopologyStore(s => s.setTopology);
  const applyLayout = useTopologyStore(s => s.applyLayout);
  const fileRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);
  const [showLayout, setShowLayout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gridRows, setGridRows] = useState(10);
  const [gridCols, setGridCols] = useState(10);
  const [gridSpacing, setGridSpacing] = useState(5.0);
  const [showGridConfig, setShowGridConfig] = useState(false);

  const errors = validateTopology(topology);
  const hasErrors = errors.some(e => e.severity === 'error');
  const hasWarnings = errors.some(e => e.severity === 'warning');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const parsed = parseTopology(text);
      setTopology(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        setTopology(json);
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <div style={{
        height: 52,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>🗺️</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              NS-3 Topology Editor
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1 }}>BTP Research Tool</div>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

        {/* File actions */}
        <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={handleFileUpload} />
        <input ref={jsonRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonUpload} />

        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()} title="Upload topology.txt">
          <Upload size={14} /> Upload .txt
        </button>

        <button type="button" className="btn-secondary" onClick={() => jsonRef.current?.click()} title="Import JSON">
          <FolderOpen size={14} /> Import JSON
        </button>

        <button type="button" className="btn-primary" onClick={() => downloadTopology(topology)} title="Download topology.txt">
          <Download size={14} /> Export .txt
        </button>

        <button type="button" className="btn-secondary" onClick={() => downloadJSON(topology)} title="Export JSON">
          <FileJson size={14} /> Export JSON
        </button>

        <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

        {/* Generate Layout */}
        <div style={{ position: 'relative' }}>
          <button type="button" className="btn-secondary"
            onClick={() => { setShowLayout(!showLayout); setShowGridConfig(false); }}>
            <LayoutGrid size={14} /> Generate Layout <ChevronDown size={12} />
          </button>
          {showLayout && (
            <div className="glass-panel animate-fadeIn"
              style={{ position: 'absolute', top: '110%', left: 0, width: 220, zIndex: 100, padding: 8 }}>

              {/* Grid option with config */}
              <div>
                <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
                  onClick={() => setShowGridConfig(!showGridConfig)}>
                  <Grid3x3 size={14} /> Rectangular Grid <ChevronDown size={10} style={{ marginLeft: 'auto' }} />
                </button>
                {showGridConfig && (
                  <div style={{ padding: '8px', background: 'var(--bg-primary)', borderRadius: 6, marginBottom: 4 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Rows</div>
                        <input className="input-field" type="number" min={2} max={50} value={gridRows}
                          onChange={e => setGridRows(parseInt(e.target.value) || 10)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Cols</div>
                        <input className="input-field" type="number" min={2} max={50} value={gridCols}
                          onChange={e => setGridCols(parseInt(e.target.value) || 10)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Spacing</div>
                        <input className="input-field" type="number" min={1} max={20} step={0.5} value={gridSpacing}
                          onChange={e => setGridSpacing(parseFloat(e.target.value) || 5)} />
                      </div>
                    </div>
                    <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                      onClick={() => { applyLayout(generateGrid(gridRows, gridCols, gridSpacing)); setShowLayout(false); setShowGridConfig(false); }}>
                      Generate
                    </button>
                  </div>
                )}
              </div>

              <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
                onClick={() => { applyLayout(generateLShapedCorridor(5.0)); setShowLayout(false); }}>
                <GitBranch size={14} /> L-Shaped Corridor
              </button>

              <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => { applyLayout(generateCrossShape(4, 5.0)); setShowLayout(false); }}>
                <span style={{ fontSize: 14 }}>✚</span> Cross-Shaped Building
              </button>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Validation badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {hasErrors ? (
            <div className="badge badge-red">
              <XCircle size={11} />
              {errors.filter(e => e.severity === 'error').length} Error{errors.filter(e => e.severity === 'error').length > 1 ? 's' : ''}
            </div>
          ) : hasWarnings ? (
            <div className="badge badge-amber">
              <AlertTriangle size={11} />
              {errors.filter(e => e.severity === 'warning').length} Warning{errors.filter(e => e.severity === 'warning').length > 1 ? 's' : ''}
            </div>
          ) : (
            <div className="badge badge-green">
              <CheckCircle2 size={11} /> Valid
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

        {/* Settings */}
        <button type="button" className="tool-btn" title="Settings" onClick={() => setShowSettings(!showSettings)}
          style={showSettings ? { background: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)' } : undefined}>
          ⚙️
        </button>
      </div>

      {/* Settings panel slide-in */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}
