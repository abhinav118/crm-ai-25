
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Users, MessageSquare, Calendar } from "lucide-react";

interface SegmentPerformance {
  segment: string;
  contacts: number;
  growth: string;
  engagement: string;
  avgValue: string;
  retention: string;
  campaigns_sent: number;
  response_rate: string;
  last_campaign: string;
}

interface EnhancedSegmentTableProps {
  segmentPerformance: SegmentPerformance[];
  isLoading: boolean;
}

export const EnhancedSegmentTable: React.FC<EnhancedSegmentTableProps> = ({
  segmentPerformance,
  isLoading
}) => {
  const getGrowthBadge = (growth: string) => {
    const isPositive = growth.startsWith('+');
    const isNeutral = growth === '0%';
    
    return (
      <Badge 
        variant={isPositive ? "default" : isNeutral ? "secondary" : "destructive"}
        className={`flex items-center gap-1 ${
          isPositive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
          isNeutral ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800 hover:bg-red-200'
        }`}
      >
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {!isPositive && !isNeutral && <TrendingDown className="h-3 w-3" />}
        {growth}
      </Badge>
    );
  };

  const getEngagementColor = (engagement: string) => {
    const rate = parseFloat(engagement.replace('%', ''));
    if (rate >= 70) return 'text-green-600 font-semibold';
    if (rate >= 40) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!segmentPerformance || segmentPerformance.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No segment performance data available</p>
          <p className="text-sm mt-2">Create segments to track performance metrics</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">Segment</TableHead>
              <TableHead className="min-w-[80px]">Contacts</TableHead>
              <TableHead className="min-w-[100px]">Growth</TableHead>
              <TableHead className="min-w-[120px]">Engagement Rate</TableHead>
              <TableHead className="min-w-[100px]">Response Rate</TableHead>
              <TableHead className="min-w-[100px]">Retention Rate</TableHead>
              <TableHead className="min-w-[100px]">Campaigns Sent</TableHead>
              <TableHead className="min-w-[120px]">Last Campaign</TableHead>
              <TableHead className="min-w-[100px]">Avg. Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segmentPerformance.map((segment) => (
              <TableRow key={segment.segment} className="hover:bg-gray-50">
                <TableCell className="font-medium">{segment.segment}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    {segment.contacts.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  {getGrowthBadge(segment.growth)}
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className={getEngagementColor(segment.engagement)}>
                        {segment.engagement}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based on contact activity and responses</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{segment.response_rate}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={getEngagementColor(segment.retention)}>
                    {segment.retention}
                  </span>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="font-medium">{segment.campaigns_sent.toLocaleString()}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total messages sent to this segment</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{segment.last_campaign}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{segment.avgValue}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};
