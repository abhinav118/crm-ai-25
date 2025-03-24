import React from 'react';
import { CheckCircle, CircleIcon, UploadIcon, MapIcon, CheckIcon } from 'lucide-react';
import { ImportStage } from './types';

interface ImportBreadcrumbsProps {
  currentStage: ImportStage;
  onStageSelect: (stage: ImportStage) => void;
}

const ImportBreadcrumbs: React.FC<ImportBreadcrumbsProps> = ({ currentStage, onStageSelect }) => {
  const stages: { id: ImportStage; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload CSV', icon: <UploadIcon size={16} /> },
    { id: 'map', label: 'Map Fields', icon: <MapIcon size={16} /> },
    { id: 'verify', label: 'Verify Data', icon: <CheckIcon size={16} /> },
  ];

  return (
    <div className="flex items-center w-full py-4">
      {stages.map((stage, index) => {
        const isActive = currentStage === stage.id;
        const isPast = 
          (currentStage === 'map' && stage.id === 'upload') ||
          (currentStage === 'verify' && (stage.id === 'upload' || stage.id === 'map')) ||
          (currentStage === 'complete');
        
        return (
          <React.Fragment key={stage.id}>
            <div 
              className={`flex items-center cursor-pointer ${isActive || isPast ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => onStageSelect(stage.id)}
            >
              <div className="flex items-center justify-center w-8 h-8">
                {isPast ? (
                  <CheckCircle size={18} className="text-primary" />
                ) : (
                  <CircleIcon size={18} className={isActive ? 'fill-primary' : 'fill-none'} />
                )}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                {stage.label}
              </span>
            </div>
            
            {index < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isPast ? 'bg-primary' : 'bg-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ImportBreadcrumbs;
