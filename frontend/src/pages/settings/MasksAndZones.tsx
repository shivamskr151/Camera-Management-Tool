import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Point, PolygonDrawerHandle } from "@/components/masks-and-zones";
import PolygonDrawer from "@/components/masks-and-zones/PolygonDrawer";
import { Plus, Edit3, Trash2, Camera, Check, X, Settings, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CameraSearch, { Camera as CameraType } from '@/components/CameraSearch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Select from 'react-select';
import { toast } from 'sonner';
import ParametersForm, { ParameterValue } from '@/components/ParametersForm';
import { activityData } from '@/constants/ParametersData';
import { SavedPolygon, MasksAndZonesProps } from '@/types/masks-and-zones';
import { formatActivityName } from '@/utils/masks-and-zones';
import { PolygonPreview } from '@/components/masks-and-zones/PolygonPreview';
import { SavedZoneItem } from '@/components/masks-and-zones/SavedZoneItem';
import { DrawingControls } from '@/components/masks-and-zones/DrawingControls';
import { CameraFeed } from '@/components/masks-and-zones/CameraFeed';
import { DeleteConfirmationDialog } from '@/components/masks-and-zones/DeleteConfirmationDialog';
import { ZoneCoordinates } from '@/components/masks-and-zones/ZoneCoordinates';
import { useDrawingState } from '@/hooks/ui/useDrawingState';
import { useActivityState } from '@/hooks/ui/useActivityState';

export const MasksAndZones: React.FC<MasksAndZonesProps> = ({ className }) => {
    // Camera selection
    const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
    const [isCameraFeedOpen, setIsCameraFeedOpen] = useState(false);
    
    // Drawing state
    const [strokeColor, setStrokeColor] = useState('#3498db');
    const [pointRadius, setPointRadius] = useState(5);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [fillOpacity, setFillOpacity] = useState(0.2);
    
    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'activity' | 'zone' } | null>(null);
    
    // Refs
    const polygonDrawerRef = useRef<PolygonDrawerHandle>(null);
    const newZoneInputRef = useRef<HTMLInputElement>(null);
    
    // Custom hooks
    const {
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
        handleStartEditingName,
        handleParametersChange,
        handleSaveName,
        handleCancelEditingName,
        handleSaveActivity
    } = useActivityState();

    const {
        polygonPoints,
        isDrawingMode,
        isDrawing,
        isDrawingEnabled,
        drawnZones,
        activePolygonId,
        newZoneName,
        setPolygonPoints,
        setIsDrawingMode,
        setIsDrawing,
        setIsDrawingEnabled,
        setDrawnZones,
        setActivePolygonId,
        setNewZoneName,
        handlePolygonChange,
        handleStartDrawing,
        handleSavePolygon,
        handleCancelDrawing,
        handleEditPolygon
    } = useDrawingState(
        polygonDrawerRef,
        selectedActivity,
        strokeColor,
        setStrokeColor,
        parameters
    );

    // Callbacks
    const handleCameraSelect = useCallback((camera: CameraType) => {
        setSelectedCamera(camera);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'activity') {
            setSavedActivities(savedActivities.filter(z => z.id !== itemToDelete.id));
            toast.success('Activity deleted successfully');
        } else {
            setDrawnZones(drawnZones.filter(z => z.id !== itemToDelete.id));
            toast.success('Zone deleted successfully');
        }

        setDeleteDialogOpen(false);
        setItemToDelete(null);
    }, [itemToDelete, savedActivities, drawnZones, setSavedActivities, setDrawnZones]);

    const saveToActivity = useCallback((polygons: SavedPolygon[]) => {
        try {
            if (!selectedCamera) return;

            const activityData = {
                zones: polygons.reduce((acc, polygon) => {
                    if (!acc[polygon.activity]) {
                        acc[polygon.activity] = {
                            zones: {},
                            parameters: {}
                        };
                    }
                    acc[polygon.activity].zones[polygon.name] = {
                        points: polygon.points,
                        parameters: polygon.parameters
                    };
                    return acc;
                }, {} as Record<string, { zones: Record<string, { points: Point[]; parameters: Record<string, ParameterValue> }>; parameters: Record<string, ParameterValue> }>)
            };

            // Here you would typically make an API call to save the data
            console.log('Saving activity data:', activityData);
        } catch (error) {
            console.error('Error saving to Activity:', error);
            toast.error('Failed to save data to Activity');
        }
    }, [selectedCamera]);

    // Update parameters state when editing a zone
    useEffect(() => {
        if (editingNameId) {
            // If editing, use the parameters from the activity being edited
            const editingActivity = savedActivities.find(a => a.id === editingNameId);
            if (editingActivity) {
                setParameters(editingActivity.parameters || {});
                setSelectedActivity(editingActivity.activity);
            }
        } else if (!editingNameId && !activePolygonId) {
            // Only reset to default parameters if not editing and no activity is selected
            const activity = activityData.find(act => act.name === selectedActivity);
            if (activity && Object.keys(parameters).length === 0) {
                setParameters({ ...activity.data.parameters });
                setIsDrawingEnabled(true);
            }
        }
    }, [editingNameId, activePolygonId, savedActivities, selectedActivity, parameters, setParameters, setSelectedActivity, setIsDrawingEnabled]);

    // Update parameters when activity changes
    useEffect(() => {
        if (!editingNameId && !activePolygonId) {
            const activity = activityData.find(act => act.name === selectedActivity);
            if (activity) {
                setParameters({ ...activity.data.parameters });
                setIsDrawingEnabled(true);
            } else {
                setParameters({});
                setIsDrawingEnabled(false);
            }
        }
    }, [selectedActivity, editingNameId, activePolygonId, setParameters, setIsDrawingEnabled]);

    return (
        <div className={className}>
            <div className="flex justify-end items-center mb-4">
                <CameraSearch
                    mode="mask"
                    onCameraSelect={handleCameraSelect}
                    className="w-[300px]"
                />
            </div>

            {!selectedCamera ? (
                <div className="flex flex-col items-center justify-center p-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border rounded-xl shadow-sm">
                    <div className="rounded-full p-6 bg-white dark:bg-gray-800 shadow-md mb-6">
                        <Camera className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xl text-muted-foreground font-medium">Select a Camera</p>
                    <p className="text-sm text-muted-foreground mt-2">Choose a camera to configure masks and zones</p>
                </div>
            ) : (
                <Card>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-4">
                                {/* Drawing Area */}
                                <div className="w-full mt-4">
                                    <div className="relative w-full aspect-video bg-muted rounded-lg">
                                        {/* Camera feed */}
                                        <CameraFeed
                                            isOpen={isCameraFeedOpen}
                                            onOpenChange={setIsCameraFeedOpen}
                                            selectedCamera={selectedCamera}
                                        />

                                        {/* Display saved polygons */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <svg className="w-full h-full">
                                                {drawnZones.map(polygon => (
                                                    <PolygonPreview
                                                        key={polygon.id}
                                                        polygon={polygon}
                                                        isActive={activePolygonId === polygon.id}
                                                        strokeWidth={strokeWidth}
                                                        fillOpacity={fillOpacity}
                                                    />
                                                ))}
                                            </svg>
                                        </div>

                                        {/* Active polygon drawer */}
                                        <div className="absolute inset-0">
                                            <PolygonDrawer
                                                ref={polygonDrawerRef}
                                                strokeColor={strokeColor}
                                                fillColor={strokeColor}
                                                fillOpacity={fillOpacity}
                                                strokeWidth={strokeWidth}
                                                pointRadius={pointRadius}
                                                onChange={handlePolygonChange}
                                                className="w-full h-full"
                                                initialPoints={activePolygonId ? polygonPoints : []}
                                            />
                                        </div>

                                        {/* Drawing Controls */}
                                        <DrawingControls
                                            strokeColor={strokeColor}
                                            pointRadius={pointRadius}
                                            strokeWidth={strokeWidth}
                                            fillOpacity={fillOpacity}
                                            onStrokeColorChange={setStrokeColor}
                                            onPointRadiusChange={setPointRadius}
                                            onStrokeWidthChange={setStrokeWidth}
                                            onFillOpacityChange={setFillOpacity}
                                        />
                                    </div>
                                </div>

                                {/* Controls Panel */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Side - Activity Selection and Saved Zones */}
                                    <div className="space-y-6">
                                        {/* Activity Selection */}
                                        <div className="flex items-center gap-4">
                                            <label className="text-gray-700 font-medium">Select Activity</label>
                                            <div className="flex-1">
                                                <Select
                                                    options={activityData.map((activity) => ({
                                                        value: activity.id,
                                                        label: formatActivityName(activity.name),
                                                    }))}
                                                    onChange={(selectedOption) => {
                                                        const activity = activityData.find((act) => act.id === selectedOption.value);
                                                        if (activity) {
                                                            setSelectedActivity(activity.name);
                                                        }
                                                    }}
                                                    value={
                                                        selectedActivity
                                                            ? {
                                                                value: activityData.find(act => act.name === selectedActivity)?.id || '',
                                                                label: formatActivityName(selectedActivity)
                                                            }
                                                            : null
                                                    }
                                                    placeholder="Select"
                                                />
                                            </div>
                                        </div>

                                        {/* Saved Zones List */}
                                        <div className="border-t border-border pt-6">
                                            <h3 className="text-lg font-medium mb-2">Save Activity ({savedActivities.length})</h3>
                                            <div className="space-y-2">
                                                {savedActivities.map(polygon => (
                                                    <SavedZoneItem
                                                        key={polygon.id}
                                                        polygon={polygon}
                                                        isActive={activePolygonId === polygon.id}
                                                        onEdit={() => handleEditPolygon(polygon)}
                                                        onDelete={() => {
                                                            setItemToDelete({ id: polygon.id, type: 'activity' });
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        onStartEditingName={() => handleStartEditingName(polygon)}
                                                        onSaveName={handleSaveName}
                                                        onCancelEditingName={handleCancelEditingName}
                                                        editingNameId={editingNameId}
                                                        editingName={editingName}
                                                        onEditingNameChange={setEditingName}
                                                        onParametersChange={(newParams) => {
                                                            handleParametersChange(newParams);
                                                        }}
                                                        editingParameters={parameters}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Save Configuration Button */}
                                        <div className="pt-4 border-t border-border">
                                            <Button
                                                onClick={() => {
                                                    saveToActivity([...drawnZones, ...savedActivities]);
                                                    toast.success('Configuration saved successfully');
                                                }}
                                                className="w-full"
                                                disabled={!selectedCamera || savedActivities.length === 0 || editingNameId !== null}
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Configuration
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Right Side - Drawing Controls and Parameters */}
                                    <div className="space-y-6">
                                        {/* Drawing Controls */}
                                        <div className="space-y-4">
                                            {isDrawing ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="zoneName" className="text-sm font-medium">
                                                            Zone Name:
                                                        </Label>
                                                        <Input
                                                            id="zoneName"
                                                            ref={newZoneInputRef}
                                                            value={newZoneName}
                                                            onChange={(e) => setNewZoneName(e.target.value)}
                                                            placeholder="Enter zone name"
                                                            className="w-full"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && polygonPoints.length >= 3) {
                                                                    handleSavePolygon();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={handleCancelDrawing}
                                                            className="flex-1"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            onClick={handleSavePolygon}
                                                            className="flex-1"
                                                            disabled={polygonPoints.length < 3 || !newZoneName.trim()}
                                                        >
                                                            Save Zone
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        onClick={handleStartDrawing}
                                                        className="w-full"
                                                        disabled={!selectedActivity}
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Draw New Zone
                                                    </Button>

                                                    {/* Zone Coordinates Display */}
                                                    <ZoneCoordinates
                                                        zones={drawnZones}
                                                        onDelete={(id) => {
                                                            setItemToDelete({ id, type: 'zone' });
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        onEdit={handleEditPolygon}
                                                    />
                                                </>
                                            )}
                                        </div>

                                        {/* Parameters Form */}
                                        <ParametersForm
                                            activityType={selectedActivity}
                                            parameters={parameters}
                                            onChange={(newParameters) => {
                                                setParameters(newParameters);
                                                if (editingNameId) {
                                                    // If editing, update both sides
                                                    const updatedActivities = savedActivities.map(activity =>
                                                        activity.id === editingNameId
                                                            ? { ...activity, parameters: { ...newParameters } }
                                                            : activity
                                                    );
                                                    setSavedActivities(updatedActivities);
                                                }
                                            }}
                                            onActivityChange={(activity) => {
                                                setSelectedActivity(activity);
                                                const activityConfig = activityData.find(act => act.name === activity);
                                                if (activityConfig && !editingNameId) {
                                                    setParameters({ ...activityConfig.data.parameters });
                                                    setIsDrawingEnabled(true);
                                                }
                                            }}
                                        />

                                        {/* Save/Update Activity Button */}
                                        <div className="pt-4 border-t border-border">
                                            {editingNameId ? (
                                                <Button
                                                    onClick={() => handleSaveName(editingNameId)}
                                                    className="w-full"
                                                    disabled={!selectedActivity || Object.keys(parameters).length === 0}
                                                >
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Update Activity
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={handleSaveActivity}
                                                    className="w-full"
                                                    disabled={!selectedActivity || Object.keys(parameters).length === 0}
                                                >
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save Activity
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                itemToDelete={itemToDelete}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
};

export default MasksAndZones; 