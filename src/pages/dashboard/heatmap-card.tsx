import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useState } from 'react';
import utc from 'dayjs/plugin/utc';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { themeConfig } from 'src/theme';
import { IcClock } from 'src/assets/icons';
import { fetcher, endpoints } from 'src/lib/axios';

import { DateRangeFilter } from 'src/components/date-range-filter';

import { type HeatmapResponse } from 'src/types/dashboard';

import { CardHeader } from './primitives';

// ----------------------------------------------------------------------

dayjs.extend(utc);

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
  // Selector de fechas propio de esta tarjeta. Default: última semana (7 días).
  const [from, setFrom] = useState<Dayjs | null>(() => dayjs().subtract(7, 'day').startOf('day'));
  const [to, setTo] = useState<Dayjs | null>(() => dayjs());
  // UTC porque transactions.started se guarda en UTC (driver mysql timezone: 'Z').
  const fromStr = from?.utc().format('YYYY-MM-DD HH:mm:ss');
  const toStr = to?.utc().format('YYYY-MM-DD HH:mm:ss');

  const url =
    fromStr && toStr
      ? `${endpoints.dashboard.heatmap}?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`
      : endpoints.dashboard.heatmap;
  const { data: res, isLoading } = useQuery({
    queryKey: ['dashboard', 'heatmap', fromStr, toStr],
    queryFn: () => fetcher(url),
  });
  const heatmap = res?.data as HeatmapResponse | undefined;

  const days = heatmap?.days ?? [];
  const hours = heatmap?.hours ?? [];
  const data = heatmap?.data ?? [];
  const maxV = data.length > 0 ? Math.max(...data.flat()) : 0;

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <CardHeader icon={<IcClock sx={{ fontSize: 18 }} />} label="Horarios de afluencia" />
        <DateRangeFilter
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
          }}
        />
      </Stack>
      {isLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: '40px repeat(7,1fr)', gap: '4px' }}>
          <Box />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} variant="text" width={28} sx={{ mx: 'auto' }} />
          ))}
          {Array.from({ length: 7 }).map((_, ri) => [
            <Skeleton key={`l${ri}`} variant="text" width={28} sx={{ ml: 'auto' }} />,
            ...Array.from({ length: 7 }).map((__, ci) => (
              <Skeleton
                key={`${ri}-${ci}`}
                variant="rounded"
                height={20}
                sx={{ borderRadius: 1 }}
              />
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
            <Typography
              key={`l${ri}`}
              variant="caption"
              sx={{ color: g[400], textAlign: 'right', pr: 0.5 }}
            >
              {hours[ri]}
            </Typography>,
            ...row.map((v, ci) => (
              <Tooltip
                key={`${ri}-${ci}`}
                title={`${days[ci]} ${hours[ri]}: ${v} recargas`}
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    height: 20,
                    borderRadius: 1,
                    bgcolor: getColor(v, maxV),
                    cursor: 'default',
                  }}
                />
              </Tooltip>
            )),
          ])}
        </Box>
      )}
    </Card>
  );
}
