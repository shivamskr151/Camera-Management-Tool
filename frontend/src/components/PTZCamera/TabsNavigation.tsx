import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera as CameraIcon, Save, Play } from 'lucide-react';

interface TabsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabsNavigation: React.FC<TabsNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant={activeTab === 'control' ? 'default' : 'outline'}
        onClick={() => onTabChange('control')}
        className="flex items-center space-x-2"
      >
        <CameraIcon className="h-4 w-4" />
        <span>Camera Control</span>
      </Button>
      <Button
        variant={activeTab === 'presets' ? 'default' : 'outline'}
        onClick={() => onTabChange('presets')}
        className="flex items-center space-x-2"
      >
        <Save className="h-4 w-4" />
        <span>Presets</span>
      </Button>
      <Button
        variant={activeTab === 'patrol' ? 'default' : 'outline'}
        onClick={() => onTabChange('patrol')}
        className="flex items-center space-x-2"
      >
        <Play className="h-4 w-4" />
        <span>Patrol</span>
      </Button>
    </div>
  );
};

export default TabsNavigation; 