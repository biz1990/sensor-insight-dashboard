
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, RefreshCw, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import DeviceColumnChart from '@/components/charts/DeviceColumnChart';
import { getDeviceReadings, getDeviceWithLocation } from '@/services/mockData';
import { cn } from '@/lib/utils';
import { DateRange, Device, SensorReading } from '@/types';
import { DateRange as DayPickerDateRange } from 'react-day-picker';

const DeviceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | undefined>();
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DayPickerDateRange | undefined>();
  const [activeTab, setActiveTab] = useState<'daily' | 'range'>('daily');

  useEffect(() => {
    if (id) {
      fetchDevice(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (device?.id) {
      if (activeTab === 'daily') {
        fetchDailyData(device.id, selectedDate);
      } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
        fetchRangeData(device.id, dateRange.from, dateRange.to);
      }
    }
  }, [device, selectedDate, dateRange, activeTab]);

  const fetchDevice = async (deviceId: number) => {
    setIsLoading(true);
    try {
      // In a real application, this would be an API call
      const fetchedDevice = getDeviceWithLocation(deviceId);
      if (fetchedDevice) {
        setDevice(fetchedDevice);
        fetchDailyData(deviceId, selectedDate);
      }
    } catch (error) {
      console.error('Error fetching device:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyData = async (deviceId: number, date: Date) => {
    // In a real application, this would be an API call with the date parameter
    try {
      const deviceReadings = getDeviceReadings(deviceId, 24); // Get 24 hours of data
      setReadings(deviceReadings);
    } catch (error) {
      console.error('Error fetching readings:', error);
    }
  };

  const fetchRangeData = async (deviceId: number, start: Date, end: Date) => {
    // In a real application, this would be an API call with date range parameters
    try {
      // Calculate days difference
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const deviceReadings = getDeviceReadings(deviceId, diffDays * 24); // Get data for the range
      setReadings(deviceReadings);
    } catch (error) {
      console.error('Error fetching range readings:', error);
    }
  };

  const handleRefresh = () => {
    if (device?.id) {
      fetchDevice(device.id);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>;
      case 'offline':
        return <Badge variant="outline" className="text-gray-500">Offline</Badge>;
      case 'warning':
        return <Badge className="warning-badge">Warning</Badge>;
      case 'error':
        return <Badge className="danger-badge">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const exportData = () => {
    // In a real application, this would call an API to generate the CSV
    if (!device || readings.length === 0) return;

    // Convert readings to CSV
    const headers = ['Timestamp', 'Temperature (°C)', 'Humidity (%)'];
    const csvContent = [
      headers.join(','),
      ...readings.map(reading => [
        format(new Date(reading.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        reading.temperature,
        reading.humidity
      ].join(','))
    ].join('\n');

    // Create blob and download
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
        Loading device information...
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

  const latestReading = readings.length > 0 ? readings[0] : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
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
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData} className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={() => fetchDevice(device.id)} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
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
              latestReading?.temperature! > 28 || latestReading?.temperature! < 18 ? "temperature-text" : ""
            )}>
              {latestReading ? `${latestReading.temperature}°C` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestReading ? `Last updated: ${format(new Date(latestReading.timestamp), 'yyyy-MM-dd HH:mm')}` : 'No readings available'}
            </p>
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
              latestReading?.humidity! > 70 || latestReading?.humidity! < 30 ? "humidity-text" : ""
            )}>
              {latestReading ? `${latestReading.humidity}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestReading ? `Last updated: ${format(new Date(latestReading.timestamp), 'yyyy-MM-dd HH:mm')}` : 'No readings available'}
            </p>
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
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Sensor Readings</CardTitle>
          <CardDescription>
            Historical temperature and humidity data
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
            
            <div className="pt-4">
              {readings.length > 0 ? (
                <DeviceColumnChart data={readings} height={400} />
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
