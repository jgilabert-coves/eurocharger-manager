import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { del, fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
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

const STATUS_COLOR: Record<
  InvitationStatus,
  'warning' | 'success' | 'default' | 'error'
> = {
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
  const accountId = user?.account_id;

  const [createOpen, setCreateOpen] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const { data, isFetching, refetch } = useQuery<InvitationsResponse>({
    queryKey: ['invitations', accountId],
    queryFn: () => fetcher(endpoints.invitations.list(accountId!)),
    enabled: !!accountId,
  });

  const rows = data?.data ?? [];

  const handleRevoke = async (id: string) => {
    try {
      setRevoking(id);
      await del(endpoints.invitations.revoke(accountId!, id));
      refetch();
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
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h4">Invitaciones</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gestiona los accesos invitados al panel de tu cuenta
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mdi:plus" width={18} />}
            onClick={() => setCreateOpen(true)}
          >
            Nueva invitación
          </Button>
        </Stack>

        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Expira</TableCell>
                  <TableCell>Aceptada</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
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
                        {inv.status === 'pending' && (
                          <Tooltip title="Revocar invitación">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={revoking === inv.id}
                                onClick={() => handleRevoke(inv.id)}
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </DashboardContent>

      <CreateInvitationDialog
        accountId={accountId!}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => refetch()}
      />
    </>
  );
}
