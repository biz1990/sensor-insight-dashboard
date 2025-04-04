import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import DeviceList from '@/components/DeviceList';
import DeviceColumnChart from '@/components/charts/DeviceColumnChart';
import ConnectedScatterChart from '@/components/charts/ConnectedScatterChart';
import { getDeviceReadings, getDevicesWithLatestReadings } from '@/services/mockData';
import { cn } from '@/lib/utils';
import { DateRange, Device, SensorReading } from '@/types';
import { DateRange as DayPickerDateRange } from 'react-day-picker';

const Dashboard = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DayPickerDateRange | undefined>();
  const [temperature, setTemperature] = useState<SensorReading[]>([]);
  const [humidity, setHumidity] = useState<SensorReading[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'range'>('daily');

  useEffect(() => {
    fetchDevices();
    const intervalId = setInterval(fetchDevices, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyData(selectedDate);
    } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
      fetchRangeData(dateRange.from, dateRange.to);
    }
  }, [selectedDate, dateRange, activeTab]);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      // In a real application, this would be an API call
      const fetchedDevices = getDevicesWithLatestReadings();
      setDevices(fetchedDevices);

      // Fetch chart data for the selected date
      if (activeTab === 'daily') {
        fetchDailyData(selectedDate);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyData = async (date: Date) => {
    // In a real application, this would be an API call with the date parameter
    try {
      let allData: SensorReading[] = [];
      
      // Get readings for each device
      devices.forEach(device => {
        const deviceReadings = getDeviceReadings(device.id, 24); // Get 24 hours of data
        allData = [...allData, ...deviceReadings];
      });
      
      // Set the data for charts
      setTemperature(allData);
      setHumidity(allData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchRangeData = async (start: Date, end: Date) => {
    // In a real application, this would be an API call with date range parameters
    try {
      let allData: SensorReading[] = [];
      
      // Calculate days difference
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Get readings for each device
      devices.forEach(device => {
        const deviceReadings = getDeviceReadings(device.id, diffDays * 24); // Get data for the range
        allData = [...allData, ...deviceReadings];
      });
      
      // Set the data for charts
      setTemperature(allData);
      setHumidity(allData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your sensors and environment data
          </p>
        </div>
        <Button onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devices.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {devices.filter(d => d.status === 'online').length} online
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devices.filter(d => d.status === 'warning').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Devices with warning status
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devices.filter(d => d.status === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Devices with error status
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devices.filter(d => d.status === 'offline').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Devices currently offline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Charts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Device Comparison</CardTitle>
          <CardDescription>
            Compare temperature and humidity data across all devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'daily' | 'range')}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="range">Date Range</TabsTrigger>
              </TabsList>
              
              {activeTab === 'daily' && (
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal w-[180px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                        className={cn("p-3")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              
              {activeTab === 'range' && (
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal w-[280px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "PPP")} -{" "}
                              {format(dateRange.to, "PPP")}
                            </>
                          ) : (
                            format(dateRange.from, "PPP")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            
            <TabsContent value="daily" className="space-y-4">
              <Tabs defaultValue="temperature">
                <TabsList>
                  <TabsTrigger value="temperature">Temperature</TabsTrigger>
                  <TabsTrigger value="humidity">Humidity</TabsTrigger>
                </TabsList>
                <TabsContent value="temperature" className="pt-4">
                  <ConnectedScatterChart 
                    data={temperature} 
                    compareType="temperature" 
                    height={400} 
                  />
                </TabsContent>
                <TabsContent value="humidity" className="pt-4">
                  <ConnectedScatterChart 
                    data={humidity} 
                    compareType="humidity" 
                    height={400} 
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="range" className="space-y-4">
              <Tabs defaultValue="temperature">
                <TabsList>
                  <TabsTrigger value="temperature">Temperature</TabsTrigger>
                  <TabsTrigger value="humidity">Humidity</TabsTrigger>
                </TabsList>
                <TabsContent value="temperature" className="pt-4">
                  <ConnectedScatterChart 
                    data={temperature} 
                    compareType="temperature" 
                    height={400} 
                  />
                </TabsContent>
                <TabsContent value="humidity" className="pt-4">
                  <ConnectedScatterChart 
                    data={humidity} 
                    compareType="humidity" 
                    height={400} 
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Devices</CardTitle>
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

export default Dashboard;
