import type { AxiosRequestConfig } from 'axios';
import type { Transaction, TransactionsDataTableResponse } from 'src/types/transactions';

import { round } from 'es-toolkit';
import { Link } from 'react-router';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
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

import { paths } from 'src/routes/paths';

import { fDateTime } from 'src/utils/format-time';

import { fetcher } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

function formatDuration(startDate: Date | string, endDate: Date | string | null): string {
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : Date.now();
  const diffMs = end - start;
  if (diffMs < 0) return '—';
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const STATUS_COLOR: Record<string, 'info' | 'success' | 'default'> = {
  CARGANDO: 'info',
  FINALIZADO: 'success',
};

const STATUS_LABEL: Record<string, string> = {
  CARGANDO: 'En curso',
  FINALIZADO: 'Finalizada',
};

// ----------------------------------------------------------------------

type TransactionsTableProps = {
  endpoint: string;
  extraParams?: Record<string, string | number>;
  enableSearch?: boolean;
  searchQuery?: string;
  defaultPageSize?: number;
  showEndDate?: boolean;
  showStatus?: boolean;
};

// ----------------------------------------------------------------------

export function TransactionsTable({
  endpoint,
  enableSearch = true,
  searchQuery: searchQueryProp,
  defaultPageSize = 10,
  extraParams,
  showEndDate = false,
  showStatus = false,
}: TransactionsTableProps) {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [searchQueryInternal, setSearchQueryInternal] = useState('');
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const isControlled = searchQueryProp !== undefined;
  const searchQuery = isControlled ? searchQueryProp : searchQueryInternal;

  const fetchTransactions = useCallback(async () => {
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
      };
      const result: TransactionsDataTableResponse = await fetcher([endpoint, queryArgs]);
      setRows(result.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, extraParams, page, pageSize, searchQuery, orderBy, order]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSort = (field: string) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const colSpan = (showEndDate ? 8 : 7) + 1 + (showStatus ? 1 : 0);

  return (
    <>
      {/* Search */}
      {enableSearch && !isControlled && (
        <Box sx={{ mb: 3 }}>
          <TextField
            size='small'
            sx={{maxWidth: 400}}
            placeholder="Buscar por usuario, estación, cargador..."
            value={searchQueryInternal}
            onChange={(e) => {
              setSearchQueryInternal(e.target.value);
              setPage(0);
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
                <TableCell sx={{ width: 56, color: 'text.disabled' }}>#</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'chargepoint'}
                    direction={orderBy === 'chargepoint' ? order : 'asc'}
                    onClick={() => handleSort('chargepoint')}
                  >
                    Cargador
                  </TableSortLabel>
                </TableCell>
                <TableCell>Conector</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'startDate'}
                    direction={orderBy === 'startDate' ? order : 'asc'}
                    onClick={() => handleSort('startDate')}
                  >
                    Inicio
                  </TableSortLabel>
                </TableCell>
                {showEndDate && (
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'endDate'}
                      direction={orderBy === 'endDate' ? order : 'asc'}
                      onClick={() => handleSort('endDate')}
                    >
                      Fin
                    </TableSortLabel>
                  </TableCell>
                )}
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'power'}
                    direction={orderBy === 'power' ? order : 'asc'}
                    onClick={() => handleSort('power')}
                  >
                    Energía
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'total'}
                    direction={orderBy === 'total' ? order : 'asc'}
                    onClick={() => handleSort('total')}
                  >
                    Coste
                  </TableSortLabel>
                </TableCell>
                <TableCell>Usuario</TableCell>
                {showStatus && <TableCell>Estado</TableCell>}
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
                      No se encontraron recargas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((tx) => (
                  <TableRow
                    key={tx.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, userSelect: 'none' }}
                  >
                    {/* ID */}
                    <TableCell>
                      <Typography variant="caption" color="text.disabled">
                        {tx.id}
                      </Typography>
                    </TableCell>

                    {/* Cargador */}
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Iconify icon="mdi:ev-station" width={16} sx={{ color: 'primary.main', flexShrink: 0 }} />
                          {tx.chargepoint?.id ? (
                            <Link
                              to={paths.chargingstations.detail(String(tx.chargepoint.id))}
                              style={{ textDecoration: 'none' }}
                            >
                              <Typography variant="subtitle2" color='text.primary'>
                                {tx.chargepoint.name ?? '-'}
                              </Typography>
                            </Link>
                          ) : (
                            <Typography variant="subtitle2">{tx.chargepoint?.name ?? '-'}</Typography>
                          )}
                        </Stack>
                        {tx.address && (
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Iconify icon="mdi:map-marker-outline" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                              {tx.address}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </TableCell>

                    {/* Conector */}
                    <TableCell>
                      {tx.chargepoint?.connectors?.length ? (
                        <Stack spacing={0.5}>
                          {tx.chargepoint.connectors.map((conn) => (
                            <Stack key={conn.id} direction="row" alignItems="center" spacing={0.75}>
                              <Iconify icon="mdi:power-plug-outline" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
                              <Typography variant="caption" color="text.secondary">
                                {conn.name ?? `Conector ${conn.ocppId}`}
                                {conn.power ? ` · ${conn.power} kW` : ''}
                              </Typography>
                              <Chip
                                label={conn.status}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.6rem' }}
                              />
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>

                    {/* Duración */}
                    <TableCell>
                      <Typography variant="body2">
                        {tx.startDate ? formatDuration(tx.startDate, tx.endDate ?? null) : '—'}
                      </Typography>
                    </TableCell>

                    {/* Inicio */}
                    <TableCell>
                      <Typography variant="body2">
                        {tx.startDate ? fDateTime(tx.startDate) : '—'}
                      </Typography>
                    </TableCell>

                    {/* Fin (solo finalizadas) */}
                    {showEndDate && (
                      <TableCell>
                        <Typography variant="body2">
                          {tx.endDate ? fDateTime(tx.endDate) : '—'}
                        </Typography>
                      </TableCell>
                    )}

                    {/* Energía */}
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Iconify icon="mdi:lightning-bolt" width={15} sx={{ color: 'warning.main' }} />
                        <Typography variant="body2" fontWeight={600}>
                          {tx.power ? round(tx.power, 2) : 0} kWh
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Coste */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {tx.total ? round(tx.total, 2) : 0} €
                      </Typography>
                    </TableCell>

                    {/* Usuario */}
                    <TableCell>
                      {tx.appUser ? (
                        <Stack spacing={0.25}>
                          {tx.appUser.id ? (
                            <Link
                              to={paths.appUsers.detail(tx.appUser.id)}
                              style={{ textDecoration: 'none' }}
                            >
                              <Typography variant="subtitle2" color='text.primary'>
                                {tx.appUser.name ?? '—'}
                              </Typography>
                            </Link>
                          ) : (
                            <Typography variant="subtitle2">{tx.appUser.name ?? '—'}</Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {tx.appUser.email ?? ''}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>

                    {/* Estado (solo en vista "Todas") */}
                    {showStatus && (
                      <TableCell>
                        <Label color={STATUS_COLOR[tx.status] ?? 'default'} variant="soft">
                          {STATUS_LABEL[tx.status] ?? tx.status}
                        </Label>
                      </TableCell>
                    )}
                  </TableRow>
                ))
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
    </>
  );
}
