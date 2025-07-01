
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
    color: "#6366F1",
  },
};

export const ResponseRateChart: React.FC<ResponseRateChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No campaign response data available for the selected date range.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="campaign_name" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis 
            label={{ value: 'Response Rate %', angle: -90, position: 'insideLeft' }}
          />
          <ChartTooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded shadow-lg">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-gray-600">
                      Total Recipients: {data.total_recipients}
                    </p>
                    <p className="text-sm text-gray-600">
                      Unique Respondents: {data.unique_respondents}
                    </p>
                    <p className="text-sm font-medium text-blue-600">
                      Response Rate: {data.response_rate}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="response_rate" 
            fill="var(--color-response_rate)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
