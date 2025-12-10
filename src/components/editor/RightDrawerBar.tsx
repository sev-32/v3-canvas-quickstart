import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Wand2,
  Settings2,
  Layers,
  History,
  Sparkles,
  Sliders,
  Bug,
  Palette,
  Grid3X3,
  Cpu,
} from 'lucide-react';
import type { ToolType } from '@/lib/canvas/types';

export type DrawerType = 
  | 'wand-settings'
  | 'layers'
  | 'history'
  | 'properties'
  | 'ai-tools'
  | 'debug'
  | null;

interface DrawerItem {
  id: DrawerType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  category: 'tool' | 'panel' | 'dev';
  toolRequired?: ToolType;
}

const DRAWER_ITEMS: DrawerItem[] = [
  // Tool-specific drawers
  { id: 'wand-settings', icon: Wand2, label: 'Wand Settings', category: 'tool', toolRequired: 'magic-wand' },
  
  // Main panels
  { id: 'properties', icon: Sliders, label: 'Properties', category: 'panel' },
  { id: 'layers', icon: Layers, label: 'Layers', category: 'panel' },
  { id: 'history', icon: History, label: 'History', category: 'panel' },
  { id: 'ai-tools', icon: Sparkles, label: 'AI Tools', category: 'panel' },
  
  // Development tools
  { id: 'debug', icon: Bug, label: 'Debug Console', category: 'dev' },
];

interface RightDrawerBarProps {
  activeDrawer: DrawerType;
  activeTool: ToolType;
  onDrawerSelect: (drawer: DrawerType) => void;
}

export function RightDrawerBar({
  activeDrawer,
  activeTool,
  onDrawerSelect,
}: RightDrawerBarProps) {
  const toolDrawers = DRAWER_ITEMS.filter(d => d.category === 'tool');
  const panelDrawers = DRAWER_ITEMS.filter(d => d.category === 'panel');
  const devDrawers = DRAWER_ITEMS.filter(d => d.category === 'dev');

  const renderDrawerButton = (item: DrawerItem) => {
    const Icon = item.icon;
    const isActive = activeDrawer === item.id;
    const isToolRequired = item.toolRequired && item.toolRequired !== activeTool;
    
    // Show tool-specific buttons only when relevant
    if (item.toolRequired && item.toolRequired !== activeTool) {
      return null;
    }

    return (
      <Button
        key={item.id}
        variant="ghost"
        size="icon"
        onClick={() => onDrawerSelect(isActive ? null : item.id)}
        disabled={isToolRequired}
        className={`
          w-10 h-10 relative group transition-all duration-200
          ${isActive
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }
          ${item.category === 'dev' ? 'opacity-60 hover:opacity-100' : ''}
        `}
        title={item.label}
      >
        <Icon className="w-4 h-4" />
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-full" />
        )}
        
        {/* Tooltip */}
        <div className="
          absolute right-full mr-2 px-2 py-1 
          bg-popover text-popover-foreground text-xs rounded 
          opacity-0 group-hover:opacity-100 pointer-events-none 
          whitespace-nowrap z-50 shadow-lg border border-border
          transition-opacity duration-150
        ">
          {item.label}
        </div>
      </Button>
    );
  };

  return (
    <div className="w-12 glass-morphism border-l border-border flex flex-col items-center py-2 flex-shrink-0">
      {/* Tool-specific drawers */}
      {toolDrawers.some(d => !d.toolRequired || d.toolRequired === activeTool) && (
        <>
          <div className="space-y-1">
            {toolDrawers.map(renderDrawerButton)}
          </div>
          <Separator className="my-2 w-8 bg-border" />
        </>
      )}

      {/* Main panels */}
      <div className="space-y-1">
        {panelDrawers.map(renderDrawerButton)}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Dev tools at bottom */}
      <Separator className="my-2 w-8 bg-border" />
      <div className="space-y-1">
        {devDrawers.map(renderDrawerButton)}
      </div>
    </div>
  );
}
