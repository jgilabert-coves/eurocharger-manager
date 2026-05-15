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
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitationRole>('saas_guest');
  const [chargerGroupId, setChargerGroupId] = useState<string>('');
  const [permissionLevel, setPermissionLevel] = useState<InvitationPermissionLevel>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: groupsData } = useQuery<ChargerGroupsResponse>({
    queryKey: ['charger-groups', accountId],
    queryFn: () => fetcher(endpoints.accounts.chargerGroups(accountId)),
    enabled: open,
    staleTime: 2 * 60 * 1000,
  });

  const groups: ChargerGroup[] = groupsData?.data ?? [];

  const handleClose = () => {
    setEmail('');
    setRole('saas_guest');
    setChargerGroupId('');
    setPermissionLevel('view');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload: Record<string, string> = {
        email: email.trim(),
        role,
        permissionLevel,
      };
      if (chargerGroupId) payload.chargerGroupId = chargerGroupId;

      await post(endpoints.invitations.create(accountId), payload);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err?.error ?? 'Error al enviar la invitación. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
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
          sx={{ mb: 2 }}
        >
          <MenuItem value="saas_guest">Invitado</MenuItem>
          <MenuItem value="saas_admin">Admin</MenuItem>
        </TextField>

        <TextField
          select
          label="Propietario"
          size="small"
          fullWidth
          value={chargerGroupId}
          onChange={(e) => setChargerGroupId(e.target.value)}
          helperText={
            groups.length === 0
              ? 'Sin propietarios aún. Crea uno en "Propietarios".'
              : 'Opcional — sin grupo, el invitado no verá ningún cargador.'
          }
          sx={{ mb: 2 }}
        >
          <MenuItem value="">Sin grupo asignado</MenuItem>
          {groups.map((g) => (
            <MenuItem key={g.id} value={g.id}>
              {g.name}
            </MenuItem>
          ))}
        </TextField>

        {chargerGroupId && (
          <TextField
            select
            label="Nivel de acceso"
            size="small"
            fullWidth
            value={permissionLevel}
            onChange={(e) => setPermissionLevel(e.target.value as InvitationPermissionLevel)}
          >
            <MenuItem value="view">Solo visualización</MenuItem>
            <MenuItem value="operate">Visualización y operación</MenuItem>
          </TextField>
        )}
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
