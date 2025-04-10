
import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { SensorReading } from '@/types';

interface ConnectedScatterChartProps {
  data: SensorReading[];
  compareType: 'temperature' | 'humidity';
  height?: number;
}

const ConnectedScatterChart: React.FC<ConnectedScatterChartProps> = ({ 
  data, 
  compareType, 
  height = 400 
}) => {
  // Group readings by deviceId
  const deviceReadings = data.reduce<Record<number, SensorReading[]>>((acc, reading) => {
    if (!acc[reading.deviceId]) {
      acc[reading.deviceId] = [];
    }
    acc[reading.deviceId].push(reading);
    return acc;
  }, {});

  // Process data for scatter plot with accurate timestamp handling
  const scatterData = Object.entries(deviceReadings).map(([deviceId, readings]) => {
    return {
      id: deviceId,
      name: `Device ${deviceId}`,
      data: readings.map(r => {
        // Handle timestamp properly based on its type without converting to local timezone
        let timestamp: number;
        let dateObj: Date;
        
        if (typeof r.timestamp === 'string') {
          dateObj = new Date(r.timestamp);
          timestamp = dateObj.getTime();
        } else if (r.timestamp && typeof r.timestamp === 'object' && 'getTime' in r.timestamp) {
          dateObj = r.timestamp as Date;
          timestamp = dateObj.getTime();
        } else {
          // Handle when timestamp is a number or other format
          dateObj = new Date(r.timestamp as any);
          timestamp = dateObj.getTime();
        }
        
        // Format time directly with database time
        const formattedTime = formatInTimeZone(dateObj, 'UTC', 'yyyy-MM-dd HH:mm:ss');
          
        return {
          x: timestamp,
          y: compareType === 'temperature' ? r.temperature : r.humidity,
          temperature: r.temperature,
          humidity: r.humidity,
          timestamp: r.timestamp,
          formattedTime: formattedTime,
        };
      }).sort((a, b) => a.x - b.x), // Sort by timestamp
    };
  });

  // Log for debugging
  console.log('ConnectedScatterChart data:', scatterData);

  // Generate colors for different devices
  const generateColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#6BFF95', '#FFE66D', '#7272FF', '#FF72F4'];
    return colors[index % colors.length];
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis
          dataKey="x"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(timestamp) => formatInTimeZone(new Date(timestamp), 'UTC', 'HH:mm:ss')}
          name="Time"
          padding={{ left: 20, right: 20 }}
          label={{ value: 'Time', position: 'insideBottom', offset: -10 }}
        />
        <YAxis
          dataKey="y"
          name={compareType === 'temperature' ? 'Temperature (°C)' : 'Humidity (%)'}
          domain={compareType === 'temperature' ? ['dataMin - 5', 'dataMax + 5'] : [0, 100]}
          label={{ 
            value: compareType === 'temperature' ? 'Temperature (°C)' : 'Humidity (%)', 
            angle: -90, 
            position: 'insideLeft' 
          }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
                
              return (
                <div className="bg-background border rounded p-2 shadow-md">
                  <p className="text-sm font-medium">{data.formattedTime}</p>
                  <p className="text-sm">Device: {payload[0].name}</p>
                  <p className="text-sm text-[#FF6B6B]">Temperature: {data.temperature}°C</p>
                  <p className="text-sm text-[#4ECDC4]">Humidity: {data.humidity}%</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        
        {scatterData.map((device, index) => (
          <React.Fragment key={device.id}>
            <Scatter
              name={device.name}
              data={device.data}
              fill={generateColor(index)}
              line={true}
              lineJointType="monotoneX"
              lineType="joint"
              shape="circle"
            />
          </React.Fragment>
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default ConnectedScatterChart;
