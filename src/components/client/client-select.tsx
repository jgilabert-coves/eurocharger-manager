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

import { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PROVINCES = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz',
  'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real',
  'Córdoba', 'Cuenca', 'Gerona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva',
  'Huesca', 'Islas Baleares', 'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas', 'León',
  'Lérida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Orense', 'Palencia',
  'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria',
  'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora',
  'Zaragoza', 'Ceuta', 'Melilla',
];

const COUNTRIES = [
  'España', 'Portugal', 'Francia', 'Alemania', 'Italia', 'Reino Unido', 'Países Bajos',
  'Bélgica', 'Suiza', 'Austria', 'Suecia', 'Noruega', 'Dinamarca', 'Finlandia',
  'Polonia', 'República Checa', 'Hungría', 'Rumanía', 'Bulgaria', 'Grecia',
];

// ----------------------------------------------------------------------

const DEFAULT_FORM: CreateClientPayload = {
  nombre: '',
  apellidos: '',
  email: '',
  cif: '',
  direccion: '',
  ciudad: '',
  codigo_postal: '',
  provincia: '',
  pais: 'España',
  telefono: '',
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
    form.nombre.trim() !== '' &&
    form.email.trim() !== '' &&
    form.cif.trim() !== '';

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
                label="Nombre"
                required
                size="small"
                fullWidth
                value={form.nombre}
                onChange={set('nombre')}
              />
              <TextField
                label="Apellidos"
                size="small"
                fullWidth
                value={form.apellidos}
                onChange={set('apellidos')}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Email"
                required
                size="small"
                fullWidth
                type="email"
                value={form.email}
                onChange={set('email')}
              />
              <TextField
                label="CIF / NIF"
                required
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
              value={form.direccion}
              onChange={set('direccion')}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Ciudad"
                size="small"
                fullWidth
                value={form.ciudad}
                onChange={set('ciudad')}
              />
              <TextField
                label="Código postal"
                size="small"
                sx={{ width: { sm: 160 } }}
                value={form.codigo_postal}
                onChange={set('codigo_postal')}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="País"
                size="small"
                fullWidth
                value={form.pais}
                onChange={set('pais')}
              >
                {COUNTRIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Provincia"
                size="small"
                fullWidth
                value={form.provincia}
                onChange={set('provincia')}
                disabled={form.pais !== 'España'}
              >
                {PROVINCES.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Teléfono"
              size="small"
              fullWidth
              value={form.telefono}
              onChange={set('telefono')}
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

      <Button
        variant="outlined"
        startIcon={<Iconify icon="mdi:plus" width={16} />}
        onClick={() => setMode('create')}
      >
        Crear nuevo cliente
      </Button>
    </Stack>
  );
}
