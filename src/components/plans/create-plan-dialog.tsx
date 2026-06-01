import type { CreatePlanBody } from 'src/types/billing';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { post, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

type ItemKey = 'base' | 'chargers' | 'sim' | 'call_center' | 'guests';

const ITEM_LABELS: Record<ItemKey, string> = {
  base:        'Base',
  chargers:    'Cargadores',
  sim:         'SIM',
  call_center: 'Call Center',
  guests:      'Invitados',
};

interface PriceFields {
  monthly: string;
  yearly: string;
}

interface FormState {
  name: string;
  isDefault: boolean;
  trialDays: string;
  maxGuests: string;
  base: PriceFields;
  chargers: PriceFields;
  sim: PriceFields;
  call_center: PriceFields;
  guests: PriceFields;
}

const DEFAULT_FORM: FormState = {
  name: '',
  isDefault: false,
  trialDays: '0',
  maxGuests: '',
  base:        { monthly: '', yearly: '' },
  chargers:    { monthly: '', yearly: '' },
  sim:         { monthly: '', yearly: '' },
  call_center: { monthly: '', yearly: '' },
  guests:      { monthly: '', yearly: '' },
};

function eurosToCents(value: string): number | undefined {
  const parsed = parseFloat(value.replace(',', '.'));
  if (isNaN(parsed)) return undefined;
  return Math.round(parsed * 100);
}

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CreatePlanDialog({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = form.name.trim() !== '';

  const handleClose = () => {
    setForm({ ...DEFAULT_FORM });
    setError(null);
    onClose();
  };

  const handlePriceChange = (item: ItemKey, field: 'monthly' | 'yearly', value: string) => {
    setForm((f) => ({ ...f, [item]: { ...f[item], [field]: value } }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const body: CreatePlanBody = {
        name: form.name.trim(),
        isDefault: form.isDefault,
        trialDays: parseInt(form.trialDays, 10) || 0,
        maxGuests: form.maxGuests !== '' ? parseInt(form.maxGuests, 10) : null,
      };

      const hasItems = (['base', 'chargers', 'sim', 'call_center', 'guests'] as ItemKey[]).some(
        (k) => form[k].monthly !== ''
      );

      if (hasItems) {
        body.items = {} as CreatePlanBody['items'];
        (['base', 'chargers', 'sim', 'call_center', 'guests'] as ItemKey[]).forEach((k) => {
          const monthly = eurosToCents(form[k].monthly);
          const yearly = eurosToCents(form[k].yearly);
          if (monthly != null) {
            (body.items as any)[k] = {
              monthlyPriceCents: monthly,
              ...(yearly != null ? { yearlyPriceCents: yearly } : {}),
            };
          }
        });
      }

      await post(endpoints.plans.create, body);
      handleClose();
      onSuccess?.();
    } catch {
      setError('Error al crear el plan. Comprueba los datos e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>Nuevo plan</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* General */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              General
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                label="Nombre"
                required
                size="small"
                fullWidth
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  label="Días de prueba"
                  size="small"
                  type="number"
                  slotProps={{ htmlInput: { min: 0 } }}
                  value={form.trialDays}
                  onChange={(e) => setForm((f) => ({ ...f, trialDays: e.target.value }))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Máx. invitados"
                  size="small"
                  type="number"
                  slotProps={{ htmlInput: { min: 0 } }}
                  value={form.maxGuests}
                  placeholder="Sin límite"
                  onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
                  sx={{ flex: 1 }}
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={form.isDefault}
                    onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  />
                }
                label="Plan por defecto"
              />
            </Box>
          </Box>

          {/* Prices */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Precios
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(['base', 'chargers', 'sim', 'call_center', 'guests'] as ItemKey[]).map((item) => (
                <Box key={item}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.75, display: 'block' }}
                  >
                    {ITEM_LABELS[item]}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                      label="Mensual"
                      size="small"
                      value={form[item].monthly}
                      onChange={(e) => handlePriceChange(item, 'monthly', e.target.value)}
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position="end">€</InputAdornment>,
                        },
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Anual (opcional)"
                      size="small"
                      value={form[item].yearly}
                      onChange={(e) => handlePriceChange(item, 'yearly', e.target.value)}
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position="end">€</InputAdornment>,
                        },
                      }}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Crear plan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
