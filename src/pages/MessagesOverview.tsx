
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { MetricsCard } from "@/components/analytics/MetricsCard";
import { useDateRange as ImportedUseDateRange, DateRangeContext } from "./ReportingPage";
import { useMessageMetrics } from "@/hooks/useMessageMetrics";
import { subDays } from "date-fns";

const MessagesOverviewComponent = () => {
  console.log('MessagesOverview component rendering');
  
  const { dateRange } = ImportedUseDateRange();
  const [activeChartTab, setActiveChartTab] = useState("delivered");
  
  // Use real data instead of mock data
  const { data: metrics, isLoading, error } = useMessageMetrics(dateRange);

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  console.log('Creating metric cards data');
  const metricCards = [
    {
      title: "Messages Sent",
      value: metrics?.total_sent?.toString() || "0",
      percentage: 100,
      icon: <MessageSquare size={20} />,
      color: "blue" as const,
      tooltip: "Total number of SMS messages sent in the selected period"
    },
    {
      title: "Delivered",
      value: metrics?.delivered_count?.toString() || "0",
      percentage: calculatePercentage(metrics?.delivered_count || 0, metrics?.total_sent || 0),
      icon: <TrendingUp size={20} />,
      color: "green" as const,
      tooltip: "Messages successfully delivered to recipients"
    },
    {
      title: "Bounced",
      value: metrics?.bounced_count?.toString() || "0",
      percentage: calculatePercentage(metrics?.bounced_count || 0, metrics?.total_sent || 0),
      icon: <TrendingDown size={20} />,
      color: "orange" as const,
      tooltip: "Messages that failed to deliver due to invalid numbers or carrier issues"
    },
    {
      title: "Not Sent",
      value: metrics?.not_sent_count?.toString() || "0",
      percentage: calculatePercentage(metrics?.not_sent_count || 0, metrics?.total_sent || 0),
      icon: <MessageSquare size={20} />,
      color: "purple" as const,
      tooltip: "Messages that were not sent due to system or user restrictions"
    },
    {
      title: "Clicked",
      value: metrics?.clicked_count?.toString() || "0",
      percentage: calculatePercentage(metrics?.clicked_count || 0, metrics?.delivered_count || 0),
      icon: <TrendingUp size={20} />,
      color: "blue" as const,
      tooltip: "Number of links clicked in delivered messages"
    },
    {
      title: "Replied",
      value: metrics?.replied_count?.toString() || "0",
      percentage: calculatePercentage(metrics?.replied_count || 0, metrics?.delivered_count || 0),
      icon: <MessageSquare size={20} />,
      color: "green" as const,
      tooltip: "Number of recipients who replied to messages"
    },
    {
      title: "Opted Out",
      value: metrics?.opt_out_count?.toString() || "0",
      percentage: calculatePercentage(metrics?.opt_out_count || 0, metrics?.delivered_count || 0),
      icon: <TrendingDown size={20} />,
      color: "orange" as const,
      tooltip: "Recipients who opted out from receiving future messages"
    }
  ];

  const chartConfig = {
    delivered: {
      label: "Delivered",
      color: "hsl(var(--chart-1))",
    },
    bounced: {
      label: "Bounced", 
      color: "hsl(var(--chart-2))",
    },
    not_sent: {
      label: "Not Sent",
      color: "hsl(var(--chart-3))",
    },
  };

  console.log('About to render MessagesOverview component');

  if (error) {
    console.error('Error loading message metrics:', error);
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading message metrics. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      {/* Responsive columns: 1 on xs, 2 on sm, 4 on lg */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => {
          console.log(`Rendering metric card ${index}:`, metric);
          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <MetricsCard
                      title={metric.title}
                      value={isLoading ? "..." : metric.value}
                      icon={metric.icon}
                      color={metric.color}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {isLoading ? "..." : `${metric.percentage}%`}
                      </Badge>
                    </div>
                    <Info className="absolute top-2 right-12 h-4 w-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{metric.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Messages Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Messages Over Time</CardTitle>
          <CardDescription>
            Daily message statistics for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeChartTab} onValueChange={setActiveChartTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
              <TabsTrigger value="bounced">Bounced</TabsTrigger>
              <TabsTrigger value="not_sent">Not Sent</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeChartTab} className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-[240px] sm:h-[320px] md:h-[400px] text-muted-foreground">
                  <p>Loading message data...</p>
                </div>
              ) : metrics?.time_series && metrics.time_series.length > 0 ? (
                // Responsive chart height, taller on desktop
                <ChartContainer config={chartConfig} className="h-[240px] sm:h-[320px] md:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.time_series}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                      />
                      <YAxis />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                      />
                      <Bar 
                        dataKey={activeChartTab} 
                        fill={chartConfig[activeChartTab as keyof typeof chartConfig]?.color}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px] sm:h-[320px] text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No data available for the selected date range</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

let didWarnAboutMissingProvider = false;
const MessagesOverview = (props: any) => {
  // Try to access the context, otherwise provide a default one (for direct renders)
  let contextOk = true;
  try {
    ImportedUseDateRange();
  } catch (err: any) {
    contextOk = false;
    if (!didWarnAboutMissingProvider) {
      // eslint-disable-next-line no-console
      console.warn(
        "MessagesOverview: DateRangeProvider missing, using emergency fallback context. This is intended for direct testing only."
      );
      didWarnAboutMissingProvider = true;
    }
  }
  if (contextOk) {
    // Assume we're under correct Provider, render normally
    return <MessagesOverviewComponent {...props} />;
  }

  // Fallback: Provide a dummy date range context
  const today = new Date();
  const fallbackDateRange = {
    from: subDays(today, 7),
    to: today,
  };
  const fallbackContext = {
    dateRange: fallbackDateRange,
    setDateRange: () => {},
  };

  return (
    <DateRangeContext.Provider value={fallbackContext}>
      <MessagesOverviewComponent {...props} />
    </DateRangeContext.Provider>
  );
};

export default MessagesOverview;
