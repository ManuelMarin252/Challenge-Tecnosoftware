import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/role.service';
import { userService } from '../services/user.service';
import { type User } from '../types/api';
import { X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { getErrorMessage } from '../lib/utils';

interface RoleManagerDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function RoleManagerDialog({ user, open, onClose }: RoleManagerDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // Reset state when user opens dialog
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line
      setSelectedRoleIds(user.roles.map(r => r.id));
    }
  }, [user, open]);

  // Fetch available roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: roleService.getRoles,
    enabled: open, // Only fetch when dialog is open
  });

  // Mutation to update roles
  const mutation = useMutation({
    mutationFn: (roleIds: number[]) => userService.updateUserRoles(user!.id, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  if (!open || !user) return null;

  const handleToggleRole = (roleId: number) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSave = () => {
    mutation.mutate(selectedRoleIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-lg">Manage Roles</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Select roles for <span className="font-medium text-foreground">{user.email}</span>
          </p>

          {rolesLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {roles?.map((role) => (
                <label 
                  key={role.id} 
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedRoleIds.includes(role.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-accent"
                  )}
                >
                  <span className="font-medium">{role.name}</span>
                  <input
                    type="checkbox"
                    className="accent-primary h-4 w-4"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => handleToggleRole(role.id)}
                  />
                </label>
              ))}
            </div>
          )}

          {mutation.isError && (
             <div className="mt-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm">
                {getErrorMessage(mutation.error)}
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
