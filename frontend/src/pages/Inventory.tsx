
import { useState } from 'react';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import type { InventoryItem } from '../types/api';
import { Plus, History } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'; // Assuming UI components exist or using generic dialog
import { StockHistory } from '../components/StockHistory';

export function Inventory() {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);
  const [replenishQuantity, setReplenishQuantity] = useState(1);
  const [replenishReason, setReplenishReason] = useState('Reposición manual');

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory-v2'],
    queryFn: () => inventoryService.findAll(false),
  });

  const replenishMutation = useMutation({
    mutationFn: async (data: { productId: number, quantity: number, reason: string }) => {
        await inventoryService.replenish(data.productId, data.quantity, data.reason);
    },
    onSuccess: () => {
        toast.success('Stock actualizado');
        setIsReplenishOpen(false);
        queryClient.invalidateQueries({ queryKey: ['inventory-v2'] });
        queryClient.invalidateQueries({ queryKey: ['inventory-history'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
        toast.error('Error al actualizar stock: ' + (error.response?.data?.message || error.message));
    }
  });

  const handleReplenish = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedProduct) {
          replenishMutation.mutate({
              productId: selectedProduct.productId,
              quantity: replenishQuantity,
              reason: replenishReason
          });
      }
  };

  const openReplenish = (item: InventoryItem) => {
      setSelectedProduct(item);
      setReplenishQuantity(10);
      setReplenishReason('Reposición manual');
      setIsReplenishOpen(true);
  };

  if (isLoading) return <div className="p-8">Cargando inventario...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h2>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              <th className="h-12 px-4 font-medium">Producto</th>
              <th className="h-12 px-4 font-medium">Código</th>
              <th className="h-12 px-4 font-medium text-right">Stock Actual</th>
              <th className="h-12 px-4 font-medium text-right">Min. Stock</th>
              <th className="h-12 px-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {inventory?.map((item) => (
              <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                <td className="p-4 font-medium">{item.product.title || 'Sin Título'}</td>
                <td className="p-4 text-muted-foreground">{item.product.code || '-'}</td>
                <td className={`p-4 text-right font-bold ${item.stock <= item.minStock ? 'text-red-500' : ''}`}>
                    {item.stock}
                </td>
                <td className="p-4 text-right text-muted-foreground">{item.minStock}</td>
                <td className="p-4 text-right">
                   <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openReplenish(item)}
                        className="p-2 hover:bg-primary/10 text-primary rounded-md transition-colors"
                        title="Reponer Stock"
                      >
                         <Plus size={18} />
                      </button>
                      
                      {/* History Trigger (Using Dialog for simplicity in this file, ideally a separate component) */}
                      <Dialog>
                        <DialogTrigger asChild>
                            <button className="p-2 hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors" title="Ver Historial">
                                <History size={18} />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Historial: {item.product.title}</DialogTitle>
                            </DialogHeader>
                            <StockHistory productId={item.productId} />
                        </DialogContent>
                      </Dialog>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Replenish Dialog */}
      {isReplenishOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
             <div className="bg-card border rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
                <h3 className="text-lg font-semibold">Reponer Stock: {selectedProduct.product.title}</h3>
                <form onSubmit={handleReplenish}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cantidad a agregar</label>
                            <input 
                                type="number" 
                                min="1"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={replenishQuantity}
                                onChange={e => setReplenishQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Motivo</label>
                            <input 
                                type="text" 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={replenishReason}
                                onChange={e => setReplenishReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button" 
                            onClick={() => setIsReplenishOpen(false)}
                            className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={replenishMutation.isPending}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            {replenishMutation.isPending ? 'Guardando...' : 'Confirmar'}
                        </button>
                    </div>
                </form>
             </div>
          </div>
      )}
    </div>
  );
}
