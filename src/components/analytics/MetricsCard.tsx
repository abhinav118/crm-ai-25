
import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MetricsCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
};

export const MetricsCard = ({ title, value, icon, color }: MetricsCardProps) => {
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
      default:
        return 'bg-gray-50 text-gray-500';
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-muted-foreground text-lg font-medium mb-1">{title}</h3>
            <p className="text-4xl font-bold">{value}</p>
          </div>
          <div className={cn("p-2 rounded-md", getColorClasses(color))}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
