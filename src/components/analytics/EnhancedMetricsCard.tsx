
import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from './AnimatedCounter';

type EnhancedMetricsCardProps = {
  title: string;
  value: number;
  percentage: number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  tooltip: string;
  isLoading?: boolean;
};

export const EnhancedMetricsCard = ({ 
  title, 
  value, 
  percentage, 
  icon, 
  color, 
  tooltip,
  isLoading = false 
}: EnhancedMetricsCardProps) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-500';
      case 'green':
        return 'bg-green-50 text-green-500';
      case 'purple':
        return 'bg-purple-50 text-purple-500';
      case 'orange':
        return 'bg-orange-50 text-orange-500';
      case 'red':
        return 'bg-red-50 text-red-500';
      default:
        return 'bg-gray-50 text-gray-500';
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="relative hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-muted-foreground text-lg font-medium mb-1">{title}</h3>
                  <div className="text-4xl font-bold">
                    {isLoading ? (
                      <div className="animate-pulse bg-gray-200 h-10 w-20 rounded"></div>
                    ) : (
                      <AnimatedCounter value={value} />
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={cn("p-2 rounded-md", getColorClasses(color))}>
                    {icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {isLoading ? "..." : `${percentage}%`}
                  </Badge>
                </div>
              </div>
              <Info className="absolute top-2 right-2 h-4 w-4 text-muted-foreground opacity-50" />
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
