import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PresetCardProps } from '@/types/ptz-camera';
import { convertFromSeconds } from '@/utils/time';

const PresetCard: React.FC<PresetCardProps> = ({ 
  preset, 
  isSelected, 
  isMoving, 
  onEdit, 
  onDelete, 
  onTogglePatrol, 
  onStartSinglePresetPatrol,
  isPatrolling 
}) => {
  const formattedDuration = `${convertFromSeconds(preset.duration, preset.durationUnit)} ${preset.durationUnit}`;

  return (
    <Card className="p-3 relative">
      <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
        isSelected ? 'bg-green-500' : 'bg-transparent'
      }`} />
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{preset.name}</h4>
          <p className="text-xs text-gray-500">
            Duration: {formattedDuration}
          </p>
          {preset.lastUsed && (
            <p className="text-xs text-gray-500">
              Last used: {new Date(preset.lastUsed).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
        <div>Pan: {preset.panTilt.pan.toFixed(2)}</div>
        <div>Tilt: {preset.panTilt.tilt.toFixed(2)}</div>
        <div>Zoom: {preset.zoom.toFixed(1)}x</div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center">
          <Checkbox
            id={`patrol-${preset.id}`}
            checked={preset.selectedForPatrol}
            onCheckedChange={onTogglePatrol}
          />
          <label
            htmlFor={`patrol-${preset.id}`}
            className="ml-2 text-sm"
          >
            Include in patrol
          </label>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onStartSinglePresetPatrol}
          disabled={isPatrolling}
        >
          Patrol this preset
        </Button>
      </div>
    </Card>
  );
};

export default PresetCard; 