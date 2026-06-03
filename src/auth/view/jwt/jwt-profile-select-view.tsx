import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { selectProfile } from '../../context/jwt/action';
import { useAuthContext } from '../../hooks/use-auth-context';
import { PROFILE_SELECTION_KEY } from '../../context/jwt/constant';

// ----------------------------------------------------------------------

const ROLE_LABEL: Record<string, string> = {
  saas_owner: 'Propietario',
  saas_admin: 'Administrador',
  saas_guest: 'Invitado',
};

const ROLE_COLOR: Record<string, 'success' | 'warning' | 'default'> = {
  saas_owner: 'success',
  saas_admin: 'warning',
  saas_guest: 'default',
};

// ----------------------------------------------------------------------

export function JwtProfileSelectView() {
  const navigate = useNavigate();
  const { checkUserSession } = useAuthContext();

  const [selectionData, setSelectionData] = useState<ProfileSelectionData | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(PROFILE_SELECTION_KEY);
    if (!raw) {
      navigate(paths.auth.jwt.signIn, { replace: true });
      return;
    }
    try {
      setSelectionData(JSON.parse(raw));
    } catch {
      navigate(paths.auth.jwt.signIn, { replace: true });
    }
  }, [navigate]);

  const handleSelect = async (profile: Profile) => {
    if (!selectionData) return;
    setLoadingId(profile.membership_id);
    setError(null);
    try {
      await selectProfile(profile.membership_id, selectionData.profile_selection_token);
      sessionStorage.removeItem(PROFILE_SELECTION_KEY);
      await checkUserSession?.();
      navigate(paths.dashboard.root, { replace: true });
    } catch (err: any) {
      const msg: string = err?.error ?? err?.message ?? '';
      if (msg.includes('expired') || msg.includes('Invalid')) {
        setError('La sesión de selección ha expirado. Por favor, inicia sesión de nuevo.');
      } else {
        setError('Error al seleccionar el perfil. Inténtalo de nuevo.');
      }
      setLoadingId(null);
    }
  };

  if (!selectionData) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', p: 5, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Selecciona un perfil
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tienes acceso a varias cuentas. Elige con cuál quieres entrar.
            </Typography>
          </Box>

          {error && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'error.lighter',
                border: '1px solid',
                borderColor: 'error.light',
              }}
            >
              <Typography variant="caption" color="error.dark">
                {error}
              </Typography>
            </Box>
          )}

          <Stack spacing={1.5}>
            {selectionData.profiles.map((profile) => (
              <Button
                key={profile.membership_id}
                variant="outlined"
                disabled={loadingId !== null}
                onClick={() => handleSelect(profile)}
                sx={{
                  justifyContent: 'space-between',
                  p: 2,
                  textAlign: 'left',
                  borderRadius: 2,
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lighter' },
                }}
              >
                <Box>
                  <Typography variant="subtitle2" color="text.primary">
                    {profile.account_name}
                  </Typography>
                  <Chip
                    size="small"
                    label={ROLE_LABEL[profile.role] ?? profile.role}
                    color={ROLE_COLOR[profile.role] ?? 'default'}
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                {loadingId === profile.membership_id ? (
                  <CircularProgress size={20} />
                ) : (
                  <Iconify
                    icon="eva:arrow-ios-forward-fill"
                    width={20}
                    sx={{ color: 'text.secondary', flexShrink: 0 }}
                  />
                )}
              </Button>
            ))}
          </Stack>

          <Button
            variant="text"
            size="small"
            color="inherit"
            onClick={() => {
              sessionStorage.removeItem(PROFILE_SELECTION_KEY);
              navigate(paths.auth.jwt.signIn, { replace: true });
            }}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={18} />}
          >
            Volver al inicio de sesión
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
