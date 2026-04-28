import type { ClientInvoiceModel } from 'src/types/invoice';

import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

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

// ----------------------------------------------------------------------

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPeriodHeader(start: Date, end: Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
  }
  return `${formatDate(s)} – ${formatDate(e)}`;
}

function formatEur(amount: number): string {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function periodKey(invoice: ClientInvoiceModel): string {
  const s = new Date(invoice.start_date);
  const e = new Date(invoice.end_date);
  return `${s.getFullYear()}-${String(s.getMonth()).padStart(2, '0')}-${String(e.getFullYear())}-${String(e.getMonth()).padStart(2, '0')}`;
}

// ----------------------------------------------------------------------

type InvoiceGroup = {
  key: string;
  label: string;
  invoices: ClientInvoiceModel[];
  periodTotal: number;
};

// ----------------------------------------------------------------------

export default function InvoicesView() {
  const { hasRole } = useAbility();
  const { user } = useAuthContext();
  const isEurocharger = hasRole('Eurocharger');

  const visibleInvoices = useMemo(() => {
    if (isEurocharger) return MOCK_INVOICES;
    return MOCK_INVOICES.filter((inv) => inv.client_id === user?.client_id);
  }, [isEurocharger, user?.client_id]);

  const groups = useMemo<InvoiceGroup[]>(() => {
    const map = new Map<string, ClientInvoiceModel[]>();
    for (const inv of visibleInvoices) {
      const k = periodKey(inv);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(inv);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, invoices]) => ({
        key,
        label: formatPeriodHeader(invoices[0].start_date, invoices[0].end_date),
        invoices,
        periodTotal: invoices.reduce((sum, i) => sum + i.total, 0),
      }));
  }, [visibleInvoices]);

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

          {groups.length === 0 ? (
            <Card sx={{ p: 5, textAlign: 'center' }}>
              <Typography color="text.secondary">No hay facturas disponibles.</Typography>
            </Card>
          ) : (
            groups.map((group) => (
              <Card key={group.key} variant="outlined">
                {/* Period header */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ px: 3, py: 2, bgcolor: 'background.neutral' }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    {group.label}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="caption" color="text.secondary">
                      Total período:
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.darkest">
                      {formatEur(group.periodTotal)}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider />

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ pl: 3 }}>Nº Factura</TableCell>
                        {isEurocharger && <TableCell>Empresa</TableCell>}
                        <TableCell>Período cubierto</TableCell>
                        <TableCell align="right">Base imp.</TableCell>
                        <TableCell align="right">IVA</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right" sx={{ pr: 3 }}>Vencimiento</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {group.invoices.map((inv) => (
                        <TableRow
                          key={inv.id}
                          sx={{ '&:last-child td': { border: 0 } }}
                        >
                          <TableCell sx={{ pl: 3 }}>
                            <Stack spacing={0.25}>
                              <Typography variant="caption" fontWeight={700} fontFamily="monospace">
                                {inv.invoice_number}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                Emitida: {formatDate(inv.issue_date)}
                              </Typography>
                            </Stack>
                          </TableCell>

                          {isEurocharger && (
                            <TableCell>
                              <Stack spacing={0.25}>
                                <Typography variant="caption" fontWeight={600}>
                                  {inv.business_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                  {inv.client_code}
                                </Typography>
                              </Stack>
                            </TableCell>
                          )}

                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(inv.start_date)} – {formatDate(inv.end_date)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="caption">{formatEur(inv.tax_base)}</Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Chip
                              label={`${inv.tax_percentage}% · ${formatEur(inv.tax_amount)}`}
                              size="small"
                              variant="soft"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="caption" fontWeight={700} color="primary.darkest">
                              {formatEur(inv.total)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right" sx={{ pr: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(inv.expiration_date)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Period summary */}
                <Divider />
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  spacing={3}
                  sx={{ px: 3, py: 1.5, bgcolor: 'background.neutral' }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Base imponible:{' '}
                    <strong>{formatEur(group.invoices.reduce((s, i) => s + i.tax_base, 0))}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    IVA:{' '}
                    <strong>{formatEur(group.invoices.reduce((s, i) => s + i.tax_amount, 0))}</strong>
                  </Typography>
                  <Typography variant="caption" fontWeight={700}>
                    Total período: <strong>{formatEur(group.periodTotal)}</strong>
                  </Typography>
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      </DashboardContent>
    </>
  );
}
