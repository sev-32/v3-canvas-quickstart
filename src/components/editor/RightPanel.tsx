import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Layers, History, Sparkles } from 'lucide-react';
import { LayersPanel } from './LayersPanel';
import { HistoryPanel } from './HistoryPanel';
import { PropertiesPanel } from './PropertiesPanel';
import type { Layer, HistoryEntry, BlendingMode } from '@/lib/canvas/types';

type PanelType = 'properties' | 'layers' | 'history' | 'ai';

interface RightPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  history: HistoryEntry[];
  historyIndex: number;
  tolerance: number;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onAddLayer: () => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onUpdateBlendMode: (id: string, mode: BlendingMode) => void;
  onHistoryNavigate: (index: number) => void;
  onToleranceChange: (value: number) => void;
}

export function RightPanel({
  layers,
  selectedLayerId,
  history,
  historyIndex,
  tolerance,
  onSelectLayer,
  onToggleVisibility,
  onDeleteLayer,
  onAddLayer,
  onUpdateOpacity,
  onUpdateBlendMode,
  onHistoryNavigate,
  onToleranceChange,
}: RightPanelProps) {
  const [activePanel, setActivePanel] = useState<PanelType>('layers');

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  const tabs = [
    { id: 'properties' as const, icon: Settings, label: 'Properties' },
    { id: 'layers' as const, icon: Layers, label: 'Layers' },
    { id: 'history' as const, icon: History, label: 'History' },
    { id: 'ai' as const, icon: Sparkles, label: 'AI Tools' },
  ];

  return (
    <div className="w-80 glass-morphism border-l border-border flex flex-col flex-shrink-0">
      {/* Tab Bar */}
      <div className="flex border-b border-border flex-shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePanel === tab.id;

          return (
            <Button
              key={tab.id}
              variant="ghost"
              title={tab.label}
              onClick={() => setActivePanel(tab.id)}
              className={`panel-tab py-3 ${
                isActive ? 'panel-tab-active' : 'text-muted-foreground'
              } ${tab.id === 'ai' && isActive ? 'text-editor-purple' : ''}`}
            >
              <Icon size={16} />
            </Button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {activePanel === 'properties' && (
          <div className="h-full animate-fade-in">
            <PropertiesPanel
              selectedLayer={selectedLayer}
              tolerance={tolerance}
              onToleranceChange={onToleranceChange}
            />
          </div>
        )}

        {activePanel === 'layers' && (
          <div className="h-full animate-fade-in">
            <LayersPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={onSelectLayer}
              onToggleVisibility={onToggleVisibility}
              onDeleteLayer={onDeleteLayer}
              onAddLayer={onAddLayer}
              onUpdateOpacity={onUpdateOpacity}
              onUpdateBlendMode={onUpdateBlendMode}
            />
          </div>
        )}

        {activePanel === 'history' && (
          <div className="h-full animate-fade-in">
            <HistoryPanel
              history={history}
              currentIndex={historyIndex}
              onNavigate={onHistoryNavigate}
            />
          </div>
        )}

        {activePanel === 'ai' && (
          <div className="h-full animate-fade-in p-4 text-center text-muted-foreground flex items-center justify-center">
            <div className="space-y-4">
              <Sparkles className="w-12 h-12 mx-auto text-editor-purple opacity-50" />
              <p>AI Tools coming soon</p>
              <p className="text-xs">
                Generative fill, object removal, enhancement, and more
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
