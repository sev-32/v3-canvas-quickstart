import { useState, useCallback, useRef } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { ToolPanel } from './ToolPanel';
import { RightPanel } from './RightPanel';
import { EditorCanvas } from './EditorCanvas';
import { EmptyState } from './EmptyState';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_TOLERANCE } from '@/lib/canvas/constants';
import type {
  Layer,
  Selection,
  ToolType,
  BlendingMode,
  HistoryEntry,
  EditorState,
} from '@/lib/canvas/types';
import { toast } from '@/hooks/use-toast';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createLayerThumbnail(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 40;
  const ctx = canvas.getContext('2d')!;

  // Scale to fit thumbnail
  const scale = Math.min(48 / imageData.width, 40 / imageData.height);
  const width = imageData.width * scale;
  const height = imageData.height * scale;
  const x = (48 - width) / 2;
  const y = (40 - height) / 2;

  // Draw scaled image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(imageData, 0, 0);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 48, 40);
  ctx.drawImage(tempCanvas, x, y, width, height);

  return canvas.toDataURL();
}

export function ImageEditor() {
  const [hasProject, setHasProject] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('magic-wand');
  const [tolerance, setTolerance] = useState(DEFAULT_TOLERANCE);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add to history
  const addToHistory = useCallback(
    (action: string, newLayers?: Layer[], newSelection?: Selection | null) => {
      const entry: HistoryEntry = {
        layers: newLayers || layers,
        selectedLayerId,
        selection: newSelection !== undefined ? newSelection : selection,
        action,
        timestamp: Date.now(),
      };

      // Truncate future history if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(entry);

      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex, layers, selectedLayerId, selection]
  );

  // Handle file upload
  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);

      try {
        const img = new Image();
        const url = URL.createObjectURL(file);

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        });

        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d')!;

        // Scale image to fit canvas
        const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (CANVAS_WIDTH - width) / 2;
        const y = (CANVAS_HEIGHT - height) / 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(img, x, y, width, height);

        const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        URL.revokeObjectURL(url);

        // Create initial layer
        const newLayer: Layer = {
          id: generateId(),
          name: file.name.replace(/\.[^.]+$/, ''),
          visible: true,
          opacity: 1,
          blendingMode: 'normal',
          imageData,
          thumbnail: createLayerThumbnail(imageData),
          mask: null,
          locked: false,
        };

        setLayers([newLayer]);
        setSelectedLayerId(newLayer.id);
        setHasProject(true);
        setSelection(null);

        // Add to history
        addToHistory('Upload Image', [newLayer], null);

        toast({
          title: 'Image loaded',
          description: `${file.name} opened successfully`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load image',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [addToHistory]
  );

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];
      setLayers(entry.layers);
      setSelectedLayerId(entry.selectedLayerId);
      setSelection(entry.selection);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];
      setLayers(entry.layers);
      setSelectedLayerId(entry.selectedLayerId);
      setSelection(entry.selection);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  const handleHistoryNavigate = useCallback(
    (index: number) => {
      if (index >= 0 && index < history.length) {
        const entry = history[index];
        setLayers(entry.layers);
        setSelectedLayerId(entry.selectedLayerId);
        setSelection(entry.selection);
        setHistoryIndex(index);
      }
    },
    [history]
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(5, prev + 0.1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.1, prev - 0.1));
  }, []);

  // Layer operations
  const handleToggleVisibility = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  const handleDeleteLayer = useCallback(
    (id: string) => {
      if (layers.length <= 1) return;

      const newLayers = layers.filter((l) => l.id !== id);
      setLayers(newLayers);

      if (selectedLayerId === id) {
        setSelectedLayerId(newLayers[0]?.id || null);
      }

      addToHistory('Delete Layer', newLayers);
    },
    [layers, selectedLayerId, addToHistory]
  );

  const handleAddLayer = useCallback(() => {
    const newLayer: Layer = {
      id: generateId(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      blendingMode: 'normal',
      imageData: null,
      thumbnail: null,
      mask: null,
      locked: false,
    };

    const newLayers = [...layers, newLayer];
    setLayers(newLayers);
    setSelectedLayerId(newLayer.id);
    addToHistory('Add Layer', newLayers);
  }, [layers, addToHistory]);

  const handleUpdateOpacity = useCallback(
    (id: string, opacity: number) => {
      setLayers((prev) =>
        prev.map((layer) => (layer.id === id ? { ...layer, opacity } : layer))
      );
    },
    []
  );

  const handleUpdateBlendMode = useCallback(
    (id: string, blendingMode: BlendingMode) => {
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === id ? { ...layer, blendingMode } : layer
        )
      );
    },
    []
  );

  // Selection
  const handleSelectionChange = useCallback(
    (newSelection: Selection | null) => {
      setSelection(newSelection);
      if (newSelection) {
        addToHistory('Magic Wand Selection', undefined, newSelection);
      }
    },
    [addToHistory]
  );

  // Export
  const handleExport = useCallback(() => {
    if (layers.length === 0) return;

    // Create composite
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    for (const layer of layers) {
      if (layer.visible && layer.imageData) {
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendingMode as GlobalCompositeOperation;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = layer.imageData.width;
        tempCanvas.height = layer.imageData.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.putImageData(layer.imageData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }

    // Download
    const link = document.createElement('a');
    link.download = 'export.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast({
      title: 'Exported',
      description: 'Image saved as export.png',
    });
  }, [layers]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <EditorToolbar
        projectName={hasProject ? 'V3 Canvas Editor' : 'New Project'}
        zoomLevel={Math.round(zoom * 100)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        hasProject={hasProject}
        isProcessing={isProcessing}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onExport={handleExport}
        onUpload={handleUpload}
      />

      <div className="flex flex-1 overflow-hidden">
        <ToolPanel
          selectedTool={activeTool}
          isProcessing={isProcessing}
          onToolSelect={setActiveTool}
        />

        {hasProject ? (
          <EditorCanvas
            layers={layers}
            selection={selection}
            activeTool={activeTool}
            tolerance={tolerance}
            zoom={zoom}
            onZoomChange={setZoom}
            onToleranceChange={setTolerance}
            onSelectionChange={handleSelectionChange}
          />
        ) : (
          <EmptyState onUpload={handleUpload} />
        )}

        <RightPanel
          layers={layers}
          selectedLayerId={selectedLayerId}
          history={history}
          historyIndex={historyIndex}
          tolerance={tolerance}
          onSelectLayer={setSelectedLayerId}
          onToggleVisibility={handleToggleVisibility}
          onDeleteLayer={handleDeleteLayer}
          onAddLayer={handleAddLayer}
          onUpdateOpacity={handleUpdateOpacity}
          onUpdateBlendMode={handleUpdateBlendMode}
          onHistoryNavigate={handleHistoryNavigate}
          onToleranceChange={setTolerance}
        />
      </div>
    </div>
  );
}
