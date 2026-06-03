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
  base: 'Base',
  chargers: 'Cargadores',
  sim: 'SIM',
  call_center: 'Call Center',
  guests: 'Invitados',
};

interface FormState {
  name: string;
  isDefault: boolean;
  trialDays: string;
  maxGuests: string;
  base: string;
  chargers: string;
  sim: string;
  call_center: string;
  guests: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  isDefault: false,
  trialDays: '0',
  maxGuests: '',
  base: '',
  chargers: '',
  sim: '',
  call_center: '',
  guests: '',
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

  const handlePriceChange = (item: ItemKey, value: string) => {
    setForm((f) => ({ ...f, [item]: value }));
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
        (k) => form[k] !== ''
      );

      if (hasItems) {
        body.items = {} as CreatePlanBody['items'];
        (['base', 'chargers', 'sim', 'call_center', 'guests'] as ItemKey[]).forEach((k) => {
          const monthly = eurosToCents(form[k]);
          if (monthly != null) {
            (body.items as any)[k] = { monthlyPriceCents: monthly };
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
                <TextField
                  key={item}
                  label={ITEM_LABELS[item]}
                  size="small"
                  fullWidth
                  value={form[item]}
                  onChange={(e) => handlePriceChange(item, e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">€/mes</InputAdornment>,
                    },
                  }}
                />
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
