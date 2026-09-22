import type { Invoice } from 'src/types/billing';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useQueryClient } from '@tanstack/react-query';

import { post, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';

import { useAuthContext } from 'src/auth/hooks';

import type { PayInvoiceResponse } from './subscription-constants';

// ----------------------------------------------------------------------

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

/**
 * Cobra una factura pendiente de la suscripción.
 *
 * Lo usan el aviso de impago y las filas del historial, así que vive en un hook
 * para que el 3DS y el refresco de estado se traten igual en los dos sitios.
 *
 * Tras pagar hace falta `checkUserSession()`: el guard y el banner leen el estado
 * de suscripción del JWT, no de la API, y si no se refresca el usuario sigue
 * viendo el aviso de impago con la factura ya pagada.
 */
export function usePayInvoice() {
  const queryClient = useQueryClient();
  const { checkUserSession } = useAuthContext();
  const { notifySuccess, notifyError } = useNotification();

  const [payingId, setPayingId] = useState<string | null>(null);

  const payInvoice = async (invoice: Invoice) => {
    setPayingId(invoice.id);
    try {
      const res: PayInvoiceResponse = await post(endpoints.billing.payInvoice(invoice.id), {});

      if (res.data?.requiresAction && res.data.clientSecret) {
        // El banco pide autenticación: sin esto el cobro se queda a medias y en
        // silencio, que es el fallo clásico de los pagos con 3DS.
        const stripe = await stripePromise;
        if (!stripe) throw new Error('No se pudo cargar Stripe');

        const { error } = await stripe.handleNextAction({ clientSecret: res.data.clientSecret });
        if (error) throw new Error(error.message ?? 'No se pudo autenticar el pago');
      }

      notifySuccess('Factura pagada correctamente');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription'] }),
        checkUserSession?.(),
      ]);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (error instanceof Error ? error.message : null);
      notifyError(message ?? 'No se pudo pagar la factura. Revisa tu método de pago.');
    } finally {
      setPayingId(null);
    }
  };

  return { payInvoice, payingId };
}
