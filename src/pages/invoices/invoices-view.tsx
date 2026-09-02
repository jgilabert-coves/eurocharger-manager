import type { PayoutStatus, ClientInvoiceModel } from 'src/types/invoice';

import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { formatEuros } from 'src/utils/format-number';

import { CONFIG } from 'src/global-config';
import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';

import { JWT_STORAGE_KEY } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

const metadata = { title: `Facturas | ${CONFIG.appName}` };

type DateFilter = '3m' | '6m' | 'year';

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: 'year', label: 'Este año' },
];

type ClientInvoicesResponse = { data: ClientInvoiceModel[]; total: number };

/**
 * Etiqueta y color de cada estado de pago.
 * `legacy` son las autofacturas anteriores al sistema de pagos: se liquidaron
 * por transferencia manual y quedan fuera del flujo, así que no se pintan como
 * "pagadas" (no existe ningún transfer de Stripe detrás).
 */
const PAYOUT_STATUS_META: Record<
  PayoutStatus,
  { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }
> = {
  legacy: { label: 'Liquidada (manual)', color: 'default' },
  pending_review: { label: 'Pendiente de autorizar', color: 'info' },
  blocked: { label: 'Sin cuenta de cobro', color: 'warning' },
  approved: { label: 'Autorizada', color: 'info' },
  paying: { label: 'Transfiriendo', color: 'info' },
  paid: { label: 'Pagada', color: 'success' },
  failed: { label: 'Transferencia fallida', color: 'error' },
  reversed: { label: 'Revertida', color: 'error' },
  canceled: { label: 'Anulada', color: 'default' },
};

/** Estados en los que el dinero todavía no ha salido. */
const OUTSTANDING_STATUSES: PayoutStatus[] = [
  'pending_review',
  'blocked',
  'approved',
  'paying',
  'failed',
];

// ----------------------------------------------------------------------

function formatPeriodLabel(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const dayS = s.getDate();
  const dayE = e.getDate();
  const monthS = s.toLocaleDateString('es-ES', { month: 'short' });
  const monthE = e.toLocaleDateString('es-ES', { month: 'short' });

  if (sameYear) {
    return `${dayS} ${monthS} – ${dayE} ${monthE} ${e.getFullYear()}`;
  }
  return `${dayS} ${monthS} ${s.getFullYear()} – ${dayE} ${monthE} ${e.getFullYear()}`;
}

function getPeriodType(
  start: string,
  end: string
): { label: string; color: 'success' | 'info' | 'warning' } {
  const s = new Date(start);
  const e = new Date(end);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (months <= 1) return { label: 'Mensual', color: 'success' };
  if (months <= 3) return { label: 'Trimestral', color: 'info' };
  return { label: 'Anual', color: 'warning' };
}

/** Fecha `from` (YYYY-MM-DD) que corresponde a cada filtro. */
function filterToFromDate(filter: DateFilter): string {
  const now = new Date();
  const cutoff =
    filter === 'year'
      ? new Date(now.getFullYear(), 0, 1)
      : new Date(now.getFullYear(), now.getMonth() - (filter === '3m' ? 3 : 6), 1);
  return cutoff.toISOString().slice(0, 10);
}

function centsToEuros(cents: number | null): number {
  return (cents ?? 0) / 100;
}

// ----------------------------------------------------------------------

type KpiCardProps = { icon: string; label: string; value: string; hint?: string };

