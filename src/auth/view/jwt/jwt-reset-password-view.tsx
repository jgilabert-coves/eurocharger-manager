import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { resetPassword } from '../../context/jwt';
import { FormHead } from '../../components/form-head';

// ----------------------------------------------------------------------

const ResetPasswordSchema = zod
  .object({
    password: zod
      .string()
      .min(1, { message: 'La contraseña es obligatoria' })
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    confirmPassword: zod.string().min(1, { message: 'Confirma la contraseña' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordSchemaType = zod.infer<typeof ResetPasswordSchema>;

// ----------------------------------------------------------------------

export function JwtResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const showPassword = useBoolean();
  const showConfirm = useBoolean();

  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const methods = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    if (!token) {
      setErrorMessage('Enlace de recuperación inválido. Solicita uno nuevo.');
      return;
    }
    try {
      await resetPassword(token, data.password);
      setDone(true);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setErrorMessage(msg ?? 'Error al restablecer la contraseña. El enlace puede haber expirado.');
    }
  });

  if (done) {
    return (
      <>
        <FormHead
          title="Contraseña actualizada"
          sx={{ textAlign: { xs: 'center', md: 'left' } }}
        />
        <Alert severity="success" sx={{ mb: 3 }}>
          Tu contraseña se ha actualizado correctamente.
        </Alert>
        <Typography variant="body2" align="center">
          <Link
            component={RouterLink}
            href={paths.auth.jwt.signIn}
            variant="subtitle2"
            onClick={() => router.push(paths.auth.jwt.signIn)}
          >
            Iniciar sesión
          </Link>
        </Typography>
      </>
    );
  }

  return (
    <>
      <FormHead
        title="Nueva contraseña"
        description="Introduce tu nueva contraseña."
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {!token && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Enlace inválido.{' '}
          <Link component={RouterLink} href={paths.auth.jwt.forgotPassword}>
            Solicitar nuevo enlace
          </Link>
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text
            name="password"
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            type={showPassword.value ? 'text' : 'password'}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={showPassword.onToggle} edge="end">
                      <Iconify
                        icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Field.Text
            name="confirmPassword"
            label="Confirmar contraseña"
            type={showConfirm.value ? 'text' : 'password'}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={showConfirm.onToggle} edge="end">
                      <Iconify
                        icon={showConfirm.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <LoadingButton
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator="Guardando..."
            disabled={!token}
          >
            Guardar nueva contraseña
          </LoadingButton>
        </Box>
      </Form>

      <Typography variant="body2" align="center" sx={{ mt: 3 }}>
        <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
          Volver al inicio de sesión
        </Link>
      </Typography>
    </>
  );
}
