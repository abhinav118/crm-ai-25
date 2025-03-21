
import React from 'react';
import { ImportStage } from './ImportContactsDialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Check, Circle } from 'lucide-react';

interface ImportBreadcrumbsProps {
  currentStage: ImportStage;
}

const ImportBreadcrumbs: React.FC<ImportBreadcrumbsProps> = ({ currentStage }) => {
  const stages: { key: ImportStage; label: string; description: string }[] = [
    { 
      key: 'upload', 
      label: 'Upload', 
      description: 'Upload file and configure' 
    },
    { 
      key: 'map', 
      label: 'Map', 
      description: 'Map columns to fields' 
    },
    { 
      key: 'verify', 
      label: 'Verify', 
      description: 'Confirm and finalize selection' 
    },
  ];

  const getStageNumber = (stage: ImportStage): number => {
    const index = stages.findIndex(s => s.key === stage);
    return index + 1;
  };

  const isStageCompleted = (stage: ImportStage): boolean => {
    const currentIndex = stages.findIndex(s => s.key === currentStage);
    const stageIndex = stages.findIndex(s => s.key === stage);
    return stageIndex < currentIndex;
  };

  const isCurrentStage = (stage: ImportStage): boolean => {
    return stage === currentStage;
  };

  return (
    <div className="mb-8">
      <Breadcrumb>
        <BreadcrumbList className="flex justify-between w-full px-0">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.key}>
              <BreadcrumbItem className="flex flex-col items-center space-y-1">
                <div className="flex items-center">
                  <div 
                    className={`flex items-center justify-center w-8 h-8 rounded-full border ${
                      isStageCompleted(stage.key)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isCurrentStage(stage.key)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-400 border-gray-300'
                    }`}
                  >
                    {isStageCompleted(stage.key) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{getStageNumber(stage.key)}</span>
                    )}
                  </div>
                  <BreadcrumbLink
                    className={`ml-2 ${
                      isCurrentStage(stage.key)
                        ? 'font-medium text-indigo-600'
                        : isStageCompleted(stage.key)
                          ? 'text-gray-700'
                          : 'text-gray-400'
                    }`}
                  >
                    {stage.label}
                  </BreadcrumbLink>
                </div>
                <span className="text-xs text-gray-500 mt-1 hidden md:block">
                  {stage.description}
                </span>
              </BreadcrumbItem>
              
              {index < stages.length - 1 && (
                <BreadcrumbSeparator className="mx-4">
                  <div className="w-16 h-px bg-gray-300 hidden md:block"></div>
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default ImportBreadcrumbs;
