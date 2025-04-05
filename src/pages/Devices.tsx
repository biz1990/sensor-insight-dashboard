
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, PlusCircle } from 'lucide-react';
import DeviceList from '@/components/DeviceList';
import { getDevicesWithLatestReadings } from '@/services/databaseService';
import { Device } from '@/types';
import AddDeviceDialog from '@/components/AddDeviceDialog';
import { useToast } from "@/hooks/use-toast";

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDevices();
    const intervalId = setInterval(fetchDevices, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, []);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      // Now using the real service function that will try DB first, then fallback to mock
      const fetchedDevices = await getDevicesWithLatestReadings();
      setDevices(fetchedDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: "Error",
        description: "Failed to load devices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDevices();
  };

  const handleAddDevice = (newDevice: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => {
    // In a real app, this would call an API to create the device
    const deviceId = devices.length > 0 ? Math.max(...devices.map(d => d.id)) + 1 : 1;
    const now = new Date().toISOString();
    
    const createdDevice: Device = {
      id: deviceId,
      name: newDevice.name,
      serialNumber: newDevice.serialNumber,
      locationId: newDevice.locationId,
      status: 'offline', // New devices start as offline
      createdAt: now,
      updatedAt: now
    };
    
    setDevices([...devices, createdDevice]);
    setIsAddDeviceOpen(false);
    
    toast({
      title: "Device Added",
      description: `${newDevice.name} has been added successfully.`,
    });
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
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDeviceOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Device
          </Button>
          <Button onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
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
            <DeviceList devices={devices} onDeviceDelete={handleRefresh} />
          )}
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <AddDeviceDialog 
        open={isAddDeviceOpen} 
        onOpenChange={setIsAddDeviceOpen}
        onAdd={handleAddDevice}
      />
    </div>
  );
};

export default Devices;
