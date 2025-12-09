import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Move,
  Crop,
  BoxSelect,
  Wand2,
  Brush,
  Eraser,
  PenTool,
  Type,
  Square,
  GraduationCap,
  HeartPulse,
  Droplet,
  Palette,
} from 'lucide-react';
import type { ToolType } from '@/lib/canvas/types';

interface Tool {
  id: ToolType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  category: string;
}

const tools: Tool[] = [
  { id: 'move', icon: Move, label: 'Move', category: 'basic' },
  { id: 'crop', icon: Crop, label: 'Crop', category: 'basic' },
  { id: 'marquee', icon: BoxSelect, label: 'Marquee Select', category: 'selection' },
  { id: 'magic-wand', icon: Wand2, label: 'Magic Wand', category: 'selection' },
  { id: 'healing', icon: HeartPulse, label: 'Healing Brush', category: 'paint' },
  { id: 'brush', icon: Brush, label: 'Brush', category: 'paint' },
  { id: 'clone', icon: Droplet, label: 'Clone Stamp', category: 'paint' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', category: 'paint' },
  { id: 'pen', icon: PenTool, label: 'Pen Tool', category: 'vector' },
  { id: 'text', icon: Type, label: 'Text', category: 'vector' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', category: 'vector' },
  { id: 'gradient', icon: GraduationCap, label: 'Gradient', category: 'effects' },
  { id: 'color-adjust', icon: Palette, label: 'Color Adjust', category: 'effects' },
];

interface ToolPanelProps {
  selectedTool: ToolType;
  isProcessing: boolean;
  onToolSelect: (tool: ToolType) => void;
}

export function ToolPanel({ selectedTool, isProcessing, onToolSelect }: ToolPanelProps) {
  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  const categoryOrder = ['basic', 'selection', 'paint', 'vector', 'effects'];

  return (
    <div className="w-20 glass-morphism border-r border-border flex flex-col flex-shrink-0">
      <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar flex-1">
        {categoryOrder.map((category, categoryIndex) => {
          const categoryTools = groupedTools[category];
          if (!categoryTools) return null;

          return (
            <div key={category} className="space-y-1">
              {categoryIndex !== 0 && <Separator className="bg-border my-2" />}
              {categoryTools.map((tool) => {
                const Icon = tool.icon;
                const isActive = selectedTool === tool.id;

                return (
                  <Button
                    key={tool.id}
                    variant="ghost"
                    size="icon"
                    onClick={() => onToolSelect(tool.id)}
                    disabled={isProcessing}
                    className={`tool-button relative group ${
                      isActive ? 'tool-button-active' : 'tool-button-inactive'
                    }`}
                    title={tool.label}
                  >
                    <Icon className="w-5 h-5" />
                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border shadow-lg transition-opacity">
                      {tool.label}
                    </div>
                  </Button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
