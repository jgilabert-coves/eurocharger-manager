import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { tk } from './tokens';

// ----------------------------------------------------------------------
// CardHeader
// ----------------------------------------------------------------------

export function CardHeader({
  icon: Icon,
  label,
  action,
}: {
  icon: React.ComponentType<{ size: number; color?: string }>;
  label: string;
  action?: ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Icon size={16} color={tk.inkDarkest} />
        <Typography variant="subtitle2" sx={{ color: tk.inkDarkest }}>{label}</Typography>
      </Stack>
      {action}
    </Stack>
  );
}

// ----------------------------------------------------------------------
// DeltaBadge
// ----------------------------------------------------------------------

export function DeltaBadge({ delta, bg, color }: { delta: string; bg: string; color: string }) {
  return (
    <Chip
      size="small"
      label={delta}
      sx={{
        bgcolor: bg,
        color,
        fontWeight: 600,
        fontSize: 11,
        height: 22,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}
