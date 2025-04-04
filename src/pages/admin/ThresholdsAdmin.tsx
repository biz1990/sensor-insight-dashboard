
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
import { AlertCircle, Save } from 'lucide-react';
import { mockWarningThreshold } from '@/services/mockData';
import { WarningThreshold } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ThresholdsAdmin = () => {
  const [thresholds, setThresholds] = useState<WarningThreshold | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    setIsLoading(true);
    try {
      // In a real application, this would be an API call
      setThresholds(mockWarningThreshold);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveThresholds = async () => {
    try {
      // In a real application, this would be an API call
      if (!thresholds) return;
      
      const updatedThreshold: WarningThreshold = {
        ...thresholds,
        updatedAt: new Date().toISOString(),
        updatedBy: 1, // Assuming the current user ID
      };
      
      setThresholds(updatedThreshold);
      
      toast({
        title: "Thresholds updated",
        description: "Warning thresholds have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating thresholds:', error);
      toast({
        title: "Error",
        description: "Failed to update warning thresholds.",
        variant: "destructive",
      });
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
          onClick={handleSaveThresholds} 
          disabled={isLoading || !thresholds}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading thresholds...</div>
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
