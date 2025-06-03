
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

const CampaignPerformance = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Campaign Performance
          </CardTitle>
          <CardDescription>
            This section will contain performance metrics and analytics for individual SMS campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Coming Soon</p>
              <p className="text-sm">Campaign performance analytics will be available here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignPerformance;
