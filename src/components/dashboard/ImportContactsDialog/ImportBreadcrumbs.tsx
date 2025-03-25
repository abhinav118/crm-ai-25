import React from 'react';
import { Upload, FileCheck, CheckCircle, Clock } from 'lucide-react';
import { ImportStage } from './types';

interface ImportBreadcrumbsProps {
  currentStage: ImportStage;
  onStageSelect: (stage: ImportStage) => void;
}

const ImportBreadcrumbs: React.FC<ImportBreadcrumbsProps> = ({ 
  currentStage,
  onStageSelect 
}) => {
  const stages: { id: ImportStage; label: string; icon: React.ReactNode }[] = [
    { 
      id: 'upload', 
      label: 'Upload', 
      icon: <Upload size={16} className={currentStage === 'upload' ? 'text-primary' : 'text-muted-foreground'} /> 
    },
    { 
      id: 'map', 
      label: 'Map Fields', 
      icon: <FileCheck size={16} className={currentStage === 'map' ? 'text-primary' : 'text-muted-foreground'} /> 
    },
    { 
      id: 'verify', 
      label: 'Verify', 
      icon: <CheckCircle size={16} className={currentStage === 'verify' ? 'text-primary' : 'text-muted-foreground'} /> 
    },
    { 
      id: 'import', 
      label: 'Import', 
      icon: <Clock size={16} className={currentStage === 'import' ? 'text-primary' : 'text-muted-foreground'} /> 
    },
  ];

  // Calculate progress based on current stage
  const getProgressPercent = () => {
    const stageIndex = stages.findIndex(s => s.id === currentStage);
    if (stageIndex === -1) return 0;
    return (stageIndex / (stages.length - 1)) * 100;
  };

  return (
    <div className="mb-6">
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted mb-4 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${getProgressPercent()}%` }}
        />
      </div>
      
      {/* Breadcrumb navigation */}
      <div className="flex justify-between">
        {stages.map((stage, index) => {
          // Calculate if this stage is completed, active, or upcoming
          const isCompleted = stages.findIndex(s => s.id === currentStage) > index;
          const isActive = stage.id === currentStage;
          const isClickable = index <= stages.findIndex(s => s.id === currentStage);
          
          return (
            <div 
              key={stage.id}
              className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              onClick={() => isClickable && onStageSelect(stage.id)}
            >
              <div className={`flex items-center mb-1 ${isActive ? 'text-primary' : isCompleted ? 'text-primary opacity-70' : 'text-muted-foreground'}`}>
                {stage.icon}
              </div>
              <span 
                className={`text-xs ${isActive ? 'font-medium text-primary' : isCompleted ? 'text-primary opacity-70' : 'text-muted-foreground'}`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImportBreadcrumbs;
