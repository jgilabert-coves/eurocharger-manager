import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { themeConfig } from 'src/theme';
import { endpoints, fetcher } from 'src/lib/axios';

import { type ConnectorStatusTotals } from 'src/types/dashboard';

import { IcPlug } from './icons';
import { CardHeader } from './primitives';

// ----------------------------------------------------------------------

const p = themeConfig.palette;

const ROWS = [
  { key: 'available' as const, label: 'Disponibles', color: p.primary.dark },
  { key: 'inUse' as const, label: 'Ocupados', color: p.info.main },
  { key: 'faulted' as const, label: 'Averiados', color: p.error.main },
  { key: 'disconnected' as const, label: 'Desconectados', color: p.grey[800] },
];

const inkDarkest = p.grey[900];
const inkLighter = p.grey[500];
const bgBar = p.grey[200];

function pctValue(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// ----------------------------------------------------------------------

export function ChargersCard() {
  const [metrics, setMetrics] = useState<ConnectorStatusTotals | null>(null);
  const [loading, setLoading] = useState(true);

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

        if (cancelled || !response.data) return;
        setMetrics(response.data);
      } catch (error) {
        console.error('Error fetching connectors metrics:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const total = metrics?.total ?? 0;

  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardHeader icon={IcPlug} label="Conectores" />

      <Stack spacing={2} sx={{ flex: 1, mb: 2 }}>
        {ROWS.map(({ key, label, color }) => {
          const value = metrics?.[key] ?? 0;
          const pct = pctValue(value, total);

          return (
            <Box key={key}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: inkDarkest }}>{label}</Typography>
                {loading ? (
                  <Skeleton width={40} height={20} />
                ) : (
                  <Typography variant="subtitle2" sx={{ color: inkDarkest }}>
                    {value}
                    <Typography component="span" variant="body2" sx={{ color: inkLighter }}>
                      /{total}
                    </Typography>
                  </Typography>
                )}
              </Stack>
              {loading ? (
                <Skeleton variant="rounded" height={6} sx={{ borderRadius: '10px' }} />
              ) : (
                <Box sx={{ height: 6, bgcolor: bgBar, borderRadius: '10px', overflow: 'hidden' }}>
                  <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: '10px', opacity: value === 0 ? 0.3 : 1 }} />
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>

      <Divider sx={{ borderColor: bgBar }} />

      <Stack spacing={1} sx={{ pt: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" sx={{ color: inkDarkest, fontWeight: 600 }}>Total conectores</Typography>
          {loading ? <Skeleton width={30} /> : (
            <Typography variant="h6" sx={{ color: inkDarkest }}>{total}</Typography>
          )}
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" sx={{ color: inkLighter }}>Disponibilidad</Typography>
          {loading ? <Skeleton width={40} /> : (
            <Typography variant="h6" sx={{ color: p.primary.dark }}>{pctValue(metrics?.available ?? 0, total)}%</Typography>
          )}
        </Stack>
        {loading ? (
          <Skeleton variant="rounded" height={5} sx={{ borderRadius: '10px' }} />
        ) : (
          <LinearProgress
            variant="determinate"
            value={pctValue(metrics?.available ?? 0, total)}
            sx={{
              height: 5,
              borderRadius: '10px',
              bgcolor: bgBar,
              '& .MuiLinearProgress-bar': { bgcolor: p.primary.dark, borderRadius: '10px' },
            }}
          />
        )}
      </Stack>
    </Card>
  );
}
