
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUserManagement } from './hooks/useUserManagement';
import UsersTable from './components/UsersTable';
import AddUserDialog from './components/AddUserDialog';
import EditUserDialog from './components/EditUserDialog';
import DeleteUserDialog from './components/DeleteUserDialog';

const UsersAdminPage = () => {
  const {
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
  } = useUserManagement();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage user accounts
          </p>
        </div>
        
        <AddUserDialog
          isOpen={isAddDialogOpen}
          setIsOpen={setIsAddDialogOpen}
          onAddUser={handleAddUser}
          newUser={newUser}
          setNewUser={setNewUser}
        />
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
            <UsersTable
              users={users}
              onEditUser={openEditDialog}
              onDeleteUser={openDeleteDialog}
            />
          )}
        </CardContent>
      </Card>

      <EditUserDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        onSave={handleEditUser}
      />

      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
};

export default UsersAdminPage;
