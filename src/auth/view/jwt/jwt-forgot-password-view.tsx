import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Form, Field } from 'src/components/hook-form';

import { forgotPassword } from '../../context/jwt';
import { FormHead } from '../../components/form-head';

// ----------------------------------------------------------------------

const ForgotPasswordSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: 'El email es obligatorio' })
    .email({ message: 'Introduce un email válido' }),
});

type ForgotPasswordSchemaType = zod.infer<typeof ForgotPasswordSchema>;

// ----------------------------------------------------------------------

export function JwtForgotPasswordView() {
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const methods = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await forgotPassword(data.email);
      setSent(true);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Error al enviar el correo. Inténtalo de nuevo.');
    }
  });

  return (
    <>
      <FormHead
        title="¿Has olvidado tu contraseña?"
        description="Introduce tu email y te enviaremos un enlace para restablecerla."
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {sent ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          Si el email está registrado, recibirás un enlace en breve.
        </Alert>
      ) : (
        <>
          {!!errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
              <Field.Text name="email" label="Email" slotProps={{ inputLabel: { shrink: true } }} />

              <LoadingButton
                fullWidth
                color="inherit"
                size="large"
                type="submit"
                variant="contained"
                loading={isSubmitting}
                loadingIndicator="Enviando..."
              >
                Enviar enlace de recuperación
              </LoadingButton>
            </Box>
          </Form>
        </>
      )}

      <Typography variant="body2" align="center" sx={{ mt: 3 }}>
        <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
          Volver al inicio de sesión
        </Link>
      </Typography>
    </>
  );
}
