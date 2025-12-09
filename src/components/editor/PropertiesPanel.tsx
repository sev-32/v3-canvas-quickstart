import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Sun, Contrast, Thermometer, Droplets, Wand2 } from 'lucide-react';
import type { Layer } from '@/lib/canvas/types';

interface AdjustmentSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
}

function AdjustmentSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  icon,
}: AdjustmentSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-xs text-muted-foreground w-10 text-right">
          {value > 0 ? '+' : ''}
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}

interface PropertiesPanelProps {
  selectedLayer: Layer | null;
  tolerance?: number;
  onToleranceChange?: (value: number) => void;
}

export function PropertiesPanel({
  selectedLayer,
  tolerance = 32,
  onToleranceChange,
}: PropertiesPanelProps) {
  if (!selectedLayer) {
    return (
      <div className="p-4 text-center text-muted-foreground h-full flex items-center justify-center">
        Select a layer to adjust its properties
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <Accordion type="multiple" defaultValue={['magic-wand', 'light', 'color']}>
          {/* Magic Wand Settings */}
          {onToleranceChange && (
            <AccordionItem value="magic-wand" className="border-border">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-editor-purple" />
                  Magic Wand
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <AdjustmentSlider
                  label="Tolerance"
                  value={tolerance}
                  min={0}
                  max={255}
                  onChange={onToleranceChange}
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Light adjustments */}
          <AccordionItem value="light" className="border-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-editor-warning" />
                Light
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <AdjustmentSlider
                label="Exposure"
                value={0}
                min={-5}
                max={5}
                step={0.1}
                onChange={() => {}}
                icon={<Sun className="w-3 h-3" />}
              />
              <AdjustmentSlider
                label="Contrast"
                value={0}
                min={-100}
                max={100}
                onChange={() => {}}
                icon={<Contrast className="w-3 h-3" />}
              />
              <AdjustmentSlider
                label="Highlights"
                value={0}
                min={-100}
                max={100}
                onChange={() => {}}
              />
              <AdjustmentSlider
                label="Shadows"
                value={0}
                min={-100}
                max={100}
                onChange={() => {}}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Color adjustments */}
          <AccordionItem value="color" className="border-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                Color
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <AdjustmentSlider
                label="Temperature"
                value={0}
                min={-100}
                max={100}
                onChange={() => {}}
                icon={<Thermometer className="w-3 h-3" />}
              />
              <AdjustmentSlider
                label="Tint"
                value={0}
                min={-100}
                max={100}
                onChange={() => {}}
              />
              <AdjustmentSlider
                label="Vibrance"
                value={0}
                min={-100}
                max={100}
                onChange={() => {}}
              />
              <AdjustmentSlider
                label="Saturation"
                value={0}
                min={-100}
                max={100}
                onChange={() => {}}
                icon={<Droplets className="w-3 h-3" />}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ScrollArea>
  );
}
