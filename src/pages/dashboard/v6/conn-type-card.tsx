import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { tk } from './tokens';
import { IcPlug } from './icons';
import { CardHeader } from './primitives';
import { CONN_TYPES } from './data';

export function ConnTypeCard() {
  return (
    <Card sx={{ p: 3 }}>
      <CardHeader icon={IcPlug} label="Tipo de conectores" />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        {CONN_TYPES.map(({ label, total, inUse, c, bg, desc }) => {
          const pct = Math.round((inUse / total) * 100);
          return (
            <Box key={label} sx={{ bgcolor: bg, borderRadius: 2, p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: tk.inkDarkest }}>{label}</Typography>
                <Typography variant="subtitle2" sx={{ color: tk.inkDarkest }}>
                  {inUse}
                  <Typography component="span" variant="body2" sx={{ color: tk.inkLighter }}>/{total}</Typography>
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: tk.inkLighter, display: 'block', mb: 1 }}>{desc}</Typography>
              <Box sx={{ height: 5, bgcolor: tk.white, borderRadius: '10px', overflow: 'hidden' }}>
                <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: c, borderRadius: '10px' }} />
              </Box>
              <Typography variant="caption" sx={{ color: c, fontWeight: 600, mt: 0.5, display: 'block' }}>{pct}% en uso</Typography>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}
