import type { SelectedGroup } from 'src/components/chargepoint/group-dual-picker';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';
import { GroupDualPicker } from 'src/components/chargepoint/group-dual-picker';

// ----------------------------------------------------------------------

export type CreateInvitationDialogProps = {
  accountId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateInvitationDialog({
  accountId,
  open,
  onClose,
  onSuccess,
}: CreateInvitationDialogProps) {
  const { notifySuccess, notifyError } = useNotification();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitationRole>('saas_guest');
  const [groups, setGroups] = useState<SelectedGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: groupsData } = useQuery<ChargerGroupsResponse>({
    queryKey: ['charger-groups', accountId],
    queryFn: () => fetcher(endpoints.accounts.chargerGroups(accountId)),
    enabled: open,
    staleTime: 2 * 60 * 1000,
  });

  const availableGroups: ChargerGroup[] = groupsData?.data ?? [];

  const handleClose = () => {
    setEmail('');
    setRole('saas_guest');
    setGroups([]);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await post(endpoints.invitations.create(accountId), {
        email: email.trim(),
        role,
        ...(groups.length > 0 ? { groups: groups.map((g) => ({ groupId: g.groupId, permissionLevel: g.permissionLevel })) } : {}),
      });
      notifySuccess('Invitación enviada con éxito');
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err?.error ?? 'Error al enviar la invitación. Inténtalo de nuevo.');
      notifyError();
    } finally {
      setLoading(false);
    }
  };

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Nueva invitación
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
          Se enviará un correo al invitado con el enlace de acceso.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Email"
          required
          type="email"
          size="small"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@ejemplo.com"
          sx={{ mb: 2 }}
        />

        <TextField
          select
          label="Rol"
          required
          size="small"
          fullWidth
          value={role}
          onChange={(e) => setRole(e.target.value as InvitationRole)}
          sx={{ mb: 1 }}
        >
          <MenuItem value="saas_guest">Invitado</MenuItem>
          <MenuItem value="saas_admin">Admin</MenuItem>
        </TextField>

        <Typography variant="subtitle2" sx={{ mt: 1, mb: 0 }}>
          Propietarios (opcional)
        </Typography>
        <GroupDualPicker
          available={availableGroups}
          selected={groups}
          onChange={setGroups}
          emptyText="Sin propietarios aún. Crea uno en Propietarios."
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!isValid || loading}
          onClick={handleSubmit}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Enviar invitación
        </Button>
      </DialogActions>
    </Dialog>
  );
}
