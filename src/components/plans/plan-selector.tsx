import type { Plan } from 'src/types/billing';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import ToggleButton from '@mui/material/ToggleButton';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type BillingPeriod = 'monthly' | 'annual';

function fCents(cents: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

// ----------------------------------------------------------------------

type PlanCardProps = {
  plan: Plan;
  period: BillingPeriod;
  selected: boolean;
  onSelect: () => void;
};

function PlanCard({ plan, period, selected, onSelect }: PlanCardProps) {
  const basePrice =
    period === 'annual' ? plan.items.base.annual?.priceCents : plan.items.base.monthly?.priceCents;

  const annualMonthlyEquiv =
    period === 'annual' && plan.items.base.annual
      ? Math.round(plan.items.base.annual.priceCents / 12)
      : null;

  const chargersPrice = plan.items.chargers.monthly?.priceCents;
  const simPrice = plan.items.sim.monthly?.priceCents;
  const guestsPrice = plan.items.guests.monthly?.priceCents;

  return (
    <Card
      onClick={onSelect}
      sx={{
        p: 2.5,
        cursor: 'pointer',
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.lighter' : 'background.paper',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        position: 'relative',
        '&:hover': { borderColor: 'primary.light' },
      }}
    >
      {selected && (
        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
          <Iconify icon="eva:checkmark-circle-2-fill" width={22} sx={{ color: 'primary.main' }} />
        </Box>
      )}

      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} pr={4}>
            {plan.name}
          </Typography>
          {plan.trialDays > 0 && (
            <Label color="success" variant="soft" sx={{ mt: 0.5 }}>
              {plan.trialDays} días gratis
            </Label>
          )}
        </Box>

        <Box>
          {basePrice != null ? (
            <>
              <Stack direction="row" alignItems="baseline" spacing={0.5}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color={selected ? 'primary.main' : 'text.primary'}
                >
                  {fCents(basePrice)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  /{period === 'annual' ? 'año' : 'mes'}
                </Typography>
              </Stack>
              {annualMonthlyEquiv != null && (
                <Typography variant="caption" color="success.main">
                  ~{fCents(annualMonthlyEquiv)}/mes
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.disabled">
              Sin precio base
            </Typography>
          )}
        </Box>

        <Divider />

        <Stack spacing={0.5}>
          {chargersPrice != null && (
            <Typography variant="caption" color="text.secondary">
              + {fCents(chargersPrice)} por cargador/mes
            </Typography>
          )}
          {simPrice != null && (
            <Typography variant="caption" color="text.secondary">
              + {fCents(simPrice)} por SIM/mes
            </Typography>
          )}
          {guestsPrice != null && (
            <Typography variant="caption" color="text.secondary">
              + {fCents(guestsPrice)} por usuario/mes
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {plan.maxGuests != null ? `Hasta ${plan.maxGuests} usuarios` : 'Usuarios ilimitados'}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

type Props = {
  onConfirm: (plan: Plan, billingPeriod: BillingPeriod) => void;
  confirmLoading?: boolean;
};

export function PlanSelector({ onConfirm, confirmLoading }: Props) {
  const [selected, setSelected] = useState<Plan | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  const { data, isLoading } = useQuery<{ data: Plan[] }>({
    queryKey: ['plans-public'],
    queryFn: () => fetcher(endpoints.plans.list),
    staleTime: 5 * 60 * 1000,
  });

  const plans = (data?.data ?? []).filter((p) => Boolean(p.isActive));
  const hasAnnual = plans.some((p) => p.items.base.annual != null);

  useEffect(() => {
    if (plans.length > 0 && !selected) {
      setSelected(plans.find((p) => Boolean(p.isDefault)) ?? plans[0]);
    }
  }, [plans, selected]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (plans.length === 0) {
    return (
      <Alert severity="info">
        No hay planes disponibles en este momento. Contacta con soporte.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      {hasAnnual && (
        <Stack alignItems="center">
          <ToggleButtonGroup
            value={period}
            exclusive
            size="small"
            onChange={(_, v) => v && setPeriod(v)}
          >
            <ToggleButton value="monthly">Mensual</ToggleButton>
            <ToggleButton value="annual">
              Anual&nbsp;
              <Label color="success" variant="soft">
                Ahorra
              </Label>
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: plans.length > 1 ? 'repeat(2, 1fr)' : '1fr',
          },
        }}
      >
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            period={period}
            selected={selected?.id === plan.id}
            onSelect={() => setSelected(plan)}
          />
        ))}
      </Box>

      <LoadingButton
        fullWidth
        size="large"
        variant="contained"
        color="inherit"
        disabled={!selected}
        loading={confirmLoading}
        loadingIndicator="Preparando..."
        onClick={() => selected && onConfirm(selected, period)}
      >
        Continuar con {selected?.name ?? '—'}
      </LoadingButton>
    </Stack>
  );
}
