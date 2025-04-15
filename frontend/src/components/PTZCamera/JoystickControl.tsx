import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface JoystickControlProps {
  joystickPosition: { x: number; y: number };
  joystickContainerRef: React.RefObject<HTMLDivElement>;
  joystickHandleRef: React.RefObject<HTMLDivElement>;
  onStartDrag: (event: React.MouseEvent | React.TouchEvent) => void;
}

const JoystickControl: React.FC<JoystickControlProps> = ({
  joystickPosition,
  joystickContainerRef,
  joystickHandleRef,
  onStartDrag
}) => {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div 
        ref={joystickContainerRef}
        className="relative w-56 h-56 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-inner touch-none"
        onMouseDown={onStartDrag}
        onTouchStart={onStartDrag}
      >
        <div 
          ref={joystickHandleRef}
          className="absolute w-10 h-10 rounded-full bg-blue-500 shadow-md cursor-grab active:cursor-grabbing transition-transform hover:scale-105"
          style={{ 
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${joystickPosition.x}px, ${joystickPosition.y}px)`
          }}
        />
      </div>
    </div>
  );
};

export default JoystickControl; 