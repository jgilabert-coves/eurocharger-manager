import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { IcChart } from './icons';
import { tk, badgeColors } from './tokens';
import { CardHeader, DeltaBadge } from './primitives';
import {
  PERIODS,
  STATS_BY_PERIOD,
  EMPTY_PERIOD,
  getCustomPeriodData,
  type Period,
} from './data';

export function StatsCard() {
  const [sel, setSel] = useState(0);
  const [period, setPeriod] = useState<Period>('Semana');
  const [showCustom, setShowCustom] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const periodData =
    period === 'Periodo'
      ? getCustomPeriodData(dateFrom, dateTo) || EMPTY_PERIOD
      : STATS_BY_PERIOD[period];

  const statsData = periodData.data;
  const xLabels = periodData.labels;
  const active = statsData[sel];

  const N = active.dayVals.length;
  const NL = xLabels.length;
  const seriesData = xLabels.map((_, i) => {
    const srcIdx = Math.round((i * (N - 1)) / (NL - 1));
    const val = active.dayVals[srcIdx];
    return typeof val === 'number' ? val : 0;
  });

  const filteredLabels = xLabels.map((l) => (l === '' ? ' ' : l));

  return (
    <Card sx={{ p: 3 }}>
      <CardHeader
        icon={IcChart}
        label="Estadísticas"
        action={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={period}
            onChange={(_, v) => {
              if (!v) return;
              setPeriod(v);
              setShowCustom(v === 'Periodo');
            }}
            sx={{
              bgcolor: tk.skyLighter,
              borderRadius: 2,
              '& .MuiToggleButton-root': {
                border: 'none',
                fontSize: 12,
                fontWeight: 400,
                px: 1.5,
                py: 0.5,
                borderRadius: '8px !important',
                color: tk.inkLighter,
                textTransform: 'none',
                '&.Mui-selected': {
                  fontWeight: 600,
                  bgcolor: tk.white,
                  color: tk.inkDarkest,
                  boxShadow: `0 0 0 0.5px ${tk.skyLight}`,
                  '&:hover': { bgcolor: tk.white },
                },
              },
            }}
          >
            {PERIODS.map((p) => (
              <ToggleButton key={p} value={p}>
                {p}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        }
      />

      {showCustom && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 1.5, p: 1, bgcolor: tk.skyLighter, borderRadius: 2 }}
        >
          <Typography variant="caption" sx={{ color: tk.inkLighter }}>Desde</Typography>
          <TextField
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            slotProps={{ input: { sx: { fontSize: 12, p: '4px 8px', color: tk.inkDarkest } } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <Typography variant="caption" sx={{ color: tk.inkLighter }}>Hasta</Typography>
          <TextField
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            slotProps={{ input: { sx: { fontSize: 12, p: '4px 8px', color: tk.inkDarkest } } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
        </Stack>
      )}

      {/* Stat selectors */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, mb: 1 }}>
        {statsData.map(({ label, v, delta }, i) => {
          const { bg, color } = badgeColors(delta);
          return (
            <Box
              key={label}
              onClick={() => setSel(i)}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: sel === i ? tk.skyLighter : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: tk.inkLighter, mb: 0.5 }}>{label}</Typography>
              <Typography variant="h5" sx={{ color: tk.inkDarkest, mb: 0.5 }}>{v}</Typography>
              <DeltaBadge delta={delta} bg={bg} color={color} />
            </Box>
          );
        })}
      </Box>

      {/* MUI LineChart */}
      <LineChart
        height={220}
        series={[
          {
            data: seriesData,
            color: active.lineColor,
            showMark: false,
            area: true,
            curve: 'natural',
          },
        ]}
        xAxis={[
          {
            data: filteredLabels,
            scaleType: 'point',
            tickLabelStyle: { fontSize: 11, fill: tk.skyDark },
          },
        ]}
        yAxis={[{ disableLine: true, disableTicks: true, tickLabelStyle: { fontSize: 11, fill: tk.skyDark } }]}
        margin={{ top: 10, bottom: 28, left: 50, right: 10 }}
        grid={{ horizontal: true }}
        sx={{
          '& .MuiAreaElement-root': { fillOpacity: 0.15 },
          '& .MuiChartsGrid-line': { stroke: tk.skyLight, strokeDasharray: '3 3' },
          '& .MuiChartsAxis-line': { stroke: tk.skyLight },
          '& .MuiChartsAxis-tick': { stroke: 'transparent' },
        }}
      />
    </Card>
  );
}
