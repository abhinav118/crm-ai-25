
import React, { useState } from 'react';
import { MetricsCard } from './MetricsCard';
import { LinksTable } from './LinksTable';
import { BarChart3, Zap, Link2, TrendingUp, Search, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { sampleLinkData } from '@/data/sampleLinkData';

export const LinksAnalytics = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculate summary metrics
  const totalClicks = sampleLinkData.reduce((sum, link) => sum + link.clicks, 0);
  const conversions = sampleLinkData.reduce((sum, link) => sum + link.conversions, 0);
  const activeLinks = sampleLinkData.filter(link => link.isActive).length;
  const avgCTR = totalClicks > 0 ? 
    (conversions / totalClicks * 100).toFixed(1) + '%' : 
    '0.0%';
  
  // Filter links based on search term
  const filteredLinks = sampleLinkData.filter(link => 
    link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.url.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleExport = () => {
    // In a real application, this would export the data to CSV or another format
    console.log('Exporting data...');
  };
  
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard 
          title="Total Clicks"
          value={totalClicks.toString()}
          icon={<BarChart3 />}
          color="blue"
        />
        <MetricsCard 
          title="Conversions"
          value={conversions.toString()}
          icon={<Zap />}
          color="green"
        />
        <MetricsCard 
          title="Active Links"
          value={activeLinks.toString()}
          icon={<Link2 />}
          color="purple"
        />
        <MetricsCard 
          title="Avg. CTR"
          value={avgCTR}
          icon={<TrendingUp />}
          color="orange"
        />
      </div>
      
      {/* Links Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">My Trigger Links</h2>
        </div>
        
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2" size={18} />
              Filter
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2" size={18} />
              Export
            </Button>
          </div>
        </div>
        
        {filteredLinks.length > 0 ? (
          <LinksTable links={filteredLinks} />
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Link2 className="text-blue-500" size={24} />
            </div>
            <h3 className="text-xl font-medium mb-2">No links found</h3>
            <p className="text-gray-500">Get started by creating your first trigger link</p>
          </div>
        )}
      </div>
    </div>
  );
};
