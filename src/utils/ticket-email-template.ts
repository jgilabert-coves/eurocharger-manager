// Template HTML para emails de tickets — compatible con Nodemailer.
// Exporta también como función TS para previsualización en la app.

export type TicketEmailData = {
  ticketId: number;
  reason: string;
  description: string;
  status: 'OPEN' | 'CLOSED';
  type: 'APP' | 'CALL';
  chargingStationName?: string | null;
  trackingEntries?: Array<{ author: string; message: string; createdAt: string }>;
  recipientName: string;
};

// Colores del tema Eurocharger
const C = {
  primaryMain: '#2DE21D',
  primaryDark: '#047800',
  primaryDarker: '#1C3E03',
  primaryLighter: '#9BF093',
  grey50: '#F7F9FA',
  grey100: '#F2F4F5',
  grey200: '#E3E5E5',
  grey500: '#72777A',
  grey700: '#404446',
  grey900: '#0F1213',
  white: '#FFFFFF',
  errorMain: '#FF5247',
  errorLighter: '#FF9898',
};

const STATUS_LABEL = { OPEN: 'Abierto', CLOSED: 'Cerrado' };
const TYPE_LABEL = { APP: 'App', CALL: 'Llamada' };

export function generateTicketEmailHtml(data: TicketEmailData): string {
  const {
    ticketId,
    reason,
    description,
    status,
    type,
    chargingStationName,
    trackingEntries = [],
    recipientName,
  } = data;

  const statusColor = status === 'OPEN' ? C.primaryDark : C.grey700;
  const statusBg = status === 'OPEN' ? C.primaryLighter : C.grey200;

  const trackingRows = trackingEntries
    .map(
      (entry) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${C.grey200};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family:'DM Sans Variable',Arial,sans-serif;font-size:13px;font-weight:600;color:${C.grey900};">
                ${entry.author}
              </td>
              <td align="right" style="font-family:'DM Sans Variable',Arial,sans-serif;font-size:12px;color:${C.grey500};">
                ${new Date(entry.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:4px;font-family:'DM Sans Variable',Arial,sans-serif;font-size:13px;color:${C.grey700};line-height:1.5;">
                ${entry.message}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join('');

  const trackingSection =
    trackingEntries.length > 0
      ? `
    <tr>
      <td style="padding-top:24px;">
        <p style="margin:0 0 12px;font-family:'DM Sans Variable',Arial,sans-serif;font-size:14px;font-weight:700;color:${C.grey900};">
          Historial de seguimiento
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${trackingRows}
        </table>
      </td>
    </tr>`
      : '';

  const stationRow = chargingStationName
    ? `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid ${C.grey100};background-color:${C.white};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="130" style="font-family:'DM Sans Variable',Arial,sans-serif;font-size:13px;color:${C.grey500};">Estación</td>
          <td style="font-family:'DM Sans Variable',Arial,sans-serif;font-size:13px;font-weight:600;color:${C.grey900};">${chargingStationName}</td>
        </tr></table>
      </td>
    </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Ticket #${ticketId} — Eurocharger</title>
</head>
<body style="margin:0;padding:0;background-color:${C.grey100};font-family:'DM Sans Variable',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.grey100};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ── Header ───────────────────────────────────────── -->
          <tr>
            <td style="background-color:${C.primaryDarker};border-radius:12px 12px 0 0;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td>
                  <span style="font-family:'DM Sans Variable',Arial,sans-serif;font-size:22px;font-weight:800;color:${C.primaryMain};letter-spacing:-0.5px;">
                    ⚡ eurocharger
                  </span>
                </td>
                <td align="right">
                  <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:${statusBg};font-family:'DM Sans Variable',Arial,sans-serif;font-size:12px;font-weight:700;color:${statusColor};letter-spacing:0.3px;text-transform:uppercase;">
                    ${STATUS_LABEL[status]}
                  </span>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- ── Title bar ────────────────────────────────────── -->
          <tr>
            <td style="background-color:${C.primaryMain};padding:16px 32px;">
              <p style="margin:0;font-family:'DM Sans Variable',Arial,sans-serif;font-size:18px;font-weight:700;color:${C.primaryDarker};">
                Ticket #${ticketId}
              </p>
              <p style="margin:4px 0 0;font-family:'DM Sans Variable',Arial,sans-serif;font-size:14px;color:${C.primaryDarker};opacity:0.8;">
                ${reason}
              </p>
            </td>
          </tr>

          <!-- ── Body ─────────────────────────────────────────── -->
          <tr>
            <td style="background-color:${C.white};padding:28px 32px;border-left:1px solid ${C.grey200};border-right:1px solid ${C.grey200};">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <p style="margin:0;font-size:15px;color:${C.grey900};line-height:1.6;">
                      Estimado/a <strong>${recipientName}</strong>,
                    </p>
                    <p style="margin:8px 0 0;font-size:14px;color:${C.grey700};line-height:1.6;">
                      Le informamos sobre la siguiente incidencia registrada en su instalación.
                    </p>
                  </td>
                </tr>

                <!-- Info table -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.grey200};border-radius:8px;overflow:hidden;">
                      <tr>
                        <td style="padding:10px 12px;border-bottom:1px solid ${C.grey100};background-color:${C.grey50};">
                          <table width="100%" cellpadding="0" cellspacing="0"><tr>
                            <td width="130" style="font-size:13px;color:${C.grey500};">Motivo</td>
                            <td style="font-size:13px;font-weight:600;color:${C.grey900};">${reason}</td>
                          </tr></table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 12px;border-bottom:1px solid ${C.grey100};background-color:${C.white};">
                          <table width="100%" cellpadding="0" cellspacing="0"><tr>
                            <td width="130" style="font-size:13px;color:${C.grey500};">Tipo</td>
                            <td style="font-size:13px;font-weight:600;color:${C.grey900};">${TYPE_LABEL[type]}</td>
                          </tr></table>
                        </td>
                      </tr>
                      ${stationRow}
                    </table>
                  </td>
                </tr>

                <!-- Description -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${C.grey900};text-transform:uppercase;letter-spacing:0.5px;">
                      Descripción
                    </p>
                    <div style="background-color:${C.grey50};border-left:3px solid ${C.primaryMain};border-radius:0 6px 6px 0;padding:12px 16px;">
                      <p style="margin:0;font-size:14px;color:${C.grey700};line-height:1.6;white-space:pre-wrap;">${description}</p>
                    </div>
                  </td>
                </tr>

                ${trackingSection}

                <!-- CTA -->
                <tr>
                  <td style="padding-top:24px;border-top:1px solid ${C.grey200};">
                    <p style="margin:0;font-size:13px;color:${C.grey500};line-height:1.6;">
                      Si tiene cualquier pregunta o necesita más información, no dude en contactar con nuestro equipo de soporte.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ── Footer ───────────────────────────────────────── -->
          <tr>
            <td style="background-color:${C.grey900};border-radius:0 0 12px 12px;padding:20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td>
                  <span style="font-family:'DM Sans Variable',Arial,sans-serif;font-size:14px;font-weight:700;color:${C.primaryMain};">
                    ⚡ eurocharger
                  </span>
                  <p style="margin:4px 0 0;font-size:12px;color:${C.grey500};">
                    Este mensaje ha sido generado automáticamente. Por favor, no responda a este correo.
                  </p>
                </td>
                <td align="right" style="vertical-align:top;">
                  <span style="font-size:11px;color:${C.grey500};">
                    © ${new Date().getFullYear()} Eurocharger
                  </span>
                </td>
              </tr></table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
