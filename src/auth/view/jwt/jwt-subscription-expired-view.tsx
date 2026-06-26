import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';
import { signOut } from 'src/auth/context/jwt/action';

// ----------------------------------------------------------------------

export function JwtSubscriptionExpiredView() {
  const router = useRouter();

  const { checkUserSession } = useAuthContext();

  const handleBackToLogin = useCallback(async () => {
    try {
      await signOut();
      await checkUserSession?.();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      router.replace(paths.auth.jwt.signIn);
    }
  }, [checkUserSession, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 3,
        py: 4,
      }}
    >
      <Typography variant="h5">Suscripción expirada</Typography>

      <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
        La suscripción de tu cuenta ha expirado. Contacta con tu administrador para reactivarla.
      </Typography>

      <Button variant="contained" color="inherit" onClick={handleBackToLogin}>
        Volver al inicio de sesión
      </Button>
    </Box>
  );
}
