import type { Theme } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

// ----------------------------------------------------------------------

export const bulletColor = { dark: '#282F37', light: '#EDEFF2' };

function colorVars(theme: Theme, variant?: 'vertical' | 'mini' | 'horizontal') {
  const {
    vars: { palette },
  } = theme;

  return {
    // Color del texto de los ítems en estado normal
    '--nav-item-color': palette.text.primary,
    // Fondo del ítem al hacer hover
    '--nav-item-hover-bg': palette.action.hover,
    // Color del texto caption (etiqueta pequeña sobre grupos de ítems)
    '--nav-item-caption-color': palette.text.disabled,
    // root — ítems de primer nivel
    // Color del texto del ítem raíz cuando está activo/seleccionado (tema claro)
    '--nav-item-root-active-color': palette.text.primary,
    // Color del texto del ítem raíz activo sobre fondo oscuro (modo apparent)
    '--nav-item-root-active-color-on-dark': palette.primary.light,
    // Fondo del ítem raíz activo
    '--nav-item-root-active-bg': varAlpha(palette.primary.mainChannel, 0.15),
    // Fondo del ítem raíz activo al hacer hover
    '--nav-item-root-active-hover-bg': varAlpha(palette.primary.mainChannel, 0.16),
    // Color del texto del ítem raíz cuando está abierto (tiene hijos desplegados)
    '--nav-item-root-open-color': palette.text.primary,
    // Fondo del ítem raíz cuando está abierto
    '--nav-item-root-open-bg': palette.action.hover,
    // sub — ítems de segundo nivel (hijos)
    // Color del texto del sub-ítem cuando está activo/seleccionado
    '--nav-item-sub-active-color': palette.text.primary,
    // Fondo del sub-ítem activo
    '--nav-item-sub-active-bg': palette.action.selected,
    // Color del texto del sub-ítem cuando está abierto
    '--nav-item-sub-open-color': palette.text.primary,
    // Fondo del sub-ítem cuando está abierto
    '--nav-item-sub-open-bg': palette.action.hover,
    ...(variant === 'vertical' && {
      // En vertical, el fondo del sub-ítem activo usa hover en lugar de selected
      '--nav-item-sub-active-bg': palette.action.hover,
      // Color del texto de los subheaders (títulos de sección) en estado normal
      '--nav-subheader-color': palette.text.disabled,
      // Color del texto de los subheaders al hacer hover
      '--nav-subheader-hover-color': palette.text.primary,
    }),
  };
}

// ----------------------------------------------------------------------

function verticalVars(theme: Theme) {
  const { shape } = theme;

  return {
    ...colorVars(theme, 'vertical'),
    // Separación vertical entre ítems
    '--nav-item-gap': '4px',
    // Radio de borde de cada ítem
    '--nav-item-radius': `${shape.borderRadius}px`,
    // Padding individual de cada ítem (top, right, bottom, left)
    '--nav-item-pt': '4px',
    '--nav-item-pr': '8px',
    '--nav-item-pb': '4px',
    '--nav-item-pl': '12px',
    // root
    // Alto de los ítems de primer nivel
    '--nav-item-root-height': '44px',
    // sub
    // Alto de los sub-ítems (segundo nivel)
    '--nav-item-sub-height': '36px',
    // icon
    // Tamaño del icono del ítem
    '--nav-icon-size': '24px',
    // Margen del icono (separa el icono del texto)
    '--nav-icon-margin': '0 12px 0 0',
    // bullet — punto indicador de sub-ítems sin icono
    // Tamaño del bullet
    '--nav-bullet-size': '12px',
    // Color del bullet en tema claro
    '--nav-bullet-light-color': bulletColor.light,
    // Color del bullet en tema oscuro
    '--nav-bullet-dark-color': bulletColor.dark,
  };
}

// ----------------------------------------------------------------------

function miniVars(theme: Theme) {
  const { shape } = theme;

  return {
    ...colorVars(theme, 'mini'),
    // Separación vertical entre ítems
    '--nav-item-gap': '4px',
    // Radio de borde de cada ítem
    '--nav-item-radius': `${shape.borderRadius}px`,
    // root
    // Alto de los ítems de primer nivel (más alto para mostrar icono + label apilados)
    '--nav-item-root-height': '56px',
    // Padding del ítem raíz
    '--nav-item-root-padding': '8px 4px 6px 4px',
    // sub
    // Alto de los sub-ítems en el popover
    '--nav-item-sub-height': '34px',
    // Padding del sub-ítem
    '--nav-item-sub-padding': '0 8px',
    // icon
    // Tamaño del icono
    '--nav-icon-size': '22px',
    // Margen del icono en ítems raíz (el label va debajo del icono)
    '--nav-icon-root-margin': '0 0 6px 0',
    // Margen del icono en sub-ítems
    '--nav-icon-sub-margin': '0 8px 0 0',
  };
}

// ----------------------------------------------------------------------

function horizontalVars(theme: Theme) {
  const { shape } = theme;

  return {
    ...colorVars(theme, 'horizontal'),
    // Separación horizontal entre ítems
    '--nav-item-gap': '6px',
    // Alto total de la barra de nav horizontal
    '--nav-height': '56px',
    // Radio de borde de cada ítem (ligeramente menor que vertical)
    '--nav-item-radius': `${shape.borderRadius * 0.75}px`,
    // root
    // Alto de los ítems de primer nivel en la barra horizontal
    '--nav-item-root-height': '32px',
    // Padding del ítem raíz
    '--nav-item-root-padding': '0 6px',
    // sub
    // Alto de los sub-ítems en el menú desplegable
    '--nav-item-sub-height': '34px',
    // Padding del sub-ítem
    '--nav-item-sub-padding': '0 8px',
    // icon
    // Tamaño del icono
    '--nav-icon-size': '22px',
    // Margen del icono en sub-ítems
    '--nav-icon-sub-margin': '0 8px 0 0',
    // Margen del icono en ítems raíz
    '--nav-icon-root-margin': '0 8px 0 0',
  };
}

// ----------------------------------------------------------------------

export const navSectionCssVars = {
  mini: miniVars,
  vertical: verticalVars,
  horizontal: horizontalVars,
};
