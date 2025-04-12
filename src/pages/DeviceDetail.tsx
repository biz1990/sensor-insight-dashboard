import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarIcon, ArrowLeft, RefreshCw, Download, Loader2, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import DeviceColumnChart from '@/components/charts/DeviceColumnChart';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { getDeviceReadings, getDevices, getWarningThresholds } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import { Device, SensorReading } from '@/types';

// Types for chart date mode
type ChartDateMode = 'latest' | 'daily' | 'range';

const DeviceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const deviceId = id ? parseInt(id) : null;
  const deviceIdRef = useRef<number | null>(deviceId);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State management
  const [device, setDevice] = useState<Device | undefined>(undefined);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [thresholds, setThresholds] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Date and view settings
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('latest');
  const [chartDateMode, setChartDateMode] = useState<ChartDateMode>('latest');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds

  // Format timestamp from database
  const formatDBTimestamp = (timestamp: string | Date): string => {
    try {
      const date = new Date(timestamp);
      return formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'Unknown';
    }
  };

  // Helper to filter readings by the selected date
  const filterReadingsByDate = (readings: SensorReading[], date: Date): SensorReading[] => {
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    return readings.filter((reading) => {
      const readingDate = format(new Date(reading.timestamp), 'yyyy-MM-dd');
      return readingDate === selectedDateStr;
    });
  };

  // Fetch warning thresholds
  const fetchThresholds = useCallback(async () => {
    try {
      const thresholdsData = await getWarningThresholds();
      setThresholds(thresholdsData);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    }
  }, []);

  // Fetch device information
  const fetchDevice = useCallback(async (deviceId: number) => {
    setIsLoading(true);
    try {
      const devices = await getDevices();
      const fetchedDevice = devices.find(d => d.id === deviceId);
      
      if (fetchedDevice) {
        setDevice(fetchedDevice);
        return true;
      } else {
        toast({
          title: "Device not found",
          description: "Could not find the requested device",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error fetching device:', error);
      toast({
        title: "Error",
        description: "Failed to load device information",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch the latest reading
  const fetchLatestReading = useCallback(async (deviceId: number) => {
    try {
      const deviceReadings = await getDeviceReadings(deviceId, 1);
      if (deviceReadings && deviceReadings.length > 0) {
        setLatestReading(deviceReadings[0]);
        setLastUpdated(new Date());
      }
      return deviceReadings;
    } catch (error) {
      console.error('Error fetching latest reading:', error);
      return [];
    }
  }, []);

  // Fetch readings based on mode
  const fetchReadings = useCallback(async (deviceId: number, mode: ChartDateMode, dateRange?: DateRange) => {
    if (!deviceId) return;
    
    setIsRefreshing(true);
    try {
      let deviceReadings: SensorReading[] = [];
      
      switch (mode) {
        case 'latest':
          deviceReadings = await getDeviceReadings(deviceId, 24);
          setChartDateMode('latest');
          break;
        case 'daily':
          // Get readings for past 24 hours, but filter them by the selected date
          const allReadings = await getDeviceReadings(deviceId, 24 * 7); // Get a week's worth of data
          deviceReadings = filterReadingsByDate(allReadings, selectedDate);
          setChartDateMode('daily');
          break;
        case 'range':
          if (dateRange?.from && dateRange?.to) {
            const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            deviceReadings = await getDeviceReadings(deviceId, diffDays * 24);
            setChartDateMode('range');
          }
          break;
      }
      
      setReadings(deviceReadings);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error(`Error fetching ${mode} readings:`, error);
      toast({
        title: "Error",
        description: `Failed to load sensor readings for ${mode} view`,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast, selectedDate]);

  // Initial data load
  useEffect(() => {
    if (!deviceId) return;
    
    const loadInitialData = async () => {
      const success = await fetchDevice(deviceId);
      if (success) {
        await fetchLatestReading(deviceId);
        await fetchReadings(deviceId, 'latest');
        await fetchThresholds();
      }
    };
    
    loadInitialData();
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [deviceId, fetchDevice, fetchLatestReading, fetchReadings, fetchThresholds]);

  // Auto-refresh logic
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!autoRefresh || !deviceIdRef.current) return;

    const refreshData = async () => {
      const currentDeviceId = deviceIdRef.current;
      if (!currentDeviceId) return;
      
      await fetchLatestReading(currentDeviceId);
      await fetchReadings(currentDeviceId, chartDateMode, dateRange);
      await fetchThresholds();
    };

    refreshData(); // Initial refresh
    refreshTimerRef.current = setInterval(refreshData, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [
    deviceIdRef, chartDateMode, dateRange, autoRefresh, refreshInterval, 
    fetchLatestReading, fetchReadings, fetchThresholds
  ]);

  // Handle tab changes
  useEffect(() => {
    if (!deviceIdRef.current) return;
    
    if (activeTab === 'latest') {
      fetchReadings(deviceIdRef.current, 'latest');
    } else if (activeTab === 'daily') {
      fetchReadings(deviceIdRef.current, 'daily');
    } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
      fetchReadings(deviceIdRef.current, 'range', dateRange);
    }
  }, [deviceIdRef, activeTab, dateRange, fetchReadings]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!deviceIdRef.current) return;
    
    await fetchLatestReading(deviceIdRef.current);
    await fetchReadings(deviceIdRef.current, chartDateMode as ChartDateMode, dateRange);
    await fetchThresholds();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    toast({
      title: autoRefresh ? "Auto-refresh disabled" : "Auto-refresh enabled",
      description: autoRefresh 
        ? "You'll need to refresh manually to see new data" 
        : "Data will update automatically every 30 seconds",
    });
  };

  // Get appropriate badge for device status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'online': return <Badge className="bg-green-500">Online</Badge>;
      case 'offline': return <Badge variant="outline" className="text-gray-500">Offline</Badge>;
      case 'warning': return <Badge variant="default" className="bg-yellow-500 text-black">Warning</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Export data to CSV
  const exportData = () => {
    if (!device || readings.length === 0) return;
    
    const headers = ['Timestamp', 'Temperature (°C)', 'Humidity (%)'];
    const csvContent = [
      headers.join(','),
      ...readings.map(reading => [
        format(new Date(reading.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        reading.temperature,
        reading.humidity
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `device-${device.id}-${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading device information...</p>
      </div>
    );
  }

  // Show error state if device not found
  if (!device) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-2">Device not found</h2>
        <p className="text-muted-foreground mb-4">The device you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/devices')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Devices
        </Button>
      </div>
    );
  }

  // Check for warnings
  const hasTemperatureWarning = latestReading && thresholds && 
    (latestReading.temperature < thresholds.minTemperature || 
     latestReading.temperature > thresholds.maxTemperature);
    
  const hasHumidityWarning = latestReading && thresholds && 
    (latestReading.humidity < thresholds.minHumidity || 
     latestReading.humidity > thresholds.maxHumidity);

  return (
    <div className="space-y-6">
      {/* Header with navigation and controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/devices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {device.name}
              {getStatusBadge(device.status)}
            </h1>
            <p className="text-muted-foreground">
              Location: {device.location?.name || 'Unknown'} • Serial: {device.serialNumber}
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated: {format(lastUpdated, 'HH:mm:ss')} 
              {autoRefresh && <span className="ml-1">(Auto-refresh: ON)</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={toggleAutoRefresh} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
            {autoRefresh ? "Disable Auto-refresh" : "Enable Auto-refresh"}
          </Button>
          <Button variant="outline" onClick={exportData} className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button 
            onClick={handleRefresh} 
            className="gap-2" 
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Now
          </Button>
        </div>
      </div>
      
      {/* Warning alert */}
      {(hasTemperatureWarning || hasHumidityWarning) && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            <p>This device has readings outside the acceptable range:</p>
            <ul className="list-disc list-inside mt-2">
              {hasTemperatureWarning && (
                <li>
                  Temperature: {latestReading?.temperature}°C 
                  (Acceptable range: {thresholds?.minTemperature}°C - {thresholds?.maxTemperature}°C)
                </li>
              )}
              {hasHumidityWarning && (
                <li>
                  Humidity: {latestReading?.humidity}% 
                  (Acceptable range: {thresholds?.minHumidity}% - {thresholds?.maxHumidity}%)
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Current readings summary cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Temperature Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Current Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold flex items-center",
              hasTemperatureWarning ? "text-red-500" : ""
            )}>
              {latestReading ? `${latestReading.temperature}°C` : 'N/A'}
              {hasTemperatureWarning && <AlertTriangle className="h-4 w-4 ml-1" />}
              {autoRefresh && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestReading ? `Last reading: ${formatDBTimestamp(latestReading.timestamp)}` : 'No readings available'}
            </p>
            {thresholds && (
              <p className="text-xs text-muted-foreground">
                Acceptable range: {thresholds.minTemperature}°C - {thresholds.maxTemperature}°C
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Humidity Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Current Humidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold flex items-center",
              hasHumidityWarning ? "text-red-500" : ""
            )}>
              {latestReading ? `${latestReading.humidity}%` : 'N/A'}
              {hasHumidityWarning && <AlertTriangle className="h-4 w-4 ml-1" />}
              {autoRefresh && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestReading ? `Last reading: ${formatDBTimestamp(latestReading.timestamp)}` : 'No readings available'}
            </p>
            {thresholds && (
              <p className="text-xs text-muted-foreground">
                Acceptable range: {thresholds.minHumidity}% - {thresholds.maxHumidity}%
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Status Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Device added: {format(new Date(device.createdAt), 'yyyy-MM-dd')}
            </p>
            <p className="text-xs text-muted-foreground">
              Auto-refresh: {autoRefresh ? 'Enabled (30s)' : 'Disabled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Sensor Readings</CardTitle>
          <CardDescription>
            {activeTab === 'latest' ? 'Last 10 temperature and humidity readings' :
             activeTab === 'daily' ? 'Daily temperature and humidity data' : 
             'Custom date range temperature and humidity data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value);
            }}
          >
            <div className="flex justify-between items-center mb-4 flex-wrap">
              <TabsList>
                <TabsTrigger value="latest">Latest</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="range">Date Range</TabsTrigger>
              </TabsList>
              
              {/* Date picker for daily view */}
              {activeTab === 'daily' && (
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
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
                        onSelect={(date) => {
                          if (date && deviceIdRef.current) {
                            setSelectedDate(date);
                            fetchReadings(deviceIdRef.current, 'daily');
                          }
                        }}
                        initialFocus
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              
              {/* Date range picker */}
              {activeTab === 'range' && (
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal w-[250px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
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
                        onSelect={(newRange) => {
                          setDateRange(newRange);
                          if (newRange?.from && newRange?.to && deviceIdRef.current) {
                            fetchReadings(deviceIdRef.current, 'range', newRange);
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            
            {/* Chart display area */}
            <div className="pt-4">
              {isRefreshing && (
                <div className="text-center mb-2">
                  <Loader2 className="h-4 w-4 animate-spin inline-block" />
                  <span className="ml-2 text-xs text-muted-foreground">Refreshing data...</span>
                </div>
              )}
              
              {readings.length > 0 ? (
                <DeviceColumnChart 
                  data={readings} 
                  height={400}
                  limit={10}
                  dateMode={chartDateMode}
                />
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No sensor readings available for the selected timeframe
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceDetail;
