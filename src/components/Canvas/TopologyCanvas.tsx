import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';
import { useTopologyStore } from '../../store/topologyStore';
import { SensorNode } from './SensorNode';
import { APNode } from './APNode';
import { InfraNode } from './InfraNode';
import { EdgeLine } from './EdgeLine';
import { Minimap } from './Minimap';
import { Tooltip } from './Tooltip';
export function TopologyCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewLineRef = useRef<Konva.Line>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  const {
    topology, tool, view, layers, gridSpacing, snapToGrid,
    setView, setSelected, selected,
    addSensor, addAP, updateSensor, updateAP, updateBS, updateWLC,
    setTool,
  } = useTopologyStore();

  // Resize observer
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.round(entry.contentRect.width);
        const height = Math.round(entry.contentRect.height);
        setSize(prev => {
          if (prev.w === width && prev.h === height) return prev;
          return { w: width, h: height };
        });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const snapV = useCallback((v: number) => (
    snapToGrid ? Math.round(v / gridSpacing) * gridSpacing : v
  ), [snapToGrid, gridSpacing]);

  // Convert stage pixel coords to topology coords
  const toTopoCoords = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    const stageX = stage.x();
    const stageY = stage.y();
    const x = (pos.x - stageX) / view.scale;
    const y = (pos.y - stageY) / view.scale;
    return { x: snapV(x), y: snapV(y) };
  }, [view.scale, snapV]);

  const getNodeCoords = useCallback((id: string) => {
    if (id.startsWith('s-')) {
      const sid = parseInt(id.slice(2), 10);
      const s = topology.sensors.find(x => x.id === sid);
      return s ? { x: s.x, y: s.y } : null;
    } else if (id.startsWith('a-')) {
      const aid = parseInt(id.slice(2), 10);
      const a = topology.aps.find(x => x.id === aid);
      return a ? { x: a.x, y: a.y } : null;
    } else if (id === 'bs') {
      return topology.infra.bs;
    } else if (id === 'wlc') {
      return topology.infra.wlc;
    }
    return null;
  }, [topology]);

  const handleNodeClick = useCallback((id: string) => {
    const state = useTopologyStore.getState();
    if (!state.edgeDrawStart) {
      state.setEdgeDrawStart(id);
    } else {
      if (state.edgeDrawStart !== id) {
        state.addEdge(state.edgeDrawStart, id);
      }
      state.setEdgeDrawStart(null);
      if (previewLineRef.current) previewLineRef.current.points([]);
    }
  }, []);

  // Handle canvas click (add nodes)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== stageRef.current && e.target.getParent()?.getParent() !== stageRef.current?.findOne('Layer')) {
      // Clicked on a node — don't add
    }

    const { x, y } = toTopoCoords();

    if (tool === 'addSensor') {
      addSensor(x, y, false, false);
    } else if (tool === 'addExitSensor') {
      addSensor(x, y, true, false);
    } else if (tool === 'addWallSensor') {
      addSensor(x, y, false, true);
    } else if (tool === 'addAP') {
      addAP(x, y);
    } else if (tool === 'moveBS') {
      updateBS(x, y);
      setTool('select');
    } else if (tool === 'moveWLC') {
      updateWLC(x, y);
      setTool('select');
    } else if (tool === 'select') {
      // Clicked empty space - deselect
      if (e.target === stageRef.current) {
        setSelected(null);
      }
    } else if (tool === 'addEdge') {
      // Clicked empty space while drawing edge - cancel
      if (e.target === stageRef.current) {
        useTopologyStore.getState().setEdgeDrawStart(null);
        if (previewLineRef.current) previewLineRef.current.points([]);
      }
    }
  }, [tool, toTopoCoords, addSensor, addAP, setSelected, updateBS, updateWLC, setTool]);

  // Pan
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setView({ x: e.target.x(), y: e.target.y() });
  }, [setView]);

  // Zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = view.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const stageX = stage.x();
    const stageY = stage.y();

    // Smooth and predictable zoom for mouse wheel and trackpad pinch.
    const zoomIntensity = 0.0015;
    const direction = (e.evt.deltaY > 0 ? -1 : 1) * (e.evt.ctrlKey ? -1 : 1);
    const zoomFactor = Math.exp(direction * Math.abs(e.evt.deltaY) * zoomIntensity);
    const newScale = Math.min(80, Math.max(1, oldScale * zoomFactor));

    const mousePointTo = {
      x: (pointer.x - stageX) / oldScale,
      y: (pointer.y - stageY) / oldScale,
    };

    setView({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, [view, setView]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === 'addEdge' && useTopologyStore.getState().edgeDrawStart) {
      const pos = toTopoCoords();
      const startNode = getNodeCoords(useTopologyStore.getState().edgeDrawStart!);
      if (startNode && previewLineRef.current) {
        previewLineRef.current.points([startNode.x, startNode.y, pos.x, pos.y]);
      }
    }
  }, [tool, toTopoCoords, getNodeCoords]);

  // Grid lines
  const renderGrid = () => {
    if (!layers.grid) return null;
    const lines = [];
    const { x: ox, y: oy } = view;
    const s = view.scale;
    const spacing = gridSpacing * s;

    const startX = Math.floor(-ox / spacing) * spacing + ox;
    const startY = Math.floor(-oy / spacing) * spacing + oy;

    for (let gx = startX; gx < size.w; gx += spacing) {
      lines.push(
        <Line key={`vg-${gx}`} points={[gx, 0, gx, size.h]}
          stroke="rgba(51,65,85,0.35)" strokeWidth={0.5} listening={false} />
      );
    }
    for (let gy = startY; gy < size.h; gy += spacing) {
      lines.push(
        <Line key={`hg-${gy}`} points={[0, gy, size.w, gy]}
          stroke="rgba(51,65,85,0.35)" strokeWidth={0.5} listening={false} />
      );
    }
    return lines;
  };

  // Cursor style by tool
  const cursorStyle: Record<string, string> = {
    select: 'default',
    addSensor: 'crosshair',
    addExitSensor: 'crosshair',
    addWallSensor: 'crosshair',
    addAP: 'crosshair',
    moveBS: 'crosshair',
    moveWLC: 'crosshair',
    addEdge: 'crosshair',
    delete: 'not-allowed',
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden"
      style={{ background: 'var(--canvas-bg)', cursor: cursorStyle[tool] || 'default' }}>
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        draggable={tool === 'select'}
        x={view.x}
        y={view.y}
        onDragMove={handleDragMove}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
      >
        {/* Grid layer */}
        <Layer listening={false}>
          {renderGrid()}
        </Layer>

        {/* Main content layer */}
        <Layer scaleX={view.scale} scaleY={view.scale} x={0} y={0}>

          {/* Edges */}
          {layers.edges && topology.edges.map(edge => {
            const fromC = getNodeCoords(edge.from);
            const toC = getNodeCoords(edge.to);
            if (!fromC || !toC) return null;
            const isSelected = selected?.type === 'edge' &&
              ((selected.from === edge.from && selected.to === edge.to) ||
               (selected.from === edge.to && selected.to === edge.from));
            return (
              <EdgeLine key={`e-${edge.from}-${edge.to}`}
                from={fromC} to={toC}
                isSelected={isSelected}
                tool={tool}
                onDelete={() => useTopologyStore.getState().deleteEdge(edge.from, edge.to)}
                onSelect={() => setSelected({ type: 'edge', from: edge.from, to: edge.to })}
              />
            );
          })}
          
          {/* Edge Preview Line */}
          {tool === 'addEdge' && (
            <Line ref={previewLineRef} stroke="#3B82F6" strokeWidth={0.07} dash={[0.2, 0.2]} listening={false} />
          )}

          {/* Sensors */}
          {layers.sensors && topology.sensors.map(sensor => (
            <SensorNode key={`s-${sensor.id}`}
              sensor={sensor}
              isSelected={selected?.type === 'sensor' && selected.id === sensor.id}
              showId={layers.nodeIds}
              tool={tool}
              scale={view.scale}
              onSelect={() => {
                if (tool === 'select') {
                  setSelected({ type: 'sensor', id: sensor.id });
                } else if (tool === 'delete') {
                  useTopologyStore.getState().deleteSensor(sensor.id);
                } else if (tool === 'addEdge') {
                  handleNodeClick(`s-${sensor.id}`);
                }
              }}
              onDragEnd={(x, y) => updateSensor(sensor.id, { x: snapV(x), y: snapV(y) })}
              onTooltip={(content, px, py) => setTooltip(content ? { x: px, y: py, content } : null)}
            />
          ))}

          {/* APs */}
          {layers.aps && topology.aps.map(ap => (
            <APNode key={`ap-${ap.id}`}
              ap={ap}
              isSelected={selected?.type === 'ap' && selected.id === ap.id}
              showId={layers.nodeIds}
              showCoverage={layers.apCoverage}
              sensors={topology.sensors}
              tool={tool}
              scale={view.scale}
              onSelect={() => {
                if (tool === 'select') setSelected({ type: 'ap', id: ap.id });
                else if (tool === 'delete') useTopologyStore.getState().deleteAP(ap.id);
                else if (tool === 'addEdge') handleNodeClick(`a-${ap.id}`);
              }}
              onDragEnd={(x, y) => updateAP(ap.id, { x: snapV(x), y: snapV(y) })}
              onTooltip={(content, px, py) => setTooltip(content ? { x: px, y: py, content } : null)}
            />
          ))}

          {/* BS & WLC */}
          {layers.infra && (
            <>
              {topology.infra.bs && (
                <InfraNode key="bs"
                  x={topology.infra.bs.x} y={topology.infra.bs.y}
                  label="BS" color="#EF4444"
                  isSelected={selected?.type === 'bs'}
                  showId={layers.nodeIds}
                  scale={view.scale}
                  onSelect={() => {
                    if (tool === 'select') setSelected({ type: 'bs' });
                    else if (tool === 'addEdge') handleNodeClick('bs');
                  }}
                  onDragEnd={(x, y) => updateBS(snapV(x), snapV(y))}
                  onTooltip={(content, px, py) => setTooltip(content ? { x: px, y: py, content } : null)}
                />
              )}
              {topology.infra.wlc && (
                <InfraNode key="wlc"
                  x={topology.infra.wlc.x} y={topology.infra.wlc.y}
                  label="WLC" color="#8B5CF6"
                  isSelected={selected?.type === 'wlc'}
                  showId={layers.nodeIds}
                  scale={view.scale}
                  onSelect={() => {
                    if (tool === 'select') setSelected({ type: 'wlc' });
                    else if (tool === 'addEdge') handleNodeClick('wlc');
                  }}
                  onDragEnd={(x, y) => updateWLC(snapV(x), snapV(y))}
                  onTooltip={(content, px, py) => setTooltip(content ? { x: px, y: py, content } : null)}
                />
              )}
            </>
          )}
        </Layer>
      </Stage>

      {/* Minimap */}
      <Minimap topology={topology} view={view} canvasSize={size} layers={layers} />

      {/* Tooltip */}
      {tooltip && <Tooltip x={tooltip.x} y={tooltip.y} content={tooltip.content} />}

      {/* Zoom level */}
      <div className="absolute bottom-6 right-6 text-xs px-2 py-1 rounded"
        style={{ background: 'rgba(15,23,42,0.8)', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
        {Math.round(view.scale * 10)}%
      </div>
    </div>
  );
}
