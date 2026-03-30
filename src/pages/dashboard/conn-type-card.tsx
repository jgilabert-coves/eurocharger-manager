import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { themeConfig } from 'src/theme';
import { IcPlug } from 'src/assets/icons';
import { endpoints, fetcher } from 'src/lib/axios';

import { type ConnectorCurrentTypeUsage } from 'src/types/dashboard';

import { CardHeader } from './primitives';

// ----------------------------------------------------------------------

const p = themeConfig.palette;

const TYPE_STYLES: Record<string, { color: string; bg: string; desc: string }> = {
  AC: { color: p.primary.dark, bg: p.primary.lighter, desc: 'Corriente alterna' },
  DC: { color: p.info.main, bg: p.info.lighter, desc: 'Corriente continua' },
};

const DEFAULT_STYLE = { color: p.grey[600], bg: p.grey[100], desc: '' };

// ----------------------------------------------------------------------

export function ConnTypeCard() {
  const { data: res, isLoading } = useQuery({
    queryKey: ['dashboard', 'connectorCurrentTypes'],
    queryFn: () => fetcher(endpoints.dashboard.connectorCurrentTypes),
  });
  const types = (res?.data as ConnectorCurrentTypeUsage[]) ?? [];

  return (
    <Card sx={{ p: 3 }}>
      <CardHeader icon={IcPlug} label="Tipo de conectores" />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <Box key={i} sx={{ bgcolor: p.grey[100], borderRadius: 2, p: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Skeleton width={30} height={24} />
                  <Skeleton width={40} height={20} />
                </Stack>
                <Skeleton width={100} height={14} sx={{ mb: 1 }} />
                <Skeleton variant="rounded" height={5} sx={{ borderRadius: '10px', mb: 0.5 }} />
                <Skeleton width={60} height={14} />
              </Box>
            ))
          : types.map(({ currentType, total, inUse, usagePercentage }) => {
              const style = TYPE_STYLES[currentType] ?? DEFAULT_STYLE;
              const pctVal = Math.round(usagePercentage);

              return (
                <Box key={currentType} sx={{ bgcolor: style.bg, borderRadius: 2, p: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: p.grey[900] }}>{currentType}</Typography>
                    <Typography variant="subtitle2" sx={{ color: p.grey[900] }}>
                      {inUse}
                      <Typography component="span" variant="body2" sx={{ color: p.grey[500] }}>/{total}</Typography>
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: p.grey[500], display: 'block', mb: 1 }}>{style.desc}</Typography>
                  <Box sx={{ height: 5, bgcolor: p.common.white, borderRadius: '10px', overflow: 'hidden' }}>
                    <Box sx={{ width: `${pctVal}%`, height: '100%', bgcolor: style.color, borderRadius: '10px' }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: style.color, fontWeight: 600, mt: 0.5, display: 'block' }}>{pctVal}% en uso</Typography>
                </Box>
              );
            })}
      </Box>
    </Card>
  );
}
