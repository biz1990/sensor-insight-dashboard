
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Edit, MapPin, Trash } from 'lucide-react';
import { mockLocations } from '@/services/mockData';
import { DeviceLocation } from '@/types';
import { useToast } from '@/hooks/use-toast';

const LocationsAdmin = () => {
  const [locations, setLocations] = useState<DeviceLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
  });
  const [selectedLocation, setSelectedLocation] = useState<DeviceLocation | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      // In a real application, this would be an API call
      setLocations(mockLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocation = async () => {
    try {
      // In a real application, this would be an API call
      const newId = Math.max(...locations.map(l => l.id)) + 1;
      const currentDate = new Date().toISOString();
      
      const createdLocation: DeviceLocation = {
        id: newId,
        name: newLocation.name,
        description: newLocation.description,
        createdAt: currentDate,
        updatedAt: currentDate,
      };
      
      setLocations([...locations, createdLocation]);
      setIsAddDialogOpen(false);
      setNewLocation({ name: '', description: '' });
      
      toast({
        title: "Location created",
        description: `Location ${createdLocation.name} has been created successfully.`,
      });
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        title: "Error",
        description: "Failed to create location.",
        variant: "destructive",
      });
    }
  };

  const handleEditLocation = async () => {
    try {
      // In a real application, this would be an API call
      if (!selectedLocation) return;
      
      const updatedLocations = locations.map(location => 
        location.id === selectedLocation.id ? { ...selectedLocation, updatedAt: new Date().toISOString() } : location
      );
      
      setLocations(updatedLocations);
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      
      toast({
        title: "Location updated",
        description: `Location ${selectedLocation.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLocation = async () => {
    try {
      // In a real application, this would be an API call
      if (!selectedLocation) return;
      
      const updatedLocations = locations.filter(location => location.id !== selectedLocation.id);
      
      setLocations(updatedLocations);
      setIsDeleteDialogOpen(false);
      setSelectedLocation(null);
      
      toast({
        title: "Location deleted",
        description: `Location ${selectedLocation.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete location.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage device locations
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <MapPin className="h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Create a new device location. Name is required.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLocation} disabled={!newLocation.name}>
                Add Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Locations</CardTitle>
          <CardDescription>
            Manage device locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading locations...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.id}</TableCell>
                      <TableCell>{location.name}</TableCell>
                      <TableCell>{location.description}</TableCell>
                      <TableCell>{format(new Date(location.createdAt), 'yyyy-MM-dd')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog open={isEditDialogOpen && selectedLocation?.id === location.id} onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (!open) setSelectedLocation(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setSelectedLocation(location);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Location</DialogTitle>
                                <DialogDescription>
                                  Update location information.
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedLocation && (
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">
                                      Name
                                    </Label>
                                    <Input
                                      id="edit-name"
                                      value={selectedLocation.name}
                                      onChange={(e) => setSelectedLocation({ ...selectedLocation, name: e.target.value })}
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-description" className="text-right">
                                      Description
                                    </Label>
                                    <Textarea
                                      id="edit-description"
                                      value={selectedLocation.description}
                                      onChange={(e) => setSelectedLocation({ ...selectedLocation, description: e.target.value })}
                                      className="col-span-3"
                                      rows={3}
                                    />
                                  </div>
                                </div>
                              )}
                              
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleEditLocation}>
                                  Save Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog open={isDeleteDialogOpen && selectedLocation?.id === location.id} onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) setSelectedLocation(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  setSelectedLocation(location);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Location</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this location? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedLocation && (
                                <div className="py-4">
                                  <p><strong>Name:</strong> {selectedLocation.name}</p>
                                  <p><strong>Description:</strong> {selectedLocation.description}</p>
                                </div>
                              )}
                              
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleDeleteLocation}>
                                  Delete Location
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationsAdmin;
