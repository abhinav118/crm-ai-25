
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ResponseRateChartData } from '@/hooks/useResponseReports';

interface ResponseRateChartProps {
  data: ResponseRateChartData[];
}

const ResponseRateChart: React.FC<ResponseRateChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Total Recipients: <span className="font-medium">{data.totalRecipients}</span>
          </p>
          <p className="text-sm text-gray-600">
            Unique Respondents: <span className="font-medium">{data.uniqueRespondents}</span>
          </p>
          <p className="text-sm text-gray-600">
            Response Rate: <span className="font-medium text-[#6366F1]">{data.responseRate}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No response data available for the selected date range.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="campaignName" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Response Rate (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="responseRate" 
            fill="#6366F1" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponseRateChart;
