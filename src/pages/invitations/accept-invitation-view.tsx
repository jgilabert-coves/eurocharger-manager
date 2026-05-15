import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

import { setSession } from 'src/auth/context/jwt';

import { useAuthContext } from '../../auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

const VALIDATE_ERRORS: Record<string, string> = {
  'Invitation not found': 'La invitación no existe.',
  'Invitation is accepted': 'Esta invitación ya ha sido aceptada.',
  'Invitation is revoked': 'Esta invitación ha sido revocada.',
  'Invitation has expired': 'Esta invitación ha expirado.',
};

const ACCEPT_ERRORS: Record<string, string> = {
  'Invitation has expired': 'La invitación ha expirado.',
  'Invitation is accepted': 'Esta invitación ya ha sido aceptada.',
  'User is already a member of this account': 'Ya eres miembro de esta cuenta.',
  'name, surname and password are required for new users':
    'Completa el formulario para crear tu cuenta.',
};

const ROLE_LABEL: Record<string, string> = {
  saas_admin: 'Administrador',
  saas_guest: 'Invitado',
};

type PageState = 'loading' | 'trying' | 'form' | 'submitting' | 'success' | 'error';

// ----------------------------------------------------------------------

export default function AcceptInvitationView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkUserSession } = useAuthContext();
  const token = searchParams.get('token') ?? '';

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [validateData, setValidateData] = useState<InvitationValidateData | null>(null);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setPageState('error');
      setErrorMessage('Token de invitación no válido o ausente.');
      return;
    }

    // Step 1: validate token
    fetcher(endpoints.invitations.validate(token))
      .then(async (res) => {
        setValidateData(res.data ?? res);
        setPageState('trying');

        // Step 2: try to accept with just the token (existing user path)
        try {
          const acceptRes = await post(endpoints.invitations.accept, { token });
          const result = acceptRes?.data ?? acceptRes;

          if (result?.user_exists === true) {
            // Existing user: profile added, redirect to login with message
            setPageState('success');
          } else if (result?.token) {
            // New user somehow got a JWT (shouldn't happen without name/surname/password)
            await setSession(result.token);
            await checkUserSession?.();
            navigate(paths.dashboard.root, { replace: true });
          }
        } catch (err: any) {
          const raw: string = err?.error ?? '';
          if (raw === 'name, surname and password are required for new users') {
            // New user — show registration form
            setPageState('form');
          } else {
            setFormError(ACCEPT_ERRORS[raw] ?? 'Error al procesar la invitación.');
            setPageState('form');
          }
        }
      })
      .catch((err: any) => {
        const raw: string = err?.error ?? '';
        setPageState('error');
        setErrorMessage(VALIDATE_ERRORS[raw] ?? 'No se pudo validar la invitación.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      setFormError(null);
      setPageState('submitting');
      const res = await post(endpoints.invitations.accept, {
        token,
        name: name.trim(),
        surname: surname.trim(),
        password,
      });
      const result = res?.data ?? res;

      if (result?.user_exists === true) {
        setPageState('success');
        return;
      }

      const jwt: string = result?.token ?? res?.token;
      await setSession(jwt);
      await checkUserSession?.();
      navigate(paths.dashboard.root, { replace: true });
    } catch (err: any) {
      const raw: string = err?.error ?? '';
      setFormError(ACCEPT_ERRORS[raw] ?? 'Error al crear la cuenta. Inténtalo de nuevo.');
      setPageState('form');
    }
  };

  const canSubmit =
    name.trim().length > 0 && surname.trim().length > 0 && password.length >= 6;

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
        {/* Loading / trying auto-accept */}
        {(pageState === 'loading' || pageState === 'trying') && (
          <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary">
              Validando la invitación…
            </Typography>
          </Stack>
        )}

        {/* Error state */}
        {pageState === 'error' && (
          <Stack alignItems="center" spacing={3} sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'error.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="eva:close-circle-fill" width={44} sx={{ color: 'error.main' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Invitación no válida
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {errorMessage}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => navigate(paths.auth.jwt.signIn, { replace: true })}
            >
              Ir al inicio de sesión
            </Button>
          </Stack>
        )}

        {/* Success: existing user — profile added */}
        {pageState === 'success' && (
          <Stack alignItems="center" spacing={3} sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'success.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="eva:checkmark-circle-2-fill" width={44} sx={{ color: 'success.main' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                ¡Perfil añadido!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                El perfil ha sido añadido a tu cuenta. La próxima vez que inicies sesión verás este
                nuevo perfil disponible.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => navigate(paths.auth.jwt.signIn, { replace: true })}
            >
              Ir al inicio de sesión
            </Button>
          </Stack>
        )}

        {/* Registration form — new user */}
        {(pageState === 'form' || pageState === 'submitting') && validateData && (
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Crea tu cuenta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fuiste invitado como{' '}
                <Box component="span" fontWeight={600} color="text.primary">
                  {ROLE_LABEL[validateData.role] ?? validateData.role}
                </Box>
              </Typography>
            </Box>

            {formError && (
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
                  {formError}
                </Typography>
              </Box>
            )}

            <TextField
              label="Email"
              size="small"
              fullWidth
              value={validateData.email}
              disabled
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Iconify icon="eva:lock-fill" width={16} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Nombre"
                required
                size="small"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <TextField
                label="Apellido"
                required
                size="small"
                fullWidth
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />
            </Stack>

            <TextField
              label="Contraseña"
              required
              size="small"
              fullWidth
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Mínimo 6 caracteres"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                      >
                        <Iconify
                          icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'}
                          width={18}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!canSubmit || pageState === 'submitting'}
              onClick={handleSubmit}
              startIcon={
                pageState === 'submitting' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              Crear cuenta
            </Button>
          </Stack>
        )}
      </Card>
    </Box>
  );
}
