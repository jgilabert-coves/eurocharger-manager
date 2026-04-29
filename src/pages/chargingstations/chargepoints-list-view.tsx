import type { AxiosRequestConfig } from 'axios';
import type { Chargepoint } from 'src/types/chargepoint';

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

import { useRouter } from 'src/routes/hooks';

import { endpoints, fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Estaciones de carga | ${CONFIG.appName}` };

const STATUS_COLORS: Record<string, 'success' | 'info' | 'error' | 'warning' | 'default'> = {
  available: 'success',
  charging: 'info',
  unavailable: 'error',
  reserved: 'warning',
    preparing: 'info',
    faulted: 'error',
    finishing: 'info',
    suspendedev: 'info',
};

type ChargepointsResponse = {
  data: Chargepoint[];
  total: number;
};

// ----------------------------------------------------------------------

export default function ChargingStationsView() {
  const router = useRouter();

  const [rows, setRows] = useState<Chargepoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const fetchChargepoints = useCallback(async () => {
    try {
      setLoading(true);
      const queryArgs: AxiosRequestConfig = {
        params: {
          roaming: 0,
          page,
          pageSize,
          searchQuery,
          sortQuery: `${orderBy}=${order}`,
        },
      };
      const result: ChargepointsResponse = await fetcher([endpoints.chargepoints.list, queryArgs]);
      setRows(result.data);
    } catch (err) {
      console.error('Error fetching chargepoints:', err);
      setRows([]);
          } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, orderBy, order]);

  useEffect(() => {
    fetchChargepoints();
  }, [fetchChargepoints]);

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
        <Typography variant="h4" sx={{ mb: 5 }}>
          Estaciones de carga
        </Typography>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, dirección, ID..."
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
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Cargador
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Conectores</TableCell>
                  <TableCell sx={{ width: 80 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron cargadores
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((cp) => (
                    <TableRow
                      key={cp.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                      onClick={() => router.push(`/chargingstations/${cp.id}`)}
                    >
                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={cp.status ?? 'Desconocido'}
                          color={STATUS_COLORS[cp.status?.toLowerCase() ?? ''] ?? 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      {/* Chargepoint info */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Iconify
                              icon="mdi:ev-station"
                              width={18}
                              sx={{ color: 'primary.main' }}
                            />
                            <Typography variant="subtitle2">
                              {cp.name ?? '-'}
                            </Typography>
                            {cp.client_cp_id && (
                              <Typography variant="caption" color="text.secondary">
                                ({cp.client_cp_id})
                              </Typography>
                            )}
                          </Stack>

                          {cp.address && (
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              sx={{ pl: 0.5 }}
                            >
                              <Iconify
                                icon="mdi:map-marker-outline"
                                width={16}
                                sx={{ color: 'text.secondary' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {cp.address}
                              </Typography>
                            </Stack>
                          )}

                          {cp.ocpp_id && (
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              sx={{ pl: 0.5 }}
                            >
                              <Iconify
                                icon="mdi:identifier"
                                width={16}
                                sx={{ color: 'text.disabled' }}
                              />
                              <Typography variant="caption" color="text.disabled">
                                OCPP: {cp.ocpp_id}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      </TableCell>

                      {/* Connectors */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          {cp.connectors?.length > 0 ? (
                            cp.connectors.map((conn) => (
                              <Stack
                                key={conn.id}
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <Iconify
                                  icon="mdi:power-plug-outline"
                                  width={16}
                                  sx={{ color: 'text.secondary' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  {conn.name ?? `Conector #${conn.id}`}
                                  {conn.power ? ` · ${conn.power} kW` : ''}
                                </Typography>
                                <Chip
                                  label={conn.status}
                                  color={STATUS_COLORS[conn.status?.toLowerCase() ?? ''] ?? 'default'}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 22, fontSize: '0.7rem' }}
                                />
                              </Stack>
                            ))
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              Sin conectores
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      {/* Action */}
                      <TableCell>
                        <IconButton size="small">
                          <Iconify icon="eva:arrow-ios-forward-fill" width={20} />
                        </IconButton>
                      </TableCell>
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
      </DashboardContent>
    </>
  );
}
