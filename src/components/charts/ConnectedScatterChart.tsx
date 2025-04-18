
import React, { useState, useEffect } from 'react';
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
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { SensorReading } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoIcon, ZoomInIcon, ZoomOutIcon, RefreshCwIcon } from 'lucide-react';

interface ConnectedScatterChartProps {
  data: SensorReading[];
  compareType: 'temperature' | 'humidity';
  height?: number;
  limit?: number;
  dateMode?: 'latest' | 'daily' | 'range';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface DeviceData {
  id: number;
  name: string;
  data: Array<{
    x: number;
    y: number;
    temperature: number;
    humidity: number;
    timestamp: string | Date;
    formattedTime: string;
    deviceId: number;
  }>;
  color: string;
  visible: boolean;
  min: number;
  max: number;
  avg: number;
}

const ConnectedScatterChart: React.FC<ConnectedScatterChartProps> = ({ 
  data, 
  compareType, 
  height = 400,
  limit = 10,
  dateMode = 'latest',
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [chartData, setChartData] = useState<DeviceData[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Record<number, boolean>>({});
  const [viewMode, setViewMode] = useState<'chart' | 'summary'>('chart');
  const [zoomMode, setZoomMode] = useState(false);
  const [zoomArea, setZoomArea] = useState<{startX: number | null, endX: number | null}>({startX: null, endX: null});
  const [zoomedDomain, setZoomedDomain] = useState<[number, number] | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showAvgLine, setShowAvgLine] = useState(false);
  const [showMinMaxArea, setShowMinMaxArea] = useState(false);
  
  // Generate colors for different devices
  const generateColor = (index: number) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#6BFF95', '#FFE66D', '#7272FF', '#FF72F4',
      '#FF9E7A', '#5D9CEC', '#A0D468', '#FFCE54', '#AC92EC', '#EC87C0',
      '#D770AD', '#F5BA45', '#4FC1E9', '#48CFAD', '#ED5564', '#FC6E51'
    ];
    return colors[index % colors.length];
  };

