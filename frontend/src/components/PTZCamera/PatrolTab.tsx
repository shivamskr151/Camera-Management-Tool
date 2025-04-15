import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatRemainingTime } from '@/utils/time';
import { Preset } from '@/types/ptz-camera';

interface PatrolTabProps {
  isPatrolling: boolean;
  patrolState: {
    isPatrolling: boolean;
    currentPresetIndex: number;
    startTime: string;
    endTime: string;
    isSinglePresetPatrol: boolean;
    singlePresetId: number | null;
    remainingTime: number;
    activePresetId: number | null;
    selectedPresetIds: number[];
    patrolMode: 'single' | 'multiple';
  };
  presets: Preset[];
  patrolStartTime: string;
  patrolEndTime: string;
  onStartPatrol: () => void;
  onStopPatrol: () => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

const PatrolTab: React.FC<PatrolTabProps> = ({
  isPatrolling,
  patrolState,
  presets,
  patrolStartTime,
  patrolEndTime,
  onStartPatrol,
  onStopPatrol,
  onStartTimeChange,
  onEndTimeChange
}) => {
  const getCurrentPresetName = () => {
    if (patrolState.isSinglePresetPatrol) {
      return presets.find(p => p.id === patrolState.singlePresetId)?.name || 'Unknown';
    } else if (patrolState.patrolMode === 'multiple') {
      const currentPreset = presets.find(p => p.id === patrolState.activePresetId);
      return currentPreset?.name || 'None';
    } else {
      return presets[patrolState.currentPresetIndex]?.name || 'None';
    }
  };

  const getSelectedPresetsCount = () => {
    if (patrolState.patrolMode === 'multiple') {
      return patrolState.selectedPresetIds.length;
    }
    return 0;
  };

  return (
    <Card className="p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Patrol Settings</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isPatrolling ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-sm text-muted-foreground">
            {isPatrolling ? 'Patrol Active' : 'Patrol Inactive'}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time" className="text-xs">Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={patrolStartTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time" className="text-xs">End Time</Label>
            <Input
              id="end-time"
              type="time"
              value={patrolEndTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Patrol Status</span>
            <span className="text-sm text-muted-foreground">
              {patrolState.isPatrolling ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Current Preset</span>
              <span className="text-sm font-medium">
                {getCurrentPresetName()}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Time Remaining</span>
              <span className="text-sm font-medium">
                {formatRemainingTime(patrolState.remainingTime)}
              </span>
            </div>
          </div>
          {patrolState.patrolMode === 'multiple' && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-muted-foreground block mb-1">Patrol Mode</span>
              <span className="text-sm font-medium">
                Multiple Presets ({getSelectedPresetsCount()} selected)
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={isPatrolling ? onStopPatrol : onStartPatrol}
            className={`w-full ${isPatrolling ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isPatrolling ? 'Stop Patrol' : 'Start Patrol'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PatrolTab; 