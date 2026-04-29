import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
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

import { endpoints, fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CreateManagerUserDialog } from 'src/components/manager-users/create-manager-user-dialog';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Usuarios del gestor | ${CONFIG.appName}` };

const ROLE_LABEL: Record<ManagerUserRole, string> = {
  Basic_Profile: 'Basic',
  Medium_Profile: 'Medium',
  Advanced_Profile: 'Advanced',
  Eurocharger: 'Eurocharger',
};

const ROLE_COLOR: Record<ManagerUserRole, 'default' | 'info' | 'warning' | 'primary'> = {
  Basic_Profile: 'default',
  Medium_Profile: 'info',
  Advanced_Profile: 'warning',
  Eurocharger: 'primary',
};

function dateToString(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ----------------------------------------------------------------------

export default function ManagerUsersView() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isFetching, refetch } = useQuery<ManagerUsersResponse>({
    queryKey: ['manager-users', page, pageSize, searchQuery, orderBy, order],
    queryFn: () =>
      fetcher([
        endpoints.managerUsers.list,
        { params: { page, pageSize, searchQuery, sortQuery: `${orderBy}=${order}` } },
      ]),
  });

  const rows: ManagerUser[] = data?.data ?? [];
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
            <Typography variant="h3">Usuarios del gestor</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gestiona los usuarios con acceso al panel de administración
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mdi:plus" width={18} />}
            onClick={() => setCreateOpen(true)}
          >
            Nuevo usuario
          </Button>
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
                      onClick={() => handleSort('full_name')}
                    >
                      Nombre
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
                  <TableCell>Rol</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'created_at'}
                      direction={orderBy === 'created_at' ? order : 'asc'}
                      onClick={() => handleSort('created_at')}
                    >
                      Alta
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <Stack alignItems="center" spacing={1.5}>
                        <Iconify
                          icon="eva:people-fill"
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
                  rows.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell sx={{ pl: 3 }}>
                        <Typography variant="caption" color="text.disabled">
                          {user.id}
                        </Typography>
                      </TableCell>

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
                              {(user.full_name?.[0] ?? '?').toUpperCase()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2">
                              {[user.full_name].filter(Boolean).join(' ') || '—'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Label color={ROLE_COLOR[user.role]} variant="soft">
                          {ROLE_LABEL[user.role] ?? user.role}
                        </Label>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.business_name ?? '—'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {dateToString(user.created_at)}
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

      <CreateManagerUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => refetch()}
      />
    </>
  );
}
