import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { themeConfig } from 'src/theme';
import { endpoints, fetcher } from 'src/lib/axios';

import { type ConnectorStatusTotals } from 'src/types/dashboard';

import { tk } from './tokens';
import { IcPlug } from './icons';
import { CardHeader } from './primitives';



function pct(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}


export function ChargersCard() {

  const [metrics, setMetrics] = useState<ConnectorStatusTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const inkDarkest = themeConfig.palette.common.black;
  const inkLighter = themeConfig.palette.grey[500];
  const background = themeConfig.palette.grey[200];
  const availableColor = themeConfig.palette.primary.dark;
  const inUseColor = themeConfig.palette.info.main;
  const faultedColor = themeConfig.palette.error.main;
  const disconnectedColor = themeConfig.palette.secondary.darker;

  useEffect(() => {
      let cancelled = false;
  
      (async () => {
        setLoading(true);
        try {
          const response: {
            status_code: number;
            data: ConnectorStatusTotals | null;
            error: string | null;
          } = await fetcher(endpoints.dashboard.connectors.metrics);
          
          console.log('Connectors metrics response:', response);
          if (cancelled || !response.data) return;

          const metricsData = response.data;
  
          setMetrics(metricsData);
        } catch (error) {
          console.error('Error fetching connectors metrics:', error);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
  
      return () => { cancelled = true; };
    }, []);


  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardHeader icon={IcPlug} label="Conectores" />

      <Stack spacing={2} sx={{ flex: 1, mb: 2 }}>
        <Box key='availables_total'>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: inkDarkest }}>Disponibles</Typography>
            <Typography variant="subtitle2" sx={{ color: inkDarkest }}>
              {metrics?.available}
              <Typography component="span" variant="body2" sx={{ color: tk.inkLighter }}>
                /{metrics?.total}
              </Typography>
            </Typography>
          </Stack>
          <Box sx={{ height: 6, bgcolor: background, borderRadius: '10px', overflow: 'hidden' }}>
            <Box sx={{ width: `${pct(metrics?.available ?? 0, metrics?.total ?? 0)}`, height: '100%', bgcolor: availableColor, borderRadius: '10px', opacity: (metrics?.available ?? 0) === 0 ? 0.3 : 1 }} />
          </Box>
        </Box>
        <Box key='inuse_total'>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: inkDarkest }}>Ocupados</Typography>
            <Typography variant="subtitle2" sx={{ color: inkDarkest }}>
              {metrics?.inUse}
              <Typography component="span" variant="body2" sx={{ color: tk.inkLighter }}>
                /{metrics?.total}
              </Typography>
            </Typography>
          </Stack>
          <Box sx={{ height: 6, bgcolor: background, borderRadius: '10px', overflow: 'hidden' }}>
            <Box sx={{ width: `${pct(metrics?.inUse ?? 0, metrics?.total ?? 0)}`, height: '100%', bgcolor: inUseColor, borderRadius: '10px', opacity: (metrics?.inUse ?? 0) === 0 ? 0.3 : 1 }} />
          </Box>
        </Box>
        <Box key='faulted_total'>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: inkDarkest }}>Averiados</Typography>
            <Typography variant="subtitle2" sx={{ color: inkDarkest }}>
              {metrics?.faulted}
              <Typography component="span" variant="body2" sx={{ color: inkLighter }}>
                /{metrics?.total}
              </Typography>
            </Typography>
          </Stack>
          <Box sx={{ height: 6, bgcolor: background, borderRadius: '10px', overflow: 'hidden' }}>
            <Box sx={{ width: `${pct(metrics?.faulted ?? 0, metrics?.total ?? 0)}`, height: '100%', bgcolor: faultedColor, borderRadius: '10px', opacity: (metrics?.faulted ?? 0) === 0 ? 0.3 : 1 }} />
          </Box>
        </Box>
        <Box key='disconnected_total'>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: inkDarkest }}>Desconectados</Typography>
            <Typography variant="subtitle2" sx={{ color: inkDarkest }}>
              {metrics?.disconnected}
              <Typography component="span" variant="body2" sx={{ color: inkLighter }}>
                /{metrics?.total}
              </Typography>
            </Typography>
          </Stack>
          <Box sx={{ height: 6, bgcolor: background, borderRadius: '10px', overflow: 'hidden' }}>
            <Box sx={{ width: `${pct(metrics?.disconnected ?? 0, metrics?.total ?? 0)}`, height: '100%', bgcolor: disconnectedColor, borderRadius: '10px', opacity: (metrics?.disconnected ?? 0) === 0 ? 0.3 : 1 }} />
          </Box>
        </Box>
      </Stack>

      <Divider sx={{ borderColor: background }} />

      <Stack spacing={1} sx={{ pt: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" sx={{ color: inkDarkest, fontWeight: 600 }}>Total conectores</Typography>
          <Typography variant="h6" sx={{ color: inkDarkest }}>{metrics?.total}</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" sx={{ color: inkLighter }}>Disponibilidad</Typography>
          <Typography variant="h6" sx={{ color: availableColor }}>{pct(metrics?.available ?? 0, metrics?.total ?? 0)}</Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={parseFloat(pct(metrics?.available ?? 0, metrics?.total ?? 0).replace('%', '')) || 0}
          sx={{
            height: 5,
            borderRadius: '10px',
            bgcolor: background,
            '& .MuiLinearProgress-bar': { bgcolor: availableColor, borderRadius: '10px' },
          }}
        />
      </Stack>
    </Card>
  );
}
