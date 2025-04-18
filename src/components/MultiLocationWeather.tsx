import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, X, RefreshCw, MapPin } from 'lucide-react';
import { useWeather, weatherLocations, WeatherLocation } from '@/hooks/use-weather';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface MultiLocationWeatherProps {
  className?: string;
  initialLocations?: string[];
  maxLocations?: number;
}

const WeatherCard: React.FC<{ location: WeatherLocation, onRemove?: () => void }> = ({ 
  location, 
  onRemove 
}) => {
  const { weatherData, isLoading, error } = useWeather(location);
  
  // Get timezone abbreviation based on location
  const getTimezoneAbbr = (timezone?: string) => {
    if (!timezone) return 'UTC';
    
    // Simple mapping of common timezones to abbreviations
    const timezoneMap: Record<string, string> = {
      'Asia/Ho_Chi_Minh': 'GMT+7',
      'Asia/Seoul': 'KST',
      'America/New_York': 'EST/EDT',
      'Europe/London': 'GMT/BST',
      'Asia/Tokyo': 'JST',
      'Australia/Sydney': 'AEST/AEDT',
      'UTC': 'UTC'
    };
    
    return timezoneMap[timezone] || timezone.split('/').pop() || 'UTC';
  };
  
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{location.name}</CardTitle>
              <CardDescription className="text-xs">
                {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
              </CardDescription>
            </div>
          </div>
          {onRemove && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="py-2 text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
        {weatherData && (
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {weatherData.current.temperature2m.toFixed(1)}°C
                </span>
                <Badge variant="outline" className="text-xs">
                  {getTimezoneAbbr(location.timezone)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Updated: {weatherData.current.time.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: true, 
                  timeZone: location.timezone || 'UTC' 
                })}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Next 4 Hours</h4>
              <div className="grid grid-cols-4 gap-1">
                {weatherData.hourly.time.slice(0, 4).map((time, index) => (
                  <div key={index} className="text-center p-1 bg-muted/50 rounded text-xs">
                    <p>{time.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: false, 
                      timeZone: location.timezone || 'UTC' 
                    })}</p>
                    <p className="font-medium">{weatherData.hourly.temperature2m[index].toFixed(1)}°</p>
                    <p className="text-[10px]">{weatherData.hourly.relativeHumidity2m[index].toFixed(0)}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MultiLocationWeather: React.FC<MultiLocationWeatherProps> = ({
  className = '',
  initialLocations = ['Hòa Phú, Vĩnh Long, Vietnam', 'Seoul, South Korea'],
  maxLocations = 6
}) => {
  // Filter initial locations to only include valid ones from our predefined list
  const validInitialLocations = initialLocations
    .map(name => weatherLocations.find(loc => loc.name === name))
    .filter((loc): loc is WeatherLocation => loc !== undefined);
  
  // State for selected locations
  const [selectedLocations, setSelectedLocations] = useState<WeatherLocation[]>(
    validInitialLocations.length > 0 ? validInitialLocations : [weatherLocations[0]]
  );
  
  // State for the add location dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState<string>('');
  
  // Add a new location
  const addLocation = () => {
    if (!newLocationName) return;
    
    const locationToAdd = weatherLocations.find(loc => loc.name === newLocationName);
    if (!locationToAdd) return;
    
    // Check if location already exists
    if (selectedLocations.some(loc => loc.name === locationToAdd.name)) {
      setIsAddDialogOpen(false);
      setNewLocationName('');
      return;
    }
    
    // Add the new location
    setSelectedLocations(prev => [...prev, locationToAdd]);
    setIsAddDialogOpen(false);
    setNewLocationName('');
  };
  
  // Remove a location
  const removeLocation = (index: number) => {
    // Don't remove if it's the last location
    if (selectedLocations.length <= 1) return;
    
    setSelectedLocations(prev => prev.filter((_, i) => i !== index));
  };
  
  // Get available locations (not already selected)
  const availableLocations = weatherLocations.filter(
    loc => !selectedLocations.some(selected => selected.name === loc.name)
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Global Weather</CardTitle>
            <CardDescription>Monitor weather across multiple locations</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                disabled={selectedLocations.length >= maxLocations || availableLocations.length === 0}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Weather Location</DialogTitle>
                <DialogDescription>
                  Select a location to add to your weather dashboard.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <Select value={newLocationName} onValueChange={setNewLocationName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocations.map(location => (
                      <SelectItem key={location.name} value={location.name}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addLocation} disabled={!newLocationName}>
                  Add Location
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {selectedLocations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No locations added. Add a location to see weather data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedLocations.map((location, index) => (
              <WeatherCard 
                key={location.name} 
                location={location} 
                onRemove={selectedLocations.length > 1 ? () => removeLocation(index) : undefined}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiLocationWeather;