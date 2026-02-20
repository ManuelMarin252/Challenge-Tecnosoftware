import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { RoleManagerDialog } from '../components/RoleManagerDialog';
import { CreateUserDialog } from '../components/CreateUserDialog';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';
import { type User } from '../types/api';
import { Shield, User as UserIcon, Loader2, Search, Plus, KeyRound } from 'lucide-react';
import clsx from 'clsx';

export function Users() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isResetPwdOpen, setIsResetPwdOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  });

  const handleManageRoles = (user: User) => {
    setSelectedUser(user);
    setIsRoleDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetPwdOpen(true);
  };

  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load users. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage users, roles, and security.</p>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
                type="text"
                placeholder="Search users..."
                className="pl-9 h-10 w-full sm:w-[250px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <button
                onClick={() => setIsCreateUserOpen(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
                <Plus size={16} className="mr-2" />
                New User
            </button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Roles</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UserIcon size={16} />
                      </div>
                      <span className="font-medium">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <span 
                          key={role.id}
                          className={clsx(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border",
                            role.name === 'Admin' 
                              ? "bg-destructive/10 text-destructive border-destructive/20" 
                              : role.name === 'Merchant'
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-secondary text-secondary-foreground border-transparent"
                          )}
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button
                        onClick={() => handleResetPassword(user)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 w-9 text-muted-foreground"
                        title="Reset Password"
                        >
                        <KeyRound size={16} />
                        </button>
                        <button
                        onClick={() => handleManageRoles(user)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 w-9 text-primary"
                        title="Manage Roles"
                        >
                        <Shield size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers?.length === 0 && (
                <tr>
                   <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                      No users found matching "{searchTerm}"
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RoleManagerDialog 
        user={selectedUser} 
        open={isRoleDialogOpen} 
        onClose={() => setIsRoleDialogOpen(false)} 
      />

      <CreateUserDialog 
        open={isCreateUserOpen} 
        onClose={() => setIsCreateUserOpen(false)} 
      />

      <ResetPasswordDialog 
        user={selectedUser} 
        open={isResetPwdOpen} 
        onClose={() => setIsResetPwdOpen(false)} 
      />
    </div>
  );
}
