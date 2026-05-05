import type { SettingsState } from 'src/components/settings';
import type { Theme, CSSObject } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

import { bulletColor } from 'src/components/nav-section';

// ----------------------------------------------------------------------

export function dashboardLayoutVars(theme: Theme) {
  return {
    // Curva de animación de la transición del nav (apertura/cierre)
    '--layout-transition-easing': 'linear',
    // Duración de la transición del nav
    '--layout-transition-duration': '120ms',
    // Ancho del nav en modo mini (solo iconos)
    '--layout-nav-mini-width': '88px',
    // Ancho del nav vertical expandido
    '--layout-nav-vertical-width': '300px',
    // Alto del nav horizontal (barra superior)
    '--layout-nav-horizontal-height': '64px',
    // Padding superior del contenido del dashboard
    '--layout-dashboard-content-pt': theme.spacing(1),
    // Padding inferior del contenido del dashboard
    '--layout-dashboard-content-pb': theme.spacing(8),
    // Padding horizontal del contenido del dashboard
    '--layout-dashboard-content-px': theme.spacing(5),
  };
}

// ----------------------------------------------------------------------

export function dashboardNavColorVars(
  theme: Theme,
  navColor: SettingsState['navColor'] = 'integrate',
  navLayout: SettingsState['navLayout'] = 'vertical'
): Record<'layout' | 'section', CSSObject | undefined> {
  const {
    vars: { palette },
  } = theme;

  switch (navColor) {
    // "integrate": el nav usa los mismos colores que el fondo de la app (se integra)
    case 'integrate':
      return {
        layout: {
          // Fondo del nav vertical
          '--layout-nav-bg': palette.background.default,
          // Fondo del nav horizontal (con opacidad)
          '--layout-nav-horizontal-bg': varAlpha(palette.background.defaultChannel, 0.8),
          // Color del borde/separador del nav
          '--layout-nav-border-color': varAlpha(palette.grey['500Channel'], 0.12),
          // Color del texto principal de los ítems del nav
          '--layout-nav-text-primary-color': palette.text.primary,
          // Color del texto secundario (subtítulos, captions)
          '--layout-nav-text-secondary-color': palette.text.secondary,
          // Color del texto deshabilitado
          '--layout-nav-text-disabled-color': palette.text.disabled,
          ...theme.applyStyles('dark', {
            '--layout-nav-border-color': varAlpha(palette.grey['500Channel'], 0.08),
            '--layout-nav-horizontal-bg': varAlpha(palette.background.defaultChannel, 0.96),
          }),
        },
        section: undefined,
      };
    // "apparent": el nav tiene fondo oscuro propio (contrasta con el contenido)
    case 'apparent':
      return {
        layout: {
          // Fondo oscuro del nav vertical
          '--layout-nav-bg': palette.grey[900],
          // Fondo oscuro del nav horizontal (con opacidad)
          '--layout-nav-horizontal-bg': varAlpha(palette.grey['900Channel'], 0.96),
          // Sin borde visible (el contraste de color ya separa el nav)
          '--layout-nav-border-color': 'transparent',
          // Texto principal en blanco para contrastar con el fondo oscuro
          '--layout-nav-text-primary-color': palette.common.white,
          // Texto secundario en gris medio
          '--layout-nav-text-secondary-color': palette.grey[500],
          // Texto deshabilitado en gris oscuro
          '--layout-nav-text-disabled-color': palette.grey[600],
          ...theme.applyStyles('dark', {
            '--layout-nav-bg': palette.grey[800],
            '--layout-nav-horizontal-bg': varAlpha(palette.grey['800Channel'], 0.8),
          }),
        },
        section: {
          // Color del texto de las etiquetas caption (texto pequeño sobre grupos)
          '--nav-item-caption-color': palette.grey[600],
          // Color del texto de los subheaders (títulos de sección del nav)
          '--nav-subheader-color': palette.grey[600],
          // Color del subheader al hacer hover
          '--nav-subheader-hover-color': palette.common.white,
          // Color del texto de los ítems del nav en estado normal
          '--nav-item-color': palette.grey[500],
          // Color del texto del ítem raíz cuando está activo/seleccionado
          '--nav-item-root-active-color': palette.grey[500],
          // Color del texto del ítem raíz cuando está abierto (tiene hijos desplegados)
          '--nav-item-root-open-color': palette.common.white,
          // Color del bullet (punto indicador) en tema claro
          '--nav-bullet-light-color': bulletColor.dark,
          // Sub-ítems (solo en nav vertical)
          ...(navLayout === 'vertical' && {
            // Color del texto del sub-ítem cuando está activo/seleccionado
            '--nav-item-sub-active-color': palette.common.white,
            // Color del texto del sub-ítem cuando está abierto
            '--nav-item-sub-open-color': palette.common.white,
          }),
        },
      };
    default:
      throw new Error(`Invalid color: ${navColor}`);
  }
}
