import type { LabelColor } from 'src/components/label';
import type { Theme, SxProps } from '@mui/material/styles';

import Tooltip from '@mui/material/Tooltip';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const STATUS_COLORS: Record<string, LabelColor> = {
  cargando: 'info',
  finalizado: 'success',
  cancelado: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  cargando: 'En curso',
  finalizado: 'Finalizada',
  cancelado: 'Cancelada',
};

// ----------------------------------------------------------------------

type TransactionStatusLabelProps = {
  status: string;
  variant?: 'soft' | 'outlined';
  sx?: SxProps<Theme>;
};

export function TransactionStatusChip({
  status,
  variant = 'soft',
  sx,
}: TransactionStatusLabelProps) {
  const key = status?.toLowerCase() ?? '';
  const color = STATUS_COLORS[key] ?? 'default';

  const hoverText = status ? STATUS_LABELS[status.toLowerCase()] : null;
  const labelText = STATUS_LABELS[status.toLowerCase()];

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
        {labelText}
      </Label>
    </Tooltip>
  );
}
