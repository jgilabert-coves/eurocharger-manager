import { z as zod } from 'zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';

import { patch, fetcher, endpoints } from 'src/lib/axios';

import { Form, Field } from 'src/components/hook-form';
import { useNotification } from 'src/components/notification';

// ----------------------------------------------------------------------

type Country = { id: number; name: string; code_2: string };

type AccountFiscalData = {
  id: number;
  name: string;
  cif: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  stateProvinceId: number | null;
  countryId: number | null;
};

const FiscalSchema = zod.object({
  name: zod.string().min(1, { message: 'La razón social es obligatoria' }),
  cif: zod.string(),
  address: zod.string(),
  city: zod.string(),
  postalCode: zod.string(),
  countryId: zod.number(),
});

type FiscalSchemaType = zod.infer<typeof FiscalSchema>;

// ----------------------------------------------------------------------

/**
 * Datos fiscales de la cuenta.
 *
 * Son los que salen en las facturas de la suscripción, así que hasta ahora solo
 * se podían fijar en el alta: cualquier corrección posterior pasaba por soporte.
 */
export function FiscalDataCard() {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useNotification();

  const { data: res, isLoading } = useQuery<{ data: AccountFiscalData }>({
    queryKey: ['billing-account'],
    queryFn: () => fetcher(endpoints.billing.account),
  });

  const { data: countriesRes } = useQuery<{ data: Country[] }>({
    queryKey: ['countries'],
    queryFn: () => fetcher(endpoints.countries),
    staleTime: 60 * 60 * 1000,
  });

  const countries = countriesRes?.data ?? [];
  const account = res?.data;

  const methods = useForm<FiscalSchemaType>({
    resolver: zodResolver(FiscalSchema),
    defaultValues: { name: '', cif: '', address: '', city: '', postalCode: '', countryId: 0 },
  });

  const {
    reset,
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  // Los valores llegan después del primer render, así que el formulario se
  // rellena cuando responde la consulta.
  useEffect(() => {
    if (!account) return;
    reset({
      name: account.name ?? '',
      cif: account.cif ?? '',
      address: account.address ?? '',
      city: account.city ?? '',
      postalCode: account.postalCode ?? '',
      countryId: account.countryId ?? 0,
    });
  }, [account, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await patch(endpoints.billing.account, {
        name: data.name,
        cif: data.cif || null,
        address: data.address || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        countryId: data.countryId || null,
      });
      notifySuccess('Datos de facturación actualizados');
      queryClient.invalidateQueries({ queryKey: ['billing-account'] });
      reset(data);
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      notifyError(message ?? 'No se pudieron guardar los datos.');
    }
  });

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Datos de facturación
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Son los datos que aparecen en las facturas de tu suscripción. Los cambios no afectan a las
        facturas ya emitidas.
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={3}>
            <Field.Text name="name" label="Razón social" />

            <Box sx={{ gap: 3, display: 'grid', gridTemplateColumns: { sm: '1fr 1fr' } }}>
              <Field.Text name="cif" label="CIF / NIF" />
              <Field.Text name="postalCode" label="Código postal" />
            </Box>

            <Field.Text name="address" label="Dirección" />

            <Box sx={{ gap: 3, display: 'grid', gridTemplateColumns: { sm: '1fr 1fr' } }}>
              <Field.Text name="city" label="Ciudad" />

              <Controller
                name="countryId"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel shrink>País</InputLabel>
                    <Select
                      {...field}
                      label="País"
                      displayEmpty
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      <MenuItem value="" disabled>
                        Selecciona un país
                      </MenuItem>
                      {countries.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {!!fieldState.error && (
                      <FormHelperText>{fieldState.error.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <LoadingButton
                type="submit"
                variant="contained"
                loading={isSubmitting}
                disabled={!isDirty}
              >
                Guardar cambios
              </LoadingButton>
            </Box>
          </Stack>
        </Form>
      )}
    </Card>
  );
}
