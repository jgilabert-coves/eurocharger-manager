import type { AxiosRequestConfig } from 'axios';
import type { Transaction, TransactionsDataTableResponse } from 'src/types/transactions';

import { round } from 'es-toolkit';
import { Link } from 'react-router';
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

import { paths } from 'src/routes/paths';

import { useDebounce } from 'src/hooks/use-debounce';

import { fDateTime } from 'src/utils/format-time';

import { fetcher } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

import { useAbility } from 'src/auth/hooks/use-ability';

import { TransactionStatusChip } from '../chips/transaction-status-chip';

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
  const abortRef = useRef<AbortController | null>(null);

  const { hasRole } = useAbility();
  const isEurocharger = hasRole('eurocharger');

  const isControlled = searchQueryProp !== undefined;
  const debouncedInternal = useDebounce(searchQueryInternal, 400);
  const searchQuery = isControlled ? searchQueryProp : debouncedInternal;

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const fetchTransactions = useCallback(async () => {
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
      const result: TransactionsDataTableResponse = await fetcher([endpoint, queryArgs]);
      setRows(result.data);
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED') return;
      console.error('Error fetching transactions:', err);
      setRows([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
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

  const colSpan = (showEndDate ? 8 : 7) + 1 + (showStatus ? 1 : 0) + (isEurocharger ? 1 : 0);

  return (
    <>
      {/* Search */}
      {enableSearch && !isControlled && (
        <Box sx={{ mb: 3 }}>
          <TextField
            size="small"
            sx={{ maxWidth: 400 }}
            placeholder="Buscar por usuario, estación, cargador..."
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
                {isEurocharger && <TableCell>ID</TableCell>}
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'chargepoint'}
                    direction={orderBy === 'chargepoint' ? order : 'asc'}
                    onClick={() => handleSort('chargepoint')}
                  >
                    Cargador
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Conector</TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'startDate'}
                    direction={orderBy === 'startDate' ? order : 'asc'}
                    onClick={() => handleSort('startDate')}
                    sx={{ '& .MuiTableSortLabel-icon': { position: 'absolute', right: -20 } }}
                  >
                    Inicio
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Duración</TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'power'}
                    direction={orderBy === 'power' ? order : 'asc'}
                    onClick={() => handleSort('power')}
                    sx={{ '& .MuiTableSortLabel-icon': { position: 'absolute', right: -20 } }}
                  >
                    kWh
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'total'}
                    direction={orderBy === 'total' ? order : 'asc'}
                    onClick={() => handleSort('total')}
                    sx={{ '& .MuiTableSortLabel-icon': { position: 'absolute', right: -20 } }}
                  >
                    €
                  </TableSortLabel>
                </TableCell>
                <TableCell align={showStatus ? 'center' : 'left'}>Usuario</TableCell>
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
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    {/* ID (solo Eurocharger) */}
                    {isEurocharger && (
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {tx.id}
                        </Typography>
                      </TableCell>
                    )}

                    {/* Cargador */}
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Iconify
                            icon="mdi:ev-station"
                            width={16}
                            sx={{ color: 'common.black', flexShrink: 0 }}
                          />
                          {tx.chargepoint?.id ? (
                            <Link
                              to={paths.chargingstations.detail(String(tx.chargepoint.id))}
                              style={{ textDecoration: 'none' }}
                            >
                              <Typography variant="subtitle2" color="text.primary">
                                {tx.chargepoint.name ?? '-'}
                              </Typography>
                            </Link>
                          ) : (
                            <Typography variant="subtitle2">
                              {tx.chargepoint?.name ?? '-'}
                            </Typography>
                          )}
                        </Stack>
                        {tx.address && (
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Iconify
                              icon="mdi:map-marker-outline"
                              width={14}
                              sx={{ color: 'text.disabled', flexShrink: 0 }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              sx={{ maxWidth: 200 }}
                            >
                              {tx.address}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </TableCell>

                    {/* Conector */}
                    <TableCell align="center">
                      {tx.chargepoint?.connectors?.length ? (
                        <Stack spacing={0.5} alignItems="center">
                          {tx.chargepoint.connectors.map((conn) => (
                            <Stack
                              key={conn.id}
                              direction="row"
                              alignItems="center"
                              justifyContent="center"
                              spacing={0.75}
                            >
                              <Iconify
                                icon="mdi:power-plug-outline"
                                width={14}
                                sx={{ color: 'text.disabled', flexShrink: 0 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {conn.name ?? `${conn.ocppId}`}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Inicio */}
                    <TableCell align="center">
                      <Typography variant="body2">
                        {tx.startDate ? fDateTime(tx.startDate) : '—'}
                      </Typography>
                    </TableCell>

                    {/* Duración */}
                    <TableCell align="center">
                      <Typography variant="body2">
                        {tx.startDate ? formatDuration(tx.startDate, tx.endDate ?? null) : '—'}
                      </Typography>
                    </TableCell>

                    {/* Energía */}
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                        spacing={0.5}
                      >
                        <Iconify
                          icon="mdi:lightning-bolt"
                          width={15}
                          sx={{ color: 'warning.main' }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {tx.power ? round(tx.power, 2) : 0}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Coste */}
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600}>
                        {tx.total ? `${round(tx.total, 2)} €` : '-'}
                      </Typography>
                    </TableCell>

                    {/* Usuario */}
                    <TableCell align={showStatus ? 'center' : 'left'}>
                      {tx.appUser ? (
                        <Stack spacing={0.25}>
                          {tx.appUser.id ? (
                            <Link
                              to={paths.appUsers.detail(tx.appUser.id)}
                              style={{ textDecoration: 'none' }}
                            >
                              <Typography variant="subtitle2" color="text.primary">
                                {tx.appUser.name ?? '—'}
                              </Typography>
                            </Link>
                          ) : (
                            <Typography variant="subtitle2">{tx.appUser.name ?? '—'}</Typography>
                          )}
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Link
                              to={paths.appUsers.detail(tx.appUser.id)}
                              style={{ textDecoration: 'none' }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                {tx.appUser.email ?? '—'}
                              </Typography>
                            </Link>
                            {tx.appUser.email && (
                              <Tooltip title="Copiar">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(tx.appUser!.email);
                                  }}
                                  sx={{ opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 } }}
                                >
                                  <Iconify icon="mingcute:copy-2-line" width={14} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Estado (solo en vista "Todas") */}
                    {showStatus && (
                      <TableCell>
                        <TransactionStatusChip status={tx.status} variant="soft" />
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
