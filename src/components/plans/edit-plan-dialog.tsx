import type { Plan, UpdatePlanBody } from 'src/types/billing';

import { useState, useEffect } from 'react';

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

import { patch, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

type ItemKey = 'base' | 'chargers' | 'sim' | 'guests';

const ITEM_LABELS: Record<ItemKey, string> = {
  base: 'Base',
  chargers: 'Cargadores',
  sim: 'SIM',
  guests: 'Invitados',
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
  guests: PriceFields;
}

function centsToEuros(cents: number | null | undefined): string {
  if (cents == null) return '';
  return (cents / 100).toFixed(2);
}

function eurosToCents(value: string): number | undefined {
  const parsed = parseFloat(value.replace(',', '.'));
  if (isNaN(parsed)) return undefined;
  return Math.round(parsed * 100);
}

function planToForm(plan: Plan): FormState {
  return {
    name: plan.name,
    isDefault: Boolean(plan.isDefault),
    trialDays: String(plan.trialDays),
    maxGuests: plan.maxGuests != null ? String(plan.maxGuests) : '',
    base: {
      monthly: centsToEuros(plan.items.base.monthly?.priceCents),
      yearly: centsToEuros(plan.items.base.annual?.priceCents),
    },
    chargers: {
      monthly: centsToEuros(plan.items.chargers.monthly?.priceCents),
      yearly: centsToEuros(plan.items.chargers.annual?.priceCents),
    },
    sim: {
      monthly: centsToEuros(plan.items.sim.monthly?.priceCents),
      yearly: centsToEuros(plan.items.sim.annual?.priceCents),
    },
    guests: {
      monthly: centsToEuros(plan.items.guests.monthly?.priceCents),
      yearly: centsToEuros(plan.items.guests.annual?.priceCents),
    },
  };
}

// ----------------------------------------------------------------------

type Props = {
  plan: Plan;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function EditPlanDialog({ plan, open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(() => planToForm(plan));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setForm(planToForm(plan));
  }, [plan, open]);

  const canSubmit = form.name.trim() !== '';

  const handleClose = () => {
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

      const body: UpdatePlanBody = {
        name: form.name.trim(),
        isDefault: form.isDefault,
        trialDays: parseInt(form.trialDays, 10) || 0,
        maxGuests: form.maxGuests !== '' ? parseInt(form.maxGuests, 10) : null,
        items: {},
      };

      (['base', 'chargers', 'sim', 'guests'] as ItemKey[]).forEach((k) => {
        const monthly = eurosToCents(form[k].monthly);
        const yearly = eurosToCents(form[k].yearly);
        if (monthly != null || yearly != null) {
          (body.items as any)[k] = {
            ...(monthly != null ? { monthlyPriceCents: monthly } : {}),
            ...(yearly != null ? { yearlyPriceCents: yearly } : {}),
          };
        }
      });

      if (Object.keys(body.items ?? {}).length === 0) {
        delete body.items;
      }

      await patch(endpoints.plans.update(plan.id), body);
      handleClose();
      onSuccess?.();
    } catch {
      setError('Error al actualizar el plan. Comprueba los datos e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>Editar plan: {plan.name}</DialogTitle>

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
            <Divider sx={{ mb: 1 }} />
            <Alert severity="info" sx={{ mb: 2 }}>
              Al modificar un precio, Stripe archiva el anterior y crea uno nuevo. Las
              suscripciones activas mantienen el precio anterior hasta que cambien de plan.
            </Alert>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(['base', 'chargers', 'sim', 'guests'] as ItemKey[]).map((item) => (
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
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
}
