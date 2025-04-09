
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Save } from 'lucide-react';
import { WarningThreshold, Device } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getWarningThresholds, updateWarningThresholds, getDevicesWithLatestReadings } from '@/services/databaseService';
import { Loader2 } from 'lucide-react';

const ThresholdsAdmin = () => {
  const [thresholds, setThresholds] = useState<WarningThreshold | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [warningDevices, setWarningDevices] = useState<Device[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    fetchThresholds();
    fetchDevices();
    
    // Set up auto-refresh every 5 minutes (300000ms)
    const intervalId = setInterval(() => {
      fetchThresholds();
      fetchDevices();
    }, 300000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Monitor devices for warnings based on thresholds
  useEffect(() => {
    if (thresholds && devices.length > 0) {
      const devicesWithWarnings = devices.filter(device => {
        if (!device.lastReading) return false;
        
        const { temperature, humidity } = device.lastReading;
        return (
          temperature < thresholds.minTemperature ||
          temperature > thresholds.maxTemperature ||
          humidity < thresholds.minHumidity ||
          humidity > thresholds.maxHumidity
        );
      });
      
      setWarningDevices(devicesWithWarnings);
    }
  }, [thresholds, devices]);

  const fetchDevices = async () => {
    try {
      const fetchedDevices = await getDevicesWithLatestReadings();
      setDevices(fetchedDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch device data.",
        variant: "destructive",
      });
    }
  };

  const fetchThresholds = async () => {
    setIsLoading(true);
    try {
      const fetchedThresholds = await getWarningThresholds();
      setThresholds(fetchedThresholds);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      toast({
        title: "Error",
        description: "Failed to load threshold settings. Using default values.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveThresholds = async () => {
    if (!thresholds) return;
    
    setIsSaving(true);
    try {
      const updatedThreshold: Partial<WarningThreshold> = {
        minTemperature: thresholds.minTemperature,
        maxTemperature: thresholds.maxTemperature,
        minHumidity: thresholds.minHumidity,
        maxHumidity: thresholds.maxHumidity,
        updatedBy: 1, // Assuming the current user ID
      };
      
      const result = await updateWarningThresholds(updatedThreshold);
      if (result) {
        setThresholds(result);
      }
      
      toast({
        title: "Thresholds updated",
        description: "Warning thresholds have been updated successfully.",
      });
      
      // Refresh devices to update warning statuses
      fetchDevices();
    } catch (error) {
      console.error('Error updating thresholds:', error);
      toast({
        title: "Error",
        description: "Failed to update warning thresholds.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof WarningThreshold, value: number) => {
    if (!thresholds) return;
    
    // Validate ranges
    let validatedValue = value;
    
    if (field === 'minTemperature' && value >= thresholds.maxTemperature) {
      validatedValue = thresholds.maxTemperature - 1;
    }
    
    if (field === 'maxTemperature' && value <= thresholds.minTemperature) {
      validatedValue = thresholds.minTemperature + 1;
    }
    
    if (field === 'minHumidity' && value >= thresholds.maxHumidity) {
      validatedValue = thresholds.maxHumidity - 1;
    }
    
    if (field === 'maxHumidity' && value <= thresholds.minHumidity) {
      validatedValue = thresholds.minHumidity + 1;
    }
    
    setThresholds({
      ...thresholds,
      [field]: validatedValue,
    });
  };

  const handleRefresh = () => {
    fetchThresholds();
    fetchDevices();
    toast({
      title: "Data refreshed",
      description: "The latest threshold and device data has been loaded.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warning Thresholds</h1>
          <p className="text-muted-foreground">
            Set warning thresholds for temperature and humidity
          </p>
        </div>
        
        <Button 
          onClick={handleRefresh}
          className="gap-2 mr-2"
          variant="outline"
        >
          <Loader2 className="h-4 w-4" />
          Refresh Data
        </Button>
        
        <Button 
          onClick={handleSaveThresholds} 
          disabled={isLoading || !thresholds || isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Warning Devices Section */}
      {warningDevices.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Devices with Warnings</AlertTitle>
          <AlertDescription>
            <p className="mb-2">The following devices have readings outside the threshold limits:</p>
            <ul className="list-disc pl-5">
              {warningDevices.map(device => (
                <li key={device.id} className="mb-1">
                  <strong>{device.name}</strong>: {device.lastReading && (
                    <>
                      {device.lastReading.temperature}°C / {device.lastReading.humidity}%
                      {device.lastReading.timestamp && (
                        <span className="text-xs ml-2">
                          ({new Date(device.lastReading.timestamp).toLocaleString()})
                        </span>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Loading thresholds...</p>
        </div>
      ) : thresholds ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 temperature-text" />
                Temperature Thresholds
              </CardTitle>
              <CardDescription>
                Set minimum and maximum acceptable temperature values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="minTemp">Minimum Temperature (°C)</Label>
                      <span className="text-sm">{thresholds.minTemperature}°C</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">0°C</span>
                      <Slider
                        id="minTemp"
                        min={0}
                        max={50}
                        step={0.5}
                        value={[thresholds.minTemperature]}
                        onValueChange={(values) => handleInputChange('minTemperature', values[0])}
                        className="flex-1"
                      />
                      <span className="text-sm">50°C</span>
                    </div>
                    <div className="mt-2">
                      <Input
                        type="number"
                        value={thresholds.minTemperature}
                        onChange={(e) => handleInputChange('minTemperature', parseFloat(e.target.value))}
                        min={0}
                        max={thresholds.maxTemperature - 1}
                        step={0.5}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="maxTemp">Maximum Temperature (°C)</Label>
                      <span className="text-sm">{thresholds.maxTemperature}°C</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">0°C</span>
                      <Slider
                        id="maxTemp"
                        min={0}
                        max={50}
                        step={0.5}
                        value={[thresholds.maxTemperature]}
                        onValueChange={(values) => handleInputChange('maxTemperature', values[0])}
                        className="flex-1"
                      />
                      <span className="text-sm">50°C</span>
                    </div>
                    <div className="mt-2">
                      <Input
                        type="number"
                        value={thresholds.maxTemperature}
                        onChange={(e) => handleInputChange('maxTemperature', parseFloat(e.target.value))}
                        min={thresholds.minTemperature + 1}
                        max={50}
                        step={0.5}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <strong>Current Range:</strong> {thresholds.minTemperature}°C to {thresholds.maxTemperature}°C
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Readings outside this range will trigger warnings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 humidity-text" />
                Humidity Thresholds
              </CardTitle>
              <CardDescription>
                Set minimum and maximum acceptable humidity values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="minHumidity">Minimum Humidity (%)</Label>
                      <span className="text-sm">{thresholds.minHumidity}%</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">0%</span>
                      <Slider
                        id="minHumidity"
                        min={0}
                        max={100}
                        step={1}
                        value={[thresholds.minHumidity]}
                        onValueChange={(values) => handleInputChange('minHumidity', values[0])}
                        className="flex-1"
                      />
                      <span className="text-sm">100%</span>
                    </div>
                    <div className="mt-2">
                      <Input
                        type="number"
                        value={thresholds.minHumidity}
                        onChange={(e) => handleInputChange('minHumidity', parseInt(e.target.value))}
                        min={0}
                        max={thresholds.maxHumidity - 1}
                        step={1}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="maxHumidity">Maximum Humidity (%)</Label>
                      <span className="text-sm">{thresholds.maxHumidity}%</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">0%</span>
                      <Slider
                        id="maxHumidity"
                        min={0}
                        max={100}
                        step={1}
                        value={[thresholds.maxHumidity]}
                        onValueChange={(values) => handleInputChange('maxHumidity', values[0])}
                        className="flex-1"
                      />
                      <span className="text-sm">100%</span>
                    </div>
                    <div className="mt-2">
                      <Input
                        type="number"
                        value={thresholds.maxHumidity}
                        onChange={(e) => handleInputChange('maxHumidity', parseInt(e.target.value))}
                        min={thresholds.minHumidity + 1}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <strong>Current Range:</strong> {thresholds.minHumidity}% to {thresholds.maxHumidity}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Readings outside this range will trigger warnings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No threshold data available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ThresholdsAdmin;
