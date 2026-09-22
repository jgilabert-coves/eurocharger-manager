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

/** Motivo del último cobro fallido, ya clasificado por la API. */
export type PayInvoiceError = {
  /** Vocabulario estable: `card_no_funds`, `card_expired`, `card_blocked`… */
  code: string | null;
  message: string;
};

/** La API responde 402 con `{ code, error }` cuando el cobro falla por la tarjeta. */
type ApiErrorBody = { error?: string; code?: string };

const GENERIC_ERROR = 'No se pudo pagar la factura. Inténtalo de nuevo o prueba con otra tarjeta.';

function toPayInvoiceError(error: unknown): PayInvoiceError {
  const body = (error as { response?: { data?: ApiErrorBody } })?.response?.data;
  if (body?.error) {
    return { code: body.code ?? null, message: body.error };
  }
  // Un fallo del propio 3DS en el navegador no pasa por la API.
  if (error instanceof Error && error.message) {
    return { code: null, message: error.message };
  }
  return { code: null, message: GENERIC_ERROR };
}

/**
 * Cobra una factura pendiente de la suscripción.
 *
 * Se instancia UNA vez por pantalla y se reparte por props: el aviso de impago y
 * los botones de cada fila comparten el estado, así que el motivo del fallo se ve
 * en el aviso aunque el intento saliera de una fila, y no se pueden lanzar dos
 * cobros a la vez.
 *
 * Tras pagar hace falta `checkUserSession()`: el guard y el banner leen el estado
 * de suscripción del JWT, no de la API, y sin refrescarlo el usuario sigue viendo
 * el aviso de impago con la factura ya pagada.
 */
export function usePayInvoice() {
  const queryClient = useQueryClient();
  const { checkUserSession } = useAuthContext();
  const { notifySuccess, notifyError } = useNotification();

  const [payingId, setPayingId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<PayInvoiceError | null>(null);

  const payInvoice = async (invoice: Invoice) => {
    setPayingId(invoice.id);
    setLastError(null);

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
      // El toast avisa, pero el motivo se queda en pantalla: 3,5 segundos no dan
      // para leer por qué ha fallado ni para actuar en consecuencia.
      const payError = toPayInvoiceError(error);
      setLastError(payError);
      notifyError(payError.message);
    } finally {
      setPayingId(null);
    }
  };

  return { payInvoice, payingId, lastError };
}
