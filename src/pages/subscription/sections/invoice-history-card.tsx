import type { Invoice } from 'src/types/billing';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate } from 'src/utils/format-time';
import { formatCents } from 'src/utils/format-number';

import { endpoints } from 'src/lib/axios';
import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';

import { JWT_STORAGE_KEY } from 'src/auth/context/jwt';
import { isPayableInvoiceStatus } from 'src/auth/guard/subscription-status';

import { usePayInvoice } from './use-pay-invoice';
import { UnpaidInvoiceAlert } from './unpaid-invoice-alert';
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL } from './subscription-constants';

// ----------------------------------------------------------------------

type Props = {
  invoices: Invoice[];
  loading: boolean;
};

export function InvoiceHistoryCard({ invoices, loading }: Props) {
  const { notifyError } = useNotification();
  const { payInvoice, payingId } = usePayInvoice();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  // `fetch` a pelo en vez de axios: la respuesta es un PDF binario, no el sobre
  // JSON que devuelven el resto de endpoints.
  const fetchInvoiceBlob = async (invoice: Invoice): Promise<Blob> => {
    const token = localStorage.getItem(JWT_STORAGE_KEY);
    const response = await fetch(`${CONFIG.serverUrl}${endpoints.billing.invoicePdf(invoice.id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error();
    return response.blob();
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      const blob = await fetchInvoiceBlob(invoice);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${invoice.verifactu_code ?? invoice.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notifyError('No se pudo descargar la factura.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewPdf = async (invoice: Invoice) => {
    setViewingId(invoice.id);
    try {
      const blob = await fetchInvoiceBlob(invoice);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Se revoca con retraso para dar tiempo a que la pestaña nueva cargue el blob.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      notifyError('No se pudo abrir la factura.');
    } finally {
      setViewingId(null);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Historial de facturas
      </Typography>

      {!loading && <UnpaidInvoiceAlert invoices={invoices} />}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!loading && invoices.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No hay facturas disponibles.
        </Typography>
      )}

      {!loading && invoices.length > 0 && (
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Código</TableCell>
                <TableCell align="right">Importe</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => {
                const payable = isPayableInvoiceStatus(invoice.status);
                const paying = payingId === invoice.id;

                return (
                  <TableRow
                    key={invoice.id}
                    sx={payable ? { bgcolor: 'error.lighter' } : undefined}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {payable && (
                          <Iconify
                            icon="solar:danger-triangle-bold"
                            width={16}
                            sx={{ color: 'error.main' }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          sx={payable ? { color: 'error.main', fontWeight: 600 } : undefined}
                        >
                          {fDate(invoice.created_at)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Chip
                          label={INVOICE_STATUS_LABEL[invoice.status]}
                          color={INVOICE_STATUS_COLOR[invoice.status]}
                          size="small"
                        />
                        {payable && invoice.attempt_count > 0 && (
                          <Typography variant="caption" color="error.main">
                            {invoice.attempt_count}{' '}
                            {invoice.attempt_count === 1 ? 'intento' : 'intentos'}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {invoice.verifactu_code ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {invoice.tax_cents > 0 ? (
                        <Stack alignItems="flex-end" spacing={0}>
                          <Typography variant="caption" color="text.secondary">
                            Base: {formatCents(invoice.subtotal_cents)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            IVA 21%: {formatCents(invoice.tax_cents)}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCents(invoice.total_cents)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" fontWeight={600}>
                          {formatCents(invoice.total_cents)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" justifyContent="center" alignItems="center">
                        {payable && (
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            disabled={!!payingId}
                            onClick={() => payInvoice(invoice)}
                            sx={{ mr: 1, whiteSpace: 'nowrap' }}
                          >
                            {paying ? 'Pagando…' : 'Pagar'}
                          </Button>
                        )}
                        <Tooltip title="Ver en nueva pestaña">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleViewPdf(invoice)}
                              disabled={viewingId === invoice.id || downloadingId === invoice.id}
                            >
                              {viewingId === invoice.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <Iconify icon="solar:eye-bold" width={18} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Descargar">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadPdf(invoice)}
                              disabled={downloadingId === invoice.id || viewingId === invoice.id}
                            >
                              {downloadingId === invoice.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <Iconify icon="solar:download-minimalistic-bold" width={18} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}
