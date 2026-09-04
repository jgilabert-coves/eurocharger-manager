import type { ConnectLinkResponse } from 'src/types/connect';

import { useState, useCallback } from 'react';

import { post, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';

import { PayoutProfileDialog } from './payout-profile-dialog';

// ----------------------------------------------------------------------

/**
 * Lanza el alta de la cuenta de cobro desde donde haga falta.
 *
 * Existe para que el alta se pueda arrancar desde más de un sitio (la pantalla
 * de cuenta de cobro y la de autofacturas, que es donde el operador se da cuenta
 * de que no le están pagando) sin duplicar el orden, que es delicado: primero el
 * formulario de datos, y solo después el enlace de Stripe. Generar el enlace
 * cierra la ventana de prefill de forma irreversible.
 */
export function useConnectOnboarding() {
  const { notifyError } = useNotification();
  const [open, setOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const start = useCallback(() => setOpen(true), []);

  /** Se llama cuando el operador ya ha confirmado sus datos en el formulario. */
  const goToStripe = useCallback(async () => {
    setOpen(false);
    setRedirecting(true);
    try {
      const response: { data: ConnectLinkResponse } = await post(
        endpoints.connect.onboardingLink,
        { origin: window.location.origin },
      );
      if (!response?.data?.url) throw new Error('sin url');
      window.location.href = response.data.url;
    } catch {
      notifyError('No se pudo abrir Stripe. Inténtalo de nuevo en unos segundos.');
      setRedirecting(false);
    }
  }, [notifyError]);

  const dialog = (
    <PayoutProfileDialog open={open} onClose={() => setOpen(false)} onReady={goToStripe} />
  );

  return { start, redirecting, dialog };
}
