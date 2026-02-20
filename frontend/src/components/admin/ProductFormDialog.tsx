import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../../services/category.service';
import { productService } from '../../services/product.service';
import { toast } from 'sonner';
import type { Product } from '../../types/api';

const productSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  categoryId: z.string().min(1, 'La categoría es requerida').transform(val => parseInt(val, 10)),
  description: z.string().optional(),
});

type ProductFormValues = z.output<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, productToEdit }: ProductFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!productToEdit;

  const { data: categories } = useQuery({
    queryKey: ['categories-v2'],
    queryFn: categoryService.findAll,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm<z.input<typeof productSchema>, undefined, z.output<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      code: '',
      categoryId: undefined,
      description: '',
    },
  });

  useEffect(() => {
    if (productToEdit) {
      setValue('title', productToEdit.title);
      setValue('code', productToEdit.code);
      setValue('categoryId', productToEdit.categoryId.toString());
      setValue('description', productToEdit.description || '');
    } else {
      reset({
        title: '',
        code: '',
        categoryId: undefined,
        description: '',
      });
    }
  }, [productToEdit, setValue, reset, open]);

  const createMutation = useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      toast.success('Producto creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      onOpenChange(false);
      reset();
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error('Error al crear producto: ' + (error.response?.data?.message || error.message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormValues) => productService.update(productToEdit!.id, data),
    onSuccess: () => {
      toast.success('Producto actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      onOpenChange(false);
      reset();
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error('Error al actualizar producto: ' + (error.response?.data?.message || error.message));
    },
  });

  const onSubmit = (data: z.output<typeof productSchema>) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los detalles del producto aquí.' : 'Ingresa los detalles del nuevo producto.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...register('title')} placeholder="Nombre del producto" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input id="code" {...register('code')} placeholder="Código único (SKU)" disabled={isEditing} />
            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              {...register('categoryId')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Seleccionar categoría</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" {...register('description')} placeholder="Breve descripción" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
