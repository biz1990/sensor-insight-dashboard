
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { Edit, Trash, UserPlus } from 'lucide-react';
import { mockUsers } from '@/services/mockData';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const UsersAdmin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'user',
    isActive: true,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // In a real application, this would be an API call
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      // In a real application, this would be an API call
      const newId = Math.max(...users.map(u => u.id)) + 1;
      const currentDate = new Date().toISOString();
      
      const createdUser: User = {
        id: newId,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role as 'admin' | 'user',
        isActive: newUser.isActive,
        createdAt: currentDate,
        updatedAt: currentDate,
      };
      
      setUsers([...users, createdUser]);
      setIsAddDialogOpen(false);
      setNewUser({ username: '', email: '', role: 'user', isActive: true });
      
      toast({
        title: "User created",
        description: `User ${createdUser.username} has been created successfully.`,
      });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to create user.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async () => {
    try {
      // In a real application, this would be an API call
      if (!selectedUser) return;
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? { ...selectedUser, updatedAt: new Date().toISOString() } : user
      );
      
      setUsers(updatedUsers);
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: "User updated",
        description: `User ${selectedUser.username} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      // In a real application, this would be an API call
      if (!selectedUser) return;
      
      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      
      setUsers(updatedUsers);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: "User deleted",
        description: `User ${selectedUser.username} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage user accounts
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. All fields are required.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger id="role" className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Active
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="isActive"
                    checked={newUser.isActive}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, isActive: checked })}
                  />
                  <Label htmlFor="isActive">
                    {newUser.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={!newUser.username || !newUser.email}>
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading users...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(user.createdAt), 'yyyy-MM-dd')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog open={isEditDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (!open) setSelectedUser(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>
                                  Update user information and permissions.
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedUser && (
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-username" className="text-right">
                                      Username
                                    </Label>
                                    <Input
                                      id="edit-username"
                                      value={selectedUser.username}
                                      onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-email" className="text-right">
                                      Email
                                    </Label>
                                    <Input
                                      id="edit-email"
                                      value={selectedUser.email}
                                      onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-role" className="text-right">
                                      Role
                                    </Label>
                                    <Select
                                      value={selectedUser.role}
                                      onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value as 'admin' | 'user' })}
                                    >
                                      <SelectTrigger id="edit-role" className="col-span-3">
                                        <SelectValue placeholder="Select a role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-isActive" className="text-right">
                                      Active
                                    </Label>
                                    <div className="flex items-center space-x-2 col-span-3">
                                      <Switch
                                        id="edit-isActive"
                                        checked={selectedUser.isActive}
                                        onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, isActive: checked })}
                                      />
                                      <Label htmlFor="edit-isActive">
                                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                                      </Label>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleEditUser}>
                                  Save Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog open={isDeleteDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) setSelectedUser(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete User</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this user? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedUser && (
                                <div className="py-4">
                                  <p><strong>Username:</strong> {selectedUser.username}</p>
                                  <p><strong>Email:</strong> {selectedUser.email}</p>
                                  <p><strong>Role:</strong> {selectedUser.role}</p>
                                </div>
                              )}
                              
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleDeleteUser}>
                                  Delete User
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

export default UsersAdmin;
