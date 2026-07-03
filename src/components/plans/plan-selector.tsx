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

import { formatCents } from 'src/utils/format-number';

import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type BillingPeriod = 'monthly' | 'annual';

// ----------------------------------------------------------------------

type PlanCardProps = {
  plan: Plan;
  period: BillingPeriod;
  selected: boolean;
  onSelect: () => void;
  discount?: { active: boolean; percentOff?: number; durationInMonths?: number } | null;
};

function PlanCard({ plan, period, selected, onSelect, discount }: PlanCardProps) {
  const monthlyBasePrice = plan.items.base.monthly?.priceCents ?? null;
  const annualBasePrice = plan.items.base.annual?.priceCents ?? null;
  const listPrice = period === 'annual' ? annualBasePrice : monthlyBasePrice;

  const discountActive =
    discount?.active === true &&
    typeof discount.percentOff === 'number' &&
    typeof discount.durationInMonths === 'number' &&
    discount.durationInMonths > 0 &&
    period === 'monthly';

  const percentOff = typeof discount?.percentOff === 'number' ? discount.percentOff : 0;
  const durationInMonths = typeof discount?.durationInMonths === 'number' ? discount.durationInMonths : 0;

  const discountAmountPerMonth =
    discountActive && monthlyBasePrice != null
      ? Math.round((monthlyBasePrice * percentOff) / 100)
      : 0;

  const discountedBasePrice =
    discountActive && period === 'monthly' && monthlyBasePrice != null
      ? monthlyBasePrice - discountAmountPerMonth
      : listPrice;

  const totalSavings =
    discountActive && period === 'monthly' && monthlyBasePrice != null
      ? discountAmountPerMonth * durationInMonths
      : 0;

  const annualMonthlyEquiv =
    period === 'annual' && annualBasePrice
      ? Math.round(annualBasePrice / 12)
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
        position: 'relative',
        // Mismo estilo que las KPI cards del dashboard: Card por defecto (fondo
        // background.paper + customShadows.card + borderRadius del tema). El estado
        // seleccionado se marca solo con el check de la esquina y el precio en verde.
        transition: 'box-shadow 0.15s ease',
        '&:hover': { boxShadow: 6 },
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
          {listPrice != null ? (
            <>
              <Stack direction="row" alignItems="baseline" spacing={0.5}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="text.primary"
                >
                  {formatCents(discountActive ? discountedBasePrice : listPrice)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  /{period === 'annual' ? 'año' : 'mes'}
                </Typography>
              </Stack>

              {discountActive ? (
                <Stack direction="column" spacing={0.5}>
                  <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                    {formatCents(listPrice)}
                  </Typography>
                  <Typography variant="caption" color="info">
                    <strong>Ahorra {formatCents(totalSavings)} en {discount.durationInMonths} meses</strong>
                  </Typography>
                </Stack>
              ) : annualMonthlyEquiv != null ? (
                <Typography variant="caption" color="text.secondary">
                  ~{formatCents(annualMonthlyEquiv, { unit: '/mes' })}
                </Typography>
              ) : null}
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
              + {formatCents(chargersPrice)}/mes por cargador
            </Typography>
          )}
          {simPrice != null && (
            <Typography variant="caption" color="text.secondary">
              + {formatCents(simPrice)}/mes por SIM
            </Typography>
          )}
          {guestsPrice != null && (
            <Typography variant="caption" color="text.secondary">
              + {formatCents(guestsPrice)}/mes por usuario
            </Typography>
          )}
          {/*
          <Typography variant="caption" color="text.secondary">
            {plan.maxGuests != null ? `Hasta ${plan.maxGuests} usuarios` : 'Usuarios ilimitados'}
          </Typography>
          */}
        </Stack>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

type Props = {
  discount?: { active: boolean; percentOff?: number; durationInMonths?: number } | null;
  onConfirm: (plan: Plan, billingPeriod: BillingPeriod) => void;
  confirmLoading?: boolean;
};
  
export function PlanSelector({ discount, onConfirm, confirmLoading }: Props) {
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
            discount={discount}
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
