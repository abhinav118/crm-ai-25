
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ResponseRateData } from '@/hooks/useResponseReports';

interface ResponseRateChartProps {
  data: ResponseRateData[];
}

const chartConfig = {
  response_rate: {
    label: "Response Rate %",
    color: "#8B5CF6",
  },
};

export const ResponseRateChart: React.FC<ResponseRateChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-lg font-medium text-gray-600">No Campaign Data Available</p>
          <p className="text-sm text-gray-500">Response rate data will appear here when campaigns are completed</p>
        </div>
      </div>
    );
  }

  // Sort data by response rate for better visualization
  const sortedData = [...data].sort((a, b) => b.response_rate - a.response_rate);

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={sortedData} 
          layout="horizontal"
          margin={{ top: 20, right: 60, left: 120, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            type="category"
            dataKey="campaign_name"
            width={110}
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <ChartTooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">📤 Sent:</span>
                        <span className="font-medium">{data.total_recipients}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">💬 Replied:</span>
                        <span className="font-medium">{data.unique_respondents}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-1 mt-2">
                        <span className="text-gray-600">📊 Response Rate:</span>
                        <span className="font-bold text-purple-600">{data.response_rate}%</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="response_rate" 
            fill="var(--color-response_rate)"
            radius={[0, 4, 4, 0]}
            stroke="#8B5CF6"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