function KpiCard({ icon, label, value, hint }: KpiCardProps) {
  return (
    <Card variant="outlined" sx={{ flex: 1, p: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            bgcolor: 'background.neutral',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={22} sx={{ color: 'text.secondary' }} />
        </Box>
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.07em',
              fontSize: '0.65rem',
              display: 'block',
            }}
          >
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
            {value}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export default function InvoicesView() {
  const { notifyError } = useNotification();
  const [dateFilter, setDateFilter] = useState<DateFilter>('year');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const from = filterToFromDate(dateFilter);

  const { data: res, isLoading, isError } = useQuery<ClientInvoicesResponse>({
    queryKey: ['client-invoices', { from }],
    queryFn: () => fetcher([endpoints.clientInvoices.list, { params: { from, page_size: 100 } }]),
  });

  const invoices = useMemo(() => res?.data ?? [], [res?.data]);

  const kpis = useMemo(() => {
    const facturado = invoices.reduce((acc, inv) => acc + Number(inv.total ?? 0), 0);
    const pendiente = invoices
      .filter((inv) => OUTSTANDING_STATUSES.includes(inv.payout_status))
      .reduce((acc, inv) => acc + centsToEuros(inv.payable_amount_cents), 0);
    return { count: invoices.length, facturado, pendiente };
  }, [invoices]);

  const sinCuentaDeCobro = invoices.some((inv) => inv.payout_status === 'blocked');

  const handleDownloadPdf = async (invoice: ClientInvoiceModel) => {
    setDownloadingId(invoice.id);
    try {
      const token = localStorage.getItem(JWT_STORAGE_KEY);
      const response = await fetch(
        `${CONFIG.serverUrl}${endpoints.clientInvoices.pdf(invoice.id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autofactura-${invoice.client_code}${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notifyError('No se pudo descargar el PDF de la autofactura.');
    } finally {
      setDownloadingId(null);
    }
  };

  const renderList = () => {
    if (isLoading) {
      return (
        <Stack spacing={1}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={78} />
          ))}
        </Stack>
      );
    }

    if (isError) {
      return <Alert severity="error">No se pudieron cargar las autofacturas.</Alert>;
    }

    if (invoices.length === 0) {
      return (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay facturas en este período.</Typography>
        </Card>
      );
    }

    return (
      <Stack spacing={1}>
        {invoices.map((inv) => {
          const period = getPeriodType(inv.start_date, inv.end_date);
          const status = PAYOUT_STATUS_META[inv.payout_status];
          return (
            <Card key={inv.id} variant="outlined">
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                spacing={1.5}
                sx={{ px: 3, py: 2 }}
              >
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="subtitle2" fontWeight={700}>
                      {inv.period_key ?? formatPeriodLabel(inv.start_date, inv.end_date)}
                    </Typography>
                    <Chip
                      label={period.label}
                      size="small"
                      color={period.color}
                      variant="soft"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                    />
                    <Chip
                      label={status.label}
                      size="small"
                      color={status.color}
                      variant="soft"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {inv.client_code}
                    {inv.invoice_number} · {inv.business_name}
                    {inv.period_key
                      ? ` · ${formatPeriodLabel(inv.start_date, inv.end_date)}`
                      : ''}
                  </Typography>
                  {inv.payout_status === 'blocked' && inv.block_reason && (
                    <Typography variant="caption" color="warning.main">
                      {inv.block_reason}
                    </Typography>
                  )}
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Stack alignItems="flex-end" spacing={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      A liquidar
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {formatEuros(
                        inv.payable_amount_cents !== null
                          ? centsToEuros(inv.payable_amount_cents)
                          : Number(inv.total ?? 0)
                      )}
                    </Typography>
                  </Stack>
                  <Tooltip title="Descargar PDF">
                    <IconButton
                      size="small"
                      onClick={() => handleDownloadPdf(inv)}
                      disabled={downloadingId === inv.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                      }}
                    >
                      {downloadingId === inv.id ? (
                        <CircularProgress size={14} />
                      ) : (
                        <Iconify icon="solar:download-minimalistic-bold" width={15} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    );
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Autofacturas</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Liquidación de lo recaudado en tus cargadores
            </Typography>
          </Box>

          {sinCuentaDeCobro && (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  component={RouterLink}
                  href={paths.payouts.root}
                >
                  Registrar
                </Button>
              }
            >
              Tienes autofacturas sin cuenta de cobro asociada. Registra tu cuenta bancaria para
              poder recibir la liquidación.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <KpiCard
              icon="solar:document-bold"
              label="Total Facturas"
              value={isLoading ? '—' : String(kpis.count)}
            />
            <KpiCard
              icon="solar:chart-2-bold"
              label="Total Facturado"
              value={isLoading ? '—' : formatEuros(kpis.facturado)}
            />
            <KpiCard
              icon="solar:card-bold"
              label="Pendiente de cobro"
              value={isLoading ? '—' : formatEuros(kpis.pendiente)}
              hint="Importe autorizado aún no transferido"
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Iconify
              icon="solar:calendar-bold"
              width={18}
              sx={{ color: 'text.disabled', mr: 0.5 }}
            />
            {DATE_FILTER_OPTIONS.map(({ value, label }) => (
              <Button
                key={value}
                size="small"
                variant={dateFilter === value ? 'outlined' : 'text'}
                color={dateFilter === value ? 'primary' : 'inherit'}
                onClick={() => setDateFilter(value)}
                sx={{
                  borderRadius: 5,
                  fontWeight: dateFilter === value ? 700 : 400,
                  color: dateFilter === value ? 'primary.main' : 'text.secondary',
                }}
              >
                {label}
              </Button>
            ))}
          </Stack>

          {renderList()}
        </Stack>
      </DashboardContent>
    </>
  );
}
