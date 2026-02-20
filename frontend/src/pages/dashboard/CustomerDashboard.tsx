import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import type { DashboardStats } from '../../services/dashboard.service';
import type { InventoryMovement } from '../../types/api';

interface CustomerDashboardProps {
  stats: DashboardStats;
  history: InventoryMovement[];
}

export function CustomerDashboard({ stats, history }: CustomerDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado (Unidades)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVentas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordenes Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMovements}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Mis Compras Recientes</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="rounded-md border">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          {/* <TableHead>Total</TableHead> Assuming price later */}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {history.map((movement) => (
                          <TableRow key={movement.id}>
                              <TableCell>{new Date(movement.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{movement.product?.title}</TableCell>
                              <TableCell>{movement.quantity}</TableCell>
                          </TableRow>
                      ))}
                      {history.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">Aún no has realizado compras.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
             </div>
          </CardContent>
      </Card>
    </div>
  );
}