  // Process and filter data whenever it changes
  useEffect(() => {
    // Group readings by deviceId
    const deviceReadings = data.reduce<Record<number, SensorReading[]>>((acc, reading) => {
      if (!acc[reading.deviceId]) {
        acc[reading.deviceId] = [];
      }
      acc[reading.deviceId].push(reading);
      return acc;
    }, {});

    // Process data for scatter plot with accurate timestamp handling
    const processedData = Object.entries(deviceReadings).map(([deviceId, readings], index) => {
      // First sort readings by timestamp
      const sortedReadings = [...readings].sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });
      
      // Apply filtering based on dateMode
      let filteredReadings = sortedReadings;
      if (dateMode === 'latest') {
        // For latest mode, take the most recent readings up to the limit
        filteredReadings = sortedReadings.slice(-limit);
      } else if (dateMode === 'daily') {
        // For daily mode, ensure we're only showing today's data
        // Get today's date in UTC
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0); // 00:00:00 of today in UTC
        
        // Filter to ensure we only show readings from today
        filteredReadings = sortedReadings.filter(r => {
          const readingDate = new Date(r.timestamp);
          return readingDate >= today;
        });
      } else if (dateMode === 'range') {
        // For range mode, ensure data is sorted by timestamp
        filteredReadings = sortedReadings;
      }
      
      // Map the readings to chart data points
      const mappedData = filteredReadings.map(r => {
        // Handle timestamp properly based on its type without converting to local timezone
        let dateObj: Date;
        
        if (typeof r.timestamp === 'string') {
          dateObj = new Date(r.timestamp);
        } else if (r.timestamp && typeof r.timestamp === 'object' && 'getTime' in r.timestamp) {
          dateObj = r.timestamp as Date;
        } else {
          dateObj = new Date(r.timestamp as any);
        }
        
        // Format time in UTC to prevent timezone conversion
        const formattedTime = formatInTimeZone(dateObj, 'UTC', 'yyyy-MM-dd HH:mm:ss');
          
        return {
          x: dateObj.getTime(),
          y: compareType === 'temperature' ? r.temperature : r.humidity,
          temperature: r.temperature,
          humidity: r.humidity,
          timestamp: r.timestamp,
          formattedTime: formattedTime,
          deviceId: parseInt(deviceId),
        };
      }).sort((a, b) => a.x - b.x); // Sort by timestamp
      
      // Calculate statistics for this device
      const values = mappedData.map(d => d.y);
      const min = values.length ? Math.min(...values) : 0;
      const max = values.length ? Math.max(...values) : 0;
      const avg = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      
      const deviceColor = generateColor(index);
      
      return {
        id: parseInt(deviceId),
        name: `Device ${deviceId}`,
        data: mappedData,
        color: deviceColor,
        visible: true, // Default all devices to visible
        min,
        max,
        avg
      };
    });

    setChartData(processedData);
    
    // Initialize selected devices if not already set
    const initialSelectedDevices: Record<number, boolean> = {};
    processedData.forEach(device => {
      // If we already have a selection state for this device, keep it
      // Otherwise default to true (selected)
      initialSelectedDevices[device.id] = 
        selectedDevices[device.id] !== undefined ? selectedDevices[device.id] : true;
    });
    setSelectedDevices(initialSelectedDevices);
    
  }, [data, compareType, dateMode, limit]);

  // Handle device selection/deselection
  const toggleDeviceVisibility = (deviceId: number) => {
    setSelectedDevices(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  // Select/deselect all devices
  const toggleAllDevices = (selected: boolean) => {
    const newSelection: Record<number, boolean> = {};
    chartData.forEach(device => {
      newSelection[device.id] = selected;
    });
    setSelectedDevices(newSelection);
  };

  // Handle zoom functionality
  const handleMouseDown = (e: any) => {
    if (!zoomMode) return;
    
    const { chartX } = e;
    setZoomArea({ startX: chartX, endX: null });
  };

  const handleMouseMove = (e: any) => {
    if (!zoomMode || zoomArea.startX === null) return;
    
    const { chartX } = e;
    setZoomArea({ startX: zoomArea.startX, endX: chartX });
  };

  const handleMouseUp = () => {
    if (!zoomMode || zoomArea.startX === null || zoomArea.endX === null) {
      setZoomArea({ startX: null, endX: null });
      return;
    }
    
    // Get the domain values from the chart coordinates
    const startX = Math.min(zoomArea.startX, zoomArea.endX);
    const endX = Math.max(zoomArea.startX, zoomArea.endX);
    
    // Only zoom if the area is significant
    if (Math.abs(endX - startX) > 10) {
      setZoomedDomain([startX, endX]);
    }
    
    setZoomArea({ startX: null, endX: null });
  };

  const resetZoom = () => {
    setZoomedDomain(null);
  };

  // Filter chart data based on selected devices
  const visibleChartData = chartData.filter(device => selectedDevices[device.id]);

  // Calculate overall statistics for visible devices
  const calculateStats = () => {
    const allValues: number[] = [];
    visibleChartData.forEach(device => {
      device.data.forEach(point => {
        allValues.push(point.y);
      });
    });
    
    if (allValues.length === 0) return { min: 0, max: 0, avg: 0 };
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const avg = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    
    return { min, max, avg };
  };
  
  const stats = calculateStats();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'chart' | 'summary')}>
          <TabsList>
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="summary">Summary View</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'chart' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setZoomMode(!zoomMode)}
                className={zoomMode ? "bg-muted" : ""}
              >
                {zoomMode ? <ZoomOutIcon className="h-4 w-4 mr-1" /> : <ZoomInIcon className="h-4 w-4 mr-1" />}
                {zoomMode ? "Exit Zoom" : "Zoom Mode"}
              </Button>
              
              {zoomedDomain && (
                <Button variant="outline" size="sm" onClick={resetZoom}>
                  Reset Zoom
                </Button>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-stats" 
                  checked={showStats} 
                  onCheckedChange={() => setShowStats(!showStats)} 
                />
                <Label htmlFor="show-stats">Show Stats</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-avg" 
                  checked={showAvgLine} 
                  onCheckedChange={() => setShowAvgLine(!showAvgLine)} 
                />
                <Label htmlFor="show-avg">Show Average</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-range" 
                  checked={showMinMaxArea} 
                  onCheckedChange={() => setShowMinMaxArea(!showMinMaxArea)} 
                />
                <Label htmlFor="show-range">Show Range</Label>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Device Selection */}
      <div className="bg-muted/30 p-3 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Select Devices to Display</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toggleAllDevices(true)}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={() => toggleAllDevices(false)}>
              Deselect All
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {chartData.map(device => (
            <Badge 
              key={device.id}
              variant={selectedDevices[device.id] ? "default" : "outline"}
              className="cursor-pointer"
              style={{ 
                backgroundColor: selectedDevices[device.id] ? device.color : 'transparent',
                color: selectedDevices[device.id] ? 'white' : device.color,
                borderColor: device.color
              }}
              onClick={() => toggleDeviceVisibility(device.id)}
            >
              {device.name} {device.data.length > 0 && `(${device.data.length})`}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Chart View */}
      {viewMode === 'chart' && (
        <div 
          className="relative" 
          style={{ height: `${height}px` }}
          onMouseLeave={handleMouseUp}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="x"
                type="number"
                scale="time"
                domain={zoomedDomain || ['dataMin', 'dataMax']}
                tickFormatter={(timestamp) => formatInTimeZone(new Date(timestamp), 'UTC', 'HH:mm:ss')}
                name="Time"
                padding={{ left: 20, right: 20 }}
                label={{ value: 'Time (UTC)', position: 'insideBottom', offset: -10 }}
                interval={dateMode === 'daily' ? 2 : 0}
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
                    const deviceData = chartData.find(d => d.id === data.deviceId);
                    const deviceColor = deviceData?.color || '#000';
                      
                    return (
                      <div className="bg-background border rounded p-3 shadow-md">
                        <p className="text-sm font-medium">{data.formattedTime}</p>
                        <p className="text-xs text-muted-foreground">Time (UTC)</p>
                        <p className="text-sm font-medium" style={{ color: deviceColor }}>
                          {payload[0].name}
                        </p>
                        <div className="mt-1 pt-1 border-t">
                          <p className="text-sm text-[#FF6B6B]">Temperature: {data.temperature}°C</p>
                          <p className="text-sm text-[#4ECDC4]">Humidity: {data.humidity}%</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
              
              {/* Show average line if enabled */}
              {showAvgLine && (
                <ReferenceLine 
                  y={stats.avg} 
                  stroke="#888" 
                  strokeDasharray="3 3"
                  label={{ 
                    value: `Avg: ${stats.avg.toFixed(1)}${compareType === 'temperature' ? '°C' : '%'}`,
                    position: 'insideBottomRight'
                  }}
                />
              )}
              
              {/* Show min-max range area if enabled */}
              {showMinMaxArea && (
                <ReferenceArea 
                  y1={stats.min} 
                  y2={stats.max} 
                  fill="#8884d8" 
                  fillOpacity={0.1}
                  stroke="#8884d8"
                  strokeOpacity={0.3}
                  strokeDasharray="3 3"
                />
              )}
              
              {/* Render each device's data */}
              {visibleChartData.map((device) => (
                <Scatter
                  key={device.id}
                  name={device.name}
                  data={device.data}
                  fill={device.color}
                  line={{ stroke: device.color, strokeWidth: 2 }}
                  lineJointType="monotoneX"
                  lineType="joint"
                  shape="circle"
                />
              ))}
              
              {/* Zoom area overlay */}
              {zoomMode && zoomArea.startX !== null && zoomArea.endX !== null && (
                <ReferenceArea
                  x1={Math.min(zoomArea.startX, zoomArea.endX)}
                  x2={Math.max(zoomArea.startX, zoomArea.endX)}
                  strokeOpacity={0.3}
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Zoom instructions */}
          {zoomMode && (
            <div className="absolute top-2 right-2 bg-background/80 p-2 rounded text-xs border">
              Click and drag to zoom in on a specific time range
            </div>
          )}
          
          {/* Stats overlay */}
          {showStats && (
            <div className="absolute top-2 left-2 bg-background/80 p-2 rounded text-xs border">
              <p><strong>Overall Statistics:</strong></p>
              <p>Min: {stats.min.toFixed(1)}{compareType === 'temperature' ? '°C' : '%'}</p>
              <p>Max: {stats.max.toFixed(1)}{compareType === 'temperature' ? '°C' : '%'}</p>
              <p>Avg: {stats.avg.toFixed(1)}{compareType === 'temperature' ? '°C' : '%'}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleChartData.map(device => (
            <Card key={device.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium" style={{ color: device.color }}>{device.name}</h3>
                  <Badge 
                    variant="outline" 
                    style={{ borderColor: device.color, color: device.color }}
                  >
                    {device.data.length} readings
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Min {compareType === 'temperature' ? 'Temp' : 'Humidity'}</span>
                    <span className="font-medium">{device.min.toFixed(1)}{compareType === 'temperature' ? '°C' : '%'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Max {compareType === 'temperature' ? 'Temp' : 'Humidity'}</span>
                    <span className="font-medium">{device.max.toFixed(1)}{compareType === 'temperature' ? '°C' : '%'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average {compareType === 'temperature' ? 'Temp' : 'Humidity'}</span>
                    <span className="font-medium">{device.avg.toFixed(1)}{compareType === 'temperature' ? '°C' : '%'}</span>
                  </div>
                  
                  {device.data.length > 0 && (
                    <div className="flex justify-between items-center pt-2 mt-2 border-t">
                      <span className="text-sm text-muted-foreground">Latest Reading</span>
                      <span className="font-medium">
                        {device.data[device.data.length - 1].y.toFixed(1)}{compareType === 'temperature' ? '°C' : '%'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Mini chart preview */}
                <div className="h-20 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <Line
                        type="monotone"
                        dataKey="y"
                        data={device.data}
                        stroke={device.color}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Overall stats card */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Overall Statistics</h3>
                <Badge variant="outline">
                  {visibleChartData.length} devices
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Min {compareType === 'temperature' ? 'Temp' : 'Humidity'}</span>
                  <span className="font-medium">{stats.min.toFixed(1)}{compareType === 'temperature' ? '°C' : '%'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max {compareType === 'temperature' ? 'Temp' : 'Humidity'}</span>
                  <span className="font-medium">{stats.max.toFixed(1)}{compareType === 'temperature' ? '°C' : '%'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average {compareType === 'temperature' ? 'Temp' : 'Humidity'}</span>
                  <span className="font-medium">{stats.avg.toFixed(1)}{compareType === 'temperature' ? '°C' : '%'}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2 mt-2 border-t">
                  <span className="text-sm text-muted-foreground">Total Readings</span>
                  <span className="font-medium">
                    {visibleChartData.reduce((sum, device) => sum + device.data.length, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* No data message */}
      {visibleChartData.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <InfoIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No device data selected. Please select at least one device to display.</p>
        </div>
      )}
    </div>
  );
};

export default ConnectedScatterChart;
