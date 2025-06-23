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
      value: metrics?.totalSent?.toLocaleString() || "0", 
      icon: MessageSquare, 
      color: "text-blue-600" 
    },
    { 
      label: "Delivered", 
      value: metrics?.delivered?.toLocaleString() || "0", 
      icon: CheckCircle, 
      color: "text-green-600" 
    },
    { 
      label: "Failed", 
      value: metrics?.failed?.toLocaleString() || "0", 
      icon: XCircle, 
      color: "text-red-600" 
    },
    { 
      label: "Pending", 
      value: metrics?.pending?.toLocaleString() || "0", 
      icon: Clock, 
      color: "text-yellow-600" 
    }
  ];

  const deliveryStatusData = [
    { name: 'Delivered', value: metrics?.delivered || 0, color: '#22c55e' },
    { name: 'Failed', value: metrics?.failed || 0, color: '#ef4444' },
    { name: 'Pending', value: metrics?.pending || 0, color: '#eab308' }
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

      {/* Campaign Details Table */}
      {metrics?.campaignData && metrics.campaignData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Details</CardTitle>
            <CardDescription>Individual campaign performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Total Sent</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Delivery Rate</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.campaignData.map((campaign, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                      <TableCell>{campaign.totalSent}</TableCell>
                      <TableCell>{campaign.delivered}</TableCell>
                      <TableCell>{campaign.failed}</TableCell>
                      <TableCell>{campaign.pending}</TableCell>
                      <TableCell>{campaign.deliveryRate}%</TableCell>
                      <TableCell>{campaign.sentDate}</TableCell>
                      <TableCell>
                        <span className={getStatusBadge(campaign.status)}>
                          {campaign.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

        {/* Delivery Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Delivery Performance
            </CardTitle>
            <CardDescription>Overall delivery metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px] xs:h-[240px] sm:h-[300px] text-muted-foreground">
                <p>Loading delivery performance...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {metrics?.deliveryRate}%
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Delivery Rate</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-semibold text-blue-600">{metrics?.totalSent}</div>
                    <p className="text-xs text-muted-foreground">Total Sent</p>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-green-600">{metrics?.delivered}</div>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-red-600">{metrics?.failed}</div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
              </div>
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
          ) : metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Contact</TableHead>
                    <TableHead className="min-w-[140px]">Phone Number</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.contact}</TableCell>
                      <TableCell>{activity.phone}</TableCell>
                      <TableCell>
                        <span className={getStatusBadge(activity.status)}>
                          {activity.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent deliveries found</p>
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
