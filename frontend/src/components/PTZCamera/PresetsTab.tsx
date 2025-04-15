import React from 'react';
import { Card } from '@/components/ui/card';
import { Camera as CameraIcon } from 'lucide-react';
import PresetCard from './PresetCard';
import { Preset } from '@/types/ptz-camera';

interface PresetsTabProps {
  presets: Preset[];
  selectedPreset: number | null;
  isMoving: boolean;
  onLoadPreset: (preset: Preset) => void;
  onEditPreset: (preset: Preset) => void;
  onDeletePreset: (presetId: number) => void;
  onTogglePatrol: (presetId: number) => void;
  onStartSinglePresetPatrol: (presetId: number) => void;
  onStartMultiplePresetPatrol: (presetIds: number[]) => void;
  isPatrolling: boolean;
}

const PresetsTab: React.FC<PresetsTabProps> = ({
  presets,
  selectedPreset,
  isMoving,
  onLoadPreset,
  onEditPreset,
  onDeletePreset,
  onTogglePatrol,
  onStartSinglePresetPatrol,
  onStartMultiplePresetPatrol,
  isPatrolling
}) => {
  const handleStartMultiplePresetPatrol = () => {
    const selectedPresets = presets.filter(p => p.selectedForPatrol);
    if (selectedPresets.length > 0) {
      onStartMultiplePresetPatrol(selectedPresets.map(p => p.id));
    }
  };

  return (
    <Card className="p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Preset Positions</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {presets.length} presets saved
          </span>
          {presets.filter(p => p.selectedForPatrol).length > 0 && (
            <button
              onClick={handleStartMultiplePresetPatrol}
              disabled={isPatrolling}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Patrol Selected ({presets.filter(p => p.selectedForPatrol).length})
            </button>
          )}
        </div>
      </div>
      
      {presets.length === 0 ? (
        <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
          <div className="rounded-full p-4 bg-white dark:bg-gray-800 shadow-md mb-4 inline-block">
            <CameraIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-base font-medium">No Presets Saved</p>
          <p className="text-sm text-muted-foreground mt-2">
            Use the camera controls to position the camera, then save as a preset
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPreset === preset.id}
              isMoving={isMoving}
              onLoad={() => onLoadPreset(preset)}
              onEdit={() => onEditPreset(preset)}
              onDelete={() => onDeletePreset(preset.id)}
              onTogglePatrol={() => onTogglePatrol(preset.id)}
              onStartSinglePresetPatrol={() => onStartSinglePresetPatrol(preset.id)}
              isPatrolling={isPatrolling}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default PresetsTab; 