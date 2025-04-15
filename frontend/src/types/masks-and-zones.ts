import { Point } from "@/components/masks-and-zones";
import { Camera } from "@/components/CameraSearch";
import { ParameterValue } from "@/components/ParametersForm";

export interface SavedPolygon {
    id: string;
    points: Point[];
    color: string;
    isActive?: boolean;
    name: string;
    activity: string;
    parameters: Record<string, ParameterValue>;
    isExpanded?: boolean;
}

export interface MasksAndZonesProps {
    className?: string;
}

export interface PolygonPreviewProps {
    polygon: SavedPolygon;
    isActive: boolean;
    strokeWidth: number;
    fillOpacity: number;
}

export interface SavedZoneItemProps {
    polygon: SavedPolygon;
    isActive: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onStartEditingName: () => void;
    onSaveName: (id: string) => void;
    onCancelEditingName: () => void;
    editingNameId: string | null;
    editingName: string;
    onEditingNameChange: (value: string) => void;
    onParametersChange: (params: Record<string, ParameterValue>) => void;
    editingParameters: Record<string, ParameterValue>;
}

export interface ItemToDelete {
    id: string;
    type: 'activity' | 'zone';
} 