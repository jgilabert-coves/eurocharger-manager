import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useAuthContext } from '../../hooks';

// ----------------------------------------------------------------------

export function JwtSubscriptionExpiredView() {
  const { signOut } = useAuthContext() as any;

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

      {signOut && (
        <Button variant="outlined" color="inherit" onClick={signOut}>
          Cerrar sesión
        </Button>
      )}
    </Box>
  );
}
