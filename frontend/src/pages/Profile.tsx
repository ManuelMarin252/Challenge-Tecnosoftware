import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { useAuth } from '../hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '../lib/utils';

export function Profile() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => userService.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
    }

    mutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and security.</p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-medium">Account Information</h3>
        </div>
        <div className="p-6 space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="p-2 bg-muted/30 rounded-md border border-input text-foreground">
                   {user?.email}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Roles</label>
                <div className="flex flex-wrap gap-2 mt-2">
                   {user?.roles.map(role => (
                      <span key={role.id} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium border border-primary/20">
                        {role.name}
                      </span>
                   ))}
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-medium">Change Password</h3>
          <p className="text-sm text-muted-foreground mt-1">Ensure your account is using a long, random password to stay secure.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <input 
                        type="password" 
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <input 
                        type="password" 
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <input 
                        type="password" 
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                </div>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            {success && <div className="text-sm text-green-600 bg-green-500/10 p-3 rounded-md">Password changed successfully.</div>}

            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                    {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
                    Update Password
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
