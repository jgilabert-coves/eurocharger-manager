import type { AxiosRequestConfig } from 'axios';
import type { Charge, ChargesDataTableResponse } from 'src/types/charges';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { useDebounce } from 'src/hooks/use-debounce';

import { fDateTime } from 'src/utils/format-time';

import { fetcher } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { useAbility } from 'src/auth/hooks/use-ability';

import { RefundDialog } from './refund-dialog';
import { ChangeStatusDialog } from './change-status-dialog';
import { ChargeStatusChip } from '../chips/charge-status-chip';
import { VALID_TRANSITIONS } from './charge-status-transitions';
import { chargeDescription, CHARGE_TYPE_COLORS, CHARGE_TYPE_LABELS } from './charge-type';

// ----------------------------------------------------------------------

type ChargesTableProps = {
  appUserId: number;
  endpoint: string;
  extraParams?: Record<string, string | number>;
  enableSearch?: boolean;
  searchQuery?: string;
  defaultPageSize?: number;
  showActions?: boolean;
};

// ----------------------------------------------------------------------

export function ChargesTable({
  appUserId,
  endpoint,
  extraParams,
  enableSearch = true,
  searchQuery: searchQueryProp,
  defaultPageSize = 10,
  showActions = true,
}: ChargesTableProps) {
  const [rows, setRows] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundCharge, setRefundCharge] = useState<Charge | null>(null);
  const [statusCharge, setStatusCharge] = useState<Charge | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [searchQueryInternal, setSearchQueryInternal] = useState('');
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const abortRef = useRef<AbortController | null>(null);

  const { hasRole } = useAbility();
  // Refund / cambio de estado son operaciones financieras: el backend las
  // restringe a rol "eurocharger" (requireRole), así que solo mostramos los
  // botones a ese rol para no enseñar acciones que devolverían 403.
  const canAct = showActions && hasRole('eurocharger');

  const isControlled = searchQueryProp !== undefined;
  const debouncedInternal = useDebounce(searchQueryInternal, 400);
  const searchQuery = isControlled ? searchQueryProp : debouncedInternal;

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const fetchCharges = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const queryArgs: AxiosRequestConfig = {
        params: {
          page,
          pageSize,
          sortQuery: `${orderBy}=${order}`,
          searchQuery,
          ...extraParams,
        },
        signal: controller.signal,
      };
      const result: ChargesDataTableResponse = await fetcher([endpoint, queryArgs]);
      setRows(result.data);
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED') return;
      console.error('Error fetching charges:', err);
      setRows([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [endpoint, extraParams, page, pageSize, searchQuery, orderBy, order]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  const handleSort = (field: string) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const colSpan = 6 + (canAct ? 1 : 0);

  return (
    <>
      {/* Search */}
      {enableSearch && !isControlled && (
        <Box sx={{ mb: 3 }}>
          <TextField
            size="small"
            sx={{ maxWidth: 400 }}
            placeholder="Buscar por PaymentIntent, transacción, mensaje..."
            value={searchQueryInternal}
            onChange={(e) => {
              setSearchQueryInternal(e.target.value);
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end">
                      <Iconify icon="eva:search-fill" width={20} height={20} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      )}

      {/* Table */}
      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'id'}
                    direction={orderBy === 'id' ? order : 'asc'}
                    onClick={() => handleSort('id')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? order : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Estado
                  </TableSortLabel>
                </TableCell>
                <TableCell>Stripe</TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'created_at'}
                    direction={orderBy === 'created_at' ? order : 'asc'}
                    onClick={() => handleSort('created_at')}
                    sx={{ '& .MuiTableSortLabel-icon': { position: 'absolute', right: -20 } }}
                  >
                    Fecha
                  </TableSortLabel>
                </TableCell>
                {canAct && <TableCell align="center">Acciones</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron cargos
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((charge) => {
                  const canRefund = charge.status === 'captured' || charge.status === 'authorized';
                  // 'captured' solo admite reembolso; 'authorized' (no capturado) se cancela.
                  const refundLabel =
                    charge.status === 'captured' ? 'Reembolsar en Stripe' : 'Cancelar en Stripe';
                  const canChangeStatus = (VALID_TRANSITIONS[charge.status] ?? []).length > 0;

                  return (
                    <TableRow
                      key={charge.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {charge.id}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Label color={CHARGE_TYPE_COLORS[charge.type]} variant="soft">
                          {CHARGE_TYPE_LABELS[charge.type]}
                        </Label>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 260 }} noWrap>
                          {chargeDescription(charge)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <ChargeStatusChip status={charge.status} />
                      </TableCell>

                      <TableCell>
                        <Tooltip title={charge.stripeChargeId ?? ''} arrow>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 160, color: 'text.secondary' }}
                          >
                            {charge.stripeChargeId ?? '—'}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="body2">
                          {charge.createdAt ? fDateTime(charge.createdAt) : '—'}
                        </Typography>
                      </TableCell>

                      {canAct && (
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            spacing={0.5}
                          >
                            {canRefund && (
                              <Tooltip title={refundLabel}>
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setRefundCharge(charge)}
                                  >
                                    <Iconify icon="mingcute:refund-cny-line" width={18} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {canChangeStatus && (
                              <Tooltip title="Cambiar estado manualmente">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => setStatusCharge(charge)}
                                  >
                                    <Iconify icon="mingcute:edit-2-line" width={18} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={-1}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 40]}
          labelRowsPerPage="Filas por página"
          slotProps={{
            actions: {
              nextButton: { disabled: rows.length < pageSize },
            },
          }}
        />
      </Card>

      {refundCharge && (
        <RefundDialog
          open
          appUserId={appUserId}
          charge={refundCharge}
          onClose={() => setRefundCharge(null)}
          onSuccess={fetchCharges}
        />
      )}

      {statusCharge && (
        <ChangeStatusDialog
          open
          appUserId={appUserId}
          charge={statusCharge}
          onClose={() => setStatusCharge(null)}
          onSuccess={fetchCharges}
        />
      )}
    </>
  );
}
