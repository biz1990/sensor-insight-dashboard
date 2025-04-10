
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trash2, RefreshCcw, Clock, Loader2 } from 'lucide-react';
import { Device, SensorReading } from '@/types';
import { format, startOfDay, endOfDay, subHours } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { getDevices, getDeviceReadings, deleteDevice } from '@/services/databaseService';
import { useToast } from "@/hooks/use-toast";
import DeviceColumnChart from '@/components/charts/DeviceColumnChart';
import ConnectedScatterChart from '@/components/charts/ConnectedScatterChart';
import { DateRange } from "react-day-picker";
import DateModeSwitcher from '@/components/DateModeSwitcher';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DeviceDetail = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [device, setDevice] = useState<Device | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [dateMode, setDateMode] = useState<'latest' | 'daily' | 'range'>('latest');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subHours(new Date(), 24),
    to: new Date(),
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Auto refresh readings every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!deviceId) return;
      
      setIsLoading(true);
      setLoadingError(null);
      
      try {
        console.log('Fetching device data for ID:', deviceId);
        // Fetch device details
        const devices = await getDevices();
        const currentDevice = devices.find(d => d.id === Number(deviceId));
        
        if (!currentDevice) {
          setLoadingError(`Device with ID ${deviceId} not found`);
          toast({
            title: "Error",
            description: "Device not found",
            variant: "destructive",
          });
          return;
        }
        
        console.log('Device found:', currentDevice);
        setDevice(currentDevice);
        
        // Fetch readings based on date mode
        let fetchedReadings: SensorReading[] = [];
        
        if (dateMode === 'latest') {
          // Get last 10 readings
          console.log('Fetching latest readings');
          fetchedReadings = await getDeviceReadings(Number(deviceId), 24);
          fetchedReadings = fetchedReadings.slice(-10);
        } else if (dateMode === 'daily') {
          // Get readings for today
          console.log('Fetching daily readings');
          const today = new Date();
          const startOfToday = startOfDay(today);
          const endOfToday = endOfDay(today);
          
          fetchedReadings = await getDeviceReadings(Number(deviceId), 24);
          fetchedReadings = fetchedReadings.filter(reading => {
            const readingDate = new Date(reading.timestamp);
            return readingDate >= startOfToday && readingDate <= endOfToday;
          });
        } else if (dateMode === 'range' && dateRange?.from) {
          // Get readings for date range
          console.log('Fetching range readings', dateRange);
          const startDate = startOfDay(dateRange.from);
          const endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date());
          
          fetchedReadings = await getDeviceReadings(Number(deviceId), 24 * 30); // Get up to 30 days of data
          fetchedReadings = fetchedReadings.filter(reading => {
            const readingDate = new Date(reading.timestamp);
            return readingDate >= startDate && readingDate <= endDate;
          });
        }
        
        console.log(`Fetched ${fetchedReadings.length} readings for device`);
        setReadings(fetchedReadings);
      } catch (error) {
        console.error('Error fetching device data:', error);
        setLoadingError('Failed to load device data. Please check your connection to the API server.');
        toast({
          title: "Error",
          description: "Failed to load device data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [deviceId, navigate, toast, dateMode, dateRange, refreshTrigger]);
  
  const handleDelete = async () => {
    if (!device) return;
    
    if (window.confirm(`Are you sure you want to delete ${device.name}?`)) {
      try {
        const result = await deleteDevice(device.id);
        
        if (result.success) {
          toast({
            title: "Device Deleted",
            description: result.message,
          });
          navigate('/devices');
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete device",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const formatTimestamp = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      // Use UTC to maintain consistency across the application
      return formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return 'Unknown';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p>Loading device data...</p>
        </div>
      </div>
    );
  }
  
  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTitle>Error Loading Device</AlertTitle>
          <AlertDescription>{loadingError}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/devices')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Devices
        </Button>
      </div>
    );
  }
  
  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <p>Device not found</p>
        <Button onClick={() => navigate('/devices')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Devices
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate('/devices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Devices
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{device.name}</CardTitle>
          <CardDescription>
            <div className="flex flex-col text-sm">
              <span>Serial Number: {device.serialNumber}</span>
              <span>Location: {device.location?.name || 'Unknown'}</span>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Sensor Readings</CardTitle>
              <CardDescription>
                Historical sensor data for this device
              </CardDescription>
            </div>
            
            <DateModeSwitcher 
              mode={dateMode} 
              onModeChange={setDateMode}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="temperature">
            <TabsList>
              <TabsTrigger value="temperature">Temperature</TabsTrigger>
              <TabsTrigger value="humidity">Humidity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="temperature">
              <Card>
                <CardContent className="p-0">
                  <div className="p-6">
                    <DeviceColumnChart 
                      data={readings} 
                      height={400} 
                      limit={10}
                      dateMode={dateMode}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="humidity">
              <Card>
                <CardContent className="p-0">
                  <div className="p-6">
                    <ConnectedScatterChart 
                      data={readings} 
                      compareType="humidity" 
                      height={400} 
                      limit={10}
                      dateMode={dateMode}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
          <CardDescription>
            Most recent {readings.length} sensor readings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Timestamp</th>
                  <th className="text-left p-2">Temperature (°C)</th>
                  <th className="text-left p-2">Humidity (%)</th>
                </tr>
              </thead>
              <tbody>
                {readings.length > 0 ? (
                  readings
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((reading) => (
                      <tr key={reading.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <span className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            {formatTimestamp(reading.timestamp)}
                          </span>
                        </td>
                        <td className="p-2">{reading.temperature}</td>
                        <td className="p-2">{reading.humidity}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center p-4">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Data automatically refreshes every 30 seconds
        </CardFooter>
      </Card>
    </div>
  );
};

export default DeviceDetail;
