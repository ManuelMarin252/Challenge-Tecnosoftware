import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { AxiosError } from 'axios';
import { shopService } from '../services/shop.service';
import type { InventoryItem } from '../types/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

function ShopItem({ item }: { item: InventoryItem }) {
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const purchaseMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      setIsPurchasing(true);
      await shopService.purchase([{ productId, quantity }]);
    },
    onSuccess: () => {
      toast.success(`Compra de ${quantity} unidad(es) realizada con éxito`);
      queryClient.invalidateQueries({ queryKey: ['shop-products-v2'] });
      setQuantity(1); // Reset quantity
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        'Error al realizar la compra: ' +
          (error.response?.data?.message || error.message),
      );
    },
    onSettled: () => {
      setIsPurchasing(false);
    },
  });

  const handleBuy = () => {
    if (quantity > item.stock) {
        toast.error(`Solo hay ${item.stock} unidades disponibles.`);
        return;
    }
    if (quantity <= 0) {
        toast.error('La cantidad debe ser mayor a 0.');
        return;
    }

    if (confirm(`¿Confirmar compra de ${quantity} unidad(es) de ${item.product.title}?`)) {
      purchaseMutation.mutate({ productId: item.product.id, quantity });
    }
  };

  const increment = () => setQuantity((prev) => Math.min(prev + 1, item.stock));
  const decrement = () => setQuantity((prev) => Math.max(prev - 1, 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (isNaN(val)) return;
      if (val > item.stock) setQuantity(item.stock);
      else if (val < 1) setQuantity(1); // Don't allow 0 directly, handle on blur if needed or correct immediately
      else setQuantity(val);
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm flex flex-col overflow-hidden">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-secondary text-secondary-foreground mb-2 inline-block">
              {item.product.code || '-'}
            </span>
            <h3 className="text-xl font-semibold leading-none tracking-tight">
              {item.product.title || 'Sin Título'}
            </h3>
          </div>
          <div
            className={
              item.stock > 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'
            }
          >
            {item.stock > 0 ? `${item.stock} en stock` : 'Agotado'}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {item.product.description || 'Sin descripción'}
        </p>

        <div className="mt-auto pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                 <span className="text-lg font-bold">
                    {/* Price is not in product entity yet, displaying generic */}
                    $ - 
                 </span>
            </div>

            {item.stock > 0 && (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={decrement} disabled={quantity <= 1} aria-label="Disminuir cantidad">
                        <Minus className="h-3 w-3" />
                    </Button>
                    <Input 
                        type="number" 
                        min={1} 
                        max={item.stock} 
                        value={quantity} 
                        onChange={handleInputChange}
                        className="h-8 w-16 text-center remove-arrow"
                        aria-label="Cantidad"
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={increment} disabled={quantity >= item.stock} aria-label="Incrementar cantidad">
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            )}
         
          <Button
            onClick={handleBuy}
            disabled={item.stock <= 0 || isPurchasing}
            className="w-full"
          >
            {isPurchasing ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4" />
            )}
            Comprar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Shop() {
  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ['shop-products-v2'],
    queryFn: shopService.getProducts,
  });

  if (isLoading) return <div className="p-8">Cargando productos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Tienda</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {inventoryItems?.map((item) => (
          <ShopItem key={item.id} item={item} />
        ))}

        {inventoryItems?.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No hay productos disponibles en la tienda.
          </div>
        )}
      </div>
    </div>
  );
}
