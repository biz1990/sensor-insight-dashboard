import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DeviceList from '@/components/DeviceList';
import CompactDeviceList from '@/components/CompactDeviceList';
import DeviceColumnChart from '@/components/charts/DeviceColumnChart';
import ConnectedScatterChart from '@/components/charts/ConnectedScatterChart';
import MSNWeatherWidget from '@/components/MSNWeatherWidget';
import MultiLocationWeather from '@/components/MultiLocationWeather';
import IndoorClimateSummary from '@/components/IndoorClimateSummary';
import * as testDataset from './generateTestData';
import { WarningThreshold } from '@/types';

const TestDashboard: React.FC = () => {
  const [dataset, setDataset] = useState(testDataset.testDataset);
  const [deviceCount, setDeviceCount] = useState(20);
  
  // Default warning thresholds
  const thresholds: WarningThreshold = {
    id: 1,
    minTemperature: 15,
    maxTemperature: 30,
    minHumidity: 30,
    maxHumidity: 70,
    updatedAt: new Date().toISOString(),
    updatedBy: 1
  };
  
  // Regenerate data with specified device count
  const regenerateData = () => {
    const newDataset = testDataset.generateTestDataset(5, deviceCount, 24);
    setDataset(newDataset);
  };
  
  // Get devices with warning status
  const warningDevices = dataset.devices.filter(device => {
    if (!device.lastReading) return false;
    
    const { temperature, humidity } = device.lastReading;
    return (
      temperature < thresholds.minTemperature ||
      temperature > thresholds.maxTemperature ||
      humidity < thresholds.minHumidity ||
      humidity > thresholds.maxHumidity
    );
  });
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Test Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="deviceCount">Device Count:</label>
            <input
              id="deviceCount"
              type="number"
              min="1"
              max="50"
              value={deviceCount}
              onChange={(e) => setDeviceCount(parseInt(e.target.value))}
              className="w-20 p-2 border rounded"
            />
          </div>
          <Button onClick={regenerateData}>Regenerate Data</Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataset.devices.length}</div>
            <p className="text-xs text-muted-foreground">
              {dataset.devices.filter(d => d.status === 'online').length} online
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{warningDevices.length}</div>
            <p className="text-xs text-muted-foreground">
              Devices outside thresholds
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataset.locations.length}</div>
            <p className="text-xs text-muted-foreground">
              Monitoring areas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataset.readings.length}</div>
            <p className="text-xs text-muted-foreground">
              Total data points
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Temperature Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Temperature Readings</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceColumnChart 
                data={dataset.readings.slice(0, 100)} 
                height={300}
              />
            </CardContent>
          </Card>
          
          {/* Humidity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Humidity Readings</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceColumnChart 
                data={dataset.readings.slice(0, 100)} 
                height={300}
              />
            </CardContent>
          </Card>
          
          {/* Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>Temperature Correlation</CardTitle>
            </CardHeader>
            <CardContent>
              <ConnectedScatterChart 
                data={dataset.readings.slice(0, 100)} 
                compareType="temperature"
                height={400}
              />
            </CardContent>
          </Card>
          
          {/* Device List */}
          <Card>
            <CardHeader>
              <CardTitle>All Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceList 
                devices={dataset.devices} 
                autoRefresh={false}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Weather Widgets */}
          <Tabs defaultValue="single">
            <TabsList className="mb-4">
              <TabsTrigger value="single">Single Location</TabsTrigger>
              <TabsTrigger value="multi">Multiple Locations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single">
              <MSNWeatherWidget 
                className="shadow-sm"
                defaultLocation="Seoul, South Korea"
              />
            </TabsContent>
            
            <TabsContent value="multi">
              <MultiLocationWeather 
                className="shadow-sm"
                initialLocations={['Hòa Phú, Vĩnh Long, Vietnam', 'Seoul, South Korea', 'New York, USA']}
              />
            </TabsContent>
          </Tabs>
          
          {/* Indoor Climate Summary */}
          <IndoorClimateSummary 
            devices={dataset.devices}
            thresholds={thresholds}
          />
          
          {/* Compact Device List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <CompactDeviceList 
                devices={dataset.devices.slice(0, 5)}
                thresholds={thresholds}
              />
            </CardContent>
          </Card>
          
          {/* Warning Devices */}
          {warningDevices.length > 0 && (
            <Card className="border-amber-500">
              <CardHeader>
                <CardTitle className="text-amber-500">Warning Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <CompactDeviceList 
                  devices={warningDevices}
                  thresholds={thresholds}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;