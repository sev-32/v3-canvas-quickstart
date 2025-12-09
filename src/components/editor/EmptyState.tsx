import { Button } from '@/components/ui/button';
import { Wand2, Upload } from 'lucide-react';

interface EmptyStateProps {
  onUpload: () => void;
}

export function EmptyState({ onUpload }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-editor-purple rounded-2xl flex items-center justify-center glow-effect animate-pulse-glow">
          <Wand2 className="w-12 h-12 text-primary-foreground" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          V3 Canvas Editor
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Professional image editing with perfect coordinate alignment,
          progressive segmentation preview, and smooth 60fps rendering.
        </p>
        <Button
          size="lg"
          onClick={onUpload}
          className="bg-gradient-to-r from-primary to-editor-purple hover:from-primary/90 hover:to-editor-purple/90 text-primary-foreground px-8 py-3 shadow-lg shadow-primary/25"
        >
          <Upload className="w-5 h-5 mr-2" />
          Open Image
        </Button>

        {/* Features list */}
        <div className="mt-12 grid grid-cols-2 gap-4 text-left">
          <div className="p-4 glass-morphism rounded-lg">
            <h3 className="font-medium text-foreground mb-1">Perfect Alignment</h3>
            <p className="text-xs text-muted-foreground">
              0px error at all zoom levels (0.1x to 10x)
            </p>
          </div>
          <div className="p-4 glass-morphism rounded-lg">
            <h3 className="font-medium text-foreground mb-1">Progressive Preview</h3>
            <p className="text-xs text-muted-foreground">
              Zero-latency segmentation with ring-based BFS
            </p>
          </div>
          <div className="p-4 glass-morphism rounded-lg">
            <h3 className="font-medium text-foreground mb-1">Dual Canvas</h3>
            <p className="text-xs text-muted-foreground">
              Separate main and preview rendering at 60fps
            </p>
          </div>
          <div className="p-4 glass-morphism rounded-lg">
            <h3 className="font-medium text-foreground mb-1">Non-Destructive</h3>
            <p className="text-xs text-muted-foreground">
              Full layer support with blend modes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
