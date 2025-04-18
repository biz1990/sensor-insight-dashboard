import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, AlertTriangle } from 'lucide-react';
import { Device } from '@/types';

interface IndoorClimateSummaryProps {
  devices: Device[];
  thresholds?: {
    minTemperature: number;
    maxTemperature: number;
    minHumidity: number;
    maxHumidity: number;
  };
  className?: string;
}

const IndoorClimateSummary: React.FC<IndoorClimateSummaryProps> = ({
  devices,
  thresholds,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'temperature' | 'humidity'>('temperature');
  const [averageTemp, setAverageTemp] = useState<number | null>(null);
  const [averageHumidity, setAverageHumidity] = useState<number | null>(null);
  const [tempRange, setTempRange] = useState<{min: number, max: number} | null>(null);
  const [humidityRange, setHumidityRange] = useState<{min: number, max: number} | null>(null);
  const [deviceCount, setDeviceCount] = useState<number>(0);

  // Calculate average indoor temperature and humidity
  useEffect(() => {
    if (!devices.length) return;

    const onlineDevices = devices.filter(d => 
      d.status === 'online' || d.status === 'warning' || d.status === 'error'
    );
    
    if (!onlineDevices.length) {
      setAverageTemp(null);
      setAverageHumidity(null);
      setTempRange(null);
      setHumidityRange(null);
      setDeviceCount(0);
      return;
    }

    const devicesWithReadings = onlineDevices.filter(d => d.lastReading);
    
    if (!devicesWithReadings.length) {
      setAverageTemp(null);
      setAverageHumidity(null);
      setTempRange(null);
      setHumidityRange(null);
      setDeviceCount(0);
      return;
    }

    // Calculate temperature stats
    const temperatures = devicesWithReadings.map(d => d.lastReading!.temperature);
    const avgTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);
    
    // Calculate humidity stats
    const humidities = devicesWithReadings.map(d => d.lastReading!.humidity);
    const avgHumidity = humidities.reduce((sum, hum) => sum + hum, 0) / humidities.length;
    const minHumidity = Math.min(...humidities);
    const maxHumidity = Math.max(...humidities);
    
    setAverageTemp(parseFloat(avgTemp.toFixed(1)));
    setAverageHumidity(parseFloat(avgHumidity.toFixed(1)));
    setTempRange({ min: minTemp, max: maxTemp });
    setHumidityRange({ min: minHumidity, max: maxHumidity });
    setDeviceCount(devicesWithReadings.length);
  }, [devices]);

  // Check if temperature is outside of thresholds
  const isTempOutsideThreshold = () => {
    if (!thresholds || !averageTemp) return false;
    return averageTemp < thresholds.minTemperature || 
           averageTemp > thresholds.maxTemperature;
  };

  // Check if humidity is outside of thresholds
  const isHumidityOutsideThreshold = () => {
    if (!thresholds || !averageHumidity) return false;
    return averageHumidity < thresholds.minHumidity || 
           averageHumidity > thresholds.maxHumidity;
  };

  // Calculate temperature percentage for visualization
  const getTempPercentage = () => {
    if (!thresholds || !averageTemp) return 50;
    
    const min = thresholds.minTemperature - 5; // Add some padding
    const max = thresholds.maxTemperature + 5; // Add some padding
    const range = max - min;
    
    // Calculate percentage (clamped between 0-100)
    const percentage = ((averageTemp - min) / range) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  // Calculate humidity percentage for visualization
  const getHumidityPercentage = () => {
    if (!thresholds || !averageHumidity) return 50;
    
    // Humidity is naturally 0-100, but we'll use the thresholds to determine the "good" range
    const min = Math.max(0, thresholds.minHumidity - 10); // Add some padding
    const max = Math.min(100, thresholds.maxHumidity + 10); // Add some padding
    const range = max - min;
    
    // Calculate percentage (clamped between 0-100)
    const percentage = ((averageHumidity - min) / range) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>Indoor Climate Summary</CardTitle>
        <CardDescription>Average readings across all sensors</CardDescription>
      </CardHeader>
      <CardContent>
        {averageTemp === null ? (
          <div className="text-center py-4 text-muted-foreground">
            No sensor data available
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'temperature' | 'humidity')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="temperature">Temperature</TabsTrigger>
              <TabsTrigger value="humidity">Humidity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="temperature" className="space-y-4">
              <div className="flex items-center gap-3">
                <Thermometer className={`h-8 w-8 ${isTempOutsideThreshold() ? 'text-red-500' : 'text-blue-500'}`} />
                <div>
                  <div className="text-sm font-medium">Average Temperature</div>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    {averageTemp}°C
                    {isTempOutsideThreshold() && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Temperature range info */}
              {tempRange && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div>Range: {tempRange.min}°C - {tempRange.max}°C</div>
                  <div>
                    {deviceCount} active sensors
                  </div>
                </div>
              )}

              {/* Temperature visualization */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Min: {thresholds?.minTemperature}°C</span>
                  <span>Max: {thresholds?.maxTemperature}°C</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isTempOutsideThreshold() ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${getTempPercentage()}%` }}
                  />
                </div>
              </div>

              {/* Status badge */}
              <div className="flex justify-center mt-2">
                <Badge 
                  variant="outline" 
                  className={`${isTempOutsideThreshold() ? 'text-red-500 border-red-500' : 'text-green-500 border-green-500'}`}
                >
                  {isTempOutsideThreshold() 
                    ? 'Outside recommended range' 
                    : 'Within recommended range'}
                </Badge>
              </div>
            </TabsContent>
            
            <TabsContent value="humidity" className="space-y-4">
              <div className="flex items-center gap-3">
                <Droplets className={`h-8 w-8 ${isHumidityOutsideThreshold() ? 'text-red-500' : 'text-blue-500'}`} />
                <div>
                  <div className="text-sm font-medium">Average Humidity</div>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    {averageHumidity}%
                    {isHumidityOutsideThreshold() && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Humidity range info */}
              {humidityRange && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div>Range: {humidityRange.min}% - {humidityRange.max}%</div>
                  <div>
                    {deviceCount} active sensors
                  </div>
                </div>
              )}

              {/* Humidity visualization */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Min: {thresholds?.minHumidity}%</span>
                  <span>Max: {thresholds?.maxHumidity}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isHumidityOutsideThreshold() ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${getHumidityPercentage()}%` }}
                  />
                </div>
              </div>

              {/* Status badge */}
              <div className="flex justify-center mt-2">
                <Badge 
                  variant="outline" 
                  className={`${isHumidityOutsideThreshold() ? 'text-red-500 border-red-500' : 'text-green-500 border-green-500'}`}
                >
                  {isHumidityOutsideThreshold() 
                    ? 'Outside recommended range' 
                    : 'Within recommended range'}
                </Badge>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default IndoorClimateSummary;