import type { AppUser } from 'src/types/appuser';
import type { ChargingStation } from 'src/types/charging_stations';
import type { ChargingStationsPrivilege } from 'src/types/privileges';

import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fDateTime } from 'src/utils/format-time';

import axiosInstance from 'src/lib/axios';
import { CONFIG } from 'src/global-config';
import { fetcher, post, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const metadata = { title: `Autorizaciones | ${CONFIG.appName}` };

type PrivilegesResponse = {
  data: ChargingStationsPrivilege[];
  total: number;
};

type GroupedPrivilege = {
  userId: number;
  user: AppUser;
  stations: { privilege: ChargingStationsPrivilege; station: ChargingStation }[];
  client: ChargingStationsPrivilege['client'];
  latestDate: Date;
};

// ----------------------------------------------------------------------

export default function AuthorizationsListView() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch privileges
  const { data: res, isLoading } = useQuery({
    queryKey: ['privileges', page, rowsPerPage, searchQuery],
    queryFn: () =>
      fetcher([
        endpoints.privileges.list,
        {
          params: { page, pageSize: rowsPerPage, searchQuery },
        },
      ]) as Promise<PrivilegesResponse>,
  });
  const privileges = useMemo(() => res?.data ?? [], [res?.data]);
  const total = res?.total ?? 0;

  // Fetch private charging stations for the dialog
  const { data: stationsRes } = useQuery({
    queryKey: ['privileges', 'stations'],
    queryFn: () => fetcher(`${endpoints.chargepoints.list}?private=true`),
    enabled: dialogOpen,
  });
  const stations = (stationsRes?.data as ChargingStation[]) ?? [];

  // Create mutation (batch)
  const createMutation = useMutation({
    mutationFn: (body: { appUserId: number; chargepointIds: number[] }) =>
      Promise.all(
        body.chargepointIds.map((id) =>
          post(endpoints.privileges.create, { appUserId: body.appUserId, chargepointId: id })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privileges'] });
      setDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to create privileges:', error);
    },
  });

  // Delete single privilege
  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(endpoints.privileges.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privileges'] });
    },
  });

  // Delete multiple privileges
  const deleteMultipleMutation = useMutation({
    mutationFn: (ids: number[]) =>
      Promise.all(ids.map((id) => axiosInstance.delete(endpoints.privileges.delete(id)))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privileges'] });
    },
  });

  // Group privileges by user
  const grouped = useMemo(() => {
    const map = new Map<number, GroupedPrivilege>();
    for (const p of privileges) {
      const uid = p.app_user.id;
      if (!map.has(uid)) {
        map.set(uid, {
          userId: uid,
          user: p.app_user,
          stations: [],
          client: p.client,
          latestDate: p.created_at,
        });
      }
      const group = map.get(uid)!;
      group.stations.push({ privilege: p, station: p.charging_station });
      if (new Date(p.created_at) > new Date(group.latestDate)) {
        group.latestDate = p.created_at;
      }
    }
    return Array.from(map.values());
  }, [privileges]);

  const isDeleting = deleteMutation.isPending || deleteMultipleMutation.isPending;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
          <Typography variant="h2">Autorizaciones</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setDialogOpen(true)}
          >
            Nueva autorización
          </Button>
        </Stack>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por usuario, estación, cliente..."
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
                  <TableCell>Usuario</TableCell>
                  <TableCell>Cargadores autorizados</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Última autorización</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : grouped.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron autorizaciones
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  grouped.map((group) => (
                    <TableRow key={group.userId} hover>
                      {/* User */}
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2">
                            {group.user.name}
                            {group.user.surname ? ` ${group.user.surname}` : ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {group.user.email}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Chargepoints with individual delete */}
                      <TableCell>
                        <Stack spacing={0.75}>
                          {group.stations.map(({ privilege, station }) =>
                            station.chargepoints?.map((cp) => (
                              <Stack key={`${privilege.id}-${cp.id}`} direction="row" alignItems="center" spacing={1}>
                                <Iconify
                                  icon="mdi:ev-plug-type2"
                                  width={16}
                                  sx={{ color: 'primary.dark', flexShrink: 0 }}
                                />
                                <Stack sx={{ flex: 1 }}>
                                  <Typography variant="body2">
                                    {cp.name ?? `Cargador #${cp.id}`}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {station.name}
                                  </Typography>
                                </Stack>
                                <Tooltip title="Eliminar esta autorización">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => deleteMutation.mutate(privilege.id)}
                                    disabled={isDeleting}
                                    sx={{ p: 0.25 }}
                                  >
                                    <Iconify icon="mingcute:close-line" width={16} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            ))
                          )}
                        </Stack>
                      </TableCell>

                      {/* Client */}
                      <TableCell>
                        {group.client ? (
                          <Chip
                            label={group.client.business_name}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Typography variant="body2">{fDateTime(group.latestDate)}</Typography>
                      </TableCell>

                      {/* Delete all */}
                      <TableCell align="right">
                        <Tooltip title="Eliminar todas las autorizaciones">
                          <IconButton
                            color="error"
                            onClick={() =>
                              deleteMultipleMutation.mutate(
                                group.stations.map((s) => s.privilege.id)
                              )
                            }
                            disabled={isDeleting}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                          </IconButton>
                        </Tooltip>
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
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 40]}
            labelRowsPerPage="Filas por página"
          />
        </Card>
      </DashboardContent>

      {/* Add authorization dialog */}
      <AddPrivilegeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        stations={stations}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}

