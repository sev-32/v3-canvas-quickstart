import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Layer, BlendingMode } from '@/lib/canvas/types';

const blendingModes: BlendingMode[] = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
];

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onAddLayer: () => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onUpdateBlendMode: (id: string, mode: BlendingMode) => void;
}

export function LayersPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onDeleteLayer,
  onAddLayer,
  onUpdateOpacity,
  onUpdateBlendMode,
}: LayersPanelProps) {
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  // Display layers in reverse order (top layer at top of list)
  const displayLayers = [...layers].reverse();

  return (
    <div className="flex flex-col h-full">
      {/* Selected layer controls */}
      {selectedLayer && (
        <div className="p-3 space-y-3 border-b border-border">
          <div className="flex justify-between items-center gap-2">
            <Select
              value={selectedLayer.blendingMode}
              onValueChange={(value) =>
                onUpdateBlendMode(selectedLayer.id, value as BlendingMode)
              }
            >
              <SelectTrigger className="w-[120px] h-8 text-xs bg-accent border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {blendingModes.map((mode) => (
                  <SelectItem key={mode} value={mode} className="capitalize text-xs">
                    {mode.replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Opacity</label>
              <Slider
                value={[selectedLayer.opacity * 100]}
                onValueChange={([val]) =>
                  onUpdateOpacity(selectedLayer.id, val / 100)
                }
                max={100}
                step={1}
                className="w-20"
              />
              <span className="text-xs w-8 text-muted-foreground">
                {Math.round(selectedLayer.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Layer list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {displayLayers.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No layers yet
            </div>
          ) : (
            displayLayers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                  selectedLayerId === layer.id
                    ? 'bg-primary/20 border border-primary/30'
                    : 'hover:bg-accent'
                }`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                >
                  {layer.visible ? (
                    <Eye className="w-4 h-4 text-foreground" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>

                {/* Thumbnail */}
                <div className="w-12 h-10 rounded bg-accent flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                  {layer.thumbnail ? (
                    <img
                      src={layer.thumbnail}
                      alt={layer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                {/* Layer name */}
                <span
                  className={`text-sm truncate flex-1 ${
                    layer.visible ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {layer.name}
                </span>

                {/* Layer opacity indicator */}
                {layer.opacity < 1 && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex items-center justify-between p-2 border-t border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddLayer}
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => selectedLayerId && onDeleteLayer(selectedLayerId)}
          disabled={!selectedLayerId || layers.length <= 1}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
