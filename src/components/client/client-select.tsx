import type { Client, CreateClientPayload } from 'src/types/clients';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { COUNTRIES } from 'src/assets/data/countries';
import { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';


const DEFAULT_FORM: CreateClientPayload = {
  name: '',
  email: null,
  cif: null,
  address: null,
  city: null,
  postalCode: null,
  stateProvinceId: null,
  countryId: null,
  phone: null,
};

export type ClientSelectProps = {
  value: Client | null;
  onChange: (client: Client) => void;
};

export function ClientSelect({ value, onChange }: ClientSelectProps) {
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<CreateClientPayload>(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'search') return () => {};
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetcher([
          endpoints.clients.list,
          { params: { page: 0, pageSize: 20, searchQuery: search } },
        ]);
        if (!cancelled) setClients(res?.data ?? []);
      } catch {
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, search]);

  const set = (field: keyof CreateClientPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const canCreate =
    form.name.trim() !== ''

  const handleCreate = async () => {
    try {
      setCreating(true);
      setCreateError(null);
      const res = await post(endpoints.clients.create, form);
      const newClient: Client = res?.data ?? res;
      onChange(newClient);
      setMode('search');
      setForm(DEFAULT_FORM);
    } catch {
      setCreateError('Error al crear el cliente. Inténtalo de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  if (mode === 'create') {
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">Nuevo cliente</Typography>
              <Button
                size="small"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
                onClick={() => {
                  setMode('search');
                  setForm(DEFAULT_FORM);
                  setCreateError(null);
                }}
              >
                Volver
              </Button>
            </Stack>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Nombre completo o Razón social"
                required
                size="small"
                fullWidth
                value={form.name}
                onChange={set('name')}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Email"
                size="small"
                fullWidth
                type="email"
                value={form.email}
                onChange={set('email')}
              />
              <TextField
                label="CIF / NIF"
                size="small"
                fullWidth
                value={form.cif}
                onChange={set('cif')}
              />
            </Stack>

            <TextField
              label="Dirección"
              size="small"
              fullWidth
              value={form.address}
              onChange={set('address')}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Ciudad"
                size="small"
                fullWidth
                value={form.city}
                onChange={set('city')}
              />
              <TextField
                label="Código postal"
                size="small"
                sx={{ width: { sm: 160 } }}
                value={form.postalCode}
                onChange={set('postalCode')}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="País"
                size="small"
                fullWidth
                value={form.countryId}
                onChange={set('countryId')}
              >
                {COUNTRIES.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Provincia"
                size="small"
                fullWidth
                value={form.stateProvinceId}
                onChange={set('stateProvinceId')}
                disabled={form.countryId !== 64}
              >
                {COUNTRIES.find((c) => c.id === form.countryId)?.state_provinces.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Teléfono"
              size="small"
              fullWidth
              value={form.phone}
              onChange={set('phone')}
            />

            {createError && (
              <Typography variant="caption" color="error">
                {createError}
              </Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                disabled={!canCreate || creating}
                onClick={handleCreate}
                startIcon={
                  creating ? (
                    <Box component={CircularProgress} size={16} color="inherit" />
                  ) : undefined
                }
              >
                Crear cliente
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <TextField
          label="Buscar cliente"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nombre del cliente..."
          slotProps={{
            input: {
              startAdornment: (
                <Box component="span" sx={{ mr: 1, color: 'text.disabled', display: 'flex' }}>
                  <Iconify icon="eva:search-fill" width={18} />
                </Box>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<Iconify icon="mdi:plus" width={16} />}
          onClick={() => setMode('create')}
          sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Nuevo cliente
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Stack spacing={0.5} sx={{ maxHeight: 240, overflowY: 'auto' }}>
          {clients.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 2, textAlign: 'center' }}
            >
              No se han encontrado clientes
            </Typography>
          ) : (
            clients.map((c) => (
              <Box
                key={c.id}
                onClick={() => onChange(c)}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: value?.id === c.id ? 'primary.main' : 'divider',
                  bgcolor: value?.id === c.id ? 'primary.lighter' : 'transparent',
                  '&:hover': {
                    bgcolor: value?.id === c.id ? 'primary.lighter' : 'action.hover',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={600}>
                    {c.business_name}
                  </Typography>
                  {value?.id === c.id && (
                    <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'primary.main' }} />
                  )}
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      )}

    </Stack>
  );
}
