import type { AxiosRequestConfig } from 'axios';
import type { Transaction, TransactionsDataTableResponse } from 'src/types/transactions';

import { round } from 'es-toolkit';
import { Helmet } from 'react-helmet-async';
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

import { fDateTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Recargas | ${CONFIG.appName}` };

const STATUS_COLORS: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  CARGANDO: 'info',
  FINALIZADO: 'success',
  ERROR: 'error',
};

// ----------------------------------------------------------------------

export default function TransactionsView() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const queryArgs: AxiosRequestConfig = {
        params: {
          page,
          pageSize,
          status: 'CARGANDO',
          sortQuery: `${orderBy}=${order}`,
          searchQuery,
        },
      };
      const result: TransactionsDataTableResponse = await fetcher([
        endpoints.transactions.current,
        queryArgs,
      ]);
      setRows(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, orderBy, order]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSort = (field: string) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Typography variant="h2" sx={{ mb: 5 }}>
          Recargas
        </Typography>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por usuario, estación, cargador..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
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

        {/* Table */}
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Estado
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Datos de la estación</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'power'}
                      direction={orderBy === 'power' ? order : 'asc'}
                      onClick={() => handleSort('power')}
                    >
                      Energía / Coste
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Tarifa</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'date'}
                      direction={orderBy === 'date' ? order : 'asc'}
                      onClick={() => handleSort('date')}
                    >
                      Fecha
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron recargas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((tx) => (
                    <TableRow
                      key={tx.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={tx.status}
                          color={STATUS_COLORS[tx.status?.toUpperCase()] ?? 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      {/* User */}
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2">
                            {tx.appUser?.name ?? '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tx.appUser?.email ?? ''}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Station / Chargepoint / Connectors */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          {/* Chargepoint */}
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Iconify
                              icon="mdi:ev-station"
                              width={18}
                              sx={{ color: 'primary.main' }}
                            />
                            <Typography variant="subtitle2">
                              {tx.chargepoint?.name ?? `Cargador #${tx.chargepoint?.id ?? '-'}`}
                            </Typography>
                          </Stack>

                          {/* Address */}
                          {tx.address && (
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: 0.5 }}>
                              <Iconify
                                icon="mdi:map-marker-outline"
                                width={16}
                                sx={{ color: 'text.secondary' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {tx.address}
                              </Typography>
                            </Stack>
                          )}

                          {/* Connectors */}
                          {tx.chargepoint?.connectors?.map((conn) => (
                            <Stack
                              key={conn.id}
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              sx={{ pl: 0.5 }}
                            >
                              <Iconify
                                icon="mdi:power-plug-outline"
                                width={14}
                                sx={{ color: 'text.disabled' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {conn.name ?? `Conector #${conn.id}`}
                                {conn.power ? ` · ${conn.power} kW` : ''}
                              </Typography>
                              <Chip
                                label={conn.status}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            </Stack>
                          ))}
                        </Stack>
                      </TableCell>

                      {/* Power / Cost */}
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Iconify
                              icon="mdi:lightning-bolt"
                              width={16}
                              sx={{ color: 'warning.main' }}
                            />
                            <Typography variant="subtitle2">
                              {tx.power ? round(tx.power, 2) : 0} kWh
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {tx.total ? round(tx.total, 2) : 0} €
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Rate */}
                      <TableCell>
                        <Typography variant="body2">
                          {tx.rate?.name ?? '-'}
                        </Typography>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Typography variant="body2">
                          {tx.date ? fDateTime(tx.date) : '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 40]}
            labelRowsPerPage="Filas por página"
          />
        </Card>
      </DashboardContent>
    </>
  );
}
