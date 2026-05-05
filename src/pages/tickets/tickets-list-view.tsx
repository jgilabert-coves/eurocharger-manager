import type { AppUserDatatableItem } from 'src/types/appuser';
import type { ChargingStation } from 'src/types/charging_stations';
import type { Ticket, TicketType, TicketStatus } from 'src/types/tickets';

import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { post, patch, fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { AppUserSearchSelect } from 'src/components/app-users/app-user-search-select';
import { StationSearchSelect } from 'src/components/chargepoint/station-search-select';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Tickets | ${CONFIG.appName}` };

type TicketsResponse = { data: Ticket[]; total?: number; success?: boolean };

const STATUS_COLOR: Record<TicketStatus, 'success' | 'default' | 'error'> = {
  OPEN: 'error',
  CLOSED: 'success',
  PENDING: 'default'
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  PENDING: 'Pendiente',
  OPEN: 'Abierto',
  CLOSED: 'Cerrado'
};

const TYPE_LABEL: Record<TicketType, string> = {
  APP: 'App',
  CALL: 'Llamada',
};

const EMPTY_FORM = {
  reason: '',
  description: '',
  type: 'APP' as TicketType,
  chargingStationId: null as number | null,
  appUserId: null as number | null,
};

// ----------------------------------------------------------------------

export default function TicketsListView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<TicketType | ''>('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUserDatatableItem | null>(null);

  const { data: res, isLoading } = useQuery<TicketsResponse>({
    queryKey: ['tickets', 'list', { page, pageSize, searchQuery, statusFilter, typeFilter }],
    queryFn: () =>
      fetcher([
        endpoints.tickets.list,
        {
          params: {
            page,
            pageSize,
            ...(searchQuery ? { searchQuery } : {}),
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(typeFilter ? { type: typeFilter } : {}),
          },
        },
      ]),
  });

  const rows = res?.data ?? [];
  const total = res?.total ?? -1;

  const { mutate: createTicket, isPending: creating } = useMutation({
    mutationFn: (body: typeof EMPTY_FORM) => post(endpoints.tickets.create, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setSelectedStation(null);
      setSelectedUser(null);
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: number; status: TicketStatus }) =>
      patch(endpoints.tickets.update(ticketId), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const handleCreate = () => {
    createTicket({
      ...form,
      chargingStationId: selectedStation?.id ?? null,
      appUserId: selectedUser?.id ?? null,
    });
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setForm(EMPTY_FORM);
    setSelectedStation(null);
    setSelectedUser(null);
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Typography variant="h4">Incidencias</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setCreateOpen(true)}
          >
            Nuevo ticket
          </Button>
        </Stack>

        {/* Search */}
        <Stack sx={{ mb: 2 }}>
          <TextField
            placeholder="Buscar por motivo, descripción, usuario..."
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

        {/* Filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={statusFilter}
            onChange={(_, val) => {
              setStatusFilter(val ?? '');
              setPage(0);
            }}
          >
            <ToggleButton value="">Todos</ToggleButton>
            <ToggleButton value="PENDING">Pendientes</ToggleButton>
            <ToggleButton value="OPEN">Abiertos</ToggleButton>
            <ToggleButton value="CLOSED">Cerrados</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={typeFilter}
            onChange={(_, val) => {
              setTypeFilter(val ?? '');
              setPage(0);
            }}
          >
            <ToggleButton value="">Todos</ToggleButton>
            <ToggleButton value="APP">App</ToggleButton>
            <ToggleButton value="CALL">Llamada</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticket</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Estación</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Creado</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Seguimiento</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron tickets
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Link to={paths.tickets.detail(ticket.id)} style={{ textDecoration: 'none' }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ '&:hover': { textDecoration: 'underline' } }}
                          >
                            {ticket.id}
                          </Typography>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <Label color="default" variant="soft">
                          {TYPE_LABEL[ticket.type]}
                        </Label>
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()} sx={{ py: 0.5 }}>
                        <Select
                          size="small"
                          value={ticket.status}
                          onChange={(e) =>
                            updateStatus({
                              ticketId: ticket.id,
                              status: e.target.value as TicketStatus,
                            })
                          }
                          renderValue={(value) => (
                            <Label color={STATUS_COLOR[value as TicketStatus]} variant="soft">
                              {STATUS_LABEL[value as TicketStatus]}
                            </Label>
                          )}
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            '& .MuiSelect-select': { p: 0, pr: '24px !important' },
                            minWidth: 110,
                          }}
                        >
                          <MenuItem value="PENDING">
                            <Label color="default">Pendiente</Label>
                          </MenuItem>
                          <MenuItem value="OPEN">
                            <Label color="error" variant="soft">Abierto</Label>
                          </MenuItem>
                          <MenuItem value="CLOSED">
                            <Label color="primary" variant="soft">Cerrado</Label>
                          </MenuItem>
                        </Select>
                      </TableCell>

                      <TableCell>
                        {ticket.chargingStation ? (
                          <Link
                            to={paths.locations.detail(String(ticket.chargingStation.id))}
                            style={{ textDecoration: 'none' }}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Iconify
                                icon="mdi:ev-station"
                                width={16}
                                sx={{ color: 'common.black' }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ '&:hover': { textDecoration: 'underline' } }}
                              >
                                {ticket.chargingStation.name}
                              </Typography>
                            </Stack>
                          </Link>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {ticket.appUser ? (
                          <Stack spacing={0}>
                            <Typography variant="body2">{ticket.appUser.name}</Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              onClick={() => router.push(paths.appUsers.detail(ticket.appUser!.id))}
                              sx={{
                                cursor: 'pointer',
                                userSelect: 'none',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              {ticket.appUser.email}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{fDateTime(ticket.createdAt)}</Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap title={ticket.reason}>
                          {ticket.reason}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {ticket.tracking.length}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          component={Link}
                          to={paths.tickets.detail(ticket.id)}
                          endIcon={<Iconify icon="eva:arrow-forward-fill" />}
                        >
                          Ver más
                        </Button>
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
            slotProps={{
              actions: {
                nextButton: { disabled: total === -1 ? rows.length < pageSize : undefined },
              },
            }}
          />
        </Card>
      </DashboardContent>

      {/* Create ticket dialog */}
      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo ticket</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Motivo"
              fullWidth
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                label="Tipo"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TicketType }))}
              >
                <MenuItem value="APP">App</MenuItem>
                <MenuItem value="CALL">Llamada</MenuItem>
              </Select>
            </FormControl>

            <StationSearchSelect value={selectedStation} onChange={setSelectedStation} />
            <AppUserSearchSelect value={selectedUser} onChange={setSelectedUser} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!form.reason || !form.description || creating}
            onClick={handleCreate}
          >
            {creating ? 'Creando…' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