// ----------------------------------------------------------------------

type AddPrivilegeDialogProps = {
  open: boolean;
  onClose: () => void;
  stations: ChargingStation[];
  onSubmit: (data: { appUserId: number; chargepointIds: number[] }) => void;
  isSubmitting: boolean;
};

function AddPrivilegeDialog({
  open,
  onClose,
  stations,
  onSubmit,
  isSubmitting,
}: AddPrivilegeDialogProps) {
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [selectedStationIds, setSelectedStationIds] = useState<number[]>([]);

  // Debounce user search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(userSearch), 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  // Search users from API
  const { data: usersRes, isFetching: searchingUsers } = useQuery({
    queryKey: ['appusers', debouncedSearch],
    queryFn: () => fetcher(['/appusers', { params: { searchQuery: debouncedSearch } }]),
    enabled: open && debouncedSearch.length >= 2,
  });
  const userResults = (usersRes?.data as AppUser[]) ?? [];

  const handleSelectUser = (user: AppUser) => {
    setSelectedUser(user);
    setUserSearch('');
  };

  const handleToggleStation = (stationId: number) => {
    setSelectedStationIds((prev) =>
      prev.includes(stationId) ? prev.filter((id) => id !== stationId) : [...prev, stationId]
    );
  };

  const handleSubmit = () => {
    if (!selectedUser || selectedStationIds.length === 0) return;
    onSubmit({ appUserId: selectedUser.id, chargepointIds: selectedStationIds });
    resetForm();
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedStationIds([]);
    setUserSearch('');
    setDebouncedSearch('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva autorización</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}
      >
        {/* User search */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Usuario
          </Typography>
          {selectedUser ? (
            <Chip
              label={`${selectedUser.name} ${selectedUser.surname ?? ''} — ${selectedUser.email}`}
              onDelete={() => setSelectedUser(null)}
            />
          ) : (
            <>
              <TextField
                fullWidth
                size="small"
                placeholder="Nombre o email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: searchingUsers ? (
                      <InputAdornment position="end">
                        <CircularProgress size={18} />
                      </InputAdornment>
                    ) : undefined,
                  },
                }}
              />
              {userResults.length > 0 && (
                <Card variant="outlined" sx={{ mt: 0.5, maxHeight: 200, overflow: 'auto' }}>
                  {userResults.map((u) => (
                    <MenuItem key={u.id} onClick={() => handleSelectUser(u)}>
                      <Stack spacing={0}>
                        <Typography variant="body2">
                          {u.name} {u.surname ?? ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {u.email}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Card>
              )}
              {debouncedSearch.length >= 2 && !searchingUsers && userResults.length === 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  No se encontraron usuarios
                </Typography>
              )}
            </>
          )}
        </Box>

        {/* Station multi-select */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Cargadores privados
            {selectedStationIds.length > 0 && (
              <Typography component="span" variant="caption" color="text.secondary">
                {' '}
                — {selectedStationIds.length} seleccionado{selectedStationIds.length > 1 ? 's' : ''}
              </Typography>
            )}
          </Typography>
          <Card variant="outlined" sx={{ maxHeight: 250, overflow: 'auto' }}>
            {stations.length === 0 ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ p: 2, display: 'block', textAlign: 'center' }}
              >
                No hay estaciones privadas disponibles
              </Typography>
            ) : (
              stations.map((s) => (
                <FormControlLabel
                  key={s.id}
                  sx={{
                    display: 'flex',
                    mx: 0,
                    px: 1.5,
                    py: 0.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  control={
                    <Checkbox
                      checked={selectedStationIds.includes(s.id)}
                      onChange={() => handleToggleStation(s.id)}
                      size="small"
                    />
                  }
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="mdi:ev-station" width={16} sx={{ color: 'primary.dark' }} />
                      <Typography variant="body2">{s.name}</Typography>
                    </Stack>
                  }
                />
              ))
            )}
          </Card>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedUser || selectedStationIds.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : `Autorizar (${selectedStationIds.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
