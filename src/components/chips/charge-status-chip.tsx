import type { ChargeStatus } from 'src/types/charges';
import type { LabelColor } from 'src/components/label';
import type { Theme, SxProps } from '@mui/material/styles';

import Tooltip from '@mui/material/Tooltip';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const STATUS_COLORS: Record<string, LabelColor> = {
  authorized: 'info',
  captured: 'success',
  failed: 'error',
  refunded: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  authorized: 'Autorizado',
  captured: 'Cobrado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
};

// ----------------------------------------------------------------------

type ChargeStatusChipProps = {
  status: ChargeStatus | string;
  variant?: 'soft' | 'outlined';
  sx?: SxProps<Theme>;
};

export function ChargeStatusChip({ status, variant = 'soft', sx }: ChargeStatusChipProps) {
  const key = status?.toLowerCase() ?? '';
  const color = STATUS_COLORS[key] ?? 'default';
  const labelText = STATUS_LABELS[key] ?? status;

  return (
    <Tooltip title={labelText ?? ''} arrow>
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
