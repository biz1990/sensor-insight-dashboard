import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CalendarIcon, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import DeviceList from '@/components/DeviceList';
import CompactDeviceList from '@/components/CompactDeviceList';
import DeviceColumnChart from '@/components/charts/DeviceColumnChart';
import ConnectedScatterChart from '@/components/charts/ConnectedScatterChart';
import MSNWeatherWidget from '@/components/MSNWeatherWidget';
import MultiLocationWeather from '@/components/MultiLocationWeather';
import IndoorClimateSummary from '@/components/IndoorClimateSummary';
import { cn } from '@/lib/utils';
import { DateRange, Device, SensorReading, WarningThreshold } from '@/types';
import { DateRange as DayPickerDateRange } from 'react-day-picker';
import { getDeviceReadings, getDevicesWithLatestReadings, getWarningThresholds } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Initialize with current date in UTC
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0); // Set to noon UTC to avoid timezone issues
    return today;
  });
  const [dateRange, setDateRange] = useState<DayPickerDateRange | undefined>();
  const [temperature, setTemperature] = useState<SensorReading[]>([]);
  const [humidity, setHumidity] = useState<SensorReading[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'range'>('daily');
  const { toast } = useToast();
  const [thresholds, setThresholds] = useState<WarningThreshold | null>(null);
  const [warningDevices, setWarningDevices] = useState<Device[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    fetchDevices();
    fetchThresholds();
    
    // Set up auto-refresh every 5 minutes (300000ms)
    const intervalId = setInterval(() => {
      fetchDevices();
      fetchThresholds();
      setLastRefreshed(new Date());
      
      if (activeTab === 'daily') {
        fetchDailyData(selectedDate);
      } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
        fetchRangeData(dateRange.from, dateRange.to);
      }
      
      toast({
        title: "Data auto-refreshed",
        description: "Dashboard data has been automatically updated.",
      });
    }, 300000); // 5 minutes
    
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
      
      // Update device status based on thresholds
      if (devicesWithWarnings.length > 0) {
        toast({
          title: "Warning",
          description: `${devicesWithWarnings.length} devices have readings outside threshold limits.`,
          variant: "destructive",
        });
      }
    }
  }, [thresholds, devices]);

  // Use a ref to track if we've already fetched data for this range
  const lastFetchedRef = React.useRef({
    daily: null as Date | null,
    range: null as { from: Date, to: Date } | null
  });

  useEffect(() => {
    if (devices.length > 0) {
      if (activeTab === 'daily') {
        // Only fetch if the date has changed
        if (!lastFetchedRef.current.daily || 
            lastFetchedRef.current.daily.getTime() !== selectedDate.getTime()) {
          fetchDailyData(selectedDate);
          lastFetchedRef.current.daily = selectedDate;
        }
      } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
        // Only fetch if the range has changed
        const currentRange = lastFetchedRef.current.range;
        const rangeChanged = !currentRange || 
          currentRange.from.getTime() !== dateRange.from.getTime() || 
          currentRange.to.getTime() !== dateRange.to.getTime();
        
        if (rangeChanged) {
          fetchRangeData(dateRange.from, dateRange.to);
          lastFetchedRef.current.range = { 
            from: dateRange.from, 
            to: dateRange.to 
          };
        }
      }
    }
  }, [selectedDate, dateRange, activeTab, devices]);

  const fetchThresholds = async () => {
    try {
      const fetchedThresholds = await getWarningThresholds();
      setThresholds(fetchedThresholds);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    }
  };

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const fetchedDevices = await getDevicesWithLatestReadings();
      setDevices(fetchedDevices);

      // Fetch chart data for the selected date if we got devices
      if (fetchedDevices.length > 0 && activeTab === 'daily') {
        fetchDailyData(selectedDate);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch devices. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyData = async (date: Date) => {
    try {
      let allData: SensorReading[] = [];
      
      console.log('Dashboard: Fetching daily data for date:', formatInTimeZone(date, 'UTC', 'yyyy-MM-dd'));
      
      // Create start and end boundaries for the selected date in UTC
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0); // 00:00:00 of the selected day in UTC
      
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999); // 23:59:59 of the selected day in UTC
      
      console.log('Dashboard: Start of day (UTC):', formatInTimeZone(startOfDay, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
      console.log('Dashboard: End of day (UTC):', formatInTimeZone(endOfDay, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
      
      // Get readings for each device
      for (const device of devices) {
        try {
          // Check if the selected date is today
          const today = new Date();
          const isToday = 
            date.getUTCFullYear() === today.getUTCFullYear() &&
            date.getUTCMonth() === today.getUTCMonth() &&
            date.getUTCDate() === today.getUTCDate();
          
          if (isToday) {
            // For today, use the specific endpoint for daily readings if available
            try {
              const result = await fetch(`${import.meta.env.VITE_DB_API_URL}/devices/${device.id}/readings/daily`);
              const data = await result.json();
              
              if (data.success && data.data.length > 0) {
                // Filter to ensure we only get readings from today (after 00:00:00 UTC)
                const todayReadings = data.data.filter(reading => {
                  const readingDate = new Date(reading.timestamp);
                  return readingDate >= startOfDay;
                });
                
                allData = [...allData, ...todayReadings];
                console.log(`Dashboard: Found ${todayReadings.length} readings for device ${device.id} today`);
              } else {
                throw new Error('No data from daily endpoint');
              }
            } catch (dailyError) {
              console.log(`Dashboard: Daily endpoint failed for device ${device.id}, using regular endpoint:`, dailyError);
              
              // If daily endpoint fails, use the regular endpoint with 24 hours of data
              const deviceReadings = await getDeviceReadings(device.id, 24);
              
              // Filter to ensure we only get today's readings
              const todayReadings = deviceReadings.filter(reading => {
                const readingDate = new Date(reading.timestamp);
                return readingDate >= startOfDay;
              });
              
              allData = [...allData, ...todayReadings];
              console.log(`Dashboard: Found ${todayReadings.length} readings for device ${device.id} from regular endpoint`);
            }
          } else {
            // For other dates, get readings for past week, then filter by selected date
            const deviceReadings = await getDeviceReadings(device.id, 24 * 7);
            
            // Filter readings for the selected date
            const dateReadings = deviceReadings.filter(reading => {
              const readingDate = new Date(reading.timestamp);
              return readingDate >= startOfDay && readingDate <= endOfDay;
            });
            
            allData = [...allData, ...dateReadings];
            console.log(`Dashboard: Found ${dateReadings.length} readings for device ${device.id} on ${formatInTimeZone(date, 'UTC', 'yyyy-MM-dd')}`);
          }
        } catch (error) {
          console.error(`Error fetching readings for device ${device.id}:`, error);
        }
      }
      
      // Log the time range of the readings we found
      if (allData.length > 0) {
        // Sort by timestamp
        allData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        const firstReading = new Date(allData[0].timestamp);
        const lastReading = new Date(allData[allData.length - 1].timestamp);
        console.log('Dashboard: First reading time:', formatInTimeZone(firstReading, 'UTC', 'HH:mm:ss'));
        console.log('Dashboard: Last reading time:', formatInTimeZone(lastReading, 'UTC', 'HH:mm:ss'));
      }
      
      // Set the data for charts
      setTemperature(allData);
      setHumidity(allData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch readings data.",
        variant: "destructive",
      });
    }
  };

  const fetchRangeData = async (start: Date, end: Date) => {
    try {
      let allData: SensorReading[] = [];
      
      // Calculate days difference
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Get readings for each device
      for (const device of devices) {
        try {
          const deviceReadings = await getDeviceReadings(device.id, diffDays * 24); // Get data for the range
          
          // Filter readings to only include those within the date range
          const filteredReadings = deviceReadings.filter(reading => {
            const readingDate = new Date(reading.timestamp);
            // Set time to start of day for start date and end of day for end date
            const startOfDay = new Date(start);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(end);
            endOfDay.setHours(23, 59, 59, 999);
            
            return readingDate >= startOfDay && readingDate <= endOfDay;
          });
          
          allData = [...allData, ...filteredReadings];
        } catch (error) {
          console.error(`Error fetching readings for device ${device.id}:`, error);
        }
      }
      
      console.log(`Fetched ${allData.length} readings for date range:`, { start, end });
      
      // Set the data for charts
      setTemperature(allData);
      setHumidity(allData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch readings data for the selected range.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    fetchDevices();
    fetchThresholds();
    setLastRefreshed(new Date());
    
    if (activeTab === 'daily') {
      fetchDailyData(selectedDate);
    } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
      fetchRangeData(dateRange.from, dateRange.to);
    }
    
    toast({
      title: "Data refreshed",
      description: "Dashboard data has been manually updated.",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your sensors and environment data
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {format(lastRefreshed, "yyyy-MM-dd HH:mm:ss")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Warning Section - Moved to top for visibility */}
      {warningDevices.length > 0 && (
        <Alert variant="warning" className="mb-6">
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
                          ({formatInTimeZone(
                            new Date(device.lastReading.timestamp),
                            'UTC',
                            "yyyy-MM-dd HH:mm:ss"
                          )})
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

      {/* Main Dashboard Layout - Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Summary Cards - Moved to top for quick overview */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="bg-card hover:bg-card/90 transition-colors">
              <CardHeader className="pb-2 pt-4">
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
            <Card className="bg-card hover:bg-card/90 transition-colors">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium">
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {devices.filter(d => d.status === 'warning').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Devices with warning status
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card hover:bg-card/90 transition-colors">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium">
                  Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {devices.filter(d => d.status === 'error').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Devices with error status
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card hover:bg-card/90 transition-colors">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium">
                  Offline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">
                  {devices.filter(d => d.status === 'offline').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Devices currently offline
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Charts - Main focus area */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <CardTitle>Device Comparison</CardTitle>
                  <CardDescription>
                    Compare temperature and humidity data across all devices
                  </CardDescription>
                </div>
                <div className="mt-2 sm:mt-0">
                  <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'daily' | 'range')} className="w-full">
                    <TabsList>
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="range">Date Range</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
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
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              // Set the selected date with proper UTC time
                              const newDate = new Date(date);
                              newDate.setUTCHours(12, 0, 0, 0); // Set to noon UTC to avoid timezone issues
                              
                              console.log('Dashboard: Calendar date selected:', formatInTimeZone(date, 'UTC', 'yyyy-MM-dd'));
                              console.log('Dashboard: Normalized date for UTC:', formatInTimeZone(newDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
                              
                              setSelectedDate(newDate);
                            }
                          }}
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
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
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
              
              <Tabs defaultValue="temperature" className="mt-4">
                <TabsList className="w-full justify-start mb-4">
                  <TabsTrigger value="temperature">Temperature</TabsTrigger>
                  <TabsTrigger value="humidity">Humidity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="temperature">
                  <ConnectedScatterChart 
                    data={temperature} 
                    compareType="temperature" 
                    height={450}
                    dateMode={activeTab}
                  />
                </TabsContent>
                
                <TabsContent value="humidity">
                  <ConnectedScatterChart 
                    data={humidity} 
                    compareType="humidity" 
                    height={450}
                    dateMode={activeTab}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Device List - Moved to sidebar for easy access */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Devices</CardTitle>
                  <CardDescription>
                    All connected devices
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/devices/add')}>
                    Add Device
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10">Loading devices...</div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto pr-2">
                  <CompactDeviceList devices={devices} thresholds={thresholds} />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Weather Widgets */}
          <Tabs defaultValue="single" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="single">Single Location</TabsTrigger>
              <TabsTrigger value="multi">Multiple Locations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single">
              <MSNWeatherWidget
                className="shadow-sm"
                defaultLocation="Hòa Phú, Vĩnh Long"
              />
            </TabsContent>
            
            <TabsContent value="multi">
              <MultiLocationWeather 
                className="shadow-sm"
                initialLocations={['Hòa Phú, Vĩnh Long, Vietnam', 'Seoul, South Korea']}
              />
            </TabsContent>
          </Tabs>
          
          {/* Indoor Climate Summary */}
          <IndoorClimateSummary
            className="shadow-sm mb-6"
            devices={devices}
            thresholds={thresholds}
          />
          
          {/* Quick Stats Card */}
          <Card className="shadow-sm bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current system information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">System Uptime</span>
                  <span>24 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Data Points Today</span>
                  <span>{temperature.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Reading</span>
                  <span>
                    {devices.length > 0 && devices[0].lastReading ? 
                      formatInTimeZone(new Date(devices[0].lastReading.timestamp), 'UTC', "HH:mm:ss") : 
                      "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Threshold Settings</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/settings')}
                  >
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
