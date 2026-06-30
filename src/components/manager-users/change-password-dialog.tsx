import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { generatePassword } from 'src/utils/generate-password';

import { patch, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  user: ManagerUser | null;
  onClose: () => void;
};

export function ChangePasswordDialog({ open, user, onClose }: Props) {
  const { notifySuccess, notifyError } = useNotification();
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = password.trim().length >= 8;

  const handleGeneratePassword = () => {
    setPassword(generatePassword());
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setPassword(generatePassword());
    setShowPassword(false);
    setError(null);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      await patch(endpoints.managerUsers.updatePassword(user.id), { password });
      notifySuccess('Contraseña actualizada con éxito');
      handleClose();
    } catch {
      notifyError();
      setError('Error al actualizar la contraseña. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cambiar contraseña</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {user && (
            <Typography variant="body2" color="text.secondary">
              Nueva contraseña para <strong>{user.full_name}</strong> ({user.email})
            </Typography>
          )}

          <TextField
            label="Nueva contraseña"
            required
            size="small"
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Mínimo 8 caracteres"
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
                    <IconButton size="small" onClick={() => setShowPassword((s) => !s)} edge="end">
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
          Guardar contraseña
        </Button>
      </DialogActions>
    </Dialog>
  );
}
