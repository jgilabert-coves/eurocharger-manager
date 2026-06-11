import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { useDebounce } from 'src/hooks/use-debounce';

import { del, fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';
import { EditGuestGroupsDialog } from 'src/components/invitations/edit-guest-groups-dialog';
import { CreateInvitationDialog } from 'src/components/invitations/create-invitation-dialog';

import { CONFIG } from '../../global-config';
import { useAuthContext } from '../../auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

const metadata = { title: `Invitaciones | ${CONFIG.appName}` };

const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  expired: 'Expirada',
  revoked: 'Revocada',
};

const STATUS_COLOR: Record<InvitationStatus, 'warning' | 'success' | 'default' | 'error'> = {
  pending: 'warning',
  accepted: 'success',
  expired: 'default',
  revoked: 'error',
};

const ROLE_LABEL: Record<InvitationRole, string> = {
  saas_admin: 'Admin',
  saas_guest: 'Invitado',
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ----------------------------------------------------------------------

export default function InvitationsView() {
  const { user } = useAuthContext();
  const isEurocharger = user?.roles?.includes('eurocharger');

  const [selectedAccount, setSelectedAccount] = useState<{
    id: number;
    business_name: string;
  } | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const debouncedAccountSearch = useDebounce(accountSearch);

  const { data: accountsData, isLoading: accountsLoading } = useQuery<{
    data: { id: number; business_name: string }[];
  }>({
    queryKey: ['accounts', 'search', debouncedAccountSearch],
    queryFn: () =>
      fetcher([
        endpoints.accounts.list,
        { params: { searchQuery: debouncedAccountSearch, pageSize: 10 } },
      ]),
    enabled: !!isEurocharger,
    staleTime: 30 * 1000,
  });

  const accountId = isEurocharger ? selectedAccount?.id : user?.account_id;

  const [createOpen, setCreateOpen] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null);
  const [revokeError, setRevokeError] = useState(false);
  const [editTarget, setEditTarget] = useState<Invitation | null>(null);

  const { notifySuccess, notifyError } = useNotification();

  const { data, isFetching, refetch } = useQuery<InvitationsResponse>({
    queryKey: ['invitations', accountId],
    queryFn: () => fetcher(endpoints.invitations.list(accountId!)),
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
  });

  const rows = data?.data ?? [];

  const handleRevoke = async (inv: Invitation) => {
    if (!accountId) return;
    try {
      setRevoking(inv.id);
      setRevokeTarget(null);
      await del(endpoints.invitations.revoke(accountId, inv.id));
      refetch();
      notifySuccess('Acción realizada con éxito');
    } catch {
      setRevokeError(true);
      notifyError('Ha ocurrido un error al lanzar la acción');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: isEurocharger ? 3 : 4 }}
        >
          <Box>
            <Typography variant="h4">Invitaciones</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {isEurocharger
                ? 'Invita usuarios a cualquier cuenta'
                : 'Gestiona los accesos invitados al panel de tu cuenta'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mdi:plus" width={18} />}
            disabled={!accountId}
            onClick={() => setCreateOpen(true)}
          >
            Nueva invitación
          </Button>
        </Stack>

        {isEurocharger && (
          <Box sx={{ mb: 4, maxWidth: 420 }}>
            <Autocomplete
              options={accountsData?.data ?? []}
              getOptionLabel={(o) => o.business_name}
              value={selectedAccount}
              onChange={(_, v) => setSelectedAccount(v)}
              inputValue={accountSearch}
              onInputChange={(_, v) => setAccountSearch(v)}
              loading={accountsLoading}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cuenta"
                  placeholder="Buscar cuenta..."
                  size="small"
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {accountsLoading ? <CircularProgress size={16} color="inherit" /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          </Box>
        )}

        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Propietarios</TableCell>
                  <TableCell>Expira</TableCell>
                  <TableCell>Aceptada</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isEurocharger && !accountId ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <Stack alignItems="center" spacing={1.5}>
                        <Iconify
                          icon="mdi:account-search-outline"
                          width={40}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Selecciona una cuenta para ver sus invitaciones
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : isFetching ? (
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
                          icon="mdi:email-outline"
                          width={40}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          No hay invitaciones enviadas
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((inv) => (
                    <TableRow
                      key={inv.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell sx={{ pl: 3 }}>
                        <Typography variant="body2">{inv.email}</Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {ROLE_LABEL[inv.role_to_assign] ?? inv.role_to_assign}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Label color={STATUS_COLOR[inv.status]} variant="soft">
                          {STATUS_LABEL[inv.status] ?? inv.status}
                        </Label>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 200 }}>
                        {inv.groups.length === 0 ? (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        ) : (
                          <Stack direction="row" flexWrap="wrap" gap={0.5}>
                            {inv.groups.slice(0, 2).map((g) => (
                              <Chip key={g.group_id} label={g.group_name} size="small" variant="soft" />
                            ))}
                            {inv.groups.length > 2 && (
                              <Chip label={`+${inv.groups.length - 2}`} size="small" />
                            )}
                          </Stack>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(inv.expires_at)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(inv.accepted_at)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right" sx={{ pr: 2 }}>
                        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                          {inv.status === 'accepted' && (
                            <Tooltip title="Gestionar propietarios">
                              <IconButton size="small" onClick={() => setEditTarget(inv)}>
                                <Iconify icon="mdi:pencil-outline" width={18} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {inv.status === 'pending' && (
                            <Tooltip title="Revocar invitación">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={revoking === inv.id}
                                  onClick={() => setRevokeTarget(inv)}
                                >
                                  {revoking === inv.id ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <Iconify icon="mdi:close-circle-outline" width={18} />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </DashboardContent>

      {accountId && (
        <CreateInvitationDialog
          accountId={accountId}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {accountId && editTarget && (
        <EditGuestGroupsDialog
          accountId={accountId}
          invitation={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      <Dialog open={!!revokeTarget} onClose={() => setRevokeTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Revocar invitación?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se revocará la invitación enviada a <strong>{revokeTarget?.email}</strong>. El enlace
            dejará de ser válido.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeTarget(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => revokeTarget && handleRevoke(revokeTarget)}
          >
            Revocar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={revokeError}
        autoHideDuration={4000}
        onClose={() => setRevokeError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setRevokeError(false)} sx={{ width: '100%' }}>
          No se pudo revocar la invitación. Inténtalo de nuevo.
        </Alert>
      </Snackbar>
    </>
  );
}
