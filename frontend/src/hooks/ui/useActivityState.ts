import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { SavedPolygon } from '@/types/masks-and-zones';
import { ParameterValue } from '@/components/ParametersForm';
import { activityData } from '@/constants/ParametersData';
import { formatActivityName } from '@/utils/masks-and-zones';

export const useActivityState = () => {
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, ParameterValue>>({});
  const [savedActivities, setSavedActivities] = useState<SavedPolygon[]>([]);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleActivityChange = useCallback((value: string) => {
    const activity = activityData.find((act) => act.name === value);
    setSelectedActivity(value);
    setParameters(activity?.data?.parameters || {});
  }, []);

  const handleStartEditingName = useCallback((polygon: SavedPolygon) => {
    setEditingNameId(polygon.id);
    setEditingName(polygon.name);
    // Set both the editing parameters and the main parameters state
    const currentParams = polygon.parameters ? { ...polygon.parameters } : {};
    setParameters(currentParams);
    setSelectedActivity(polygon.activity);
  }, []);

  const handleParametersChange = useCallback((newParameters: Record<string, ParameterValue>) => {
    // Always update the main parameters state
    setParameters(newParameters);
    
    // If editing a zone in Save Activity, update the saved activities immediately
    if (editingNameId) {
      const updatedActivities = savedActivities.map(activity =>
        activity.id === editingNameId
          ? { ...activity, parameters: { ...newParameters } }
          : activity
      );
      setSavedActivities(updatedActivities);
    }
  }, [editingNameId, savedActivities]);

  const handleSaveName = useCallback((id: string) => {
    if (editingName.trim()) {
      // Create the updated activity with current parameters
      const updatedActivities = savedActivities.map(activity =>
        activity.id === id
          ? { 
              ...activity, 
              name: editingName.trim(),
              parameters: { ...parameters }, // Use current parameters
              activity: selectedActivity
            }
          : activity
      );
      
      // Update saved activities
      setSavedActivities(updatedActivities);
      
      // Reset states after saving
      setEditingNameId(null);
      setEditingName('');
      setParameters({});
      setSelectedActivity('');
      
      toast.success('Activity updated successfully');
    }
  }, [editingName, parameters, savedActivities, selectedActivity]);

  const handleCancelEditingName = useCallback(() => {
    const currentActivity = editingNameId 
      ? savedActivities.find(p => p.id === editingNameId)
      : null;

    setEditingNameId(null);
    
    if (currentActivity) {
      // Restore the current activity's parameters and activity type
      setParameters(currentActivity.parameters || {});
      setSelectedActivity(currentActivity.activity);
    } else {
      // Reset if no activity is being edited
      const defaultActivity = activityData.find(act => act.name === selectedActivity);
      if (defaultActivity) {
        setParameters({ ...defaultActivity.data.parameters });
      } else {
        setParameters({});
        setSelectedActivity('');
      }
    }
  }, [editingNameId, savedActivities, selectedActivity]);

  const handleSaveActivity = useCallback(() => {
    if (!selectedActivity) {
      toast.error('Please select an activity first');
      return;
    }
    if (Object.keys(parameters).length === 0) {
      toast.error('Please configure parameters first');
      return;
    }
    const newActivity: SavedPolygon = {
      id: Date.now().toString(),
      points: [],
      color: '#3498db', // Default color
      isActive: true,
      name: formatActivityName(selectedActivity),
      activity: selectedActivity,
      parameters: { ...parameters }
    };
    const updatedActivities = [...savedActivities, newActivity];
    setSavedActivities(updatedActivities);
    toast.success('Activity saved successfully');

    // Reset all states to initial values
    setSelectedActivity('');
    setParameters({});
  }, [selectedActivity, parameters, savedActivities]);

  // Update parameters state when editing a zone
  useEffect(() => {
    if (editingNameId) {
      // If editing, use the parameters from the activity being edited
      const editingActivity = savedActivities.find(a => a.id === editingNameId);
      if (editingActivity) {
        setParameters(editingActivity.parameters || {});
        setSelectedActivity(editingActivity.activity);
      }
    } else if (!editingNameId) {
      // Only reset to default parameters if not editing
      const activity = activityData.find(act => act.name === selectedActivity);
      if (activity && Object.keys(parameters).length === 0) {
        setParameters({ ...activity.data.parameters });
      }
    }
  }, [editingNameId, savedActivities, selectedActivity, parameters]);

  // Update parameters when activity changes
  useEffect(() => {
    if (!editingNameId) {
      const activity = activityData.find(act => act.name === selectedActivity);
      if (activity) {
        setParameters({ ...activity.data.parameters });
      } else {
        setParameters({});
      }
    }
  }, [selectedActivity, editingNameId]);

  return {
    selectedActivity,
    parameters,
    savedActivities,
    editingNameId,
    editingName,
    setSelectedActivity,
    setParameters,
    setSavedActivities,
    setEditingNameId,
    setEditingName,
    handleActivityChange,
    handleStartEditingName,
    handleParametersChange,
    handleSaveName,
    handleCancelEditingName,
    handleSaveActivity
  };
}; 