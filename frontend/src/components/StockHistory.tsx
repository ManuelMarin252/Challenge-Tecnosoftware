import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface StockHistoryProps {
  productId: number;
}

export function StockHistory({ productId }: StockHistoryProps) {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['inventory-history', productId],
    queryFn: () => inventoryService.getHistory(productId),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando historial...</div>;
  if (!movements || movements.length === 0) return <div className="text-sm text-muted-foreground">Sin movimientos registrados.</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Historial de Movimientos</h3>
      <div className="border rounded-md divide-y">
        {movements.map((move) => (
          <div key={move.id} className="p-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-full ${
                  move.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                 {move.type === 'IN' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
              </div>
              <div>
                <p className="font-medium">{move.type === 'IN' ? 'Reposición' : 'Venta/Salida'}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(move.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
            </div>
            <div className="text-right">
                <p className="font-bold">{move.type === 'IN' ? '+' : '-'}{move.quantity}</p>
                <p className="text-xs text-muted-foreground">{move.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
