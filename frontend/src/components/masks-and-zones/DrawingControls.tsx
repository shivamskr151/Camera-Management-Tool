import React from 'react';
import { Label } from '@/components/ui/label';
import { Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

interface DrawingControlsProps {
  strokeColor: string;
  pointRadius: number;
  strokeWidth: number;
  fillOpacity: number;
  onStrokeColorChange: (color: string) => void;
  onPointRadiusChange: (radius: number) => void;
  onStrokeWidthChange: (width: number) => void;
  onFillOpacityChange: (opacity: number) => void;
}

export const DrawingControls: React.FC<DrawingControlsProps> = ({
  strokeColor,
  pointRadius,
  strokeWidth,
  fillOpacity,
  onStrokeColorChange,
  onPointRadiusChange,
  onStrokeWidthChange,
  onFillOpacityChange
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="absolute top-4 right-4 h-8 w-8"
        >
          <Sliders className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Drawing Controls</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Color Picker */}
          <div>
            <Label className="block text-sm font-medium mb-2">
              Stroke/Fill Color:
            </Label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => onStrokeColorChange(e.target.value)}
              className="w-20 h-8 border border-border rounded cursor-pointer"
              title="Select color for the zone"
            />
          </div>

          {/* Sliders */}
          <div>
            <Label className="block text-sm font-medium mb-2">
              Point Radius:
            </Label>
            <div className="flex items-center">
              <input
                type="range"
                min="1"
                max="10"
                value={pointRadius}
                onChange={(e) => onPointRadiusChange(parseInt(e.target.value))}
                className="w-full mr-2"
                title="Adjust point radius"
              />
              <span className="text-sm text-muted-foreground w-10">{pointRadius}px</span>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">
              Stroke Width:
            </Label>
            <div className="flex items-center">
              <input
                type="range"
                min="1"
                max="5"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
                className="w-full mr-2"
                title="Adjust stroke width"
              />
              <span className="text-sm text-muted-foreground w-10">{strokeWidth}px</span>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">
              Fill Opacity:
            </Label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={fillOpacity * 100}
                onChange={(e) => onFillOpacityChange(parseInt(e.target.value) / 100)}
                className="w-full mr-2"
                title="Adjust fill opacity"
              />
              <span className="text-sm text-muted-foreground w-10">{Math.round(fillOpacity * 100)}%</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 