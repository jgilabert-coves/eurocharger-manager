import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import { tk } from './tokens';
import { IcClock } from './icons';
import { CardHeader } from './primitives';
import { DAYS, HOURS, HEATMAP } from './data';

export function HeatmapCard() {
  const maxV = Math.max(...HEATMAP.flat());

  const getColor = (v: number) => {
    const p = v / maxV;
    if (p > 0.8) return tk.inkDark;
    if (p > 0.5) return tk.inkLighter;
    if (p > 0.3) return tk.skyBase;
    return tk.skyLight;
  };

  return (
    <Card sx={{ p: 3 }}>
      <CardHeader icon={IcClock} label="Horarios de afluencia" />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '40px repeat(7,1fr)',
          gap: '4px',
          alignItems: 'center',
        }}
      >
        <Box />
        {DAYS.map((d) => (
          <Typography key={d} variant="caption" sx={{ color: tk.skyDark, textAlign: 'center' }}>
            {d}
          </Typography>
        ))}
        {HEATMAP.map((row, ri) => [
          <Typography key={`l${ri}`} variant="caption" sx={{ color: tk.skyDark, textAlign: 'right', pr: 0.5 }}>
            {HOURS[ri]}
          </Typography>,
          ...row.map((v, ci) => (
            <Tooltip key={`${ri}-${ci}`} title={`${DAYS[ci]} ${HOURS[ri]}: ${v} recargas`} arrow placement="top">
              <Box sx={{ height: 20, borderRadius: 1, bgcolor: getColor(v), cursor: 'default' }} />
            </Tooltip>
          )),
        ])}
      </Box>
    </Card>
  );
}
