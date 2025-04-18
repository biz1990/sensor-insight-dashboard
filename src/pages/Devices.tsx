
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, PlusCircle, Search, Filter } from 'lucide-react';
import DeviceList from '@/components/DeviceList';
import { getDevicesWithLatestReadings, addDevice } from '@/services/databaseService';
import { Device } from '@/types';
import AddDeviceDialog from '@/components/AddDeviceDialog';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from '@/hooks/use-debounce';

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const { toast } = useToast();
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch devices from API
  const fetchDevices = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsRefreshing(true);
    }
    
    try {
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
      setIsRefreshing(false);
    }
  }, [toast]);

  // Initial data fetch
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Set up auto-refresh
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefreshEnabled) {
      intervalId = setInterval(() => fetchDevices(false), 60000); // Refresh every minute
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, fetchDevices]);

  // Filter devices based on search query and filters
  useEffect(() => {
    let result = [...devices];
    
    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(device => 
        device.name.toLowerCase().includes(query) || 
        device.serialNumber.toLowerCase().includes(query) ||
        device.location?.name.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(device => device.status === statusFilter);
    }
    
    // Apply location filter
    if (locationFilter !== 'all') {
      result = result.filter(device => device.locationId === parseInt(locationFilter));
    }
    
    setFilteredDevices(result);
  }, [devices, debouncedSearchQuery, statusFilter, locationFilter]);

  // Get unique locations for filter dropdown
  const locations = React.useMemo(() => {
    const uniqueLocations = new Map();
    devices.forEach(device => {
      if (device.location) {
        uniqueLocations.set(device.location.id, device.location);
      }
    });
    return Array.from(uniqueLocations.values());
  }, [devices]);

  const handleRefresh = () => {
    fetchDevices();
  };

  const handleAddDevice = async (newDevice: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const createdDevice = await addDevice(newDevice);
      
      if (createdDevice) {
        setDevices(prevDevices => [...prevDevices, createdDevice]);
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
          <Button 
            onClick={handleRefresh} 
            className="gap-2"
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="w-40">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select
              value={locationFilter}
              onValueChange={setLocationFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Device List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Devices</CardTitle>
              <CardDescription>
                {filteredDevices.length} {filteredDevices.length === 1 ? 'device' : 'devices'} found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Auto-refresh:</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={autoRefreshEnabled ? "text-green-500" : "text-muted-foreground"}
              >
                {autoRefreshEnabled ? "ON" : "OFF"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center">
              <Filter className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No devices match your filters</p>
              {(debouncedSearchQuery || statusFilter !== 'all' || locationFilter !== 'all') && (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setLocationFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <DeviceList 
              devices={filteredDevices} 
              onDeviceDelete={handleRefresh} 
              autoRefresh={autoRefreshEnabled}
              refreshInterval={30000}
            />
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
