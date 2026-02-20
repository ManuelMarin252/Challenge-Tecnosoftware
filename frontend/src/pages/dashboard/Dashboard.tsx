import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/auth-context';
import { dashboardService } from '../../services/dashboard.service';
import { AdminDashboard } from './AdminDashboard';
import { MerchantDashboard } from './MerchantDashboard';
import { CustomerDashboard } from './CustomerDashboard';
import { RoleEnum } from '../../types/api';
import { toast } from 'sonner';

export function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: lowStock } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: dashboardService.getLowStock,
    enabled: user?.roles.some(r =>
      r.name.toLowerCase() === RoleEnum.ADMIN ||
      r.name.toLowerCase() === RoleEnum.MERCHANT
    ),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['dashboard-history'],
    queryFn: dashboardService.getHistory,
  });

  // SSE Effect
  useEffect(() => {
    // Only connect if user is logged in
    if (!user) return;

    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/events/stream`);

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        console.log('[SSE] Received event:', parsedData);

        // Handle case where backend might wrap payload in a 'data' property
        const eventData = parsedData.data || parsedData;
        const { type, payload } = eventData;

        const refetchAll = () => {
          queryClient.refetchQueries({ queryKey: ['dashboard-stats'] });
          queryClient.refetchQueries({ queryKey: ['dashboard-history'] });
          queryClient.refetchQueries({ queryKey: ['dashboard-low-stock'] });
        };

        if (type === 'product.sold') {
            toast.info(`Nueva venta: ${payload?.quantity} unidades de producto ID ${payload?.productId}`);
            refetchAll();
        } else if (type === 'stock.replenished') {
            toast.success(`Stock reabastecido: +${payload?.quantity} unidades para producto ID ${payload?.productId}`);
            refetchAll();
        } else if (type === 'stock.changed') {
            console.log('[SSE] Stock changed, refreshing dashboard...');
            // Don't toast for everything if it's too frequent, but for now let's be verbose to help debugging
            toast.info(`Inventario actualizado (ID ${payload?.productId})`);
            refetchAll();
        } else if (type === 'product.created') {
            console.log('[SSE] Product created, updating stats...');
            toast.success('Nuevo producto registrado en el sistema');
            queryClient.refetchQueries({ queryKey: ['dashboard-stats'] });
        }
      } catch (err) {
        console.error('[SSE] Error parsing event data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error, browser will attempt auto-reconnect:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [user, queryClient]);


  if (statsLoading || historyLoading) return <div className="p-8">Cargando dashboard...</div>;
  if (!stats) return <div className="p-8">No se pudo cargar la información.</div>;

  const isAdmin = user?.roles.some(r => r.name.toLowerCase() === RoleEnum.ADMIN);
  const isMerchant = user?.roles.some(r => r.name.toLowerCase() === RoleEnum.MERCHANT);

  // Render based on highest privilege
  if (isAdmin) {
    return <AdminDashboard stats={stats} lowStock={lowStock || []} history={history || []} />;
  }

  if (isMerchant) {
     return <MerchantDashboard stats={stats} lowStock={lowStock || []} history={history || []} />;
  }

  return <CustomerDashboard stats={stats} history={history || []} />;
}
