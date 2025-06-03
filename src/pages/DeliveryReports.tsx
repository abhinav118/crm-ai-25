
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const DeliveryReports = () => {
  return (
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
  );
};

export default DeliveryReports;
