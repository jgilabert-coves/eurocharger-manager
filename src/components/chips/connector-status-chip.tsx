import type { LabelColor } from 'src/components/label';
import type { Theme, SxProps } from '@mui/material/styles';

import Tooltip from '@mui/material/Tooltip';

import { Label } from 'src/components/label';

import { ConnectorTypeIcon } from '../chargepoint';

// ----------------------------------------------------------------------

const STATUS_COLORS: Record<string, LabelColor> = {
  available: 'success',
  charging: 'info',
  preparing: 'info',
  finishing: 'info',
  suspendedev: 'info',
  suspendedevse: 'info',
  reserved: 'warning',
  unavailable: 'error',
  faulted: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  charging: 'Cargando',
  preparing: 'Preparando',
  finishing: 'Finalizando',
  suspendedev: 'Suspendido',
  suspendedevse: 'Suspendido',
  reserved: 'Reservado',
  unavailable: 'No disponible',
  faulted: 'Error',
  disconnected: 'Sin conexión',
};

const CONNECTOR_TYPE_MAP: Record<number, string> = {
  1: 'Mennekes',
  2: 'CHAdeMO',
  3: 'Schuko',
  4: 'CCS',
  5: 'J1772',
  6: 'Tesla',
};

// ----------------------------------------------------------------------

type ConnectorStatusLabelProps = {
  label: string;
  status?: string | null;
  connectorType?: number | null;
  variant?: 'soft' | 'outlined';
  sx?: SxProps<Theme>;
};

export function ConnectorStatusChip({
  label,
  status,
  connectorType,
  variant = 'soft',
  sx,
}: ConnectorStatusLabelProps) {
  const key = status?.toLowerCase() ?? '';
  const color = STATUS_COLORS[key] ?? 'default';

  const hoverText = status ? STATUS_LABELS[status.toLowerCase()] : null;
  const labelText = label === status ? STATUS_LABELS[label.toLowerCase()] : label;

  return (
    <Tooltip title={hoverText ?? ''} disableHoverListener={!hoverText} arrow>
      <Label
        color={color}
        variant={variant}
        sx={{
          ...(variant === 'outlined' && { color: 'text.primary', borderWidth: 1 }),
          ...(variant === 'soft' && { color: 'text.primary', fontWeight: '600' }),
          ...sx,
        }}
      >
        {connectorType && (
          <ConnectorTypeIcon name={CONNECTOR_TYPE_MAP[connectorType] ?? null} size={20} />
        )}
        {labelText}
      </Label>
    </Tooltip>
  );
}
