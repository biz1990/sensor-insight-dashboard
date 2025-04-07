
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, PlusCircle } from 'lucide-react';
import DeviceList from '@/components/DeviceList';
import { getDevicesWithLatestReadings, addDevice } from '@/services/databaseService';
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

  const handleAddDevice = async (newDevice: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Call the API to create the device
      const createdDevice = await addDevice(newDevice);
      
      if (createdDevice) {
        setDevices([...devices, createdDevice]);
        setIsAddDeviceOpen(false);
        
        toast({
          title: "Device Added",
          description: `${newDevice.name} has been added successfully.`,
        });
      }
    } catch (error) {
      console.error('Error adding device:', error);
      toast({
        title: "Error",
        description: "Failed to add device. Please try again.",
        variant: "destructive",
      });
    }
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
