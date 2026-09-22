// ----------------------------------------------------------------------
// Única fuente de verdad sobre qué estado de suscripción deja usar el panel.
//
// Antes esta lista estaba duplicada en `subscription-guard.tsx` y en
// `jwt-resubscribe-view.tsx`, y las dos copias habían divergido (`incomplete`
// estaba en una y no en la otra): el guard dejaba entrar al panel y la vista de
// reactivación no devolvía al dashboard, así que el usuario se quedaba atascado.
// ----------------------------------------------------------------------

/** Al corriente de pago: el panel funciona con normalidad y sin avisos. */
export const ACTIVE_STATUSES: string[] = ['trialing', 'active'];

/**
 * El cobro ha fallado, pero Stripe sigue reintentando y la suscripción vive.
 *
 * Entra cualquier rol, como hasta ahora: un rechazo temporal de la tarjeta no
 * puede dejar sin cargadores a los operarios de la cuenta, que además no tienen
 * forma de arreglarlo.
 */
export const GRACE_STATUSES: string[] = ['past_due', 'incomplete'];

/**
 * El cobro ha fallado del todo: Stripe ya no reintenta.
 *
 * Aquí solo entra el `saas_owner`, que es quien puede cambiar la tarjeta y pagar
 * la factura pendiente desde `/subscription`. Antes `unpaid` expulsaba del panel
 * a todo el mundo —incluido el owner—, que es justo lo que hacía el impago
 * irrecuperable sin llamar a soporte.
 */
export const OWNER_RECOVERABLE_STATUSES: string[] = ['unpaid', 'incomplete_expired'];

/** No hay nada que pagar: para volver hay que suscribirse otra vez. */
export const RESUBSCRIBE_STATUSES: string[] = ['canceled', 'paused'];

/** Estados de pago fallido, recuperables pagando. Los usa el banner y la pantalla de suscripción. */
export const PAYMENT_FAILED_STATUSES: string[] = [
  ...GRACE_STATUSES,
  ...OWNER_RECOVERABLE_STATUSES,
];

export function isPaymentFailed(status?: string | null): boolean {
  return !!status && PAYMENT_FAILED_STATUSES.includes(status);
}

/** ¿Este estado y este rol pueden usar el panel? */
export function hasPanelAccess(status: string | null | undefined, isOwner: boolean): boolean {
  if (!status) return false;
  if (ACTIVE_STATUSES.includes(status) || GRACE_STATUSES.includes(status)) return true;
  return isOwner && OWNER_RECOVERABLE_STATUSES.includes(status);
}

/** Estados de factura que el cliente todavía puede pagar. */
export const PAYABLE_INVOICE_STATUSES = ['open', 'uncollectible'];

export function isPayableInvoiceStatus(status: string): boolean {
  return PAYABLE_INVOICE_STATUSES.includes(status);
}
