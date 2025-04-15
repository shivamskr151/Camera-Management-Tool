import React from 'react';
import { Slider } from '@/components/ui/slider';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (value: number) => void;
}

const ZoomControl: React.FC<ZoomControlProps> = ({
  zoom,
  onZoomChange
}) => {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">Zoom Level</span>
        <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
      </div>
      <Slider
        min={1}
        max={5}
        step={0.1}
        value={[zoom]}
        onValueChange={values => onZoomChange(values[0])}
        className="py-2"
      />
    </div>
  );
};

export default ZoomControl; 