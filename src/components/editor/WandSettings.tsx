import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Zap,
  Timer,
  Gauge,
  MousePointer2,
  RefreshCw,
  Eye,
  Settings2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type FillSpeed = 'instant' | 'fast' | 'normal' | 'slow' | 'cinematic';

export interface WandSettingsState {
  fillSpeed: FillSpeed;
  timeBudgetMs: number;
  hoverRefreshRate: number; // ms between hover updates
  hoverEnabled: boolean;
  showPreview: boolean;
  previewOpacity: number;
  ringVisualization: boolean;
}

const FILL_SPEED_PRESETS: Record<FillSpeed, { label: string; timeBudget: number; description: string; icon: React.ReactNode }> = {
  instant: { label: 'Instant', timeBudget: 1000, description: 'Complete fill in one frame', icon: <Zap className="w-3 h-3" /> },
  fast: { label: 'Fast', timeBudget: 16, description: '~60fps, quick expansion', icon: <Gauge className="w-3 h-3" /> },
  normal: { label: 'Normal', timeBudget: 8, description: 'Balanced speed/smoothness', icon: <Timer className="w-3 h-3" /> },
  slow: { label: 'Slow', timeBudget: 4, description: 'Smooth wave effect', icon: <RefreshCw className="w-3 h-3" /> },
  cinematic: { label: 'Cinematic', timeBudget: 2, description: 'Beautiful slow reveal', icon: <Eye className="w-3 h-3" /> },
};

interface WandSettingsProps {
  settings: WandSettingsState;
  tolerance: number;
  onSettingsChange: (settings: WandSettingsState) => void;
  onToleranceChange: (tolerance: number) => void;
}

export function WandSettings({
  settings,
  tolerance,
  onSettingsChange,
  onToleranceChange,
}: WandSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateSetting = <K extends keyof WandSettingsState>(
    key: K,
    value: WandSettingsState[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleSpeedChange = (speed: FillSpeed) => {
    updateSetting('fillSpeed', speed);
    updateSetting('timeBudgetMs', FILL_SPEED_PRESETS[speed].timeBudget);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-4 left-24 z-20 glass-morphism rounded-xl overflow-hidden min-w-[280px]"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Wand Settings</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Tolerance Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Tolerance</Label>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {tolerance}
                  </Badge>
                </div>
                <Slider
                  value={[tolerance]}
                  onValueChange={([val]) => onToleranceChange(val)}
                  min={0}
                  max={255}
                  step={1}
                  className="wand-slider"
                />
                <p className="text-[10px] text-muted-foreground">
                  Scroll on canvas to adjust live
                </p>
              </div>

              <Separator className="bg-border" />

              {/* Fill Speed Section */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  Fill Speed
                </Label>
                <div className="grid grid-cols-5 gap-1">
                  {(Object.keys(FILL_SPEED_PRESETS) as FillSpeed[]).map((speed) => {
                    const preset = FILL_SPEED_PRESETS[speed];
                    const isActive = settings.fillSpeed === speed;
                    return (
                      <Button
                        key={speed}
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleSpeedChange(speed)}
                        className={`h-8 px-2 text-[10px] flex flex-col items-center gap-0.5 ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title={preset.description}
                      >
                        {preset.icon}
                        <span className="truncate">{preset.label}</span>
                      </Button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {FILL_SPEED_PRESETS[settings.fillSpeed].description}
                </p>
              </div>

              {/* Advanced Time Budget */}
              {settings.fillSpeed !== 'instant' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Time Budget (ms/frame)
                    </Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {settings.timeBudgetMs}ms
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.timeBudgetMs]}
                    onValueChange={([val]) => updateSetting('timeBudgetMs', val)}
                    min={1}
                    max={32}
                    step={1}
                    className="wand-slider"
                  />
                </div>
              )}

              <Separator className="bg-border" />

              {/* Hover Settings */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <MousePointer2 className="w-3 h-3" />
                  Hover Preview
                </Label>

                <div className="flex items-center justify-between">
                  <span className="text-xs">Enable Preview</span>
                  <Button
                    variant={settings.hoverEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSetting('hoverEnabled', !settings.hoverEnabled)}
                    className="h-6 px-2 text-xs"
                  >
                    {settings.hoverEnabled ? 'On' : 'Off'}
                  </Button>
                </div>

                {settings.hoverEnabled && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Refresh Rate</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {settings.hoverRefreshRate}ms
                        </Badge>
                      </div>
                      <Slider
                        value={[settings.hoverRefreshRate]}
                        onValueChange={([val]) => updateSetting('hoverRefreshRate', val)}
                        min={16}
                        max={500}
                        step={16}
                        className="wand-slider"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Smooth (16ms)</span>
                        <span>Battery Saver (500ms)</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Preview Opacity</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {Math.round(settings.previewOpacity * 100)}%
                        </Badge>
                      </div>
                      <Slider
                        value={[settings.previewOpacity * 100]}
                        onValueChange={([val]) => updateSetting('previewOpacity', val / 100)}
                        min={10}
                        max={100}
                        step={5}
                        className="wand-slider"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs">Ring Visualization</span>
                      <Button
                        variant={settings.ringVisualization ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSetting('ringVisualization', !settings.ringVisualization)}
                        className="h-6 px-2 text-xs"
                      >
                        {settings.ringVisualization ? 'On' : 'Off'}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <Separator className="bg-border" />

              {/* Controls Help */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground">Controls</Label>
                <div className="grid gap-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scroll</span>
                    <span>Adjust tolerance</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Right-click + Scroll</span>
                    <span>Zoom</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Right-click + Drag</span>
                    <span>Pan</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Left-click</span>
                    <span>Confirm selection</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const DEFAULT_WAND_SETTINGS: WandSettingsState = {
  fillSpeed: 'normal',
  timeBudgetMs: 8,
  hoverRefreshRate: 50,
  hoverEnabled: true,
  showPreview: true,
  previewOpacity: 0.6,
  ringVisualization: false,
};
