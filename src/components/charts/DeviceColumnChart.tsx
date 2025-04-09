
import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { SensorReading } from '@/types';

interface DeviceColumnChartProps {
  data: SensorReading[];
  height?: number;
}

const DeviceColumnChart: React.FC<DeviceColumnChartProps> = ({ data, height = 300 }) => {
  const chartData = data.map(reading => {
    // Ensure we properly parse the timestamp from the database
    const timestamp = typeof reading.timestamp === 'string' 
      ? parseISO(reading.timestamp)
      : new Date(reading.timestamp);
    
    return {
      timestamp: format(timestamp, 'HH:mm'),
      temperature: reading.temperature,
      humidity: reading.humidity,
      originalTimestamp: reading.timestamp,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          yAxisId="temperature"
          orientation="left"
          tick={{ fontSize: 12 }}
          domain={['dataMin - 5', 'dataMax + 5']}
          label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
        />
        <YAxis
          yAxisId="humidity"
          orientation="right"
          tick={{ fontSize: 12 }}
          domain={[0, 100]}
          label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              // Format the timestamp for the tooltip
              const displayTime = typeof data.originalTimestamp === 'string'
                ? format(parseISO(data.originalTimestamp), 'yyyy-MM-dd HH:mm')
                : format(new Date(data.originalTimestamp), 'yyyy-MM-dd HH:mm');
                
              return (
                <div className="bg-background border rounded p-2 shadow-md">
                  <p className="text-sm font-medium">{displayTime}</p>
                  <p className="text-sm text-[#FF6B6B]">Temperature: {data.temperature}°C</p>
                  <p className="text-sm text-[#4ECDC4]">Humidity: {data.humidity}%</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Bar
          dataKey="temperature"
          name="Temperature"
          yAxisId="temperature"
          fill="#FF6B6B"
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
        <Line
          type="monotone"
          dataKey="humidity"
          name="Humidity"
          yAxisId="humidity"
          stroke="#4ECDC4"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default DeviceColumnChart;
