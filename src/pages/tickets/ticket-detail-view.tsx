import type { AppUserDatatableItem } from 'src/types/appuser';
import type { ChargingStation } from 'src/types/charging_stations';
import type { Ticket, TicketType, TicketTracking, TicketStatus } from 'src/types/tickets';

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { post, patch, fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { AppUserSearchSelect } from 'src/components/app-users/app-user-search-select';
import { StationSearchSelect } from 'src/components/chargepoint/station-search-select';

import { useAuthContext } from 'src/auth/hooks';

import { CONFIG } from '../../global-config';


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

// ----------------------------------------------------------------------

const metadata = { title: `Ticket | ${CONFIG.appName}` };

type TicketResponse = { data: Ticket };

// ----------------------------------------------------------------------

export default function TicketDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const ticketId = Number(id);

  const [trackingMessage, setTrackingMessage] = useState('');
  const trackingAuthor = user?.email ?? user?.name ?? '';

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ recipientEmail: '', recipientName: '' });
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    reason: '',
    description: '',
    type: 'APP' as TicketType,
  });
  const [editStation, setEditStation] = useState<ChargingStation | null>(null);
  const [editUser, setEditUser] = useState<AppUserDatatableItem | null>(null);

  const { data: res, isLoading } = useQuery<TicketResponse>({
    queryKey: ['tickets', 'detail', ticketId],
    queryFn: () => fetcher(endpoints.tickets.single(ticketId)),
    enabled: !!ticketId,
  });

  const ticket = res?.data;

  const { mutate: addTracking, isPending: addingTracking } = useMutation({
    mutationFn: (body: { message: string; author: string }) =>
      post(endpoints.tickets.tracking(ticketId), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', ticketId] });
      setTrackingMessage('');
    },
  });

  const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
    mutationFn: (status: 'OPEN' | 'CLOSED') =>
      patch(endpoints.tickets.update(ticketId), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] });
    },
  });

  const { mutate: updateTicket, isPending: updatingTicket } = useMutation({
    mutationFn: (body: {
      reason: string;
      description: string;
      type: TicketType;
      chargingStationId: number | null;
      appUserId: number | null;
    }) => patch(endpoints.tickets.update(ticketId), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] });
      setEditOpen(false);
    },
  });

  const { mutate: sendEmail, isPending: sendingEmail } = useMutation({
    mutationFn: (body: { recipientEmail: string; recipientName: string }) =>
      post(endpoints.tickets.sendEmail(ticketId), body),
    onSuccess: () => {
      setEmailSuccess(true);
    },
  });

  const openEditDialog = () => {
    if (!ticket) return;
    setEditForm({
      reason: ticket.reason,
      description: ticket.description,
      type: ticket.type,
    });
    setEditStation(
      ticket.chargingStation
        ? { id: ticket.chargingStation.id, name: ticket.chargingStation.name, chargepoints: [] }
        : null
    );
    setEditUser(
      ticket.appUser
        ? {
            id: ticket.appUser.id,
            name: ticket.appUser.name,
            email: ticket.appUser.email,
            cardId: null,
            address: null,
            telephone: null,
            isActive: true,
            createdAt: null,
          }
        : null
    );
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    updateTicket({
      ...editForm,
      chargingStationId: editStation?.id ?? null,
      appUserId: editUser?.id ?? null,
    });
  };

  if (isLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (!ticket) {
    return (
      <DashboardContent>
        <Alert severity="error">Ticket no encontrado.</Alert>
      </DashboardContent>
    );
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        {/* Breadcrumb back */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <Button
            size="small"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={() => router.push(paths.tickets.list)}
            sx={{ color: 'text.secondary' }}
          >
            Incidencias
          </Button>
        </Stack>

        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
            <Typography variant="h4">Ticket #{ticket.id}</Typography>
            <Label color={STATUS_COLOR[ticket.status]} variant="soft">
              {STATUS_LABEL[ticket.status]}
            </Label>
            <Label color="default" variant="soft">
              {ticket.type === 'APP' ? 'App' : 'Llamada'}
            </Label>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="mdi:pencil-outline" />}
              onClick={openEditDialog}
            >
              Editar
            </Button>

            {/*ticket.appUser && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="mdi:email-outline" />}
                onClick={() => {
                  setEmailForm({
                    recipientEmail: ticket.appUser?.email ?? '',
                    recipientName: ticket.appUser?.name ?? '',
                  });
                  setEmailSuccess(false);
                  setEmailOpen(true);
                }}
              >
                Enviar email
              </Button>
            )*/}

            <Button
              variant="contained"
              size="small"
              color={ticket.status === 'CLOSED' ? 'error' : 'inherit'}
              disabled={updatingStatus}
              startIcon={
                <Iconify icon={ticket.status === 'CLOSED' ? 'mdi:lock-open-outline' : 'mdi:close-circle-outline'} />
              }
              onClick={() => updateStatus(ticket.status === 'CLOSED' ? 'OPEN' : 'CLOSED')}
            >
              {ticket.status === 'CLOSED' ? 'Reabrir ticket' : 'Cerrar ticket'}
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* Left column — ticket info */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Descripción
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {ticket.description}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Detalles
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Creado
                      </Typography>
                      <Typography variant="body2">{fDateTime(ticket.createdAt)}</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Actualizado
                      </Typography>
                      <Typography variant="body2">{fDateTime(ticket.updatedAt)}</Typography>
                    </Stack>

                    {ticket.chargingStation && (
                      <>
                        <Divider />
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Estación
                          </Typography>
                          <Link
                            to={paths.locations.detail(String(ticket.chargingStation.id))}
                            style={{ textDecoration: 'none' }}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Iconify
                                icon="mdi:ev-station"
                                width={16}
                                sx={{ color: 'primary.main' }}
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
                        </Stack>
                      </>
                    )}

                    {ticket.appUser && (
                      <>
                        <Divider />
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Typography variant="caption" color="text.secondary">
                            Usuario
                          </Typography>
                          <Stack alignItems="flex-end" spacing={0}>
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
                            <Typography variant="body2" color="text.secondary">{ticket.appUser.telephone ?? '-'}</Typography>
                          </Stack>
                        </Stack>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Right column — tracking */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                  Seguimiento
                </Typography>

                {ticket.tracking.length === 0 ? (
                  <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                    Sin entradas todavía.
                  </Typography>
                ) : (
                  <Stack spacing={0} sx={{ mb: 3 }}>
                    {ticket.tracking.map((entry, index) => (
                      <TrackingEntry
                        key={entry.id}
                        entry={entry}
                        isLast={index === ticket.tracking.length - 1}
                      />
                    ))}
                  </Stack>
                )}

                <Divider sx={{ mb: 2.5 }} />
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Añadir nota
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    label="Mensaje"
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    value={trackingMessage}
                    onChange={(e) => setTrackingMessage(e.target.value)}
                  />
                  <Box>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!trackingMessage || !trackingAuthor || addingTracking}
                      onClick={() =>
                        addTracking({ message: trackingMessage, author: trackingAuthor })
                      }
                    >
                      {addingTracking ? 'Guardando…' : 'Añadir'}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DashboardContent>

      {/* Edit ticket dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar ticket #{ticket.id}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Motivo"
              fullWidth
              value={editForm.reason}
              onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                label="Tipo"
                value={editForm.type}
                onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as TicketType }))}
              >
                <MenuItem value="APP">App</MenuItem>
                <MenuItem value="CALL">Llamada</MenuItem>
              </Select>
            </FormControl>

            <StationSearchSelect value={editStation} onChange={setEditStation} />
            <AppUserSearchSelect value={editUser} onChange={setEditUser} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!editForm.reason || !editForm.description || updatingTicket}
            onClick={handleSaveEdit}
          >
            {updatingTicket ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send email dialog */}
      <Dialog open={emailOpen} onClose={() => setEmailOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Enviar email al cliente</DialogTitle>
        <DialogContent>
          {emailSuccess ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              Email enviado correctamente.
            </Alert>
          ) : (
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <TextField
                label="Email destinatario"
                fullWidth
                value={emailForm.recipientEmail}
                onChange={(e) => setEmailForm((f) => ({ ...f, recipientEmail: e.target.value }))}
              />
              <TextField
                label="Nombre destinatario"
                fullWidth
                value={emailForm.recipientName}
                onChange={(e) => setEmailForm((f) => ({ ...f, recipientName: e.target.value }))}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailOpen(false)}>
            {emailSuccess ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!emailSuccess && (
            <Button
              variant="contained"
              disabled={!emailForm.recipientEmail || !emailForm.recipientName || sendingEmail}
              onClick={() => sendEmail(emailForm)}
            >
              {sendingEmail ? 'Enviando…' : 'Enviar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

// ----------------------------------------------------------------------

function TrackingEntry({ entry, isLast }: { entry: TicketTracking; isLast: boolean }) {
  return (
    <Stack direction="row" spacing={1.5}>
      <Stack alignItems="center" sx={{ pt: 0.5 }}>
        <Box
          sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }}
        />
        {!isLast && (
          <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider', my: 0.5, minHeight: 16 }} />
        )}
      </Stack>

      <Stack spacing={0.25} sx={{ pb: isLast ? 0 : 2, flex: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2">{entry.author}</Typography>
          <Typography variant="caption" color="text.secondary">
            {fDateTime(entry.createdAt)}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
          {entry.message}
        </Typography>
      </Stack>
    </Stack>
  );
}
