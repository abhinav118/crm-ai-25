
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, UserPlus, TrendingDown, Activity, Download } from "lucide-react";

// Sample data
const contactStats = [
  { label: "Total Contacts", value: "24,580", icon: Users, color: "text-blue-600", change: "+1,250" },
  { label: "Active Contacts", value: "18,940", icon: Activity, color: "text-green-600", change: "+890" },
  { label: "New This Month", value: "1,250", icon: UserPlus, color: "text-purple-600", change: "+18%" },
  { label: "Churn Rate", value: "2.4%", icon: TrendingDown, color: "text-red-600", change: "-0.3%" }
];

const contactGrowthData = [
  { month: 'Jan', total: 18500, active: 14200, new: 850 },
  { month: 'Feb', total: 19200, active: 14800, new: 920 },
  { month: 'Mar', total: 20100, active: 15600, new: 1100 },
  { month: 'Apr', total: 21400, active: 16500, new: 1350 },
  { month: 'May', total: 22800, active: 17800, new: 1480 },
  { month: 'Jun', total: 24580, active: 18940, new: 1250 }
];

const segmentData = [
  { name: 'VIP Customers', value: 3200, color: '#f59e0b', engagement: '89%' },
  { name: 'Regular Customers', value: 12500, color: '#3b82f6', engagement: '67%' },
  { name: 'New Subscribers', value: 4800, color: '#22c55e', engagement: '54%' },
  { name: 'Inactive Users', value: 4080, color: '#ef4444', engagement: '12%' }
];

const segmentPerformance = [
  { 
    segment: 'VIP Customers',
    contacts: 3200,
    growth: '+12%',
    engagement: '89%',
    avgValue: '$145',
    retention: '94%'
  },
  { 
    segment: 'Regular Customers',
    contacts: 12500,
    growth: '+8%',
    engagement: '67%',
    avgValue: '$85',
    retention: '78%'
  },
  { 
    segment: 'New Subscribers',
    contacts: 4800,
    growth: '+24%',
    engagement: '54%',
    avgValue: '$32',
    retention: '65%'
  },
  { 
    segment: 'Loyal Shoppers',
    contacts: 2890,
    growth: '+15%',
    engagement: '82%',
    avgValue: '$125',
    retention: '91%'
  },
  { 
    segment: 'Inactive Users',
    contacts: 4080,
    growth: '-5%',
    engagement: '12%',
    avgValue: '$8',
    retention: '23%'
  }
];

const chartConfig = {
  total: { label: "Total Contacts", color: "#3b82f6" },
  active: { label: "Active Contacts", color: "#22c55e" },
  new: { label: "New Contacts", color: "#a855f7" }
};

const ContactsOverview = () => {
  const getGrowthBadge = (growth: string) => {
    const isPositive = growth.startsWith('+');
    return `px-2 py-1 rounded-full text-xs font-medium ${
      isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Contacts Overview</h2>
          <p className="text-muted-foreground">Monitor contact growth, engagement, and segment performance</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Contact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {contactStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-green-600 font-medium">{stat.change}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Growth Trends</CardTitle>
            <CardDescription>Monthly contact acquisition and activity trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={contactGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
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
          </CardContent>
        </Card>

        {/* Contact Segments Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Segments</CardTitle>
            <CardDescription>Distribution by customer type and engagement level</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {segmentData.map((item) => (
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
          </CardContent>
        </Card>
      </div>

      {/* Segment Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Performance</CardTitle>
          <CardDescription>Detailed performance metrics for each contact segment</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Growth</TableHead>
                <TableHead>Engagement Rate</TableHead>
                <TableHead>Avg. Value</TableHead>
                <TableHead>Retention Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segmentPerformance.map((segment) => (
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsOverview;
