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
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DeviceColumnChart: React.FC<DeviceColumnChartProps> = ({ 
  data, 
  height = 300,
  limit = 10,
  dateMode = 'latest',
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [chartData, setChartData] = React.useState<any[]>([]);
  
  // Process data for chart display whenever data changes
  React.useEffect(() => {
    const processedData = data
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
        
        // Format time using UTC to prevent automatic timezone conversion
        // For database timestamp, include full date and time
        const dbTime = formatInTimeZone(dateObj, 'UTC', 'yyyy-MM-dd HH:mm:ss');
        // For display in chart, only show the time portion for better readability
        const displayTime = formatInTimeZone(dateObj, 'UTC', 'HH:mm:ss');
        
        // Log for debugging
        console.log(`Processing reading: Original=${reading.timestamp}, Parsed=${dateObj.toISOString()}, Display=${displayTime}`);
        
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
    let filteredData = processedData;
    
    if (dateMode === 'latest') {
      // For latest mode, just take the last N readings
      filteredData = processedData.slice(-limit);
    } else if (dateMode === 'daily') {
      // For daily mode, ensure we're only showing today's data
      // The data should already be filtered by parent component, but we'll double-check
      
      // Get today's date in UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // 00:00:00 of today in UTC
      
      // Filter to ensure we only show readings from today
      filteredData = processedData.filter(item => {
        return item.date >= today;
      });
      
      console.log(`DeviceColumnChart: Filtered to ${filteredData.length} readings for today`);
    } else if (dateMode === 'range') {
      // For range mode, we'll show all data as it's already filtered by parent component
      filteredData = processedData;
    }

    console.log('DeviceColumnChart filtered data:', filteredData);
    console.log('DeviceColumnChart date mode:', dateMode);
    console.log('First reading timestamp:', filteredData.length > 0 ? filteredData[0].timestamp : 'No data');
    console.log('Last reading timestamp:', filteredData.length > 0 ? filteredData[filteredData.length - 1].timestamp : 'No data');
    
    setChartData(filteredData);
  }, [data, dateMode, limit]);

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
          label={{ value: 'Time (UTC)', position: 'insideBottom', offset: -5 }}
          interval={dateMode === 'daily' ? 2 : 0} // Show fewer ticks for daily mode
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
                  <p className="text-xs text-muted-foreground">Time (UTC): {data.displayTime}</p>
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
