import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Target, DollarSign, MousePointer, Eye, TrendingUp } from "lucide-react";
import { useDateRange as ImportedUseDateRange } from './ReportingPage';
import { subDays } from "date-fns";

// Sample data
const performanceMetrics = [
  { label: "Total Revenue", value: "$45,320", icon: DollarSign, color: "text-green-600", change: "+12.5%" },
  { label: "Average Open Rate", value: "68.4%", icon: Eye, color: "text-blue-600", change: "+3.2%" },
  { label: "Click Through Rate", value: "12.8%", icon: MousePointer, color: "text-purple-600", change: "+1.8%" },
  { label: "Conversion Rate", value: "8.2%", icon: Target, color: "text-orange-600", change: "+2.1%" }
];

const campaignTrendsData = [
  { week: 'Week 1', sent: 3200, delivered: 3040, opened: 2100, clicked: 420, converted: 185 },
  { week: 'Week 2', sent: 3600, delivered: 3420, opened: 2380, clicked: 480, converted: 210 },
  { week: 'Week 3', sent: 3100, delivered: 2945, opened: 2050, clicked: 390, converted: 165 },
  { week: 'Week 4', sent: 4200, delivered: 3990, opened: 2795, clicked: 560, converted: 275 },
  { week: 'Week 5', sent: 3800, delivered: 3610, opened: 2530, clicked: 505, converted: 240 },
  { week: 'Week 6', sent: 4500, delivered: 4275, opened: 3015, clicked: 615, converted: 295 }
];

const topCampaigns = [
  { 
    id: 1, 
    name: "Summer Flash Sale", 
    sent: 2450, 
    openRate: "74.2%", 
    clickRate: "15.8%", 
    conversionRate: "9.4%", 
    revenue: "$12,580",
    roi: "420%" 
  },
  { 
    id: 2, 
    name: "Welcome Series Bundle", 
    sent: 1890, 
    openRate: "68.9%", 
    clickRate: "12.3%", 
    conversionRate: "7.8%", 
    revenue: "$8,940",
    roi: "315%" 
  },
  { 
    id: 3, 
    name: "Father's Day Special", 
    sent: 3200, 
    openRate: "71.5%", 
    clickRate: "14.2%", 
    conversionRate: "8.9%", 
    revenue: "$15,670",
    roi: "380%" 
  },
  { 
    id: 4, 
    name: "Cart Recovery Campaign", 
    sent: 980, 
    openRate: "45.3%", 
    clickRate: "18.7%", 
    conversionRate: "12.4%", 
    revenue: "$6,230",
    roi: "290%" 
  },
  { 
    id: 5, 
    name: "Weekly Newsletter", 
    sent: 5600, 
    openRate: "52.1%", 
    clickRate: "8.9%", 
    conversionRate: "4.2%", 
    revenue: "$4,890",
    roi: "180%" 
  }
];

const chartConfig = {
  sent: { label: "Sent", color: "#94a3b8" },
  delivered: { label: "Delivered", color: "#3b82f6" },
  opened: { label: "Opened", color: "#22c55e" },
  clicked: { label: "Clicked", color: "#a855f7" },
  converted: { label: "Converted", color: "#f97316" }
};

const CampaignPerformanceComponent = () => {
  const { dateRange } = ImportedUseDateRange();

  return (
    <div className="space-y-6">
      {/* Metrics cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {performanceMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="text-lg sm:text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs sm:text-sm text-green-600 font-medium">{metric.change}</p>
                </div>
                <metric.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Chart and Table should be fully responsive, with overflow-x-auto */}
      {/* Campaign Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Campaign Performance Trends
          </CardTitle>
          <CardDescription>Weekly campaign performance metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] xs:h-[240px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={campaignTrendsData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="var(--color-sent)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="delivered" 
                  stroke="var(--color-delivered)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="opened" 
                  stroke="var(--color-opened)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicked" 
                  stroke="var(--color-clicked)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="converted" 
                  stroke="var(--color-converted)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Performing Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Campaigns</CardTitle>
          <CardDescription>Best performing campaigns ranked by ROI and conversion rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Campaign Name</TableHead>
                  <TableHead className="min-w-[100px]">Messages Sent</TableHead>
                  <TableHead className="min-w-[80px]">Open Rate</TableHead>
                  <TableHead className="min-w-[80px]">Click Rate</TableHead>
                  <TableHead className="min-w-[100px]">Conversion Rate</TableHead>
                  <TableHead className="min-w-[80px]">Revenue</TableHead>
                  <TableHead className="min-w-[60px]">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.sent.toLocaleString()}</TableCell>
                    <TableCell>{campaign.openRate}</TableCell>
                    <TableCell>{campaign.clickRate}</TableCell>
                    <TableCell>{campaign.conversionRate}</TableCell>
                    <TableCell className="font-medium text-green-600">{campaign.revenue}</TableCell>
                    <TableCell className="font-bold text-orange-600">{campaign.roi}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

let didWarnAboutMissingProvider = false;
const CampaignPerformance = (props: any) => {
  let contextOk = true;
  try {
    ImportedUseDateRange();
  } catch (err) {
    contextOk = false;
    if (!didWarnAboutMissingProvider) {
      console.warn("CampaignPerformance: DateRangeProvider missing, using emergency fallback context. This is for direct testing only.");
      didWarnAboutMissingProvider = true;
    }
  }
  if (contextOk) return <CampaignPerformanceComponent {...props} />;

  const today = new Date();
  const fallbackDateRange = {
    from: subDays(today, 7),
    to: today,
  };
  const fallbackContext = {
    dateRange: fallbackDateRange,
    setDateRange: () => {},
  };
  const { DateRangeContext } = require("./ReportingPage");
  return (
    <DateRangeContext.Provider value={fallbackContext}>
      <CampaignPerformanceComponent {...props} />
    </DateRangeContext.Provider>
  );
};

export default CampaignPerformance;
