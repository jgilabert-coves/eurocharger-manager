import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { themeConfig } from 'src/theme';
import { IcClock } from 'src/assets/icons';
import { fetcher, endpoints } from 'src/lib/axios';

import { type HeatmapResponse } from 'src/types/dashboard';

import { CardHeader } from './primitives';

// ----------------------------------------------------------------------

const g = themeConfig.palette.grey;

function getColor(v: number, maxV: number) {
  if (maxV === 0) return g[200];
  const p = v / maxV;
  if (p > 0.8) return g[800];
  if (p > 0.5) return g[500];
  if (p > 0.3) return g[300];
  return g[200];
}

// ----------------------------------------------------------------------

export function HeatmapCard() {
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const response = await fetcher(endpoints.dashboard.heatmap);
        if (!cancelled) setHeatmap(response.data as HeatmapResponse);
      } catch (error) {
        console.error('Error fetching heatmap:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const days = heatmap?.days ?? [];
  const hours = heatmap?.hours ?? [];
  const data = heatmap?.data ?? [];
  const maxV = data.length > 0 ? Math.max(...data.flat()) : 0;

  return (
    <Card sx={{ p: 3 }}>
      <CardHeader icon={IcClock} label="Horarios de afluencia" />
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: '40px repeat(7,1fr)', gap: '4px' }}>
          <Box />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} variant="text" width={28} sx={{ mx: 'auto' }} />
          ))}
          {Array.from({ length: 7 }).map((_, ri) => [
            <Skeleton key={`l${ri}`} variant="text" width={28} sx={{ ml: 'auto' }} />,
            ...Array.from({ length: 7 }).map((__, ci) => (
              <Skeleton key={`${ri}-${ci}`} variant="rounded" height={20} sx={{ borderRadius: 1 }} />
            )),
          ])}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `40px repeat(${days.length},1fr)`,
            gap: '4px',
            alignItems: 'center',
          }}
        >
          <Box />
          {days.map((d) => (
            <Typography key={d} variant="caption" sx={{ color: g[400], textAlign: 'center' }}>
              {d}
            </Typography>
          ))}
          {data.map((row, ri) => [
            <Typography key={`l${ri}`} variant="caption" sx={{ color: g[400], textAlign: 'right', pr: 0.5 }}>
              {hours[ri]}
            </Typography>,
            ...row.map((v, ci) => (
              <Tooltip key={`${ri}-${ci}`} title={`${days[ci]} ${hours[ri]}: ${v} recargas`} arrow placement="top">
                <Box sx={{ height: 20, borderRadius: 1, bgcolor: getColor(v, maxV), cursor: 'default' }} />
              </Tooltip>
            )),
          ])}
        </Box>
      )}
    </Card>
  );
}
