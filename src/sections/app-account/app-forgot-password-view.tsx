import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import LoadingButton from '@mui/lab/LoadingButton';

import { requestPasswordReset } from 'src/lib/axios-app';

import { Form, Field } from 'src/components/hook-form';

import { FormHead } from 'src/auth/components/form-head';

// ----------------------------------------------------------------------

const ForgotSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: 'El correo es obligatorio' })
    .email({ message: 'El correo no tiene un formato válido' }),
});

type ForgotSchemaType = zod.infer<typeof ForgotSchema>;

// ----------------------------------------------------------------------

/** Pide el enlace de recuperación para un CONDUCTOR. */
export function AppForgotPasswordView() {
  const [sent, setSent] = useState(false);

  const methods = useForm<ForgotSchemaType>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { email: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await requestPasswordReset(data.email);
    } catch {
      // El servidor responde 202 exista o no la cuenta, para no permitir
      // averiguar qué correos están registrados. Un fallo de red tampoco debe
      // revelarlo, así que el mensaje es el mismo pase lo que pase.
    } finally {
      setSent(true);
    }
  });

  if (sent) {
    return (
      <>
        <FormHead
          title="Revisa tu correo"
          description="Si ese correo tiene una cuenta, te hemos enviado un enlace para elegir una contraseña nueva."
        />
        <Alert severity="info">El enlace caduca en una hora y solo se puede usar una vez.</Alert>
      </>
    );
  }

  return (
    <>
      <FormHead
        title="¿Has olvidado tu contraseña?"
        description="Escribe tu correo y te enviaremos un enlace para elegir una nueva."
      />

      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text
            name="email"
            label="Correo electrónico"
            placeholder="tu@email.com"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <LoadingButton
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
          >
            Enviar enlace
          </LoadingButton>
        </Box>
      </Form>
    </>
  );
}
