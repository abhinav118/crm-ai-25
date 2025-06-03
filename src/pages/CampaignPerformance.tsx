
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

const CampaignPerformance = () => {
  return (
    <div className="flex-1 space-y-6 p-6 ml-[240px]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaign Performance</h1>
          <p className="text-muted-foreground">
            Track performance metrics for individual campaigns
          </p>
        </div>
      </div>

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
