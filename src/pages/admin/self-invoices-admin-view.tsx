import type { PayoutStatus, ClientInvoiceModel } from 'src/types/invoice';

import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { useDebounce } from 'src/hooks/use-debounce';

import { formatEuros } from 'src/utils/format-number';

import { CONFIG } from 'src/global-config';
import { post, fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/confirm-dialog';
import { useNotification } from 'src/components/notification';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

const metadata = { title: `Liquidaciones | ${CONFIG.appName}` };

const PAGE_SIZE = 25;

type StatusCount = { invoices: number; amount_cents: number };

type SummaryResponse = {
  data: {
    by_status: Record<PayoutStatus, StatusCount>;
    pending_approval_cents: number;
    platform_balance: { available: number; pending: number } | null;
    transfers_enabled: boolean;
  };
};

type ListResponse = { data: ClientInvoiceModel[]; total: number };

const STATUS_META: Record<PayoutStatus, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  legacy: { label: 'Liquidada (manual)', color: 'default' },
  pending_review: { label: 'Pendiente de autorizar', color: 'info' },
  blocked: { label: 'Bloqueada', color: 'warning' },
  approved: { label: 'Autorizada', color: 'info' },
  paying: { label: 'Transfiriendo', color: 'info' },
  paid: { label: 'Pagada', color: 'success' },
  failed: { label: 'Fallida', color: 'error' },
  reversed: { label: 'Revertida', color: 'error' },
  canceled: { label: 'Anulada', color: 'default' },
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  ...(Object.keys(STATUS_META) as PayoutStatus[]).map((status) => ({
    value: status,
    label: STATUS_META[status].label,
  })),
];

/**
 * Periodos que existen de verdad, del más reciente al más antiguo: los meses
 * cerrados desde el corte de periodicidad, y trimestres antes de eso.
 *
 * Duplica a propósito la fecha del corte que vive en el backend
 * (`MONTHLY_PERIODS_FROM` en period.utils.ts). Si allí cambia, aquí también.
 */
const MONTHLY_PERIODS_FROM_YEAR = 2026;
const MONTHLY_PERIODS_FROM_MONTH = 10; // octubre de 2026, en base 1

