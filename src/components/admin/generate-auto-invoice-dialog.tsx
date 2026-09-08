import type { AccountOption } from 'src/components/account/account-search-select';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { formatEuros } from 'src/utils/format-number';

import { post, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';
import { AccountSearchSelect } from 'src/components/account/account-search-select';

// ----------------------------------------------------------------------

type Overlap = {
  id: number;
  invoice_number: string;
  from: string;
  to: string;
  period_key: string | null;
};

type PreviewData = {
  account_id: number;
  business_name: string;
  recharges: number;
  tax_base: number;
  tax_amount: number;
  total: number;
  overlaps: Overlap[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onGenerated: () => void;
};

/**
 * Popup para generar una autofactura manual: elige operador y un rango de fechas
 * libres, previsualiza el importe y los solapes, y persiste sin enviar email
 * (el operador la recibe cuando un humano la autoriza).
 */
export function GenerateAutoInvoiceDialog({ open, onClose, onGenerated }: Props) {
  const { notifySuccess, notifyError } = useNotification();

  const [account, setAccount] = useState<AccountOption | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const rangeValid = Boolean(startDate && endDate && startDate <= endDate);
  const canPreview = Boolean(account && rangeValid);

  useEffect(() => {
    if (!canPreview) {
      setPreview(null);
      setPreviewError(null);
      return undefined;
    }
    let cancelled = false;
    setPreviewing(true);
    setPreviewError(null);
    (async () => {
      try {
        const res = await post(endpoints.adminClientInvoices.preview, {
          account_id: account!.id,
          start_date: startDate,
          end_date: endDate,
        });
        if (!cancelled) setPreview(res?.data ?? null);
      } catch (error: any) {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(error?.response?.data?.error ?? 'No se pudo calcular el importe.');
        }
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canPreview, account, startDate, endDate]);

  const handleClose = () => {
    setAccount(null);
    setStartDate('');
    setEndDate('');
    setPreview(null);
    setPreviewError(null);
    onClose();
  };

  const handleGenerate = async () => {
    if (!account || !startDate || !endDate) return;
    setGenerating(true);
    try {
      const res = await post(endpoints.adminClientInvoices.generate, {
        account_id: account.id,
        start_date: startDate,
        end_date: endDate,
      });
      const invoice = res?.data;
      const statusLabel =
        invoice?.payout_status === 'blocked'
          ? 'bloqueada (el operador no tiene cuenta de cobro operativa)'
          : 'pendiente de autorizar';
      notifySuccess(
        invoice?.invoice_number
          ? `Factura ${invoice.invoice_number} generada (${statusLabel}). Se enviará al aprobar.`
          : 'Autofactura generada'
      );
      handleClose();
      onGenerated();
    } catch (error: any) {
      notifyError(error?.response?.data?.error ?? 'No se pudo generar la autofactura.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onClose={generating ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generar autofactura</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <AccountSearchSelect
            value={account}
            onChange={setAccount}
            label="Operador"
            helperText="Busca por nombre o id de la cuenta"
          />

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              type="date"
              label="Desde"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              type="date"
              label="Hasta"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          {startDate && endDate && startDate > endDate && (
            <Alert severity="error">
              Rango no válido: la fecha inicial es posterior a la final.
            </Alert>
          )}

          {previewing && (
            <Alert severity="info" icon={<CircularProgress size={14} />}>
              Calculando el importe…
            </Alert>
          )}

          {previewError && !previewing && <Alert severity="error">{previewError}</Alert>}

          {preview && !previewing && (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {preview.business_name} · {startDate} – {endDate}
              </Typography>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Recargas
                </Typography>
                <Typography variant="body2">{preview.recharges}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Base imponible
                </Typography>
                <Typography variant="body2">{formatEuros(preview.tax_base)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  IVA (21%)
                </Typography>
                <Typography variant="body2">{formatEuros(preview.tax_amount)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle2">Total</Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  {formatEuros(preview.total)}
                </Typography>
              </Stack>

              {preview.overlaps.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  El rango solapa con {preview.overlaps.length} factura(s) ya existente(s):
                  <Box component="ul" sx={{ m: 0.5, pl: 2 }}>
                    {preview.overlaps.map((o) => (
                      <li key={o.id}>
                        #{o.id} ({o.from} – {o.to})
                      </li>
                    ))}
                  </Box>
                  Revisa antes de generar para no facturar dos veces el mismo consumo.
                </Alert>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={generating}>
          Cancelar
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleGenerate}
          loading={generating}
          disabled={!canPreview || previewing}
        >
          Generar factura
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
