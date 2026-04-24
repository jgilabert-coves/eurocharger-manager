import type { Connector } from 'src/types/connector';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { post, put, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const CONNECTOR_TYPES = [
  { id: 1, label: 'Mennekes (Tipo 2)' },
  { id: 2, label: 'CHAdeMO' },
  { id: 3, label: 'Schuko' },
  { id: 4, label: 'CCS (Combo 2)' },
  { id: 5, label: 'J1772 (Tipo 1)' },
  { id: 6, label: 'Tesla' },
];

type Form = {
  name: string;
  connector_type_id: string;
  power: string;
};

const DEFAULT_FORM: Form = {
  name: '',
  connector_type_id: '',
  power: '',
};

export type ConnectorDialogProps = {
  open: boolean;
  chargepointId: number;
  connector?: Connector | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function ConnectorDialog({
  open,
  chargepointId,
  connector,
  onClose,
  onSuccess,
}: ConnectorDialogProps) {
  const isEdit = connector != null;

  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        connector
          ? {
              name: connector.name ?? '',
              connector_type_id: String(connector.connectorTypeId ?? ''),
              power: connector.power != null ? String(connector.power) : '',
            }
          : DEFAULT_FORM
      );
      setError(null);
    }
  }, [open, connector]);

  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const canSubmit =
    form.connector_type_id !== '' && form.power.trim() !== '' && !isNaN(Number(form.power));

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...(form.name.trim() && { name: form.name.trim() }),
        connector_type_id: Number(form.connector_type_id),
        power: parseFloat(form.power),
      };

      if (isEdit) {
        await put(endpoints.connectors.update(chargepointId, connector.id), payload);
      } else {
        await post(endpoints.connectors.create(chargepointId), payload);
      }

      onSuccess();
      onClose();
    } catch {
      setError('Error al guardar el conector. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEdit ? 'Editar conector' : 'Nuevo conector'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}

          <TextField
            label="Nombre (opcional)"
            size="small"
            fullWidth
            value={form.name}
            onChange={set('name')}
            placeholder="Ej. Conector derecho"
          />

          <TextField
            select
            label="Tipo de conector"
            required
            size="small"
            fullWidth
            value={form.connector_type_id}
            onChange={set('connector_type_id')}
          >
            {CONNECTOR_TYPES.map((t) => (
              <MenuItem key={t.id} value={String(t.id)}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Potencia (kW)"
            required
            size="small"
            fullWidth
            type="number"
            value={form.power}
            onChange={set('power')}
            placeholder="22"
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit || loading}
          onClick={handleSubmit}
          startIcon={loading ? <Box component={CircularProgress} size={14} color="inherit" /> : undefined}
        >
          {isEdit ? 'Guardar' : 'Añadir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
