import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

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

import { type Alarm } from 'src/types/alarms';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Alarmas | ${CONFIG.appName}` };

const STATUS_COLORS: Record<string, 'info' | 'success' | 'error' | 'warning'> = {
  ACTIVE: 'error',
  RESOLVED: 'success',
  PENDING: 'warning',
};

// ----------------------------------------------------------------------

export default function AlarmsView() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sorts, setSorts] = useState<{ field: string; order: 'asc' | 'desc' }[]>([]);

  const { data: res, isLoading } = useQuery({
    queryKey: ['alarms', 'list', { page, pageSize, searchQuery, sorts }],
    queryFn: () =>
      fetcher([
        endpoints.alarms.list,
        {
          params: {
            page,
            pageSize,
            searchQuery,
            fixed: false,
            ...(sorts.length > 0 && {
              sortQuery: sorts.map((s) => `${s.field}=${s.order}`).join(','),
            }),
          },
        },
      ]),
  });

  const rows = (res?.data as Alarm[]) ?? [];

  const handleSort = (field: string) => {
    setSorts((prev) => {
      const existing = prev.find((s) => s.field === field);
      if (!existing) return [...prev, { field, order: 'asc' }];
      if (existing.order === 'asc')
        return prev.map((s) => (s.field === field ? { ...s, order: 'desc' } : s));
      return prev.filter((s) => s.field !== field);
    });
    setPage(0);
  };

  const getSortDirection = (field: string) => sorts.find((s) => s.field === field)?.order ?? 'asc';
  const isSorted = (field: string) => sorts.some((s) => s.field === field);

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Typography variant="h2" sx={{ mb: 5 }}>
          Alarmas
        </Typography>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por estación..."
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
                      active={isSorted('status')}
                      direction={getSortDirection('status')}
                      onClick={() => handleSort('status')}
                    >
                      Estado
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Cargador</TableCell>
                  <TableCell>Conector</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Error</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={isSorted('date')}
                      direction={getSortDirection('date')}
                      onClick={() => handleSort('date')}
                    >
                      Fecha
                    </TableSortLabel>
                  </TableCell>
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
                        No se encontraron alarmas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((alarm) => {
                    const allConnectors =
                      alarm.chargingStation?.chargepoints?.flatMap((cp) =>
                        (cp.connectors ?? []).map((conn) => ({
                          ...conn,
                          cpName: cp.name ?? cp.ocpp_id ?? `#${cp.id}`,
                        }))
                      ) ?? [];
                    console.log(alarm);
                    return (
                      <TableRow
                        key={alarm.id}
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        {/* Estado */}
                        <TableCell>
                          <Chip
                            label={alarm.status}
                            color={STATUS_COLORS[alarm.status?.toUpperCase()] ?? 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>

                        {/* Cargador */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Iconify
                                icon="mdi:ev-station"
                                width={16}
                                sx={{ color: 'primary.main', flexShrink: 0 }}
                              />
                              <Typography variant="subtitle2">
                                {alarm.chargingStation?.name ?? '-'}
                              </Typography>
                            </Stack>
                            {alarm.chargingStation?.chargepoints?.map((cp) => (
                              <Stack
                                key={cp.id}
                                direction="row"
                                alignItems="center"
                                spacing={0.75}
                                sx={{ pl: 0.5 }}
                              >
                                <Iconify
                                  icon="mdi:ev-plug-type2"
                                  width={14}
                                  sx={{ color: 'text.secondary', flexShrink: 0 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {cp.name ?? cp.ocpp_id ?? `Cargador #${cp.id}`}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </TableCell>

                        {/* Conectores */}
                        <TableCell>
                          {allConnectors.length === 0 ? (
                            <Typography variant="caption" color="text.disabled">
                              —
                            </Typography>
                          ) : (
                            <Stack spacing={0.5}>
                              {allConnectors.map((conn) => (
                                <Stack
                                  key={conn.id}
                                  direction="row"
                                  alignItems="center"
                                  spacing={0.75}
                                >
                                  <Iconify
                                    icon="mdi:power-plug-outline"
                                    width={14}
                                    sx={{ color: 'text.disabled', flexShrink: 0 }}
                                  />
                                  <Typography variant="caption">
                                    {conn.name ?? `#${conn.id}`}
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
                          )}
                        </TableCell>

                        {/* Dirección */}
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {alarm.chargingStation?.address ?? '—'}
                          </Typography>
                        </TableCell>

                        {/* Error */}
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="caption" fontWeight={600}>
                              {alarm.errorCode ?? '—'}
                            </Typography>
                            {alarm.errorInfo && (
                              <Typography variant="caption" color="text.secondary">
                                {alarm.errorInfo}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>

                        {/* Fecha */}
                        <TableCell>
                          <Typography variant="body2">
                            {alarm.date ? fDateTime(alarm.date) : '—'}
                          </Typography>
                        </TableCell>
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
      </DashboardContent>
    </>
  );
}
