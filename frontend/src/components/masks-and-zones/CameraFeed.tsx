import React from 'react';
import { Camera } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Camera as CameraType } from '@/components/CameraSearch';

interface CameraFeedProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCamera: CameraType | null;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  isOpen,
  onOpenChange,
  selectedCamera
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors">
          <span className="text-muted-foreground">Camera Feed</span>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Camera Feed - {selectedCamera?.name}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">Camera Feed</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 