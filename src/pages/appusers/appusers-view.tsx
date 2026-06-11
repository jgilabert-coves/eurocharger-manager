import type { AppUserDatatableItem } from 'src/types/appuser';

import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { useState, useEffect, useCallback } from 'react';

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
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useDebounce } from 'src/hooks/use-debounce';

import { fetcher, endpoints } from 'src/lib/axios';
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
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') ?? '0');
  const pageSize = Number(searchParams.get('pageSize') ?? '10');
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') ?? '');
  const orderBy = searchParams.get('orderBy') ?? 'id';
  const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc';
  const debouncedSearch = useDebounce(localSearch);

  const updateParam = useCallback(
    (updates: Record<string, string>, replace = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([k, v]) => {
            if (v) next.set(k, v);
            else next.delete(k);
          });
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    updateParam({ search: debouncedSearch, page: '0' }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data, isFetching } = useQuery<AppUsersResponse>({
    queryKey: ['appusers', page, pageSize, debouncedSearch, orderBy, order],
    queryFn: () =>
      fetcher([
        endpoints.appUsers.list,
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

  const rows: AppUserDatatableItem[] = data?.data ?? [];
  const total: number = data?.total ?? 0;

  const handleSort = (field: string) => {
    const isAsc = orderBy === field && order === 'asc';
    updateParam({ order: isAsc ? 'desc' : 'asc', orderBy: field });
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
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
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
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>

              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
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
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        {/* ID */}
                        <TableCell sx={{ pl: 3 }}>
                          <Link
                            to={paths.appUsers.detail(user.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              color: 'inherit',
                              textDecoration: 'none',
                            }}
                          >
                            <Typography variant="caption" color="text.disabled">
                              {user.id}
                            </Typography>
                          </Link>
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

                        {/* Arrow */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            component={Link}
                            to={paths.appUsers.detail(user.id)}
                            size="small"
                            sx={{ color: 'text.secondary' }}
                          >
                            <Iconify icon="eva:arrow-ios-forward-fill" width={20} />
                          </IconButton>
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
            onPageChange={(_, newPage) => updateParam({ page: String(newPage) })}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => updateParam({ pageSize: e.target.value, page: '0' })}
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
