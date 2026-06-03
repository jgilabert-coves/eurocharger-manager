import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { post, del, patch, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type EditGuestGroupsDialogProps = {
  accountId: number;
  invitation: Invitation;
  open: boolean;
  onClose: () => void;
};

type GuestState = {
  groups: InvitationGroup[];
  role: InvitationRole | null;
};

const PERMISSION_LABEL: Record<InvitationPermissionLevel, string> = {
  view: 'Lectura',
  operate: 'Operación',
};

const ROLE_LABEL: Record<InvitationRole, string> = {
  saas_guest: 'Invitado',
  saas_admin: 'Admin',
};

export function EditGuestGroupsDialog({
  accountId,
  invitation,
  open,
  onClose,
}: EditGuestGroupsDialogProps) {
  const queryClient = useQueryClient();

  const [addGroupId, setAddGroupId] = useState('');
  const [addPermission, setAddPermission] = useState<InvitationPermissionLevel>('view');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: guestData,
    isFetching: loadingGuest,
    refetch: refetchGuest,
  } = useQuery<{ data: GuestState }>({
    queryKey: ['invitation-groups', invitation.id],
    queryFn: () => fetcher(endpoints.invitations.invitationGroups(accountId, invitation.id)),
    enabled: open,
    staleTime: 0,
  });

  const { data: allGroupsData } = useQuery<ChargerGroupsResponse>({
    queryKey: ['charger-groups', accountId],
    queryFn: () => fetcher(endpoints.accounts.chargerGroups(accountId)),
    enabled: open,
    staleTime: 2 * 60 * 1000,
  });

  const liveGroups: InvitationGroup[] = guestData?.data?.groups ?? [];
  const currentRole: InvitationRole = guestData?.data?.role ?? invitation.role_to_assign;
  const allGroups: ChargerGroup[] = allGroupsData?.data ?? [];
  const assignedGroupIds = liveGroups.map((g) => g.group_id);
  const unassignedGroups = allGroups.filter((g) => !assignedGroupIds.includes(g.id));

  const invalidateInvitations = () =>
    queryClient.invalidateQueries({ queryKey: ['invitations', accountId] });

  const handleRoleChange = async (newRole: InvitationRole) => {
    if (newRole === currentRole || changingRole) return;
    try {
      setChangingRole(true);
      setError(null);
      await patch(endpoints.invitations.invitationRole(accountId, invitation.id), { role: newRole });
      await refetchGuest();
      invalidateInvitations();
    } catch (err: any) {
      setError(err?.error ?? 'Error al cambiar el rol.');
    } finally {
      setChangingRole(false);
    }
  };

  const handleAdd = async () => {
    if (!addGroupId) return;
    try {
      setAdding(true);
      setError(null);
      await post(endpoints.invitations.invitationGroups(accountId, invitation.id), {
        groupId: addGroupId,
        permissionLevel: addPermission,
      });
      setAddGroupId('');
      setAddPermission('view');
      await refetchGuest();
      invalidateInvitations();
    } catch (err: any) {
      setError(err?.error ?? 'Error al añadir el propietario.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (groupId: string) => {
    try {
      setRemoving(groupId);
      setError(null);
      await del(endpoints.invitations.invitationGroup(accountId, invitation.id, groupId));
      await refetchGuest();
      invalidateInvitations();
    } catch (err: any) {
      setError(err?.error ?? 'Error al eliminar el propietario.');
    } finally {
      setRemoving(null);
    }
  };

  const handleClose = () => {
    setAddGroupId('');
    setAddPermission('view');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Gestionar acceso
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
        >
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {invitation.email}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Role */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <TextField
            select
            size="small"
            label="Rol"
            fullWidth
            value={currentRole}
            onChange={(e) => handleRoleChange(e.target.value as InvitationRole)}
            disabled={loadingGuest || changingRole}
          >
            {(Object.keys(ROLE_LABEL) as InvitationRole[]).map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABEL[r]}
              </MenuItem>
            ))}
          </TextField>
          {changingRole && <CircularProgress size={18} />}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Current groups */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Propietarios actuales
        </Typography>

        {loadingGuest ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={22} />
          </Box>
        ) : liveGroups.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
            Sin propietarios asignados
          </Typography>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
            {liveGroups.map((g) => (
              <Chip
                key={g.group_id}
                label={`${g.group_name} · ${PERMISSION_LABEL[g.permission_level]}`}
                size="small"
                variant="soft"
                color="primary"
                disabled={removing === g.group_id}
                onDelete={() => handleRemove(g.group_id)}
                deleteIcon={
                  removing === g.group_id ? (
                    <CircularProgress size={12} color="inherit" />
                  ) : undefined
                }
              />
            ))}
          </Stack>
        )}

        {/* Add group */}
        {unassignedGroups.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Añadir propietario
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label="Propietario"
                value={addGroupId}
                onChange={(e) => setAddGroupId(e.target.value)}
                sx={{ flex: 1 }}
              >
                <MenuItem value="">Seleccionar...</MenuItem>
                {unassignedGroups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Acceso"
                value={addPermission}
                onChange={(e) => setAddPermission(e.target.value as InvitationPermissionLevel)}
                sx={{ width: 130 }}
              >
                <MenuItem value="view">Lectura</MenuItem>
                <MenuItem value="operate">Operación</MenuItem>
              </TextField>
              <Button
                variant="contained"
                size="small"
                disabled={!addGroupId || adding}
                onClick={handleAdd}
                sx={{ minWidth: 48, px: 1 }}
              >
                {adding ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Iconify icon="mingcute:add-line" width={18} />
                )}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
