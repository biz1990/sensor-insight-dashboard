
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getUsers, addUser, updateUser, deleteUser } from '@/services/databaseService';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    isActive: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const userData = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role as 'admin' | 'user',
        isActive: newUser.isActive,
      };
      
      const createdUser = await addUser(userData);
      
      if (createdUser) {
        setUsers([...users, createdUser]);
        setIsAddDialogOpen(false);
        setNewUser({ 
          username: '', 
          email: '', 
          password: '', 
          confirmPassword: '', 
          role: 'user', 
          isActive: true 
        });
        
        toast({
          title: "User created",
          description: `User ${createdUser.username} has been created successfully.`,
        });
      }
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
      if (!selectedUser) return;
      
      const updatedUser = await updateUser(selectedUser.id, selectedUser);
      
      if (updatedUser) {
        const updatedUsers = users.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        );
        
        setUsers(updatedUsers);
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        
        toast({
          title: "User updated",
          description: `User ${updatedUser.username} has been updated successfully.`,
        });
      }
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
      if (!selectedUser) return;
      
      const result = await deleteUser(selectedUser.id);
      
      if (result.success) {
        const updatedUsers = users.filter(user => user.id !== selectedUser.id);
        
        setUsers(updatedUsers);
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        
        toast({
          title: "User deleted",
          description: `User ${selectedUser.username} has been deleted successfully.`,
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  return {
    users,
    isLoading,
    newUser,
    setNewUser,
    selectedUser,
    setSelectedUser,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    openEditDialog,
    openDeleteDialog
  };
};
