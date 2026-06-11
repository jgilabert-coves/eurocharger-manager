import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { themeConfig } from 'src/theme';

// ----------------------------------------------------------------------

const inkDarkest = themeConfig.palette.grey[900];

// ----------------------------------------------------------------------
// CardHeader
// ----------------------------------------------------------------------

export function CardHeader({
  icon,
  label,
  action,
}: {
  icon: ReactNode;
  label: string;
  action?: ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: inkDarkest }}>{icon}</Box>
        <Typography variant="h6" sx={{ color: inkDarkest }}>
          {label}
        </Typography>
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
