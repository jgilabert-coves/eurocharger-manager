import type { LabelColor } from 'src/components/label';

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
  disconnected: 'Sin conexión'
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
  type?: number | null;
};

export function ConnectorStatusChip({ label, status, type }: ConnectorStatusLabelProps) {
  const key = status?.toLowerCase() ?? '';
  const color = STATUS_COLORS[key] ?? 'default';

  //const typeName = type ? (CONNECTOR_TYPE_MAP[type] ?? `Tipo ${type}`) : null;
  const hoverText = status ? STATUS_LABELS[status.toLowerCase()] : null;
  return (
    <Tooltip title={hoverText ?? ''} disableHoverListener={!hoverText} arrow>
      <Label color={color} variant="soft">
        {type && <ConnectorTypeIcon name={CONNECTOR_TYPE_MAP[type] ?? null} size={20} />}
        {label}
      </Label>
    </Tooltip>
  );
}
