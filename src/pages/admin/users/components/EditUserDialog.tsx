
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from '@/components/ui/button';
import { User } from '@/types';

interface EditUserDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedUser: User | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
  onSave: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  isOpen,
  setIsOpen,
  selectedUser,
  setSelectedUser,
  onSave,
}) => {
  if (!selectedUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setSelectedUser(null);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>
        
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
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
