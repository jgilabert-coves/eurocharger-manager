import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { post, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { useNotification } from 'src/components/notification';

// ----------------------------------------------------------------------

const PasswordSchema = zod
  .object({
    currentPassword: zod.string().min(1, { message: 'Escribe tu contraseña actual' }),
    newPassword: zod.string().min(8, { message: 'Mínimo 8 caracteres' }),
    confirmPassword: zod.string().min(1, { message: 'Repite la nueva contraseña' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type PasswordSchemaType = zod.infer<typeof PasswordSchema>;

// ----------------------------------------------------------------------

export function ChangePasswordCard() {
  const showCurrent = useBoolean();
  const showNew = useBoolean();
  const { notifySuccess, notifyError } = useNotification();

  const methods = useForm<PasswordSchemaType>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await post(endpoints.auth.changeOwnPassword, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      notifySuccess('Contraseña actualizada');
      reset();
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      notifyError(message ?? 'No se pudo cambiar la contraseña.');
    }
  });

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Seguridad
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Cambia tu contraseña de acceso al panel.
      </Typography>

      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Field.Text
            name="currentPassword"
            label="Contraseña actual"
            type={showCurrent.value ? 'text' : 'password'}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={showCurrent.onToggle} edge="end">
                      <Iconify
                        icon={showCurrent.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ gap: 3, display: 'grid', gridTemplateColumns: { sm: '1fr 1fr' } }}>
            <Field.Text
              name="newPassword"
              label="Nueva contraseña"
              type={showNew.value ? 'text' : 'password'}
              helperText="Mínimo 8 caracteres"
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={showNew.onToggle} edge="end">
                        <Iconify
                          icon={showNew.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Field.Text
              name="confirmPassword"
              label="Repite la nueva contraseña"
              type={showNew.value ? 'text' : 'password'}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              Cambiar contraseña
            </LoadingButton>
          </Box>
        </Stack>
      </Form>
    </Card>
  );
}
