import React from 'react';
import { PolygonPreviewProps } from '@/types/masks-and-zones';

export const PolygonPreview: React.FC<PolygonPreviewProps> = React.memo(({ 
    polygon, 
    isActive, 
    strokeWidth, 
    fillOpacity 
}) => {
    const pointsString = polygon.points
        .map(point => `${point.x},${point.y}`)
        .join(' ');

    return (
        <polygon
            points={pointsString}
            fill={polygon.color}
            fillOpacity={isActive ? 0.1 : fillOpacity}
            stroke={polygon.color}
            strokeWidth={isActive ? 1 : strokeWidth}
            strokeDasharray={isActive ? "5,5" : "none"}
        />
    );
}); 