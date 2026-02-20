import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import type { DashboardStats } from '../../services/dashboard.service';
import type { InventoryItem as Inventory, InventoryMovement } from '../../types/api';

interface MerchantDashboardProps {
  stats: DashboardStats;
  lowStock: Inventory[];
  history: InventoryMovement[];
}

export function MerchantDashboard({ stats, lowStock, history }: MerchantDashboardProps) {

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas (Unidades)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVentas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cant. Ordenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Ventas (7 Días)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" name="Unidades Out" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Abastecimiento (7 Días)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.purchaseData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#82ca9d" name="Unidades In" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card>
            <CardHeader>
                <CardTitle>Alertas de Stock</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Stock Actual</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lowStock.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.product?.title || 'Unknown Product'}</TableCell>
                                <TableCell className="text-red-500 font-bold">{item.stock}</TableCell>
                            </TableRow>
                        ))}
                        {lowStock.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">Sin alertas</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
      
       <Card>
          <CardHeader>
              <CardTitle>Historial de Productos</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="rounded-md border">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Cliente/Info</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {history.map((movement) => (
                          <TableRow key={movement.id}>
                              <TableCell>{new Date(movement.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{movement.product?.title}</TableCell>
                              <TableCell>
                                <Badge variant={movement.type === 'IN' ? 'default' : 'secondary'}>
                                    {movement.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{movement.quantity}</TableCell>
                              <TableCell>{movement.user?.email || 'System'}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
             </div>
          </CardContent>
      </Card>
    </div>
  );
}
