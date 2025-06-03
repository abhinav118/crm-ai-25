
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const DeliveryReports = () => {
  return (
    <div className="flex-1 space-y-6 p-6 ml-[240px]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Delivery Reports</h1>
          <p className="text-muted-foreground">
            Detailed SMS delivery logs and status tracking
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Delivery Reports
          </CardTitle>
          <CardDescription>
            This section will contain detailed delivery logs and status tracking for individual messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Coming Soon</p>
              <p className="text-sm">Detailed delivery reports will be available here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryReports;
