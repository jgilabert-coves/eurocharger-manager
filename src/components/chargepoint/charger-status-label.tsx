import type { LabelColor } from 'src/components/label';

import { Label } from 'src/components/label';

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
};

// ----------------------------------------------------------------------

type ChargerStatusLabelProps = {
  status?: string | null;
};

export function ChargerStatusLabel({ status }: ChargerStatusLabelProps) {
  const key = status?.toLowerCase() ?? '';
  const color = STATUS_COLORS[key] ?? 'default';
  const label = STATUS_LABELS[key] ?? status ?? 'Desconocido';

  return (
    <Label color={color} variant="soft">
      {label}
    </Label>
  );
}
