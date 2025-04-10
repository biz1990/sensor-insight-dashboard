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
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { SensorReading } from '@/types';

interface DeviceColumnChartProps {
  data: SensorReading[];
  height?: number;
  limit?: number;
}

const DeviceColumnChart: React.FC<DeviceColumnChartProps> = ({ 
  data, 
  height = 300,
  limit = 10 
}) => {
  // Process data for chart display and limit to last N values
  const chartData = data
    .map(reading => {
      // Parse timestamp properly to respect the database timestamp exactly
      let timestamp: Date;
      
      if (typeof reading.timestamp === 'string') {
        // Parse ISO string to Date object, keeping the exact time from database
        timestamp = new Date(reading.timestamp);
      } else if (reading.timestamp && typeof reading.timestamp === 'object' && 'getTime' in reading.timestamp) {
        // When timestamp is already a Date object
        timestamp = reading.timestamp;
      } else {
        // Handle when timestamp is a number or other format
        timestamp = new Date(reading.timestamp as any);
      }
      
      // Format time directly from the database time without timezone conversion
      const dbTime = formatInTimeZone(timestamp, 'UTC', 'yyyy-MM-dd HH:mm:ss');
      const displayTime = formatInTimeZone(timestamp, 'UTC', 'HH:mm:ss');
      
      return {
        timestamp: dbTime,
        displayTime: displayTime,
        temperature: reading.temperature,
        humidity: reading.humidity,
        originalTimestamp: reading.timestamp,
      };
    })
    .sort((a, b) => {
      // Sort by timestamp to ensure chronological order
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-limit); // Take only the last N readings

  // Log the timestamp data for debugging
  console.log('DeviceColumnChart chartData:', chartData);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis
          dataKey="displayTime"
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
                
              return (
                <div className="bg-background border rounded p-2 shadow-md">
                  <p className="text-sm font-medium">{data.timestamp}</p>
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
