import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';

import { tk } from './tokens';
import { IcUsers, IcPlug } from './icons';
import { CardHeader } from './primitives';

type TopListItem = {
  name: string;
  recargas: number;
  euros: string;
};

type TopListProps = {
  title: string;
  items: TopListItem[];
  isClient?: boolean;
};

const trophies = ['🥇', '🥈', '🥉', ''];

export function TopList({ title, items, isClient }: TopListProps) {
  const Icon = isClient ? IcUsers : IcPlug;

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <CardHeader icon={Icon} label={title} />
        <Typography variant="caption" sx={{ color: tk.inkLighter }}>Últimas 24 horas</Typography>
      </Stack>
      {items.map(({ name, recargas, euros }, i) => (
        <Stack
          key={name}
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
              ? name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
              : 'EC'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: tk.inkDarkest }}>{name}</Typography>
            <Typography variant="caption" sx={{ color: tk.inkLighter }}>
              ↻ {recargas} recargas · ≈ {euros} €
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 16 }}>{trophies[i] || ''}</Typography>
        </Stack>
      ))}
    </Card>
  );
}
