import { useState } from 'react';
import { useAuth } from '../../context/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/product.service';
import { ProductFormDialog } from '../../components/admin/ProductFormDialog';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Pencil, Trash2, Plus, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../../types/api';
import { AxiosError } from 'axios';

export function Products() {
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const isAdmin = user?.roles.some(r => r.id === 3); 
  const isMerchant = user?.roles.some(r => r.id === 2);
  const canManageProducts = isAdmin || isMerchant;
  
  // Force showInactive to false if not admin or merchant
  if (!canManageProducts && showInactive) {
      setShowInactive(false);
  }

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-admin', showInactive],
    queryFn: () => productService.getAll(showInactive, showInactive), // Show both inactive and deleted when toggle is on
    enabled: !!user, 
  });

  const deleteMutation = useMutation({
    mutationFn: productService.delete,
    onSuccess: () => {
      toast.success('Producto eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error('Error al eliminar producto: ' + (error.response?.data?.message || error.message));
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: productService.deactivate, // Accessing new method I added to service
    onSuccess: () => {
      toast.success('Producto desactivado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error('Error al desactivar producto: ' + (error.response?.data?.message || error.message));
    },
  });

  const activateMutation = useMutation({
    mutationFn: productService.activate,
    onSuccess: () => {
      toast.success('Producto activado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error('Error al activar producto: ' + (error.response?.data?.message || error.message));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: productService.restore,
    onSuccess: () => {
      toast.success('Producto restaurado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error('Error al restaurar producto: ' + (error.response?.data?.message || error.message));
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleStatusChange = (product: Product) => {
    // Cannot toggle if deleted
    if (product.deletedAt) return;

    // Admin and Merchant can reactivate
    if (!product.isActive && !canManageProducts) {
        toast.error('No tienes permisos para reactivar productos.');
        return;
    }

    if (product.isActive) {
       deactivateMutation.mutate(product.id);
    } else {
      activateMutation.mutate(product.id);
    }
  };

  if (isLoading) return <div className="p-8">Cargando productos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Productos</h2>
          <p className="text-muted-foreground">Administra el catálogo de productos.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
        </Button>
      </div>

      {canManageProducts && (
        <div className="flex items-center space-x-2">
            <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive">Mostrar eliminados</Label>
        </div>
      )}

      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Título</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Código</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Categoría</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {products?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                products?.map((product) => (
                  <tr key={product.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">{product.title}</td>
                    <td className="p-4 align-middle">{product.code}</td>
                    <td className="p-4 align-middle">{product.category?.name || product.categoryId}</td> 
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        product.deletedAt
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : product.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {product.deletedAt ? 'Eliminado' : product.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleStatusChange(product)}
                          disabled={!!product.deletedAt || (!product.isActive && !canManageProducts)}
                          title={product.deletedAt ? "Restaurar primero" : !product.isActive && !canManageProducts ? "No tienes permisos" : "Activar/Desactivar"}
                        />

                        {product.deletedAt ? (
                           isAdmin && (
                            <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              if (confirm(`¿Estás seguro de restaurar el producto "${product.title}"?`)) {
                                restoreMutation.mutate(product.id);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-600"
                            title="Restaurar producto"
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                           )
                        ) : (
                          <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar el producto "${product.title}"?`)) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        productToEdit={editingProduct} 
      />
    </div>
  );
}
