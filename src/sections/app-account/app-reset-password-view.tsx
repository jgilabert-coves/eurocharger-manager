import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useSearchParams } from 'src/routes/hooks';

import { appApiErrorCode, resetAppPassword } from 'src/lib/axios-app';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { FormHead } from 'src/auth/components/form-head';

// ----------------------------------------------------------------------

const ResetSchema = zod
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

type ResetSchemaType = zod.infer<typeof ResetSchema>;

// ----------------------------------------------------------------------

/** Nueva contraseña de un CONDUCTOR, desde el enlace del correo. */
export function AppResetPasswordView() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const showPassword = useBoolean();
  const showConfirm = useBoolean();

  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const methods = useForm<ResetSchemaType>({
    resolver: zodResolver(ResetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);
    try {
      await resetAppPassword(token, data.password);
      setDone(true);
    } catch (error) {
      const code = appApiErrorCode(error);
      // El enlace es de un solo uso: si ya se usó, el servidor devuelve
      // token_invalid igual que si nunca existió, y el mensaje es el mismo.
      if (code === 'token_expired') {
        setErrorMessage('El enlace ha caducado. Pide uno nuevo desde la app.');
      } else if (code === 'token_invalid') {
        setErrorMessage('Este enlace ya no es válido. Pide uno nuevo desde la app.');
      } else if (code === 'weak_password') {
        setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      } else {
        setErrorMessage('No hemos podido cambiar tu contraseña. Inténtalo más tarde.');
      }
    }
  });

  if (!token) {
    return (
      <FormHead
        title="Enlace no válido"
        description="Falta el código del enlace. Ábrelo desde el correo que te enviamos."
      />
    );
  }

  if (done) {
    return (
      <>
        <FormHead
          title="Contraseña actualizada"
          description="Ya puedes iniciar sesión en la app con tu contraseña nueva."
        />
        <Button fullWidth size="large" variant="contained" href="eurocharger://login">
          Abrir la app
        </Button>
      </>
    );
  }

  return (
    <>
      <FormHead
        title="Elige una contraseña nueva"
        description="Al cambiarla se cerrarán las demás sesiones que tengas abiertas."
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text
            name="password"
            label="Contraseña nueva"
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
            label="Repite la contraseña"
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
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
          >
            Guardar contraseña
          </LoadingButton>
        </Box>
      </Form>
    </>
  );
}
