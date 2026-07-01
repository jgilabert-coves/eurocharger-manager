import type { SimOrderWithAccount } from 'src/types/sims';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fDateTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';

import { AssignSimsToOrderDialog } from './components/assign-sims-to-order-dialog';

// ----------------------------------------------------------------------

type SimOrdersResponse = { data: SimOrderWithAccount[]; total: number };

const shippingLine = (o: SimOrderWithAccount) =>
  [o.shipping_address, o.shipping_postal_code, o.shipping_city].filter(Boolean).join(', ') || '—';

export function SimRequestsTab() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<SimOrderWithAccount | null>(null);

  const { data: res, isLoading } = useQuery<SimOrdersResponse>({
    queryKey: ['sim-orders', 'requests'],
    queryFn: () => fetcher(endpoints.simOrders.requests),
  });

  const rows = res?.data ?? [];

  return (
    <>
      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cuenta</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Asignadas</TableCell>
                <TableCell>Envío</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Acción</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay solicitudes pendientes
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((order) => (
                  <TableRow
                    key={order.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="body2">{order.account_name}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{order.quantity}</Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={`${order.assigned_count}/${order.quantity}`}
                        color={order.assigned_count >= order.quantity ? 'success' : 'default'}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{shippingLine(order)}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{fDateTime(order.created_at)}</Typography>
                    </TableCell>

                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setSelectedOrder(order)}
                      >
                        Asignar tarjetas
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedOrder !== null && (
        <AssignSimsToOrderDialog
          open
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['sim-orders', 'requests'] });
          }}
        />
      )}
    </>
  );
}
