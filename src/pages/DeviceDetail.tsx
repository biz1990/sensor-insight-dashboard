import React, { useState, useEffect, useCallback } from 'react';
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
import { DateRange, Device, SensorReading, WarningThreshold } from '@/types';
import { DateRange as DayPickerDateRange } from 'react-day-picker';
import { getDeviceReadings, getDevices, getWarningThresholds } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';

const DeviceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | undefined>();
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DayPickerDateRange | undefined>();
  const [activeTab, setActiveTab] = useState<'daily' | 'range'>('daily');
  const [chartDateMode, setChartDateMode] = useState<'latest' | 'daily' | 'range'>('latest');
  const { toast } = useToast();
  const [thresholds, setThresholds] = useState<WarningThreshold | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval] = useState<number>(30000); // 30 seconds

  const fetchThresholds = useCallback(async () => {
    try {
      const thresholdsData = await getWarningThresholds();
      setThresholds(thresholdsData);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    }
  }, []);

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

  const fetchDailyData = useCallback(async (deviceId: number) => {
    try {
      const deviceReadings = await getDeviceReadings(deviceId, 24);
      setReadings(deviceReadings);
      setLastUpdated(new Date());
      setChartDateMode('daily');
    } catch (error) {
      console.error('Error fetching readings:', error);
      toast({
        title: "Error",
        description: "Failed to load sensor readings",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchLatestData = useCallback(async (deviceId: number) => {
    try {
      const deviceReadings = await getDeviceReadings(deviceId, 24);
      setReadings(deviceReadings);
      setLastUpdated(new Date());
      setChartDateMode('latest');
    } catch (error) {
      console.error('Error fetching latest readings:', error);
      toast({
        title: "Error",
        description: "Failed to load latest sensor readings",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchRangeData = useCallback(async (deviceId: number, start: Date, end: Date) => {
    try {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const deviceReadings = await getDeviceReadings(deviceId, diffDays * 24);
      setReadings(deviceReadings);
      setLastUpdated(new Date());
      setChartDateMode('range');
    } catch (error) {
      console.error('Error fetching range readings:', error);
      toast({
        title: "Error",
        description: "Failed to load sensor readings for the selected date range",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (id) {
      const deviceId = parseInt(id);
      fetchDevice(deviceId).then(success => {
        if (success) {
          fetchLatestData(deviceId);
        }
      });
      fetchThresholds();
    }
  }, [id, fetchDevice, fetchLatestData, fetchThresholds]);

  useEffect(() => {
    if (!autoRefresh || !device?.id) return;
    
    const refreshData = () => {
      if (chartDateMode === 'latest') {
        fetchLatestData(device.id);
      } else if (chartDateMode === 'daily') {
        fetchDailyData(device.id);
      } else if (chartDateMode === 'range' && dateRange?.from && dateRange?.to) {
        fetchRangeData(device.id, dateRange.from, dateRange.to);
      }
      fetchThresholds();
    };
    
    const intervalId = setInterval(refreshData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [device, chartDateMode, dateRange, autoRefresh, refreshInterval, fetchLatestData, fetchDailyData, fetchRangeData, fetchThresholds]);

  useEffect(() => {
    if (!device?.id) return;
    
    if (activeTab === 'daily') {
      fetchDailyData(device.id);
    } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
      fetchRangeData(device.id, dateRange.from, dateRange.to);
    }
  }, [device?.id, activeTab, dateRange, fetchDailyData, fetchRangeData]);

  const formatDBTimestamp = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      return formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return 'Unknown';
    }
  };

  const handleRefresh = () => {
    if (!device?.id) return;
    
    if (activeTab === 'daily') {
      fetchDailyData(device.id);
    } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
      fetchRangeData(device.id, dateRange.from, dateRange.to);
    } else {
      fetchLatestData(device.id);
    }
    fetchThresholds();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    toast({
      title: autoRefresh ? "Auto-refresh disabled" : "Auto-refresh enabled",
      description: autoRefresh 
        ? "You'll need to refresh manually to see new data" 
        : "Data will update automatically every 30 seconds",
    });
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>;
      case 'offline':
        return <Badge variant="outline" className="text-gray-500">Offline</Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-yellow-500">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading device information...</p>
      </div>
    );
  }

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

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : undefined;
  
  const hasTemperatureWarning = latestReading && thresholds && 
    (latestReading.temperature < thresholds.minTemperature || 
    latestReading.temperature > thresholds.maxTemperature);
    
  const hasHumidityWarning = latestReading && thresholds && 
    (latestReading.humidity < thresholds.minHumidity || 
    latestReading.humidity > thresholds.maxHumidity);

  return (
    <div className="space-y-6">
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
              {device.location?.name} • Serial: {device.serialNumber}
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated: {formatDBTimestamp(lastUpdated)} 
              {autoRefresh && <span className="ml-1">(Auto-refresh: ON)</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleAutoRefresh} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
            {autoRefresh ? "Disable Auto-refresh" : "Enable Auto-refresh"}
          </Button>
          <Button variant="outline" onClick={exportData} className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Now
          </Button>
        </div>
      </div>
      
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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Current Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              hasTemperatureWarning ? "text-red-500" : ""
            )}>
              {latestReading ? `${latestReading.temperature}°C` : 'N/A'}
              {hasTemperatureWarning && <AlertTriangle className="h-4 w-4 inline ml-1" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestReading ? `Last updated: ${formatDBTimestamp(latestReading.timestamp)}` : 'No readings available'}
            </p>
            {thresholds && (
              <p className="text-xs text-muted-foreground">
                Acceptable range: {thresholds.minTemperature}°C - {thresholds.maxTemperature}°C
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Current Humidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              hasHumidityWarning ? "text-red-500" : ""
            )}>
              {latestReading ? `${latestReading.humidity}%` : 'N/A'}
              {hasHumidityWarning && <AlertTriangle className="h-4 w-4 inline ml-1" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestReading ? `Last updated: ${formatDBTimestamp(latestReading.timestamp)}` : 'No readings available'}
            </p>
            {thresholds && (
              <p className="text-xs text-muted-foreground">
                Acceptable range: {thresholds.minHumidity}% - {thresholds.maxHumidity}%
              </p>
            )}
          </CardContent>
        </Card>
        
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
            <p className="text-xs text-muted-foreground mt-1">
              Auto-refresh: {autoRefresh ? 'Enabled (30s)' : 'Disabled'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Sensor Readings</CardTitle>
          <CardDescription>
            {activeTab === 'daily' ? 'Daily temperature and humidity data' : 
             activeTab === 'range' ? 'Custom date range temperature and humidity data' : 
             'Last 10 temperature and humidity readings'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: string) => {
            const newTab = value as 'daily' | 'range';
            setActiveTab(newTab);
            
            if (newTab !== activeTab && device?.id) {
              if (newTab === 'daily') {
                fetchDailyData(device.id);
              } else if (newTab === 'range' && dateRange?.from && dateRange?.to) {
                fetchRangeData(device.id, dateRange.from, dateRange.to);
              }
            }
          }}>
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
                        onSelect={(date) => {
                          if (date && device?.id) {
                            setSelectedDate(date);
                            fetchDailyData(device.id);
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
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        selected={dateRange}
                        onSelect={(newRange) => {
                          setDateRange(newRange);
                          if (newRange?.from && newRange?.to && device?.id) {
                            fetchRangeData(device.id, newRange.from, newRange.to);
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            
            <div className="pt-4">
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
