import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SavedZoneItemProps } from '@/types/masks-and-zones';
import { formatActivityName } from '@/utils/masks-and-zones';

export const SavedZoneItem: React.FC<SavedZoneItemProps> = React.memo(({ 
    polygon,
    isActive,
    onEdit,
    onDelete,
    onStartEditingName,
    onSaveName,
    onCancelEditingName,
    editingNameId,
    editingName,
    onEditingNameChange,
    onParametersChange,
    editingParameters
}) => (
    <div
        className={`flex flex-col p-3 rounded-lg ${
            isActive ? 'bg-primary/10' : 'bg-muted/30'
        } border transition-colors ${editingNameId === polygon.id ? 'border-primary' : 'border-transparent'}`}
    >
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
                <div
                    className="w-3 h-3 rounded-full ring-2 ring-background"
                    style={{ backgroundColor: polygon.color }}
                />
                <div className="flex-1">
                    <div className="font-medium text-sm">
                        {formatActivityName(polygon.activity)}
                    </div>
                    {!editingNameId && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {polygon.name !== formatActivityName(polygon.activity) ? polygon.name : ''}
                        </div>
                    )}
                </div>
            </div>
            {!editingNameId && (
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={onStartEditingName}
                        title="Edit custom name"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={onDelete}
                        title="Delete activity"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}
        </div>
        {!editingNameId && isActive && polygon.parameters && Object.keys(polygon.parameters).length > 0 && (
            <div className="bg-background/50 rounded-lg p-3 text-sm">
                <div className="font-medium mb-2">Parameters</div>
                <div className="space-y-1.5">
                    {Object.entries(polygon.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
)); 