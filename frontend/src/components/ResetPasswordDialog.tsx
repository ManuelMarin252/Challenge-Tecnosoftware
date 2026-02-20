import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { type User } from '../types/api';
import { getErrorMessage } from '../lib/utils';
import { X, Loader2 } from 'lucide-react';

interface ResetPasswordDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function ResetPasswordDialog({ user, open, onClose }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (pwd: string) => userService.resetPassword(user!.id, pwd),
    onSuccess: () => {
      setSuccess(true);
      setNewPassword('');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    }
  });

  if (!open || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    mutation.mutate(newPassword);
  };

  const handleClose = () => {
    setSuccess(false);
    setNewPassword('');
    setError('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-sm rounded-xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-lg">Reset Password</h3>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Resetting password for <strong>{user.email}</strong>
          </p>

          <div className="space-y-2">
             <label className="text-sm font-medium">New Password</label>
             <input 
                type="text" 
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
             />
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
          {success && <div className="text-sm text-green-600 bg-green-500/10 p-2 rounded">Password reset successfully!</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md">Close</button>
            <button 
              type="submit" 
              disabled={mutation.isPending || !newPassword}
              className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
