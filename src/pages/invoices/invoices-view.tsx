import type { ClientInvoiceModel } from 'src/types/invoice';

import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { useAbility } from 'src/auth/hooks/use-ability';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

const metadata = { title: `Facturas | ${CONFIG.appName}` };

// ----------------------------------------------------------------------
// Mock data

const MOCK_INVOICES: ClientInvoiceModel[] = [
  {
    id: 1,
    client_id: 22,
    client_code: 'CLI022',
    invoice_number: 'FAC-2026-001',
    business_name: 'Coves Energy, S.L.',
    business_number: 'B12345678',
    tax_id: 'B12345678',
    address: 'Calle Mayor 1',
    state_province_id: 30,
    country_id: 64,
    postal_code: '28001',
    city: 'Madrid',
    issue_date: new Date('2026-01-05'),
    expiration_date: new Date('2026-02-05'),
    start_date: new Date('2025-10-01'),
    end_date: new Date('2025-12-31'),
    tax_base: 2310.0,
    tax_percentage: 21,
    tax_amount: 485.1,
    total: 2795.1,
    created_at: new Date('2026-01-05'),
    updated_at: new Date('2026-01-05'),
  },
  {
    id: 2,
    client_id: 22,
    client_code: 'CLI022',
    invoice_number: 'FAC-2025-003',
    business_name: 'Coves Energy, S.L.',
    business_number: 'B12345678',
    tax_id: 'B12345678',
    address: 'Calle Mayor 1',
    state_province_id: 30,
    country_id: 64,
    postal_code: '28001',
    city: 'Madrid',
    issue_date: new Date('2025-10-03'),
    expiration_date: new Date('2025-11-03'),
    start_date: new Date('2025-07-01'),
    end_date: new Date('2025-09-30'),
    tax_base: 1980.0,
    tax_percentage: 21,
    tax_amount: 415.8,
    total: 2395.8,
    created_at: new Date('2025-10-03'),
    updated_at: new Date('2025-10-03'),
  },
  {
    id: 3,
    client_id: 22,
    client_code: 'CLI022',
    invoice_number: 'FAC-2025-002',
    business_name: 'Coves Energy, S.L.',
    business_number: 'B12345678',
    tax_id: 'B12345678',
    address: 'Calle Mayor 1',
    state_province_id: 30,
    country_id: 64,
    postal_code: '28001',
    city: 'Madrid',
    issue_date: new Date('2025-07-02'),
    expiration_date: new Date('2025-08-02'),
    start_date: new Date('2025-04-01'),
    end_date: new Date('2025-06-30'),
    tax_base: 2140.0,
    tax_percentage: 21,
    tax_amount: 449.4,
    total: 2589.4,
    created_at: new Date('2025-07-02'),
    updated_at: new Date('2025-07-02'),
  },
  {
    id: 4,
    client_id: 22,
    client_code: 'CLI022',
    invoice_number: 'FAC-2025-001',
    business_name: 'Coves Energy, S.L.',
    business_number: 'B12345678',
    tax_id: 'B12345678',
    address: 'Calle Mayor 1',
    state_province_id: 30,
    country_id: 64,
    postal_code: '28001',
    city: 'Madrid',
    issue_date: new Date('2025-04-03'),
    expiration_date: new Date('2025-05-03'),
    start_date: new Date('2025-01-01'),
    end_date: new Date('2025-03-31'),
    tax_base: 1750.0,
    tax_percentage: 21,
    tax_amount: 367.5,
    total: 2117.5,
    created_at: new Date('2025-04-03'),
    updated_at: new Date('2025-04-03'),
  },
];

// Current month accumulation — no invoice generated yet for this period
const CURRENT_MONTH_SUMMARY = {
  transactions: 3,
  ingresos: 1659.14,
  pagado: 1607.02,
};

// ----------------------------------------------------------------------

type DateFilter = '3m' | '6m' | 'year';

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: 'year', label: 'Este año' },
];