function recentPeriods(): string[] {
  const now = new Date();
  const periods: string[] = [];

  // Meses cerrados, del anterior a hoy hacia atrás, hasta el corte.
  let year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  let month = now.getMonth() === 0 ? 12 : now.getMonth(); // base 1
  while (
    year > MONTHLY_PERIODS_FROM_YEAR ||
    (year === MONTHLY_PERIODS_FROM_YEAR && month >= MONTHLY_PERIODS_FROM_MONTH)
  ) {
    periods.push(`${year}-${String(month).padStart(2, '0')}`);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  // Trimestres anteriores al corte, hasta completar 12 entradas.
  let qYear = MONTHLY_PERIODS_FROM_YEAR;
  let quarter = Math.floor((MONTHLY_PERIODS_FROM_MONTH - 1) / 3); // el cerrado antes del corte
  while (periods.length < 12) {
    if (quarter === 0) {
      quarter = 4;
      qYear -= 1;
    }
    periods.push(`${qYear}-Q${quarter}`);
    quarter -= 1;
  }

  return periods;
}

const centsToEuros = (cents: number | null | undefined) => (cents ?? 0) / 100;

/**
 * Fuente ÚNICA de verdad de por qué no se puede autorizar una autofactura.
 *
 * Se usa para el `disabled` del botón, para el texto del Tooltip y para el aviso
 * de la fila: si cada uno lo calculara por su cuenta, acabarían discrepando y el
 * revisor vería un botón activo que devuelve 409.
 *
 * El orden importa: primero el permiso, luego el estado, luego Connect, luego el
 * importe. Es el mismo orden en el que el backend rechaza.
 */
export function getApproveBlockReason(
  invoice: ClientInvoiceModel,
  canApprove: boolean
): string | null {
  if (!canApprove) return 'No tienes permiso para autorizar pagos';
  if (invoice.payout_status !== 'pending_review') {
    return `Solo se autorizan las pendientes de autorizar (está en "${STATUS_META[invoice.payout_status].label}")`;
  }
  if (!invoice.connect_payouts_enabled) return 'El operador no tiene una cuenta de cobro operativa';
  if (centsToEuros(invoice.payable_amount_cents) <= 0) return 'El importe a transferir no es positivo';
  return null;
}

/** Avisos que el revisor debe ver de un vistazo. */
function warningsOf(invoice: ClientInvoiceModel): { label: string; color: 'warning' | 'error' }[] {
  const warnings: { label: string; color: 'warning' | 'error' }[] = [];
  if (!invoice.connect_payouts_enabled && invoice.payout_status !== 'legacy') {
    warnings.push({ label: 'Sin cuenta de cobro', color: 'warning' });
  }
  const amount = centsToEuros(invoice.payable_amount_cents);
  if (amount === 0) warnings.push({ label: 'Importe 0', color: 'warning' });
  if (amount < 0) warnings.push({ label: 'Importe negativo', color: 'error' });
  if (invoice.payout_attempts > 0) {
    warnings.push({ label: `Reintento ${invoice.payout_attempts}`, color: 'warning' });
  }
  if (invoice.emailed_at === null && invoice.payout_status === 'paid') {
    warnings.push({ label: 'Sin enviar al operador', color: 'warning' });
  }
  return warnings;
}

// ----------------------------------------------------------------------

type DialogState =
  | { kind: 'approve'; invoice: ClientInvoiceModel }
  | { kind: 'cancel'; invoice: ClientInvoiceModel }
  | null;

export default function SelfInvoicesAdminView() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { notifySuccess, notifyError } = useNotification();

  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const periodKey = searchParams.get('period_key') ?? '';
  const search = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page') ?? '0');
  const debouncedSearch = useDebounce(search, 400);

  const [dialog, setDialog] = useState<DialogState>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rowBusy, setRowBusy] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ el: HTMLElement; invoice: ClientInvoiceModel } | null>(null);

  const canApprove = Boolean((user as { can_approve_invoices?: boolean } | null)?.can_approve_invoices);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const { data: summaryRes } = useQuery<SummaryResponse>({
    queryKey: ['admin-client-invoices', 'summary'],
    queryFn: () => fetcher(endpoints.adminClientInvoices.summary),
  });
  const summary = summaryRes?.data;

  const { data: listRes, isLoading } = useQuery<ListResponse>({
    queryKey: ['admin-client-invoices', { status, periodKey, debouncedSearch, page }],
    queryFn: () =>
      fetcher([
        endpoints.adminClientInvoices.list,
        {
          params: {
            page: page + 1,
            page_size: PAGE_SIZE,
            ...(status ? { status } : {}),
            ...(periodKey ? { period_key: periodKey } : {}),
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
          },
        },
      ]),
  });

  const invoices = useMemo(() => listRes?.data ?? [], [listRes?.data]);
  const total = listRes?.total ?? 0;

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-client-invoices'] });

  const runAction = async (invoice: ClientInvoiceModel, action: 'retry' | 'resend') => {
    setRowBusy(invoice.id);
    setMenu(null);
    try {
      if (action === 'retry') {
        await post(endpoints.adminClientInvoices.retryPayment(invoice.id), {});
        notifySuccess('Pago reencolado.');
      } else {
        await post(endpoints.adminClientInvoices.resendEmail(invoice.id), {});
        notifySuccess('Autofactura reenviada al operador.');
      }
      await refresh();
    } catch (error: any) {
      notifyError(error?.response?.data?.error ?? 'No se pudo completar la acción.');
    } finally {
      setRowBusy(null);
    }
  };

  const renderHeader = () => (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Card variant="outlined" sx={{ flex: 1, p: 2.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          PENDIENTE DE AUTORIZAR
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          {formatEuros(centsToEuros(summary?.pending_approval_cents))}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {summary?.by_status?.pending_review?.invoices ?? 0} autofactura(s)
        </Typography>
      </Card>

      <Card variant="outlined" sx={{ flex: 1, p: 2.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          SALDO DISPONIBLE EN STRIPE
        </Typography>
        <Typography
          variant="h4"
          fontWeight={700}
          color={
            summary?.platform_balance &&
            summary.platform_balance.available * 100 < (summary?.pending_approval_cents ?? 0)
              ? 'error.main'
              : 'text.primary'
          }
        >
          {summary?.platform_balance ? formatEuros(summary.platform_balance.available) : '—'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {summary?.platform_balance
            ? `${formatEuros(summary.platform_balance.pending)} pendiente de liquidar`
            : 'No disponible'}
        </Typography>
      </Card>

      <Card variant="outlined" sx={{ flex: 1, p: 2.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          YA PAGADAS
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          {summary?.by_status?.paid?.invoices ?? 0}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatEuros(centsToEuros(summary?.by_status?.paid?.amount_cents))}
        </Typography>
      </Card>
    </Stack>
  );

  const renderRow = (invoice: ClientInvoiceModel) => {
    const blockReason = getApproveBlockReason(invoice, canApprove);
    const meta = STATUS_META[invoice.payout_status];
    const warnings = warningsOf(invoice);
    const busy = rowBusy === invoice.id;

    return (
      <TableRow key={invoice.id} hover>
        <TableCell>
          <Typography variant="subtitle2">
            {invoice.account_business_name ?? invoice.business_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {invoice.client_code}
            {invoice.invoice_number}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{invoice.period_key ?? '—'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(invoice.start_date).toLocaleDateString('es-ES')} –{' '}
            {new Date(invoice.end_date).toLocaleDateString('es-ES')}
          </Typography>
        </TableCell>

        <TableCell align="right">
          <Typography variant="subtitle2">
            {formatEuros(centsToEuros(invoice.payable_amount_cents))}
          </Typography>
        </TableCell>

        <TableCell>
          {invoice.connect_bank_last4 ? (
            <Typography variant="body2">
              {invoice.connect_bank_name ?? 'Banco'} •••• {invoice.connect_bank_last4}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.disabled">
              Sin cuenta
            </Typography>
          )}
        </TableCell>

        <TableCell>
          <Chip size="small" variant="soft" color={meta.color} label={meta.label} />
        </TableCell>

        <TableCell>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {warnings.map((warning) => (
              <Chip
                key={warning.label}
                size="small"
                variant="soft"
                color={warning.color}
                label={warning.label}
              />
            ))}
          </Stack>
        </TableCell>

        <TableCell align="right">
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
            {/* El <span> es obligatorio: MUI no dispara Tooltip sobre botones disabled. */}
            <Tooltip title={blockReason ?? 'Autorizar el pago de esta autofactura'}>
              <span>
                <Button
                  size="small"
                  variant="contained"
                  disabled={blockReason !== null || busy}
                  onClick={() => setDialog({ kind: 'approve', invoice })}
                >
                  Autorizar
                </Button>
              </span>
            </Tooltip>
            {busy ? (
              <CircularProgress size={18} />
            ) : (
              <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, invoice })}>
                <Iconify icon="eva:more-vertical-fill" width={16} />
              </IconButton>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Liquidaciones a operadores</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Revisa y autoriza el pago de las autofacturas
            </Typography>
          </Box>

          {summary && !summary.transfers_enabled && (
            <Alert severity="info">
              Las transferencias reales están desactivadas
              (<code>AUTOINVOICE_TRANSFERS_ENABLED</code>). Autorizar registra el intento y la
              auditoría, pero no se mueve dinero.
            </Alert>
          )}

          {!canApprove && (
            <Alert severity="warning">
              Puedes consultar las liquidaciones pero no autorizar pagos. El permiso se concede por
              configuración.
            </Alert>
          )}

          {renderHeader()}

          <Card>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ p: 2.5 }}
              alignItems={{ md: 'center' }}
            >
              <TextField
                size="small"
                label="Buscar operador o número"
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
                sx={{ minWidth: 240 }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  label="Estado"
                  value={status}
                  onChange={(e) => updateParam('status', e.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Periodo</InputLabel>
                <Select
                  label="Periodo"
                  value={periodKey}
                  onChange={(e) => updateParam('period_key', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {recentPeriods().map((period) => (
                    <MenuItem key={period} value={period}>
                      {period}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Operador</TableCell>
                    <TableCell>Periodo</TableCell>
                    <TableCell align="right">A liquidar</TableCell>
                    <TableCell>Destino</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Avisos</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading &&
                    [0, 1, 2].map((i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <Skeleton height={32} />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">
                          No hay autofacturas con estos filtros.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && invoices.map(renderRow)}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              onPageChange={(_, next) => updateParam('page', String(next))}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
          </Card>
        </Stack>
      </DashboardContent>

      <Menu anchorEl={menu?.el ?? null} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => menu && runAction(menu.invoice, 'resend')}
          disabled={!menu || menu.invoice.payout_status === 'legacy'}
        >
          <Iconify icon="solar:letter-bold" width={18} sx={{ mr: 1 }} />
          Reenviar al operador
        </MenuItem>
        <MenuItem
          onClick={() => menu && runAction(menu.invoice, 'retry')}
          disabled={
            !canApprove || !menu || !['failed', 'approved'].includes(menu.invoice.payout_status)
          }
        >
          <Iconify icon="solar:refresh-bold" width={18} sx={{ mr: 1 }} />
          Reintentar el pago
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menu) setDialog({ kind: 'cancel', invoice: menu.invoice });
            setMenu(null);
          }}
          disabled={
            !canApprove ||
            !menu ||
            !['pending_review', 'blocked', 'approved', 'failed'].includes(menu.invoice.payout_status)
          }
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:close-circle-bold" width={18} sx={{ mr: 1 }} />
          Anular
        </MenuItem>
      </Menu>

      {dialog?.kind === 'approve' && (
        <ConfirmDialog
          open
          title="Autorizar el pago"
          confirmLabel="Autorizar"
          confirmColor="primary"
          warning="La transferencia es irreversible. Comprueba el importe y la cuenta de destino."
          successMessage="Autorizado. El pago se ejecutará en segundo plano."
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await post(endpoints.adminClientInvoices.approve(dialog.invoice.id), {});
          }}
          onSuccess={refresh}
        >
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Operador
              </Typography>
              <Typography variant="subtitle2">
                {dialog.invoice.account_business_name ?? dialog.invoice.business_name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Periodo
              </Typography>
              <Typography variant="subtitle2">
                {dialog.invoice.period_key ??
                  `${new Date(dialog.invoice.start_date).toLocaleDateString('es-ES')} – ${new Date(dialog.invoice.end_date).toLocaleDateString('es-ES')}`}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Importe
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {formatEuros(centsToEuros(dialog.invoice.payable_amount_cents))}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Destino
              </Typography>
              <Typography variant="subtitle2">
                {dialog.invoice.connect_bank_last4
                  ? `${dialog.invoice.connect_bank_name ?? 'Banco'} •••• ${dialog.invoice.connect_bank_last4}`
                  : 'Sin cuenta de cobro'}
              </Typography>
            </Box>
          </Stack>
        </ConfirmDialog>
      )}

      {dialog?.kind === 'cancel' && (
        <ConfirmDialog
          open
          title="Anular la autofactura"
          confirmLabel="Anular"
          confirmColor="error"
          warning="Una autofactura anulada no se puede volver a autorizar."
          successMessage="Autofactura anulada."
          onClose={() => {
            setDialog(null);
            setCancelReason('');
          }}
          onConfirm={async () => {
            await post(endpoints.adminClientInvoices.cancel(dialog.invoice.id), {
              reason: cancelReason,
            });
          }}
          onSuccess={() => {
            setCancelReason('');
            refresh();
          }}
        >
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {dialog.invoice.account_business_name ?? dialog.invoice.business_name} ·{' '}
              {formatEuros(centsToEuros(dialog.invoice.payable_amount_cents))}
            </Typography>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Motivo"
              placeholder="Por qué se anula"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              helperText="Queda registrado en la auditoría"
            />
          </Stack>
        </ConfirmDialog>
      )}
    </>
  );
}
