import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SavedPolygon } from '@/types/masks-and-zones';

interface ZoneCoordinatesProps {
  zones: SavedPolygon[];
  onDelete: (id: string) => void;
  onEdit: (zone: SavedPolygon) => void;
}

export const ZoneCoordinates: React.FC<ZoneCoordinatesProps> = ({
  zones,
  onDelete,
  onEdit
}) => {
  if (zones.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="space-y-2">
      {zones.map((zone) => (
        <AccordionItem key={zone.id} value={zone.id} className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-2 hover:no-underline">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
                <span className="text-sm font-medium">
                  {zone.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(zone.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(zone);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 py-2 bg-muted/50">
              <div className="text-xs">
                <div className="font-medium mb-2">Coordinates:</div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {zone.points.map((point, index) => (
                    <div key={index} className="flex justify-between p-1 hover:bg-accent/50 rounded">
                      <span>Point {index + 1}:</span>
                      <span>({Math.round(point.x)}, {Math.round(point.y)})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}; 