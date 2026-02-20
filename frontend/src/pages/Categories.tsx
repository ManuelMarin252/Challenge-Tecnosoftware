import { useState } from 'react';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/category.service';
import type { Category } from '../types/api';
import { Loader2, Plus, Pencil, Trash2, X, Search, Tag } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';

interface CategoryDialogProps {
  category?: Category;
  open: boolean;
  onClose: () => void;
}

interface CategoryFormData {
    id?: number;
    name: string;
}

function CategoryDialog({ category, open, onClose }: CategoryDialogProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState(category?.name || '');
    const [error, setError] = useState('');
    const isEditing = !!category;

    const mutation = useMutation({
        mutationFn: (data: CategoryFormData) => isEditing ? categoryService.update(category!.id, data.name) : categoryService.create({ id: data.id!, name: data.name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories-v2'] });
            onClose();
            setName('');
        },
        onError: (err: AxiosError<{ message: string }>) => {
            setError(err.response?.data?.message || 'Failed to save category');
        }
    });

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: CategoryFormData = isEditing ? { name } : { id: Math.floor(Math.random() * 100000), name };
        mutation.mutate(payload);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center  justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-sm rounded-xl shadow-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                    <h3 className="font-semibold text-lg">{isEditing ? 'Edit Category' : 'New Category'}</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <input 
                            type="text" 
                            required
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                        >
                            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function Categories() {
  const { user } = useAuth();
  const isAdmin = user?.roles.some(r => r.id === 3);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-v2'],
    queryFn: categoryService.findAll,
  });

  const deleteMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories-v2'] });
    }
  });

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(undefined);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
        deleteMutation.mutate(id);
    }
  };

  const filtered = categories?.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">Manage product categories.</p>
        </div>
        {isAdmin && (
             <button onClick={handleCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                <Plus size={16} /> New Category
            </button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="p-4 border-b border-border">
             <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search categories..."
                    className="pl-9 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <div className="divide-y divide-border">
            {filtered?.map(category => (
                <div key={category.id} className="flex items-center justify-between p-4 hover:bg-muted/5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Tag size={20} />
                        </div>
                        <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {category.id}</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(category)} className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground">
                                <Pencil size={18} />
                            </button>
                            <button onClick={() => handleDelete(category.id)} className="p-2 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>
            ))}
             {filtered?.length === 0 && <div className="p-8 text-center text-muted-foreground">No categories found.</div>}
        </div>
      </div>

      {isDialogOpen && (
        <CategoryDialog 
            open={isDialogOpen} 
            onClose={() => setIsDialogOpen(false)} 
            category={selectedCategory} 
        />
      )}
    </div>
  );
}
