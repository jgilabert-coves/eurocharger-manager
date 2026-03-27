import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { tk } from './tokens';
import { MANT } from './data';
import { IcWrench } from './icons';
import { CardHeader } from './primitives';

export function MantenimientoCard() {
  return (
    <Card sx={{ p: 3 }}>
      <CardHeader icon={IcWrench} label="Mantenimiento" />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.5, mb: 2.5 }}>
        {MANT.map(({ label, v, delta, up }) => (
          <Box key={label} sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: tk.inkLighter, display: 'block', mb: 0.5 }}>{label}</Typography>
            <Typography variant="h4" sx={{ color: tk.inkDarkest, mb: 0.5 }}>{v}</Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: up === false ? tk.redBase : up ? tk.greenDarkest : tk.inkLighter,
              }}
            >
              {delta}
            </Typography>
          </Box>
        ))}
      </Box>
      <Button
        fullWidth
        variant="contained"
        sx={{
          bgcolor: tk.inkDarkest,
          color: tk.white,
          fontWeight: 700,
          borderRadius: 2,
          py: 1.25,
          textTransform: 'none',
          '&:hover': { bgcolor: tk.inkDark },
        }}
      >
        Planificar mantenimiento
      </Button>
    </Card>
  );
}
