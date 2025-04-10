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
  dateMode?: 'latest' | 'daily' | 'range';
}

const DeviceColumnChart: React.FC<DeviceColumnChartProps> = ({ 
  data, 
  height = 300,
  limit = 10,
  dateMode = 'latest'
}) => {
  // Process data for chart display based on mode
  const chartData = data
    .map(reading => {
      // Parse timestamp properly from database value
      let dateObj: Date;
      
      if (typeof reading.timestamp === 'string') {
        dateObj = new Date(reading.timestamp);
      } else if (reading.timestamp && typeof reading.timestamp === 'object' && 'getTime' in reading.timestamp) {
        dateObj = reading.timestamp as Date;
      } else {
        dateObj = new Date(reading.timestamp as any);
      }
      
      // Keep database timestamp formatting without timezone conversion
      // This displays the time exactly as stored in the database
      const dbTime = formatInTimeZone(dateObj, 'UTC', 'yyyy-MM-dd HH:mm:ss');
      const displayTime = formatInTimeZone(dateObj, 'UTC', 'HH:mm:ss');
      
      return {
        timestamp: dbTime,
        displayTime: displayTime,
        temperature: reading.temperature,
        humidity: reading.humidity,
        originalTimestamp: reading.timestamp,
        date: dateObj,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by timestamp
  
  // Apply proper data filtering based on mode
  let filteredData = chartData;
  
  if (dateMode === 'latest') {
    // For latest mode, just take the last N readings
    filteredData = chartData.slice(-limit);
  } else if (dateMode === 'daily') {
    // For daily mode, we'll show all data as it's already filtered by parent component
    filteredData = chartData;
  } else if (dateMode === 'range') {
    // For range mode, we'll show all data as it's already filtered by parent component
    filteredData = chartData;
  }

  console.log('DeviceColumnChart filtered data:', filteredData);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={filteredData}
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
