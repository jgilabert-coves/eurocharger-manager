import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useState } from 'react';
import utc from 'dayjs/plugin/utc';
import { useQuery } from '@tanstack/react-query';
import { User, ChargingStation } from '@phosphor-icons/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { formatEuros } from 'src/utils/format-number';

import { fetcher, endpoints } from 'src/lib/axios';

import { DateRangeFilter } from 'src/components/date-range-filter';

import { type TopUser, type TopChargepoint } from 'src/types/dashboard';

import { tk } from './tokens';
import { CardHeader } from './primitives';

// ----------------------------------------------------------------------

dayjs.extend(utc);

const trophies = ['🥇', '🥈', '🥉'];

type TopListProps = {
  title: string;
  isClient?: boolean;
};

export function TopList({ title, isClient }: TopListProps) {
  // Selector de fechas propio de esta tarjeta. Default: última semana (7 días).
  const [from, setFrom] = useState<Dayjs | null>(() => dayjs().subtract(7, 'day').startOf('day'));
  const [to, setTo] = useState<Dayjs | null>(() => dayjs());
  // UTC porque transactions.started se guarda en UTC (driver mysql timezone: 'Z').
  const fromStr = from?.utc().format('YYYY-MM-DD HH:mm:ss');
  const toStr = to?.utc().format('YYYY-MM-DD HH:mm:ss');

  const endpoint = isClient ? endpoints.dashboard.topUsers : endpoints.dashboard.topChargepoints;
  const url =
    fromStr && toStr
      ? `${endpoint}?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`
      : endpoint;
  const { data: res, isLoading } = useQuery({
    queryKey: ['dashboard', isClient ? 'topUsers' : 'topChargepoints', fromStr, toStr],
    queryFn: () => fetcher(url),
  });

  const icon = isClient ? (
    <User size={18} weight="fill" />
  ) : (
    <ChargingStation size={18} weight="fill" />
  );

  const items = isClient
    ? ((res?.data as TopUser[]) ?? []).map((u) => ({
        key: u.id,
        name: u.name,
        line1: `↻ ${u.totalCharges} recargas`,
        line2: `≈ ${formatEuros(u.totalSpent)}`,
      }))
    : ((res?.data as TopChargepoint[]) ?? []).map((cp) => ({
        key: cp.id,
        name: cp.name,
        line1: `↻ ${cp.totalCharges} recargas`,
        line2: `≈ ${formatEuros(cp.totalRevenue)}`,
      }));

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <CardHeader icon={icon} label={title} />
        <DateRangeFilter
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
          }}
        />
      </Stack>

      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Stack
              key={i}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ py: 1, borderBottom: `1px solid ${tk.skyLight}` }}
            >
              <Skeleton variant="circular" width={32} height={32} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={120} height={18} />
                <Skeleton variant="text" width={160} height={14} />
              </Box>
            </Stack>
          ))
        : items.map(({ key, name, line1, line2 }, i) => (
            <Stack
              key={key}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ py: 1, borderBottom: `1px solid ${tk.skyLight}` }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: tk.greenLightest,
                  fontSize: 11,
                  fontWeight: 700,
                  color: tk.greenDarkest,
                }}
              >
                {isClient
                  ? (name ?? '')
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                  : 'EC'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: tk.inkDarkest }}>
                  {name}
                </Typography>
                <Typography variant="caption" sx={{ color: tk.inkLighter }}>
                  {line1} · {line2}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 16 }}>{trophies[i] ?? ''}</Typography>
            </Stack>
          ))}
    </Card>
  );
}
