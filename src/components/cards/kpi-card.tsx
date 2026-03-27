import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { themeConfig } from 'src/theme';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type PaletteKey = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

export type KpiCardProps = {
  title: string;
  value: string;
  subtitle: string;
  delta?: string;
  trend?: 'up' | 'down';
  icon: string;
  palette: PaletteKey;
};

function resolvePalette(key: PaletteKey) {
  return themeConfig.palette[key];
}

export function KpiCard({ title, value, subtitle, delta, trend, icon, palette }: KpiCardProps) {
  const colors = resolvePalette(palette);

  return (
    <Card
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="left" spacing={1}>
        <Iconify icon={icon} width={24}/>
        <Typography variant="h6">
          {title}
        </Typography>
      </Stack>
      <Typography variant="h4">{value}</Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        {delta && trend && (
          <Label color={trend === 'up' ? 'success' : 'error'} variant="soft">
            {trend === 'up' ? '▲' : '▼'} {delta}
          </Label>
        )}
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Stack>
    </Card>
  );
}