// ----------------------------------------------------------------------

function formatEur(amount: number): string {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function formatPeriodLabel(start: Date, end: Date): string {
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

function getPeriodType(start: Date, end: Date): { label: string; color: 'success' | 'info' | 'warning' } {
  const s = new Date(start);
  const e = new Date(end);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (months <= 1) return { label: 'Mensual', color: 'success' };
  if (months <= 3) return { label: 'Trimestral', color: 'info' };
  return { label: 'Anual', color: 'warning' };
}

// ----------------------------------------------------------------------

export default function InvoicesView() {
  const { hasRole } = useAbility();
  const { user } = useAuthContext();
  const isEurocharger = hasRole('Eurocharger');
  const [dateFilter, setDateFilter] = useState<DateFilter>('3m');

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    if (dateFilter === '3m') {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (dateFilter === '6m') {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    } else {
      cutoff = new Date(now.getFullYear(), 0, 1);
    }

    let invoices = MOCK_INVOICES;
    if (!isEurocharger) {
      invoices = invoices.filter((inv) => inv.client_id === user?.client_id);
    }
    return invoices.filter((inv) => new Date(inv.issue_date) >= cutoff);
  }, [isEurocharger, user?.client_id, dateFilter]);

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h3">Autofacturas</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Facturas emitidas a clientes
            </Typography>
          </Box>

          {/* Summary cards — current month accumulation (no invoice yet) */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                  <Iconify icon="solar:document-bold" width={22} sx={{ color: 'text.secondary' }} />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.07em', fontSize: '0.65rem', display: 'block' }}
                  >
                    Total Facturas
                  </Typography>
                  <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
                    {CURRENT_MONTH_SUMMARY.transactions}
                  </Typography>
                </Box>
              </Stack>
            </Card>

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
                  <Iconify icon="solar:chart-2-bold" width={22} sx={{ color: 'text.secondary' }} />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.07em', fontSize: '0.65rem', display: 'block' }}
                  >
                    Total Ingresos
                  </Typography>
                  <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
                    {formatEur(CURRENT_MONTH_SUMMARY.ingresos)}
                  </Typography>
                </Box>
              </Stack>
            </Card>

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
                  <Iconify icon="solar:card-bold" width={22} sx={{ color: 'text.secondary' }} />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.07em', fontSize: '0.65rem', display: 'block' }}
                  >
                    Total Pagado
                  </Typography>
                  <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
                    {formatEur(CURRENT_MONTH_SUMMARY.pagado)}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>

          {/* Date range filters */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Iconify icon="solar:calendar-bold" width={18} sx={{ color: 'text.disabled', mr: 0.5 }} />
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

          {/* Invoice list */}
          {filteredInvoices.length === 0 ? (
            <Card sx={{ p: 5, textAlign: 'center' }}>
              <Typography color="text.secondary">No hay facturas en este período.</Typography>
            </Card>
          ) : (
            <Stack spacing={1}>
              {filteredInvoices.map((inv) => {
                const period = getPeriodType(inv.start_date, inv.end_date);
                return (
                  <Card key={inv.id} variant="outlined">
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ px: 3, py: 2 }}
                    >
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {formatPeriodLabel(inv.start_date, inv.end_date)}
                          </Typography>
                          <Chip
                            label={period.label}
                            size="small"
                            color={period.color}
                            variant="soft"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {inv.invoice_number} · {inv.business_name}
                        </Typography>
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Stack alignItems="flex-end" spacing={0.25}>
                          <Typography variant="caption" color="text.secondary">
                            Saldo final
                          </Typography>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {formatEur(inv.total)}
                          </Typography>
                        </Stack>
                        <IconButton
                          size="small"
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                          }}
                        >
                          <Iconify icon="solar:download-minimalistic-bold" width={15} />
                        </IconButton>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          <Iconify icon="eva:more-vertical-fill" width={16} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </DashboardContent>
    </>
  );
}
