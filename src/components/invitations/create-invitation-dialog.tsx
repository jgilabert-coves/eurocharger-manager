import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
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

type GroupRow = {
  groupId: string;
  permissionLevel: InvitationPermissionLevel;
};

const EMPTY_GROUP: GroupRow = { groupId: '', permissionLevel: 'view' };

export function CreateInvitationDialog({
  accountId,
  open,
  onClose,
  onSuccess,
}: CreateInvitationDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitationRole>('saas_guest');
  const [groups, setGroups] = useState<GroupRow[]>([]);
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

  const addGroup = () => setGroups((prev) => [...prev, { ...EMPTY_GROUP }]);

  const updateGroup = (index: number, patch: Partial<GroupRow>) =>
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)));

  const removeGroup = (index: number) =>
    setGroups((prev) => prev.filter((_, i) => i !== index));

  const selectedGroupIds = groups.map((g) => g.groupId).filter(Boolean);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const validGroups = groups.filter((g) => g.groupId);
      await post(endpoints.invitations.create(accountId), {
        email: email.trim(),
        role,
        ...(validGroups.length > 0 ? { groups: validGroups } : {}),
      });
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

        {/* Groups */}
        {groups.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Divider sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Propietarios asignados
              </Typography>
            </Divider>
            {groups.map((g, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <TextField
                  select
                  size="small"
                  label="Propietario"
                  value={g.groupId}
                  onChange={(e) => updateGroup(i, { groupId: e.target.value })}
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {availableGroups.map((ag) => (
                    <MenuItem
                      key={ag.id}
                      value={ag.id}
                      disabled={selectedGroupIds.includes(ag.id) && ag.id !== g.groupId}
                    >
                      {ag.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Acceso"
                  value={g.permissionLevel}
                  onChange={(e) => updateGroup(i, { permissionLevel: e.target.value as InvitationPermissionLevel })}
                  sx={{ width: 130 }}
                >
                  <MenuItem value="view">Lectura</MenuItem>
                  <MenuItem value="operate">Operación</MenuItem>
                </TextField>
                <IconButton size="small" onClick={() => removeGroup(i)} sx={{ color: 'text.secondary' }}>
                  <Iconify icon="mingcute:close-line" width={16} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {availableGroups.length > 0 && (
          <Button
            size="small"
            variant="text"
            startIcon={<Iconify icon="mingcute:add-line" width={16} />}
            onClick={addGroup}
            disabled={groups.length >= availableGroups.length}
            sx={{ mt: 0.5 }}
          >
            Añadir propietario
          </Button>
        )}

        {availableGroups.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Sin propietarios aún. Crea uno en Propietarios.
          </Typography>
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
