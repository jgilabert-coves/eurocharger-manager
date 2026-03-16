import type { AxiosRequestConfig } from 'axios';
import type { Reservation } from 'src/types/reservation';

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

const metadata = { title: `Reservas | ${CONFIG.appName}` };

const STATUS_COLORS: Record<string, 'info' | 'success' | 'error'> = {
  ACTIVED: 'info',
  EXECUTED: 'success',
  EXPIRED: 'error'
};

type ReservationsResponse = {
  data: Reservation[];
  total: number;
};

// ----------------------------------------------------------------------

export default function ReservationsView() {
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const queryArgs: AxiosRequestConfig = {
        params: {
          page,
          pageSize,
          sortQuery: `${orderBy}=${order}`,
          searchQuery,
        },
      };
      const result: ReservationsResponse = await fetcher([
        endpoints.reservations.list,
        queryArgs,
      ]);
      setRows(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, orderBy, order]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

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
          Reservas
        </Typography>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por usuario, estación..."
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
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'chargingStation'}
                      direction={orderBy === 'chargingStation' ? order : 'asc'}
                      onClick={() => handleSort('chargingStation')}
                    >
                      Datos de la estación
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'createdAt'}
                      direction={orderBy === 'createdAt' ? order : 'asc'}
                      onClick={() => handleSort('createdAt')}
                    >
                      Creada
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'expiredAt'}
                      direction={orderBy === 'expiredAt' ? order : 'asc'}
                      onClick={() => handleSort('expiredAt')}
                    >
                      Expiración
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron reservas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((reservation) => (
                    <TableRow
                      key={reservation.id}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={reservation.status}
                          color={STATUS_COLORS[reservation.status.toUpperCase()] ?? 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      {/* User */}
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2">
                            {reservation.appUser?.name ?? '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reservation.appUser?.email ?? ''}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Station / Chargepoints / Connectors */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          {/* Station name */}
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Iconify
                              icon="mdi:ev-station"
                              width={18}
                              sx={{ color: 'primary.main' }}
                            />
                            <Typography variant="subtitle2">
                              {reservation.chargingStation?.name ?? '-'}
                            </Typography>
                          </Stack>

                          {/* Chargepoints and their connectors */}
                          {reservation.chargingStation?.chargepoints?.map((cp) => (
                            <Stack key={cp.id} spacing={0.25} sx={{ pl: 0.5 }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Iconify
                                  icon="mdi:ev-plug-type2"
                                  width={16}
                                  sx={{ color: 'text.secondary' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  {cp.name ?? `Cargador #${cp.id}`}
                                </Typography>
                              </Stack>

                              {cp.connectors?.map((conn) => (
                                <Stack
                                  key={conn.id}
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{ pl: 2 }}
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
                          ))}
                        </Stack>
                      </TableCell>

                      {/* Created at */}
                      <TableCell>
                        <Typography variant="body2">
                          {reservation.createdAt ? fDateTime(reservation.createdAt) : '-'}
                        </Typography>
                      </TableCell>

                      {/* Expires at */}
                      <TableCell>
                        <Typography variant="body2">
                          {reservation.expiredAt ? fDateTime(reservation.expiredAt) : '-'}
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
