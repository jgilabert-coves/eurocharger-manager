import type { StatsPeriodData } from 'src/types/dashboard';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { DeltaBadge } from 'src/pages/dashboard/primitives';
import { tk, badgeColors } from 'src/pages/dashboard/tokens';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PERIODS = ['Semana', 'Mes', 'Año', 'Periodo'] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_DAYS: Record<string, number> = {
  Semana: 7,
  Mes: 31,
  Año: 366,
};

function getDateRange(period: Period): { from: string; to: string } | null {
  if (period === 'Periodo') return null;
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - PERIOD_DAYS[period]);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

// ----------------------------------------------------------------------

export type StatsChartProps = {
  /** Iconify icon name (e.g. "solar:chart-bold") */
  icon: string;
  /** Card header label */
  label: string;
  /** API endpoint base (e.g. "/dashboard/stats") — will append ?from=&to= */
  endpoint: string;
};

const EMPTY: StatsPeriodData = { labels: ['—'], series: [] };

export function StatsChart({ icon, label, endpoint }: StatsChartProps) {
  const [sel, setSel] = useState(0);
  const [period, setPeriod] = useState<Period>('Semana');
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Cache keyed by "from|to" so identical ranges (including preset ones) never re-fetch
  const cache = useRef<Record<string, StatsPeriodData>>({});
  const [data, setData] = useState<StatsPeriodData>(EMPTY);

  const fetchByRange = useCallback(
    async (from: string, to: string) => {
      const key = `${from}|${to}`;

      if (cache.current[key]) {
        setData(cache.current[key]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { fetcher } = await import('src/lib/axios');
        const response = await fetcher(`${endpoint}?from=${from}&to=${to}`);
        const result = response.data as StatsPeriodData;
        cache.current[key] = result;
        setData(result);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setData(EMPTY);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  // Fetch when period changes (preset periods)
  useEffect(() => {
    const range = getDateRange(period);
    if (range) {
      fetchByRange(range.from, range.to);
    }
  }, [period, fetchByRange]);

  // Fetch when custom dates change
  useEffect(() => {
    if (period !== 'Periodo' || !dateFrom || !dateTo) return;
    const d1 = new Date(dateFrom);
    const d2 = new Date(dateTo);
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime()) || d2 < d1) return;
    fetchByRange(dateFrom, dateTo);
  }, [dateFrom, dateTo, period, fetchByRange]);

  const { labels: xLabels, series } = data;
  const active = series[sel];

  const seriesData = active
    ? (() => {
        const N = active.dataPoints.length;
        const NL = xLabels.length;
        return xLabels.map((_, i) => {
          const srcIdx = NL > 1 ? Math.round((i * (N - 1)) / (NL - 1)) : 0;
          const val = active.dataPoints[srcIdx];
          return typeof val === 'number' ? val : 0;
        });
      })()
    : [];

  const filteredLabels = xLabels.map((l) => (l === '' ? ' ' : l));

  const handlePeriodChange = (_: unknown, v: string | null) => {
    if (!v) return;
    setSel(0);
    setPeriod(v as Period);
  };

  const skeletonCount = series.length || 4;

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon={icon} width={16} sx={{ color: tk.inkDarkest }} />
          <Typography variant="subtitle2" sx={{ color: tk.inkDarkest }}>
            {label}
          </Typography>
        </Stack>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={period}
          onChange={handlePeriodChange}
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
      </Stack>

      {/* Custom date range picker */}
      {period === 'Periodo' && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 1.5, p: 1, bgcolor: tk.skyLighter, borderRadius: 2 }}
        >
          <Typography variant="caption" sx={{ color: tk.inkLighter }}>
            Desde
          </Typography>
          <TextField
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            slotProps={{ input: { sx: { fontSize: 12, p: '4px 8px', color: tk.inkDarkest } } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <Typography variant="caption" sx={{ color: tk.inkLighter }}>
            Hasta
          </Typography>
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
      {loading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${skeletonCount},1fr)`,
            gap: 1,
            mb: 1,
          }}
        >
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Box
              key={i}
              sx={{
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Skeleton variant="text" width={60} height={16} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width={50} height={28} sx={{ mb: 0.5 }} />
              <Skeleton variant="rounded" width={56} height={22} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      ) : (
        series.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${series.length},1fr)`,
              gap: 1,
              mb: 1,
            }}
          >
            {series.map(({ label: sLabel, value, delta }, i) => {
              const { bg, color } = badgeColors(delta);
              return (
                <Box
                  key={sLabel}
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
                  <Typography variant="caption" sx={{ color: tk.inkLighter, mb: 0.5 }}>
                    {sLabel}
                  </Typography>
                  <Typography variant="h5" sx={{ color: tk.inkDarkest, mb: 0.5 }}>
                    {value}
                  </Typography>
                  <DeltaBadge delta={delta} bg={bg} color={color} />
                </Box>
              );
            })}
          </Box>
        )
      )}

      {/* LineChart */}
      {loading ? (
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />
      ) : (
        active && (
          <LineChart
            height={220}
            series={[
              {
                data: seriesData,
                color: active.color,
                showMark: false,
                area: true,
                curve: 'catmullRom',
                valueFormatter: (v: number | null, { dataIndex }: { dataIndex: number }) =>
                  active.formattedDataPoints?.[dataIndex] ?? String(v ?? ''),
              },
            ]}
            xAxis={[
              {
                data: filteredLabels.map((_, i) => i),
                scaleType: 'linear',
                valueFormatter: (v: number) => filteredLabels[v] ?? '',
                tickLabelStyle: { fontSize: 11, fill: tk.skyDark },
                min: 0,
                max: filteredLabels.length - 1,
              },
            ]}
            yAxis={[
              {
                min: 0,
                disableLine: true,
                disableTicks: true,
                tickLabelStyle: { fontSize: 11, fill: tk.skyDark },
              },
            ]}
            margin={{ top: 10, bottom: 28, left: 50, right: 10 }}
            grid={{ horizontal: true }}
            sx={{
              '& .MuiAreaElement-root': { fillOpacity: 0.15 },
              '& .MuiChartsGrid-line': { stroke: tk.skyLight, strokeDasharray: '3 3' },
              '& .MuiChartsAxis-line': { stroke: tk.skyLight },
              '& .MuiChartsAxis-tick': { stroke: 'transparent' },
            }}
          />
        )
      )}
    </Card>
  );
}
