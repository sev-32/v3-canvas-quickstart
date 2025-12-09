import { useRef, useEffect, useCallback, useState } from 'react';
import { CoordinateSystem } from '@/lib/canvas/CoordinateSystem';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/canvas/constants';
import {
  drawCheckerboard,
  drawLayer,
  drawSelection,
  drawPreviewMask,
  drawSeedHighlight,
  createComposite,
  setupHighDPICanvas,
} from '@/lib/canvas/canvasRenderer';
import { PreviewWaveEngine } from '@/lib/canvas/PreviewWaveEngine';
import type { Layer, Selection, ToolType, WorldPoint } from '@/lib/canvas/types';
import { WandSettings, DEFAULT_WAND_SETTINGS, type WandSettingsState } from './WandSettings';
import { AnimatePresence } from 'framer-motion';

interface EditorCanvasProps {
  layers: Layer[];
  selection: Selection | null;
  activeTool: ToolType;
  tolerance: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onToleranceChange: (tolerance: number) => void;
  onSelectionChange: (selection: Selection | null) => void;
}

export function EditorCanvas({
  layers,
  selection,
  activeTool,
  tolerance,
  zoom,
  onZoomChange,
  onToleranceChange,
  onSelectionChange,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const coordSystemRef = useRef<CoordinateSystem>(new CoordinateSystem());
  const previewEngineRef = useRef<PreviewWaveEngine>(new PreviewWaveEngine());

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [previewMask, setPreviewMask] = useState<Uint8ClampedArray | null>(null);
  const [hoverPoint, setHoverPoint] = useState<WorldPoint | null>(null);
  const [wandSettings, setWandSettings] = useState<WandSettingsState>(DEFAULT_WAND_SETTINGS);

  const lastHoverUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const marchingAntsOffsetRef = useRef(0);

  // Update coordinate system when viewport or zoom changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    coordSystemRef.current.updateState({
      viewportWidth: rect.width,
      viewportHeight: rect.height,
      zoom,
      panX: panOffset.x,
      panY: panOffset.y,
      devicePixelRatio: window.devicePixelRatio,
    });
  }, [zoom, panOffset]);

  // Update preview engine time budget when settings change
  useEffect(() => {
    // The time budget is passed to startWave, so we just need to trigger new previews
  }, [wandSettings.timeBudgetMs]);

  // Main render loop
  useEffect(() => {
    const mainCanvas = mainCanvasRef.current;
    const container = containerRef.current;
    if (!mainCanvas || !container) return;

    const rect = container.getBoundingClientRect();
    const ctx = setupHighDPICanvas(mainCanvas, rect.width, rect.height);

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Apply coordinate transform
      ctx.save();
      coordSystemRef.current.applyToContext(ctx);

      // Draw checkerboard background
      drawCheckerboard(ctx);

      // Draw layers
      for (const layer of layers) {
        if (layer.visible && layer.imageData) {
          drawLayer(ctx, layer);
        }
      }

      // Draw selection (marching ants)
      if (selection?.mask) {
        drawSelection(ctx, selection.mask);
      }

      ctx.restore();

      // Update marching ants offset
      marchingAntsOffsetRef.current = (marchingAntsOffsetRef.current + 0.5) % 8;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [layers, selection]);

  // Preview render loop
  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    const container = containerRef.current;
    if (!previewCanvas || !container) return;

    const rect = container.getBoundingClientRect();
    const ctx = setupHighDPICanvas(previewCanvas, rect.width, rect.height);

    const render = () => {
      // Clear
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Apply coordinate transform
      ctx.save();
      coordSystemRef.current.applyToContext(ctx);

      // Draw magic wand preview
      if (previewMask && hoverPoint && activeTool === 'magic-wand' && wandSettings.hoverEnabled) {
        ctx.globalAlpha = wandSettings.previewOpacity;
        drawPreviewMask(ctx, previewMask);
        ctx.globalAlpha = 1;
        drawSeedHighlight(ctx, hoverPoint);
      }

      ctx.restore();

      requestAnimationFrame(render);
    };

    const frameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frameId);
  }, [previewMask, hoverPoint, activeTool, wandSettings.hoverEnabled, wandSettings.previewOpacity]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      coordSystemRef.current.updateState({
        viewportWidth: rect.width,
        viewportHeight: rect.height,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Start preview with current settings
  const startPreview = useCallback(
    (worldPoint: WorldPoint) => {
      if (!wandSettings.hoverEnabled || layers.length === 0) return;

      // Check refresh rate throttle
      const now = performance.now();
      if (now - lastHoverUpdateRef.current < wandSettings.hoverRefreshRate) {
        return;
      }
      lastHoverUpdateRef.current = now;

      const composite = createComposite(layers);
      
      // For instant mode, use a very large time budget
      const timeBudget = wandSettings.fillSpeed === 'instant' 
        ? 10000 // 10 seconds - effectively instant
        : wandSettings.timeBudgetMs;

      previewEngineRef.current.startWave(
        composite,
        worldPoint,
        tolerance,
        (result) => {
          setPreviewMask(result.mask);
        },
        (result) => {
          setPreviewMask(result.mask);
        },
        timeBudget
      );
    },
    [layers, tolerance, wandSettings]
  );

  // Handle mouse move for preview
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Handle panning with right-click drag
      if (isPanning || isRightMouseDown) {
        const deltaX = screenX - lastMousePos.x;
        const deltaY = screenY - lastMousePos.y;
        setPanOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        setLastMousePos({ x: screenX, y: screenY });
        return;
      }

      // Convert to world coordinates
      const worldPoint = coordSystemRef.current.screenToWorld(screenX, screenY);

      // Validate bounds
      if (!coordSystemRef.current.isInBounds(worldPoint)) {
        setHoverPoint(null);
        setPreviewMask(null);
        previewEngineRef.current.cancel();
        return;
      }

      setHoverPoint(worldPoint);

      // Start progressive preview for magic wand
      if (activeTool === 'magic-wand') {
        startPreview(worldPoint);
      }
    },
    [isPanning, isRightMouseDown, lastMousePos, activeTool, startPreview]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Right mouse button for panning
      if (e.button === 2) {
        e.preventDefault();
        setIsRightMouseDown(true);
        setIsPanning(true);
        setLastMousePos({ x: screenX, y: screenY });
        return;
      }

      // Middle mouse button for panning
      if (e.button === 1) {
        setIsPanning(true);
        setLastMousePos({ x: screenX, y: screenY });
        return;
      }

      // Left click for tool action
      if (e.button === 0) {
        const worldPoint = coordSystemRef.current.screenToWorld(screenX, screenY);

        if (activeTool === 'magic-wand' && coordSystemRef.current.isInBounds(worldPoint)) {
          // Complete selection from current preview
          if (previewMask) {
            const bounds = {
              x: 0,
              y: 0,
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
            };
            onSelectionChange({ mask: previewMask, bounds });
          }
        }
      }
    },
    [activeTool, previewMask, onSelectionChange]
  );

  // Handle mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      setIsRightMouseDown(false);
    }
    setIsPanning(false);
  }, []);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setIsRightMouseDown(false);
    setHoverPoint(null);
    setPreviewMask(null);
    previewEngineRef.current.cancel();
  }, []);

  // Handle wheel for tolerance (default) or zoom (with right-click)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      
      // Right-click held: zoom
      if (isRightMouseDown || e.buttons === 2) {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.1, Math.min(10, zoom + delta));
        onZoomChange(newZoom);
        return;
      }

      // Default: adjust tolerance for magic wand
      if (activeTool === 'magic-wand') {
        const delta = e.deltaY > 0 ? -5 : 5;
        const newTolerance = Math.max(0, Math.min(255, tolerance + delta));
        onToleranceChange(newTolerance);
        
        // Re-trigger preview with new tolerance
        if (hoverPoint && wandSettings.hoverEnabled) {
          // Force immediate update
          lastHoverUpdateRef.current = 0;
          startPreview(hoverPoint);
        }
        return;
      }

      // Other tools: zoom
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(10, zoom + delta));
      onZoomChange(newZoom);
    },
    [zoom, tolerance, activeTool, isRightMouseDown, onZoomChange, onToleranceChange, hoverPoint, wandSettings.hoverEnabled, startPreview]
  );

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Get cursor based on tool
  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (isRightMouseDown) return 'grab';
    switch (activeTool) {
      case 'move':
        return 'move';
      case 'magic-wand':
        return 'crosshair';
      case 'brush':
      case 'eraser':
        return 'crosshair';
      case 'text':
        return 'text';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-editor-bg"
      style={{ cursor: getCursor() }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    >
      {/* Checkerboard pattern background (CSS) */}
      <div className="absolute inset-0 checkerboard-bg opacity-20" />

      {/* Main canvas */}
      <canvas
        ref={mainCanvasRef}
        className="absolute inset-0"
      />

      {/* Preview canvas overlay */}
      <canvas
        ref={previewCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Wand Settings Panel */}
      <AnimatePresence>
        {activeTool === 'magic-wand' && (
          <WandSettings
            settings={wandSettings}
            tolerance={tolerance}
            onSettingsChange={setWandSettings}
            onToleranceChange={onToleranceChange}
          />
        )}
      </AnimatePresence>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 glass-morphism px-3 py-1.5 rounded-lg">
        <span className="text-sm font-medium text-foreground">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Tolerance indicator (when magic wand active) */}
      {activeTool === 'magic-wand' && (
        <div className="absolute bottom-4 left-20 glass-morphism px-3 py-1.5 rounded-lg">
          <span className="text-sm font-medium text-foreground">
            Tol: {tolerance}
          </span>
        </div>
      )}

      {/* Canvas dimensions indicator */}
      <div className="absolute bottom-4 right-4 glass-morphism px-3 py-1.5 rounded-lg">
        <span className="text-xs text-muted-foreground">
          {CANVAS_WIDTH} × {CANVAS_HEIGHT}
        </span>
      </div>
    </div>
  );
}
