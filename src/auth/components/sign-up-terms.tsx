import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

// ----------------------------------------------------------------------

export function SignUpTerms({ sx, ...other }: BoxProps) {
  return (
    <Box
      component="span"
      sx={[
        () => ({
          mt: 3,
          display: 'block',
          textAlign: 'center',
          typography: 'caption',
          color: 'text.secondary',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {'Al iniciar sesión, aceptas nuestros '}
      <Link underline="always" color="text.primary" href="https://www.eurocharger.es/terminosycondiciones" target="_blank">
        Términos y condiciones
      </Link>
      {' y nuestra '}
      <Link underline="always" color="text.primary" href="https://www.eurocharger.es/privacidad" target="_blank">
        Política de privacidad
      </Link>
      .
    </Box>
  );
}
