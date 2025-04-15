import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Preset } from '@/types/ptz-camera';
import { convertToSeconds } from '@/utils/time';

interface PresetDialogProps {
  editingPreset: Preset;
  newPresetName: string;
  duration: number;
  durationUnit: 'seconds' | 'minutes' | 'hours';
  onClose: () => void;
  onSave: (preset: Preset) => void;
  onNameChange: (name: string) => void;
  onDurationChange: (duration: number) => void;
  onDurationUnitChange: (unit: 'seconds' | 'minutes' | 'hours') => void;
}

const PresetDialog: React.FC<PresetDialogProps> = ({
  editingPreset,
  newPresetName,
  duration,
  durationUnit,
  onClose,
  onSave,
  onNameChange,
  onDurationChange,
  onDurationUnitChange
}) => {
  const handleSave = () => {
    const updatedPreset: Preset = {
      ...editingPreset,
      name: newPresetName,
      duration: convertToSeconds(duration, durationUnit),
      durationUnit
    };
    onSave(updatedPreset);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{editingPreset.id ? 'Edit Preset' : 'Save Preset'}</DialogTitle>
          <DialogDescription>
            Configure your preset settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium block">Preset Name</label>
            <Input
              value={newPresetName}
              onChange={e => onNameChange(e.target.value)}
              placeholder="Enter preset name"
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium block">Duration</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                value={duration}
                onChange={e => onDurationChange(Number(e.target.value))}
                className="h-10"
              />
              <Select
                value={durationUnit}
                onValueChange={(value: 'seconds' | 'minutes' | 'hours') => onDurationUnitChange(value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="seconds">Seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Position Details</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-700 p-2 rounded">
                <span className="text-xs text-muted-foreground block">Pan</span>
                <span className="text-sm font-mono">{editingPreset.panTilt.pan.toFixed(2)}</span>
              </div>
              <div className="bg-white dark:bg-gray-700 p-2 rounded">
                <span className="text-xs text-muted-foreground block">Tilt</span>
                <span className="text-sm font-mono">{editingPreset.panTilt.tilt.toFixed(2)}</span>
              </div>
              <div className="bg-white dark:bg-gray-700 p-2 rounded">
                <span className="text-xs text-muted-foreground block">Zoom</span>
                <span className="text-sm font-mono">{editingPreset.zoom.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PresetDialog; 