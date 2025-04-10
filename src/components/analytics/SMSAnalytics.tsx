
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MetricsCard } from './MetricsCard';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { MessageSquare, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type SMSLink = {
  id: string;
  link: string;
  clicks: number;
  conversions: number;
  last_clicked: string | null;
  ctr: number;
};

export const SMSAnalytics = () => {
  const [links, setLinks] = useState<SMSLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate summary metrics
  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
  const totalConversions = links.reduce((sum, link) => sum + (link.conversions || 0), 0);
  const overallCTR = totalClicks > 0 
    ? ((totalConversions / totalClicks) * 100).toFixed(1) + '%' 
    : '0.0%';
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Use the generic fetch approach since TypeScript doesn't recognize the sms_analytics table
        const { data, error } = await supabase
          .from('sms_analytics')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        // Cast the data to the correct type
        setLinks(data as unknown as SMSLink[]);
      } catch (err) {
        console.error('Error fetching SMS analytics:', err);
        setError('Failed to load SMS analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  const getLinkName = (url: string) => {
    try {
      // Try to extract a meaningful name from the URL
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        return pathSegments[pathSegments.length - 1];
      }
      return url.replace(/(^\w+:|^)\/\//, '').split('/')[0];
    } catch (e) {
      // If URL parsing fails, just return the raw URL or a portion of it
      return url.substring(0, 30) + (url.length > 30 ? '...' : '');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricsCard 
          title="Total Clicks"
          value={totalClicks.toString()}
          icon={<MessageSquare />}
          color="blue"
        />
        <MetricsCard 
          title="Total Conversions"
          value={totalConversions.toString()}
          icon={<Zap />}
          color="green"
        />
        <MetricsCard 
          title="Overall CTR"
          value={overallCTR}
          icon={<TrendingUp />}
          color="orange"
        />
      </div>
      
      {/* Links Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">SMS Link Performance</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <p>Loading SMS analytics data...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : links.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Last Clicked</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>CTR %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{getLinkName(link.link || '')}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <a 
                        href={link.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {link.link}
                      </a>
                    </TableCell>
                    <TableCell>{link.clicks || 0}</TableCell>
                    <TableCell>{formatDate(link.last_clicked)}</TableCell>
                    <TableCell>{link.conversions || 0}</TableCell>
                    <TableCell>{(link.ctr || 0).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="text-blue-500" size={24} />
            </div>
            <h3 className="text-xl font-medium mb-2">No SMS links found</h3>
            <p className="text-gray-500">Link analytics will appear here once SMS messages with tracked links are sent</p>
          </div>
        )}
      </div>
    </div>
  );
};
