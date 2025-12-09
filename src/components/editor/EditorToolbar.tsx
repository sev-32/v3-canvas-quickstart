import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Save,
  Upload,
} from 'lucide-react';

interface EditorToolbarProps {
  projectName: string;
  zoomLevel: number;
  canUndo: boolean;
  canRedo: boolean;
  hasProject: boolean;
  isProcessing: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExport: () => void;
  onUpload: () => void;
}

export function EditorToolbar({
  projectName,
  zoomLevel,
  canUndo,
  canRedo,
  hasProject,
  isProcessing,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onExport,
  onUpload,
}: EditorToolbarProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 glass-morphism border-b border-border z-30 flex-shrink-0">
      <h1 className="text-lg font-bold text-foreground">{projectName}</h1>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo || isProcessing}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo || isProcessing}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 bg-accent/50 rounded-lg p-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomOut}
            disabled={zoomLevel <= 10 || isProcessing}
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm w-14 text-center text-foreground font-medium">
            {zoomLevel}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomIn}
            disabled={zoomLevel >= 500 || isProcessing}
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUpload}
          disabled={isProcessing}
          className="text-muted-foreground hover:text-foreground"
        >
          <Upload className="w-4 h-4 mr-2" />
          Open
        </Button>
        <Button
          onClick={onExport}
          disabled={!hasProject || isProcessing}
          className="bg-editor-success hover:bg-editor-success/90 text-foreground"
        >
          <Save className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
    </header>
  );
}
