
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import DeviceList from '@/components/DeviceList';
import { getDevicesWithLatestReadings } from '@/services/mockData';
import { Device } from '@/types';

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
    const intervalId = setInterval(fetchDevices, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, []);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      // In a real application, this would be an API call
      const fetchedDevices = getDevicesWithLatestReadings();
      setDevices(fetchedDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDevices();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-muted-foreground">
            View and manage all your sensor devices
          </p>
        </div>
        <Button onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Device List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>All Devices</CardTitle>
          <CardDescription>
            Overview of all devices and their latest readings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading devices...</div>
          ) : (
            <DeviceList devices={devices} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Devices;
