import React from 'react';
import { Button } from '@/components/ui/button';

interface PositionDisplayProps {
  panTilt: { pan: number; tilt: number };
  zoom: number;
  onReset: () => void;
}

const PositionDisplay: React.FC<PositionDisplayProps> = ({
  panTilt,
  zoom,
  onReset
}) => {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Current Position</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onReset}
          className="text-xs"
        >
          Reset Position
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <span className="text-xs text-muted-foreground block mb-1">Pan</span>
          <span className="text-sm font-mono font-medium">{panTilt.pan.toFixed(2)}</span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <span className="text-xs text-muted-foreground block mb-1">Tilt</span>
          <span className="text-sm font-mono font-medium">{panTilt.tilt.toFixed(2)}</span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <span className="text-xs text-muted-foreground block mb-1">Zoom</span>
          <span className="text-sm font-mono font-medium">{zoom.toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
};

export default PositionDisplay; 