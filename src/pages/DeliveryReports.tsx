import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { useDateRange as ImportedUseDateRange } from "./ReportingPage";
import { subDays } from "date-fns";

// Sample data
const deliveryStats = [
  { label: "Total Sent", value: "12,450", icon: MessageSquare, color: "text-blue-600" },
  { label: "Delivered", value: "11,890", icon: CheckCircle, color: "text-green-600" },
  { label: "Failed", value: "340", icon: XCircle, color: "text-red-600" },
  { label: "Pending", value: "220", icon: Clock, color: "text-yellow-600" }
];

const deliveryTrendsData = [
  { day: 'Mon', sent: 1800, delivered: 1720, failed: 45, pending: 35 },
  { day: 'Tue', sent: 2100, delivered: 2010, failed: 55, pending: 35 },
  { day: 'Wed', sent: 1950, delivered: 1855, failed: 60, pending: 35 },
  { day: 'Thu', sent: 2200, delivered: 2090, failed: 70, pending: 40 },
  { day: 'Fri', sent: 2400, delivered: 2280, failed: 80, pending: 40 },
  { day: 'Sat', sent: 1600, delivered: 1520, failed: 50, pending: 30 },
  { day: 'Sun', sent: 1400, delivered: 1355, failed: 30, pending: 15 }
];

const deliveryStatusData = [
  { name: 'Delivered', value: 11890, color: '#22c55e' },
  { name: 'Failed', value: 340, color: '#ef4444' },
  { name: 'Pending', value: 220, color: '#eab308' }
];

const recentDeliveries = [
  { id: 1, recipientName: "John Smith", recipient: "+1 (555) 123-4567", status: "Delivered", timestamp: "2 mins ago", deliveryTime: "1.2s" },
  { id: 2, recipientName: "Sarah Johnson", recipient: "+1 (555) 987-6543", status: "Delivered", timestamp: "5 mins ago", deliveryTime: "0.8s" },
  { id: 3, recipientName: "Mike Wilson", recipient: "+1 (555) 246-8135", status: "Failed", timestamp: "12 mins ago", deliveryTime: "-" },
  { id: 4, recipientName: "Emily Davis", recipient: "+1 (555) 369-2580", status: "Delivered", timestamp: "18 mins ago", deliveryTime: "1.5s" },
  { id: 5, recipientName: "Robert Brown", recipient: "+1 (555) 147-8520", status: "Pending", timestamp: "25 mins ago", deliveryTime: "-" }
];

const chartConfig = {
  sent: { label: "Sent", color: "#3b82f6" },
  delivered: { label: "Delivered", color: "#22c55e" },
  failed: { label: "Failed", color: "#ef4444" },
  pending: { label: "Pending", color: "#eab308" }
};

const DeliveryReportsComponent = () => {
  const { dateRange } = ImportedUseDateRange();

  const getStatusBadge = (status: string) => {
    const styles = {
      Delivered: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
      Pending: "bg-yellow-100 text-yellow-800"
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {deliveryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Delivery Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Delivery Trends (Last 7 Days)
            </CardTitle>
            <CardDescription>Daily message delivery performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] xs:h-[240px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deliveryTrendsData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="delivered" fill="var(--color-delivered)" />
                  <Bar dataKey="failed" fill="var(--color-failed)" />
                  <Bar dataKey="pending" fill="var(--color-pending)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Delivery Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Status Breakdown</CardTitle>
            <CardDescription>Current month delivery distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] xs:h-[240px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deliveryStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {deliveryStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deliveries Table - ensure it scrolls on mobile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Deliveries</CardTitle>
          <CardDescription>Latest message delivery activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Recipient Name</TableHead>
                  <TableHead className="min-w-[140px]">Phone Number</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Delivery Time</TableHead>
                  <TableHead className="min-w-[120px]">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">{delivery.recipientName}</TableCell>
                    <TableCell>{delivery.recipient}</TableCell>
                    <TableCell>
                      <span className={getStatusBadge(delivery.status)}>
                        {delivery.status}
                      </span>
                    </TableCell>
                    <TableCell>{delivery.deliveryTime}</TableCell>
                    <TableCell className="text-muted-foreground">{delivery.timestamp}</TableCell>
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

// Same fallback context trick as MessagesOverview
let didWarnAboutMissingProvider = false;
const DeliveryReports = (props: any) => {
  let contextOk = true;
  try {
    ImportedUseDateRange();
  } catch (err) {
    contextOk = false;
    if (!didWarnAboutMissingProvider) {
      console.warn("DeliveryReports: DateRangeProvider missing, using emergency fallback context. This is for direct testing only.");
      didWarnAboutMissingProvider = true;
    }
  }
  if (contextOk) return <DeliveryReportsComponent {...props} />;

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
      <DeliveryReportsComponent {...props} />
    </DateRangeContext.Provider>
  );
};

export default DeliveryReports;
