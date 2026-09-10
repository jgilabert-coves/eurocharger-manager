import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useSearchParams } from 'src/routes/hooks';

import { activateAccount, appApiErrorCode, resendActivation } from 'src/lib/axios-app';

import { FormHead } from 'src/auth/components/form-head';

// ----------------------------------------------------------------------

type Estado = 'activando' | 'listo' | 'caducado' | 'invalido' | 'error';

/**
 * Activación de la cuenta de un conductor desde el enlace del correo.
 *
 * Se activa sola al abrir la página: el enlace ya es la confirmación, pedir además
 * que pulse un botón no añade nada.
 *
 * Activar es idempotente, así que reabrir el enlace vuelve a mostrar "listo" en vez
 * de un error, que es lo que el usuario espera.
 */
export function AppActivateView() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [estado, setEstado] = useState<Estado>('activando');
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('invalido');
      return;
    }

    activateAccount(token)
      .then(() => setEstado('listo'))
      .catch((error) => {
        const code = appApiErrorCode(error);
        if (code === 'token_expired') setEstado('caducado');
        else if (code === 'token_invalid' || code === 'user_not_found') setEstado('invalido');
        else setEstado('error');
      });
  }, [token]);

  const handleReenviar = async () => {
    if (!email.trim()) return;
    setReenviando(true);
    try {
      await resendActivation(email.trim());
    } catch {
      // El endpoint responde 202 exista o no la cuenta; un fallo de red tampoco
      // debe revelar nada, así que el mensaje es el mismo en ambos casos.
    } finally {
      setReenviando(false);
      setReenviado(true);
    }
  };

  if (estado === 'activando') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 6 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Activando tu cuenta…
        </Typography>
      </Box>
    );
  }

  if (estado === 'listo') {
    return (
      <>
        <FormHead
          title="¡Cuenta activada!"
          description="Ya puedes iniciar sesión en la app de Eurocharger y empezar a cargar."
        />
        <Button fullWidth size="large" variant="contained" href="eurocharger://login">
          Abrir la app
        </Button>
      </>
    );
  }

  if (estado === 'caducado') {
    return (
      <>
        <FormHead
          title="El enlace ha caducado"
          description="Los enlaces de activación duran 7 días. Dinos tu correo y te enviamos uno nuevo."
        />

        {reenviado ? (
          <Alert severity="success">
            Si la cuenta existe y sigue pendiente, recibirás un correo de activación.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              type="email"
              label="Tu correo"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <LoadingButton
              fullWidth
              size="large"
              variant="contained"
              loading={reenviando}
              disabled={!email.trim()}
              onClick={handleReenviar}
            >
              Enviar enlace nuevo
            </LoadingButton>
          </Box>
        )}
      </>
    );
  }

  return (
    <FormHead
      title={estado === 'invalido' ? 'Enlace no válido' : 'Algo ha fallado'}
      description={
        estado === 'invalido'
          ? 'Este enlace de activación no es válido. Comprueba que lo has copiado entero.'
          : 'No hemos podido activar tu cuenta. Inténtalo de nuevo en unos minutos.'
      }
    />
  );
}
