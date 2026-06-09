import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { type Incident } from 'src/types/incidents';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Incidencias | ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function IncidentsView() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const debouncedSearch = useDebounce(searchQuery);

  const { data: res, isLoading } = useQuery({
    queryKey: ['incidents', 'list', { page, pageSize, search: debouncedSearch, orderBy, order }],
    queryFn: () =>
      fetcher([
        endpoints.incidents.list,
        {
          params: {
            page,
            pageSize,
            searchQuery: debouncedSearch,
            sortQuery: `${orderBy}=${order}`,
          },
        },
      ]),
  });

  const rows = (res?.data as Incident[]) ?? [];

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
          Incidencias
        </Typography>

        {/* Search */}
        <Stack sx={{ mb: 3 }}>
          <TextField
            placeholder="Buscar por estación o usuario..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ flex: 1, maxWidth: { md: 400 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        {/* Table */}
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'type'}
                      direction={orderBy === 'type' ? order : 'asc'}
                      onClick={() => handleSort('type')}
                    >
                      Tipo
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Mensaje</TableCell>
                  <TableCell>Cargador</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Usuario</TableCell>
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
                        No se encontraron incidencias
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((incident) => (
                    <TableRow
                      key={incident.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      {/* Tipo */}
                      <TableCell>
                        <Chip
                          label={incident.type}
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      {/* Mensaje */}
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" noWrap title={incident.message}>
                          {incident.message ?? '—'}
                        </Typography>
                      </TableCell>

                      {/* Cargador */}
                      <TableCell>
                        <Stack spacing={0.25}>
                          {incident.chargingStation ? (
                            <Link
                              to={paths.chargingstations.detail(String(incident.chargingStation.id))}
                              style={{ textDecoration: 'none' }}
                            >
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                <Iconify
                                  icon="mdi:ev-station"
                                  width={16}
                                  sx={{ color: 'common.black', flexShrink: 0 }}
                                />
                                <Typography
                                  variant="subtitle2"
                                  sx={{ '&:hover': { textDecoration: 'underline' } }}
                                >
                                  {incident.chargingStation.name ?? '—'}
                                </Typography>
                              </Stack>
                            </Link>
                          ) : (
                            <Typography variant="subtitle2">—</Typography>
                          )}
                          {incident.client && (
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.75}
                              sx={{ pl: 0.25 }}
                            >
                              <Iconify
                                icon="mdi:account-outline"
                                width={14}
                                sx={{ color: 'text.disabled', flexShrink: 0 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {incident.client.businessName}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      </TableCell>

                      {/* Dirección */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {incident.chargingStation?.address ?? '—'}
                        </Typography>
                      </TableCell>

                      {/* Usuario */}
                      <TableCell>
                        {incident.appUser ? (
                          <Stack spacing={0.25}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              {incident.appUser.id ? (
                                <Link
                                  to={paths.appUsers.detail(incident.appUser.id)}
                                  style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ '&:hover': { textDecoration: 'underline' } }}
                                  >
                                    {incident.appUser.name}
                                  </Typography>
                                </Link>
                              ) : (
                                <Typography variant="body2">{incident.appUser.name}</Typography>
                              )}
                              <Tooltip title="Copiar">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    navigator.clipboard.writeText(incident.appUser!.name)
                                  }
                                  sx={{ opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 } }}
                                >
                                  <Iconify icon="mingcute:copy-2-line" width={14} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                {incident.appUser.email}
                              </Typography>
                              {incident.appUser.email && (
                                <Tooltip title="Copiar">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      navigator.clipboard.writeText(incident.appUser!.email)
                                    }
                                    sx={{ opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 } }}
                                  >
                                    <Iconify icon="mingcute:copy-2-line" width={14} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      {/* Fecha */}
                      <TableCell>
                        <Typography variant="body2">
                          {incident.date ? fDateTime(incident.date) : '—'}
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
