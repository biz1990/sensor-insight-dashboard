import React, { useState } from 'react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Loader2 } from 'lucide-react';
import { Device } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface DeviceReportFormProps {
  devices: Device[];
  onGenerateReport: (deviceId: number, startDate: Date, endDate: Date, interval: string) => Promise<any>;
}

const DeviceReportForm: React.FC<DeviceReportFormProps> = ({ devices, onGenerateReport }) => {
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [interval, setInterval] = useState<string>('raw');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateReport = async () => {
    if (!selectedDevice || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please select a device, start date, and end date",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const deviceId = parseInt(selectedDevice);
      const report = await onGenerateReport(deviceId, startDate, endDate, interval);
      
      // Handle the report data (e.g., download as CSV)
      if (report && report.data && report.data.readings) {
        const device = devices.find(d => d.id === deviceId);
        const deviceName = device ? device.name : `Device-${deviceId}`;
        
        // Format dates for filename
        const startFormatted = formatInTimeZone(startDate, 'Asia/Ho_Chi_Minh', 'yyyyMMdd');
        const endFormatted = formatInTimeZone(endDate, 'Asia/Ho_Chi_Minh', 'yyyyMMdd');
        
        // Log the date range for debugging
        console.log(`Report date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
        console.log(`First reading timestamp: ${report.data.readings[0]?.timestamp}`);
        
        // Create CSV content
        const headers = ['Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Device', 'Location'];
        const csvContent = [
          headers.join(','),
          ...report.data.readings.map((reading: any) => {
            // Parse the timestamp and format it in Vietnam timezone
            const timestamp = new Date(reading.timestamp);
            const formattedTimestamp = formatInTimeZone(timestamp, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss');
            
            return [
              formattedTimestamp,
              reading.temperature.toFixed(2),
              reading.humidity.toFixed(2),
              deviceName.replace(/,/g, ' '),
              (report.data.device.location || 'Unknown').replace(/,/g, ' ')
            ].join(',');
          })
        ].join('\n');
        
        // Create and download the file
        const BOM = '\uFEFF'; // For Excel compatibility
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${deviceName}-report-${startFormatted}-to-${endFormatted}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Report generated",
          description: `Report for ${deviceName} has been downloaded`,
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Device Report</CardTitle>
        <CardDescription>
          Select a device and date range to generate a report of sensor readings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="device">Device</Label>
          <Select
            value={selectedDevice}
            onValueChange={setSelectedDevice}
          >
            <SelectTrigger id="device">
              <SelectValue placeholder="Select a device" />
            </SelectTrigger>
            <SelectContent>
              {devices.map(device => (
                <SelectItem key={device.id} value={device.id.toString()}>
                  {device.name} ({device.serialNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => startDate ? date < startDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="interval">Data Interval</Label>
          <Select
            value={interval}
            onValueChange={setInterval}
          >
            <SelectTrigger id="interval">
              <SelectValue placeholder="Select data interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="raw">Raw Data (All readings)</SelectItem>
              <SelectItem value="hourly">Hourly Average</SelectItem>
              <SelectItem value="daily">Daily Average</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button onClick={handleGenerateReport} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeviceReportForm;