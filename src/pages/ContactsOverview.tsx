
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, UserPlus, TrendingDown, Activity } from "lucide-react";
import { useDateRange as ImportedUseDateRange } from "./ReportingPage";
import { useContactsMetrics } from "@/hooks/useContactsMetrics";
import { subDays } from "date-fns";

const chartConfig = {
  total: { label: "Total Contacts", color: "#3b82f6" },
  active: { label: "Active Contacts", color: "#22c55e" },
  new: { label: "New Contacts", color: "#a855f7" }
};

const ContactsOverviewComponent = () => {
  const { dateRange } = ImportedUseDateRange();
  const { data: metrics, isLoading, error } = useContactsMetrics(dateRange);

  const contactStats = [
    { 
      label: "Total Contacts", 
      value: metrics?.total_contacts?.toLocaleString() || "0", 
      icon: Users, 
      color: "text-blue-600", 
      change: `+${metrics?.new_contacts || 0}` 
    },
    { 
      label: "Active Contacts", 
      value: metrics?.active_contacts?.toLocaleString() || "0", 
      icon: Activity, 
      color: "text-green-600", 
      change: "+890" 
    },
    { 
      label: "New This Month", 
      value: metrics?.new_contacts?.toLocaleString() || "0", 
      icon: UserPlus, 
      color: "text-purple-600", 
      change: "+18%" 
    },
    { 
      label: "Churn Rate", 
      value: `${metrics?.churn_rate?.toFixed(1) || "0.0"}%`, 
      icon: TrendingDown, 
      color: "text-red-600", 
      change: "-0.3%" 
    }
  ];

  const getGrowthBadge = (growth: string) => {
    const isPositive = growth.startsWith('+');
    return `px-2 py-1 rounded-full text-xs font-medium ${
      isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`;
  };

  if (error) {
    console.error('Error loading contacts metrics:', error);
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading contacts metrics. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {contactStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {isLoading ? "..." : stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-green-600 font-medium">{stat.change}</p>
                </div>
                <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Charts side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Growth Trends</CardTitle>
            <CardDescription>Monthly contact acquisition and activity trends</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px] xs:h-[240px] sm:h-[300px] text-muted-foreground">
                <p>Loading growth trends...</p>
              </div>
            ) : metrics?.growth_data && metrics.growth_data.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] xs:h-[240px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.growth_data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stackId="1"
                      stroke="var(--color-total)" 
                      fill="var(--color-total)"
                      fillOpacity={0.1}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="active" 
                      stackId="2"
                      stroke="var(--color-active)" 
                      fill="var(--color-active)"
                      fillOpacity={0.2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="new" 
                      stackId="3"
                      stroke="var(--color-new)" 
                      fill="var(--color-new)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] xs:h-[240px] sm:h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No contact data available for the selected date range</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Segments Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Segments</CardTitle>
            <CardDescription>Distribution by customer type and engagement level</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px] xs:h-[240px] sm:h-[300px] text-muted-foreground">
                <p>Loading segment data...</p>
              </div>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-[200px] xs:h-[240px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics?.segment_data || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(metrics?.segment_data || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                  {(metrics?.segment_data || []).map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{item.value.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-2">({item.engagement})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table: make sure it scrolls on mobile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Segment Performance</CardTitle>
          <CardDescription>Detailed performance metrics for each contact segment</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <p>Loading segment performance...</p>
            </div>
          ) : metrics?.segment_performance && metrics.segment_performance.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Segment</TableHead>
                    <TableHead className="min-w-[80px]">Contacts</TableHead>
                    <TableHead className="min-w-[80px]">Growth</TableHead>
                    <TableHead className="min-w-[100px]">Engagement Rate</TableHead>
                    <TableHead className="min-w-[80px]">Avg. Value</TableHead>
                    <TableHead className="min-w-[100px]">Retention Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.segment_performance.map((segment) => (
                    <TableRow key={segment.segment}>
                      <TableCell className="font-medium">{segment.segment}</TableCell>
                      <TableCell>{segment.contacts.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={getGrowthBadge(segment.growth)}>
                          {segment.growth}
                        </span>
                      </TableCell>
                      <TableCell>{segment.engagement}</TableCell>
                      <TableCell className="font-medium">{segment.avgValue}</TableCell>
                      <TableCell>{segment.retention}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No segment performance data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Same fallback context trick as other components
let didWarnAboutMissingProvider = false;
const ContactsOverview = (props: any) => {
  let contextOk = true;
  try {
    ImportedUseDateRange();
  } catch (err) {
    contextOk = false;
    if (!didWarnAboutMissingProvider) {
      console.warn("ContactsOverview: DateRangeProvider missing, using emergency fallback context. This is for direct testing only.");
      didWarnAboutMissingProvider = true;
    }
  }
  if (contextOk) return <ContactsOverviewComponent {...props} />;

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
      <ContactsOverviewComponent {...props} />
    </DateRangeContext.Provider>
  );
};

export default ContactsOverview;
