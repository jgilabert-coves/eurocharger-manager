import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { fetcher, endpoints } from 'src/lib/axios';

import { type TopUser, type TopChargepoint } from 'src/types/dashboard';

import { tk } from './tokens';
import { IcUsers, IcPlug } from './icons';
import { CardHeader } from './primitives';

// ----------------------------------------------------------------------

const trophies = ['🥇', '🥈', '🥉'];

type TopListProps = {
  title: string;
  isClient?: boolean;
};

export function TopList({ title, isClient }: TopListProps) {
  const [users, setUsers] = useState<TopUser[]>([]);
  const [chargepoints, setChargepoints] = useState<TopChargepoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const endpoint = isClient ? endpoints.dashboard.topUsers : endpoints.dashboard.topChargepoints;
        const response = await fetcher(endpoint);

        if (cancelled) return;
        if (isClient) {
          setUsers(response.data as TopUser[]);
        } else {
          setChargepoints(response.data as TopChargepoint[]);
        }
      } catch (error) {
        console.error(`Error fetching top ${isClient ? 'users' : 'chargepoints'}:`, error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isClient]);

  const Icon = isClient ? IcUsers : IcPlug;

  const items = isClient
    ? users.map((u) => ({ key: u.id, name: u.name, line1: `↻ ${u.totalCharges} recargas`, line2: `≈ ${u.totalSpent.toFixed(2)} €` }))
    : chargepoints.map((cp) => ({ key: cp.id, name: cp.name, line1: `↻ ${cp.totalCharges} recargas`, line2: `≈ ${cp.totalRevenue.toFixed(2)} €` }));

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <CardHeader icon={Icon} label={title} />
      </Stack>

      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1, borderBottom: `1px solid ${tk.skyLight}` }}>
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
                  ? name.split(' ').map((w) => w[0]).join('').slice(0, 2)
                  : 'EC'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: tk.inkDarkest }}>{name}</Typography>
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
