import type { Subscription, SubscriptionDiscount } from 'src/types/billing';

import { Fragment } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { fDate } from 'src/utils/format-time';
import { formatCents } from 'src/utils/format-number';

import {
  ITEM_LABEL,
  ITEM_ORDER,
  STATUS_COLOR,
  STATUS_LABEL,
} from './subscription-constants';

// ----------------------------------------------------------------------

const calcDiscountCents = (d: SubscriptionDiscount, baseCents: number) =>
  d.discount_type === 'percent'
    ? Math.round((baseCents * d.discount_value) / 100)
    : Math.min(d.discount_value, baseCents);

const formatDiscountLabel = (d: SubscriptionDiscount) => {
  const value = d.discount_type === 'percent' ? `${d.discount_value}%` : formatCents(d.discount_value);
  if (d.duration === 'forever') return `${d.coupon_name} (${value})`;
  if (d.duration === 'once') return `${d.coupon_name} (${value}, una vez)`;
  return `${d.coupon_name} (${value}, ${d.duration_months} meses)`;
};

/** Suma de los items, sin descuentos ni IVA. */
export function estimatedCentsOf(subscription?: Subscription): number {
  return (
    subscription?.items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0) ?? 0
  );
}

/** Lo que queda tras aplicar los descuentos, sin IVA. */
export function discountedCentsOf(subscription?: Subscription): number {
  const estimated = estimatedCentsOf(subscription);

  const discountAmount = (subscription?.discounts ?? []).reduce((total, d) => {
    const item = subscription?.items.find((i) => i.type === d.applies_to);
    const baseCents =
      d.applies_to === 'total'
        ? estimated
        : (item?.unit_price_cents ?? 0) * (item?.quantity ?? 0);
    return total + calcDiscountCents(d, baseCents);
  }, 0);

  return estimated - discountAmount;
}

// ----------------------------------------------------------------------

type Props = {
  subscription: Subscription;
  onCancelClick: () => void;
};

export function SubscriptionDetailsCard({ subscription, onCancelClick }: Props) {
  const estimatedCents = estimatedCentsOf(subscription);
  const discountedCents = discountedCentsOf(subscription);

  const renderItems = () => {
    if (!subscription.items?.length) return null;

    const visibleItems = subscription.items
      .filter((item) => item.unit_price_cents * item.quantity > 0)
      .sort((a, b) => (ITEM_ORDER[a.type] ?? 99) - (ITEM_ORDER[b.type] ?? 99));
    if (!visibleItems.length) return null;

    const discounts = subscription.discounts ?? [];
    const discountsFor = (type: string) => discounts.filter((d) => d.applies_to === type);
    const totalDiscounts = discounts.filter((d) => d.applies_to === 'total');

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Concepto</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Precio unitario</TableCell>
              <TableCell align="right">Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleItems.map((item) => (
              <Fragment key={item.id}>
                <TableRow>
                  <TableCell>{ITEM_LABEL[item.type] ?? item.type}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCents(item.unit_price_cents)}</TableCell>
                  <TableCell align="right">
                    {formatCents(item.unit_price_cents * item.quantity)}
                  </TableCell>
                </TableRow>
                {discountsFor(item.type).map((d) => {
                  const amount = calcDiscountCents(d, item.unit_price_cents * item.quantity);
                  return (
                    <TableRow key={`d-${d.id}`} sx={{ bgcolor: 'success.lighter' }}>
                      <TableCell colSpan={3} sx={{ py: 0.5, pl: 4, borderBottom: 'none' }}>
                        <Typography variant="caption" color="success.dark">
                          {formatDiscountLabel(d)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.5, borderBottom: 'none' }}>
                        <Typography variant="caption" color="success.dark">
                          -{formatCents(amount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Fragment>
            ))}
            {totalDiscounts.map((d) => {
              const amount = calcDiscountCents(d, estimatedCents);
              return (
                <TableRow key={`d-${d.id}`} sx={{ bgcolor: 'success.lighter' }}>
                  <TableCell colSpan={3} sx={{ py: 0.5, pl: 2, borderBottom: 'none' }}>
                    <Typography variant="caption" color="success.dark">
                      {formatDiscountLabel(d)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5, borderBottom: 'none' }}>
                    <Typography variant="caption" color="success.dark">
                      -{formatCents(amount)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6">Estado</Typography>
          <Chip
            label={STATUS_LABEL[subscription.status] ?? subscription.status}
            color={STATUS_COLOR[subscription.status] ?? 'default'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Stack>

        {!!subscription.cancel_at_period_end && !!subscription.current_period_end && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Tu suscripción se cancelará el{' '}
            <strong>{fDate(subscription.current_period_end)}</strong> y no se renovará. Si cambias
            de opinión, contacta con soporte.
          </Alert>
        )}

        {!!subscription.current_period_start && !!subscription.current_period_end && (
          <Typography variant="body2" color="text.secondary">
            Periodo actual:{' '}
            <strong>
              {fDate(subscription.current_period_start)} → {fDate(subscription.current_period_end)}
            </strong>
          </Typography>
        )}

        <Divider />

        <Typography variant="subtitle1">Detalle de la suscripción</Typography>

        {renderItems()}

        <Divider />

        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="subtitle1">Total estimado / mes</Typography>
          <Stack alignItems="flex-end" spacing={0.25}>
            <Typography variant="caption" color="text.secondary">
              IVA 21%: {formatCents(discountedCents * 0.21)}
            </Typography>
            <Typography variant="h5" color="text.primary" fontWeight={700}>
              {formatCents(discountedCents * 1.21)}
            </Typography>
          </Stack>
        </Stack>

        {subscription.status !== 'canceled' && !subscription.cancel_at_period_end && (
          <Box sx={{ pt: 1 }}>
            <Button variant="outlined" color="error" onClick={onCancelClick}>
              Cancelar suscripción
            </Button>
          </Box>
        )}
      </Stack>
    </Card>
  );
}
