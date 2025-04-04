
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Device, DeviceLocation } from '@/types';
import { mockLocations } from '@/services/mockData';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Device name must be at least 2 characters.' }),
  serialNumber: z.string().min(4, { message: 'Serial number must be at least 4 characters.' }),
  locationId: z.string().min(1, { message: 'Please select a location.' }),
});

type AddDeviceProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => void;
};

const AddDeviceDialog: React.FC<AddDeviceProps> = ({ open, onOpenChange, onAdd }) => {
  const [locations, setLocations] = useState<DeviceLocation[]>([]);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      serialNumber: '',
      locationId: '',
    },
  });
  
  useEffect(() => {
    // In a real app, this would be an API call
    setLocations(mockLocations);
  }, []);
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      onAdd({
        name: values.name,
        serialNumber: values.serialNumber,
        locationId: parseInt(values.locationId),
        status: 'offline'
      });
      
      toast({
        title: "Device added",
        description: `${values.name} has been successfully added.`,
      });
      
      form.reset();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>
            Create a new sensor device. Fill in all the required fields.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Temperature Sensor 01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="SN-12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value} 
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem 
                          key={location.id} 
                          value={location.id.toString()}
                        >
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Device</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeviceDialog;
