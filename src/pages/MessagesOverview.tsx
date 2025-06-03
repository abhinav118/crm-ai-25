
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarIcon, Info, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { MetricsCard } from "@/components/analytics/MetricsCard";

interface DateRange {
  from: Date;
  to: Date;
}

interface MessageMetrics {
  total_sent: number;
  delivered_count: number;
  bounced_count: number;
  not_sent_count: number;
  clicked_count: number;
  replied_count: number;
  opt_out_count: number;
  time_series: Array<{
    date: string;
    delivered: number;
    bounced: number;
    not_sent: number;
  }>;
}

const MessagesOverview = () => {
  console.log('MessagesOverview component rendering');
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [messageType, setMessageType] = useState<string>("all");
  const [metrics, setMetrics] = useState<MessageMetrics>({
    total_sent: 0,
    delivered_count: 0,
    bounced_count: 0,
    not_sent_count: 0,
    clicked_count: 0,
    replied_count: 0,
    opt_out_count: 0,
    time_series: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState("delivered");

  // Mock data for demonstration
  const generateMockData = (): MessageMetrics => {
    console.log('Generating mock data');
    const mockTimeSeries = [];
    const startDate = dateRange.from;
    const endDate = dateRange.to;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      mockTimeSeries.push({
        date: format(d, 'yyyy-MM-dd'),
        delivered: Math.floor(Math.random() * 20) + 5,
        bounced: Math.floor(Math.random() * 5),
        not_sent: Math.floor(Math.random() * 3),
      });
    }

    const mockData = {
      total_sent: 120,
      delivered_count: 95,
      bounced_count: 10,
      not_sent_count: 15,
      clicked_count: 8,
      replied_count: 6,
      opt_out_count: 2,
      time_series: mockTimeSeries
    };
    
    console.log('Mock data generated:', mockData);
    return mockData;
  };

  useEffect(() => {
    console.log('useEffect triggered for fetching metrics');
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        console.log('Starting to fetch metrics');
        // In a real implementation, this would be an API call
        // const response = await fetch(`/api/reporting/messages-overview?start=${format(dateRange.from, 'yyyy-MM-dd')}&end=${format(dateRange.to, 'yyyy-MM-dd')}&type=${messageType}`);
        // const data = await response.json();
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        const mockData = generateMockData();
        console.log('Setting metrics with mock data');
        setMetrics(mockData);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        console.log('Finished fetching metrics');
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange, messageType]);

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  console.log('Creating metric cards data');
  const metricCards = [
    {
      title: "Messages Sent",
      value: metrics.total_sent.toString(),
      percentage: 100,
      icon: <MessageSquare size={20} />,
      color: "blue" as const,
      tooltip: "Total number of SMS messages sent in the selected period"
    },
    {
      title: "Delivered",
      value: metrics.delivered_count.toString(),
      percentage: calculatePercentage(metrics.delivered_count, metrics.total_sent),
      icon: <TrendingUp size={20} />,
      color: "green" as const,
      tooltip: "Messages successfully delivered to recipients"
    },
    {
      title: "Bounced",
      value: metrics.bounced_count.toString(),
      percentage: calculatePercentage(metrics.bounced_count, metrics.total_sent),
      icon: <TrendingDown size={20} />,
      color: "orange" as const,
      tooltip: "Messages that failed to deliver due to invalid numbers or carrier issues"
    },
    {
      title: "Not Sent",
      value: metrics.not_sent_count.toString(),
      percentage: calculatePercentage(metrics.not_sent_count, metrics.total_sent),
      icon: <MessageSquare size={20} />,
      color: "purple" as const,
      tooltip: "Messages that were not sent due to system or user restrictions"
    },
    {
      title: "Clicked",
      value: metrics.clicked_count.toString(),
      percentage: calculatePercentage(metrics.clicked_count, metrics.delivered_count),
      icon: <TrendingUp size={20} />,
      color: "blue" as const,
      tooltip: "Number of links clicked in delivered messages"
    },
    {
      title: "Replied",
      value: metrics.replied_count.toString(),
      percentage: calculatePercentage(metrics.replied_count, metrics.delivered_count),
      icon: <MessageSquare size={20} />,
      color: "green" as const,
      tooltip: "Number of recipients who replied to messages"
    },
    {
      title: "Opted Out",
      value: metrics.opt_out_count.toString(),
      percentage: calculatePercentage(metrics.opt_out_count, metrics.delivered_count),
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Date Range:</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Message Type:</label>
          <Select value={messageType} onValueChange={setMessageType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="campaign">Campaign</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automation">Automation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => {
          console.log(`Rendering metric card ${index}:`, metric);
          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <MetricsCard
                      title={metric.title}
                      value={metric.value}
                      icon={metric.icon}
                      color={metric.color}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {metric.percentage}%
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
              {metrics.time_series.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
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
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
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

export default MessagesOverview;
