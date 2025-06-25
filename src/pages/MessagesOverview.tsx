import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, TrendingUp, TrendingDown, MousePointer, Reply, UserX, Inbox } from "lucide-react";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useDateRange as ImportedUseDateRange, DateRangeContext } from "./ReportingPage";
import { useRealMessageMetrics } from "@/hooks/useRealMessageMetrics";
import { EnhancedMetricsCard } from "@/components/analytics/EnhancedMetricsCard";
import { DateRangeSelector } from "@/components/analytics/DateRangeSelector";
import { subDays } from "date-fns";

const MessagesOverviewComponent = () => {
  console.log('MessagesOverview component rendering');
  
  const { dateRange, setDateRange } = ImportedUseDateRange();
  const [activeChartTab, setActiveChartTab] = useState("delivered");
  
  // Use real data from database
  const { data: metrics, isLoading, error } = useRealMessageMetrics(dateRange);

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  console.log('Creating metric cards data');
  const metricCards = [
    {
      title: "Messages Sent",
      value: metrics?.total_sent || 0,
      percentage: 100,
      icon: <MessageSquare size={20} />,
      color: "blue" as const,
      tooltip: "Total number of SMS messages sent from campaigns in the selected period"
    },
    {
      title: "Delivered",
      value: metrics?.delivered_count || 0,
      percentage: calculatePercentage(metrics?.delivered_count || 0, metrics?.total_sent || 0),
      icon: <TrendingUp size={20} />,
      color: "green" as const,
      tooltip: "Messages successfully delivered to recipients' phones"
    },
    {
      title: "Bounced",
      value: metrics?.bounced_count || 0,
      percentage: calculatePercentage(metrics?.bounced_count || 0, metrics?.total_sent || 0),
      icon: <TrendingDown size={20} />,
      color: "red" as const,
      tooltip: "Messages that failed to deliver due to invalid numbers or carrier issues"
    },
    {
      title: "Not Sent",
      value: metrics?.not_sent_count || 0,
      percentage: calculatePercentage(metrics?.not_sent_count || 0, metrics?.total_sent || 0),
      icon: <MessageSquare size={20} />,
      color: "orange" as const,
      tooltip: "Messages that were not sent due to system errors or restrictions"
    },
    {
      title: "Clicked",
      value: metrics?.clicked_count || 0,
      percentage: calculatePercentage(metrics?.clicked_count || 0, metrics?.delivered_count || 0),
      icon: <MousePointer size={20} />,
      color: "purple" as const,
      tooltip: "Estimated number of links clicked in delivered messages (based on 3% CTR)"
    },
    {
      title: "Received",
      value: metrics?.received_count || 0,
      percentage: calculatePercentage(metrics?.received_count || 0, metrics?.delivered_count || 0),
      icon: <Inbox size={20} />,
      color: "blue" as const,
      tooltip: "Messages received by contacts (logged in contact_logs)"
    },
    {
      title: "Opted Out",
      value: metrics?.opted_out_count || 0,
      percentage: calculatePercentage(metrics?.opted_out_count || 0, metrics?.delivered_count || 0),
      icon: <UserX size={20} />,
      color: "red" as const,
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
              <p className="text-sm mt-2">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter - Top Right */}
      <div className="flex justify-end">
        <DateRangeSelector 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          className="w-64"
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {metricCards.map((metric, index) => {
          console.log(`Rendering metric card ${index}:`, metric);
          return (
            <EnhancedMetricsCard
              key={index}
              title={metric.title}
              value={metric.value}
              percentage={metric.percentage}
              icon={metric.icon}
              color={metric.color}
              tooltip={metric.tooltip}
              isLoading={isLoading}
            />
          );
        })}
      </div>

      {/* Messages Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Messages Over Time</CardTitle>
          <CardDescription>
            Daily message statistics for the selected period from real campaign data
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                  <p>Loading real message data...</p>
                </div>
              ) : metrics?.time_series && metrics.time_series.length > 0 ? (
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
                    <p>No message data available for the selected date range</p>
                    <p className="text-sm mt-2">Try selecting a different time period or check if campaigns have been sent</p>
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
