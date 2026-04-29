import type { Client } from 'src/types/clients';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { post, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { ClientSelect } from 'src/components/client/client-select';

// ----------------------------------------------------------------------

const ROLES: { value: ManagerUserRole; label: string }[] = [
  { value: 'Basic_Profile', label: 'Basic' },
  { value: 'Medium_Profile', label: 'Medium' },
  { value: 'Advanced_Profile', label: 'Advanced' },
  { value: 'Eurocharger', label: 'Eurocharger' },
];

function generatePassword(): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%&*';
  const all = lower + upper + digits + special;
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  const chars = [rand(lower), rand(upper), rand(digits), rand(special)];
  for (let i = 0; i < 8; i++) chars.push(rand(all));
  return chars.sort(() => Math.random() - 0.5).join('');
}

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const DEFAULT_FORM: CreateManagerUserPayload = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'Basic_Profile',
  client_id: null,
};

export function CreateManagerUserDialog({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<CreateManagerUserPayload>({ ...DEFAULT_FORM, password: generatePassword() });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isEurocharger = form.role === 'Eurocharger';

  const canSubmit =
    form.first_name.trim() !== '' &&
    form.last_name.trim() !== '' &&
    form.email.trim() !== '' &&
    form.password.trim() !== '' &&
    form.role !== '' as any;

  const handleRoleChange = (role: ManagerUserRole) => {
    setForm((f) => ({ ...f, role, client_id: role === 'Eurocharger' ? null : f.client_id }));
    if (role === 'Eurocharger') setSelectedClient(null);
  };

  const handleGeneratePassword = () => {
    setForm((f) => ({ ...f, password: generatePassword() }));
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(form.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setForm({ ...DEFAULT_FORM, password: generatePassword() });
    setSelectedClient(null);
    setShowPassword(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await post(endpoints.managerUsers.create, form);
      handleClose();
      onSuccess?.();
    } catch {
      setError('Error al crear el usuario. Comprueba los datos e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>Nuevo usuario del gestor</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Access data */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Datos de acceso
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  label="Nombre"
                  required
                  size="small"
                  fullWidth
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                />
                <TextField
                  label="Apellidos"
                  required
                  size="small"
                  fullWidth
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                />
              </Box>
              <TextField
                label="Email"
                required
                size="small"
                fullWidth
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <TextField
                label="Contraseña"
                required
                size="small"
                fullWidth
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Generar nueva contraseña">
                          <IconButton size="small" onClick={handleGeneratePassword} edge={false}>
                            <Iconify icon="mdi:refresh" width={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={copied ? '¡Copiado!' : 'Copiar contraseña'}>
                          <IconButton size="small" onClick={handleCopy} edge={false}>
                            <Iconify
                              icon={copied ? 'eva:checkmark-fill' : 'eva:copy-fill'}
                              width={18}
                              sx={{ color: copied ? 'success.main' : 'inherit' }}
                            />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                        >
                          <Iconify
                            icon={showPassword ? 'eva:eye-off-fill' : 'eva:eye-fill'}
                            width={18}
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          </Box>

          {/* Role */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Rol
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              select
              label="Rol"
              required
              size="small"
              fullWidth
              value={form.role}
              onChange={(e) => handleRoleChange(e.target.value as ManagerUserRole)}
            >
              {ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Client */}
          {!isEurocharger && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Cliente
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ClientSelect
                value={selectedClient}
                onChange={(c) => {
                  setSelectedClient(c);
                  setForm((f) => ({ ...f, client_id: c.id }));
                }}
              />
            </Box>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Crear usuario
        </Button>
      </DialogActions>
    </Dialog>
  );
}
