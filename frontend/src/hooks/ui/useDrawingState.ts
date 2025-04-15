import { useState, useCallback } from 'react';
import { Point } from "@/components/masks-and-zones";
import { PolygonDrawerHandle } from "@/components/masks-and-zones";
import { toast } from 'sonner';
import { SavedPolygon } from '@/types/masks-and-zones';
import { ParameterValue } from '@/components/ParametersForm';

export const useDrawingState = (
  polygonDrawerRef: React.RefObject<PolygonDrawerHandle>,
  selectedActivity: string,
  strokeColor: string,
  setStrokeColor: (color: string) => void,
  parameters: Record<string, ParameterValue>
) => {
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [drawnZones, setDrawnZones] = useState<SavedPolygon[]>([]);
  const [activePolygonId, setActivePolygonId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState('');

  const handlePolygonChange = useCallback((points: Point[]) => {
    setPolygonPoints(points);
  }, []);

  const handleStartDrawing = useCallback(() => {
    if (!selectedActivity) {
      toast.error('Please select an activity first');
      return;
    }
    setIsDrawingEnabled(true);
    setIsDrawing(true);
    setPolygonPoints([]); // Reset any existing points
    if (polygonDrawerRef.current) {
      polygonDrawerRef.current.resetPolygon();
    }
  }, [selectedActivity, polygonDrawerRef]);

  const handleStopDrawing = useCallback(() => {
    setIsDrawingEnabled(false);
    setIsDrawing(false);
    setPolygonPoints([]);
    if (polygonDrawerRef.current) {
      polygonDrawerRef.current.resetPolygon();
    }
  }, [polygonDrawerRef]);

  const handleSavePolygon = useCallback(() => {
    if (!selectedActivity) {
      toast.error('Please select an activity first');
      return;
    }

    if (!newZoneName.trim()) {
      toast.error('Please enter a name for the zone');
      return;
    }

    if (polygonDrawerRef.current) {
      const points = polygonDrawerRef.current.getPoints();
      if (points.length >= 3) {
        const currentParameters = { ...parameters }; // Create a deep copy of parameters
        if (activePolygonId) {
          // Update existing zone
          const updatedZones = drawnZones.map(zone =>
            zone.id === activePolygonId
              ? {
                  ...zone,
                  points,
                  color: strokeColor,
                  name: newZoneName.trim(),
                  activity: selectedActivity,
                  parameters: currentParameters
                }
              : zone
          );
          setDrawnZones(updatedZones);
          toast.success('Zone updated successfully');
        } else {
          // Create new zone
          const newZone: SavedPolygon = {
            id: Date.now().toString(),
            points,
            color: strokeColor,
            isActive: true,
            name: newZoneName.trim(),
            activity: selectedActivity,
            parameters: currentParameters
          };
          setDrawnZones([...drawnZones, newZone]);
          toast.success('Zone saved successfully');
        }
        handleStopDrawing();
        setNewZoneName('');
        setActivePolygonId(null);
      } else {
        toast.error('Please draw a valid polygon with at least 3 points');
      }
    }
  }, [selectedActivity, newZoneName, strokeColor, handleStopDrawing, activePolygonId, drawnZones, parameters, polygonDrawerRef]);

  const handleCancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setPolygonPoints([]);
    setActivePolygonId(null);
    setNewZoneName('');
    if (polygonDrawerRef.current) {
      polygonDrawerRef.current.resetPolygon();
    }
  }, [polygonDrawerRef]);

  const handleEditPolygon = useCallback((polygon: SavedPolygon) => {
    setStrokeColor(polygon.color);
    setActivePolygonId(polygon.id);
    setPolygonPoints([...polygon.points]);
    setNewZoneName(polygon.name);
    setIsDrawing(true);

    if (polygonDrawerRef.current) {
      polygonDrawerRef.current.setPoints(polygon.points);
    }
  }, [polygonDrawerRef, setStrokeColor]);

  return {
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
    handleStopDrawing,
    handleSavePolygon,
    handleCancelDrawing,
    handleEditPolygon
  };
}; 