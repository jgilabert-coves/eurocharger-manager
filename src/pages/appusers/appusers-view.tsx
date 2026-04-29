import type { AppUserDatatableItem } from 'src/types/appuser';

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
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
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { endpoints, fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Usuarios | ${CONFIG.appName}` };

type AppUsersResponse = {
  data: AppUserDatatableItem[];
  total: number;
};

function dateToString(value?: Date | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ----------------------------------------------------------------------

export default function AppUsersView() {
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isFetching } = useQuery<AppUsersResponse>({
    queryKey: ['appusers', page, pageSize, searchQuery, orderBy, order],
    queryFn: () =>
      fetcher([
        endpoints.appUsers.list,
        { params: { page, pageSize, searchQuery, sortQuery: `${orderBy}=${order}` } },
      ]),
  });

  const rows: AppUserDatatableItem[] = data?.data ?? [];
  const total: number = data?.total ?? 0;

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
        {/* Header */}
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h4">Usuarios</Typography>
          </Box>
        </Stack>

        {/* Search */}
        <Stack sx={{ mb: 3 }}>
          <TextField
            placeholder="Buscar por nombre, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ maxWidth: 400 }}
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
                  <TableCell sx={{ width: 48, pl: 3 }}>
                    <TableSortLabel
                      active={orderBy === 'id'}
                      direction={orderBy === 'id' ? order : 'desc'}
                      onClick={() => handleSort('id')}
                    >
                      #
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Nombre completo
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'email'}
                      direction={orderBy === 'email' ? order : 'asc'}
                      onClick={() => handleSort('email')}
                    >
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>DNI</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'createdAt'}
                      direction={orderBy === 'createdAt' ? order : 'asc'}
                      onClick={() => handleSort('createdAt')}
                    >
                      Alta
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 100 }}>Estado</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                      <Stack alignItems="center" spacing={1.5}>
                        <Iconify
                          icon="eva:search-fill"
                          width={40}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron usuarios
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((user) => {
                    const address = user.address;

                    return (
                      <TableRow
                        key={user.id}
                        hover
                        onClick={() => router.push(paths.appUsers.detail(user.id))}
                        sx={{
                          cursor: 'pointer',
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        {/* ID */}
                        <TableCell sx={{ pl: 3 }}>
                          <Typography variant="caption" color="text.disabled">
                            {user.id}
                          </Typography>
                        </TableCell>

                        {/* Full name */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                bgcolor: 'primary.lighter',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Typography variant="caption" fontWeight={700} color="primary.main">
                                {(user.name?.[0] ?? '?').toUpperCase()}
                              </Typography>
                            </Box>
                            <Typography variant="subtitle2">{user.name || '—'}</Typography>
                          </Stack>
                        </TableCell>

                        {/* Email */}
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </TableCell>

                        {/* Phone */}
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.telephone ?? '—'}
                          </Typography>
                        </TableCell>

                        {/* DNI */}
                        <TableCell>
                          {user.cardId ? (
                            <Chip
                              label={user.cardId}
                              size="small"
                              variant="outlined"
                              sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Address */}
                        <TableCell sx={{ maxWidth: 200 }}>
                          {address ? (
                            <Tooltip title={address} placement="top">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                                sx={{ maxWidth: 180 }}
                              >
                                {address}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Created at */}
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {dateToString(user.createdAt)}
                          </Typography>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Label
                            color={user.isActive === false ? 'error' : 'success'}
                            variant="soft"
                          >
                            {user.isActive === false ? 'Inactivo' : 'Activo'}
                          </Label>
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
            count={total || -1}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
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
