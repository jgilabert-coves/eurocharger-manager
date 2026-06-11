import type { SelectedGroup } from 'src/components/chargepoint/group-dual-picker';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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

import { del, post, patch, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';
import { GroupDualPicker } from 'src/components/chargepoint/group-dual-picker';

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
  const { notifySuccess, notifyError } = useNotification();

  const [localGroups, setLocalGroups] = useState<SelectedGroup[]>([]);
  const [saving, setSaving] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: guestData,
    isFetching: loadingGuest,
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

  const serverGroups: InvitationGroup[] = guestData?.data?.groups ?? [];
  const currentRole: InvitationRole = guestData?.data?.role ?? invitation.role_to_assign;
  const allGroups: ChargerGroup[] = allGroupsData?.data ?? [];

  // Sincronizar estado local cuando lleguen los datos del servidor
  useEffect(() => {
    if (guestData) {
      setLocalGroups(
        serverGroups.map((g) => ({ groupId: g.group_id, permissionLevel: g.permission_level }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestData]);

  const invalidateInvitations = () =>
    queryClient.invalidateQueries({ queryKey: ['invitations', accountId] });

  const handleRoleChange = async (newRole: InvitationRole) => {
    if (newRole === currentRole || changingRole) return;
    try {
      setChangingRole(true);
      setError(null);
      await patch(endpoints.invitations.invitationRole(accountId, invitation.id), { role: newRole });
      await queryClient.invalidateQueries({ queryKey: ['invitation-groups', invitation.id] });
      invalidateInvitations();
      notifySuccess('Roles actualizados con éxito');
    } catch (err: any) {
      notifyError(err?.error ?? 'Ha ocurrido un error al lanzar la acción');
      setError(err?.error ?? 'Error al cambiar el rol.');
    } finally {
      setChangingRole(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const originalIds = serverGroups.map((g) => g.group_id);
      const localIds = localGroups.map((g) => g.groupId);

      const toRemove = serverGroups.filter((g) => !localIds.includes(g.group_id));
      const toAdd = localGroups.filter((g) => !originalIds.includes(g.groupId));
      // Permiso cambiado: quitar y volver a añadir
      const toUpdatePermission = localGroups.filter((g) => {
        const original = serverGroups.find((s) => s.group_id === g.groupId);
        return original && original.permission_level !== g.permissionLevel;
      });

      await Promise.all([
        ...toRemove.map((g) =>
          del(endpoints.invitations.invitationGroup(accountId, invitation.id, g.group_id))
        ),
        ...toUpdatePermission.map(async (g) => {
          await del(endpoints.invitations.invitationGroup(accountId, invitation.id, g.groupId));
          await post(endpoints.invitations.invitationGroups(accountId, invitation.id), {
            groupId: g.groupId,
            permissionLevel: g.permissionLevel,
          });
        }),
        ...toAdd.map((g) =>
          post(endpoints.invitations.invitationGroups(accountId, invitation.id), {
            groupId: g.groupId,
            permissionLevel: g.permissionLevel,
          })
        ),
      ]);

      await queryClient.invalidateQueries({ queryKey: ['invitation-groups', invitation.id] });
      invalidateInvitations();
      notifySuccess('Roles actualizados con éxito');
      onClose();
    } catch (err: any) {
      notifyError(err?.error ?? 'Ha ocurrido un error al lanzar la acción');
      setError(err?.error ?? 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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

        {/* Rol */}
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

        <Divider sx={{ mb: 1 }} />

        <Typography variant="subtitle2" sx={{ mb: 0 }}>
          Propietarios
        </Typography>

        {loadingGuest ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <GroupDualPicker
            available={allGroups}
            selected={localGroups}
            onChange={setLocalGroups}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loadingGuest}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
}
