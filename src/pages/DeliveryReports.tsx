
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { useDateRange as ImportedUseDateRange } from "./ReportingPage";
import { useDeliveryReportMetrics } from "@/hooks/useDeliveryReportMetrics";
import { subDays } from "date-fns";

const chartConfig = {
  sent: { label: "Sent", color: "#3b82f6" },
  delivered: { label: "Delivered", color: "#22c55e" },
  failed: { label: "Failed", color: "#ef4444" },
  pending: { label: "Pending", color: "#eab308" }
};

const DeliveryReportsComponent = () => {
  const { dateRange } = ImportedUseDateRange();
  const { data: metrics, isLoading, error } = useDeliveryReportMetrics(dateRange);

  const deliveryStats = [
    { 
      label: "Total Sent", 
      value: metrics?.total_sent?.toLocaleString() || "0", 
      icon: MessageSquare, 
      color: "text-blue-600" 
    },
    { 
      label: "Delivered", 
      value: metrics?.delivered_count?.toLocaleString() || "0", 
      icon: CheckCircle, 
      color: "text-green-600" 
    },
    { 
      label: "Failed", 
      value: metrics?.failed_count?.toLocaleString() || "0", 
      icon: XCircle, 
      color: "text-red-600" 
    },
    { 
      label: "Pending", 
      value: metrics?.pending_count?.toLocaleString() || "0", 
      icon: Clock, 
      color: "text-yellow-600" 
    }
  ];

  const deliveryStatusData = [
    { name: 'Delivered', value: metrics?.delivered_count || 0, color: '#22c55e' },
    { name: 'Failed', value: metrics?.failed_count || 0, color: '#ef4444' },
    { name: 'Pending', value: metrics?.pending_count || 0, color: '#eab308' }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      Delivered: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
      Pending: "bg-yellow-100 text-yellow-800"
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`;
  };

  if (error) {
    console.error('Error loading delivery metrics:', error);
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading delivery metrics. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  <p className="text-lg sm:text-2xl font-bold">
                    {isLoading ? "..." : stat.value}
                  </p>
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
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px] xs:h-[240px] sm:h-[300px] text-muted-foreground">
                <p>Loading delivery trends...</p>
              </div>
            ) : metrics?.delivery_trends && metrics.delivery_trends.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] xs:h-[240px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.delivery_trends} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
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
            ) : (
              <div className="flex items-center justify-center h-[200px] xs:h-[240px] sm:h-[300px] text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No delivery data available for the selected date range</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Status Breakdown</CardTitle>
            <CardDescription>Current delivery distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px] xs:h-[240px] sm:h-[300px] text-muted-foreground">
                <p>Loading status breakdown...</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Deliveries</CardTitle>
          <CardDescription>Latest message delivery activities</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <p>Loading recent deliveries...</p>
            </div>
          ) : metrics?.recent_deliveries && metrics.recent_deliveries.length > 0 ? (
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
                  {metrics.recent_deliveries.map((delivery) => (
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
          ) : (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent deliveries found for the selected date range</p>
              </div>
            </div>
          )}
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
