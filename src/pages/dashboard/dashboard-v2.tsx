import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import { BarChart } from '@mui/x-charts/BarChart';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import ToggleButton from '@mui/material/ToggleButton';
import { useTheme, alpha } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { DashboardContent } from '../../layouts/dashboard';

// ----------------------------------------------------------------------

const metadata = { title: `Dashboard V2 | ${CONFIG.appName}` };

// Mock data
const KPI_CARDS = [
  {
    title: 'Energía entregada',
    value: '842 kWh',
    subtitle: '≈ 84 kWh por cargador',
    delta: '+12.2%',
    trend: 'up' as const,
    icon: 'solar:bolt-bold',
    color: 'success' as const,
  },
  {
    title: 'Recargas activas',
    value: '71',
    subtitle: '≈ 7.3 por cargador',
    delta: '+2.0%',
    trend: 'up' as const,
    icon: 'solar:battery-charge-bold',
    color: 'info' as const,
  },
  {
    title: 'Usuarios activos',
    value: '847',
    subtitle: '+23 esta semana',
    delta: '+3.1%',
    trend: 'up' as const,
    icon: 'solar:users-group-rounded-bold',
    color: 'warning' as const,
  },
  {
    title: 'Ingresos',
    value: '1.641€',
    subtitle: 'Media: 23,1€/recarga',
    delta: '-8.0%',
    trend: 'down' as const,
    icon: 'solar:wallet-money-bold',
    color: 'error' as const,
  },
];

const CHARGER_STATUS = [
  { label: 'Disponibles', value: 7, color: '#22c55e' },
  { label: 'Ocupados', value: 2, color: '#3b82f6' },
  { label: 'Reservados', value: 3, color: '#f59e0b' },
  { label: 'Averiados', value: 0, color: '#ef4444' },
  { label: 'Sin conexión', value: 1, color: '#9ca3af' },
];

const CONNECTOR_TYPES = [
  { label: 'Mennekes', total: 89, inUse: 34, type: 'AC' },
  { label: 'CCS', total: 48, inUse: 21, type: 'DC' },
  { label: 'CHAdeMO', total: 0, inUse: 0, type: 'DC' },
  { label: 'Schuko', total: 0, inUse: 0, type: 'AC' },
];

const TOP_CLIENTS = [
  { name: 'Jonay Gilabert', recargas: 12, euros: '94,17€' },
  { name: 'Pablo Melón', recargas: 12, euros: '94,12€' },
  { name: 'Alejandro Martínez', recargas: 12, euros: '94,12€' },
  { name: 'Kike Escalante', recargas: 12, euros: '94,12€' },
];

const TOP_CHARGERS = [
  { name: 'Parque Majuelo 2', recargas: 125, euros: '214,40€' },
  { name: 'Ayto. Pedreguer', recargas: 125, euros: '214,40€' },
  { name: 'Universidad Málaga 2', recargas: 125, euros: '714,40€' },
  { name: 'Copinsa Oficina', recargas: 125, euros: '214,40€' },
];

const ACTIVE_CHARGERS = [
  { id: 'EUR*2134', name: 'Campus Medicina 1', city: 'Málaga', conn: '1/2', full: false },
  { id: 'EUR*2111', name: 'Campus Medicina 2', city: 'Sevilla', conn: '2/2', full: true },
  { id: 'EUR*9814', name: 'Campus Medicina 3', city: 'Valencia', conn: '1/3', full: false },
  { id: 'EUR*1851', name: 'Campus Medicina 4', city: 'Málaga', conn: '1/1', full: true },
];

const RECENT_TRANSACTIONS = [
  { id: 'EUR*2134', user: 'Alejandro Martínez', station: 'Campus Medicina 1', kwh: 14.2, euros: '6,82€', status: 'CARGANDO' },
  { id: 'EUR*2111', user: 'Jonay Gilabert', station: 'Campus Medicina 2', kwh: 32.1, euros: '15,41€', status: 'CARGANDO' },
  { id: 'EUR*9814', user: 'Kike Escalante', station: 'Campus Medicina 3', kwh: 8.7, euros: '4,18€', status: 'CARGANDO' },
  { id: 'EUR*1851', user: 'Pablo Melón', station: 'Campus Medicina 4', kwh: 45.0, euros: '21,60€', status: 'FINALIZADO' },
];

const MAINTENANCE = [
  { label: 'Alarmas', value: 2, delta: '+0.2%', trend: 'up' as const, color: 'error' as const },
  { label: 'Averías', value: 3, delta: '+1.2%', trend: 'up' as const, color: 'error' as const },
  { label: 'Consultas', value: 41, delta: '-0.1%', trend: 'down' as const, color: 'info' as const },
  { label: 'Sugerencias', value: 13, delta: '0%', trend: 'neutral' as const, color: 'warning' as const },
];

type Period = 'day' | 'week' | 'month' | 'year';

const CHART_DATA: Record<Period, { labels: string[]; recargas: number[]; ingresos: number[] }> = {
  day: {
    labels: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'],
    recargas: [1, 1, 2, 3, 8, 15, 22, 21, 18, 14, 7, 2],
    ingresos: [20, 25, 40, 65, 190, 370, 530, 500, 430, 340, 150, 50],
  },
  week: {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    recargas: [150, 180, 210, 195, 240, 170, 148],
    ingresos: [2100, 2050, 1980, 1900, 1850, 1720, 1641],
  },
  month: {
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    recargas: [1200, 1400, 1600, 1640],
    ingresos: [18900, 21200, 23100, 24310],
  },
  year: {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    recargas: [3800, 4100, 4450, 4800, 5200, 5550, 5850, 6100, 6350, 6550, 6700, 6842],
    ingresos: [18500, 19700, 21000, 22200, 23400, 24500, 25500, 26300, 26900, 27400, 28000, 28490],
  },
};

const HEATMAP_DATA = {
  days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  hours: ['08h', '10h', '12h', '14h', '16h', '18h', '20h'],
  values: [
    [2, 3, 4, 5, 4, 2, 1],
    [3, 5, 8, 9, 7, 3, 2],
    [5, 8, 12, 15, 11, 6, 4],
    [6, 10, 14, 18, 13, 7, 5],
    [5, 9, 12, 16, 12, 6, 4],
    [3, 6, 9, 11, 8, 4, 3],
    [2, 4, 6, 8, 6, 3, 2],
  ],
};

// ----------------------------------------------------------------------

export default function DashboardV2Page() {
  const theme = useTheme();
  const [period, setPeriod] = useState<Period>('week');

  const chartData = CHART_DATA[period];

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Resumen general
        </Typography>

        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {KPI_CARDS.map((kpi) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={kpi.title}>
              <KpiCard {...kpi} />
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6">Actividad</Typography>
                <ToggleButtonGroup
                  size="small"
                  value={period}
                  exclusive
                  onChange={(_, v) => v && setPeriod(v)}
                >
                  <ToggleButton value="day">Día</ToggleButton>
                  <ToggleButton value="week">Semana</ToggleButton>
                  <ToggleButton value="month">Mes</ToggleButton>
                  <ToggleButton value="year">Año</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              <BarChart
                height={300}
                series={[
                  { data: chartData.recargas, label: 'Recargas', color: theme.palette.primary.main },
                  { data: chartData.ingresos.map((v) => v / 100), label: 'Ingresos (x100€)', color: theme.palette.success.main },
                ]}
                xAxis={[{ data: chartData.labels, scaleType: 'band' }]}
                margin={{ top: 20, bottom: 30, left: 50, right: 20 }}
                borderRadius={4}
              />
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Estado cargadores
              </Typography>
              <PieChart
                height={220}
                series={[
                  {
                    data: CHARGER_STATUS.filter((s) => s.value > 0).map((s, i) => ({
                      id: i,
                      value: s.value,
                      label: s.label,
                      color: s.color,
                    })),
                    paddingAngle: 2,
                    cornerRadius: 4,
                    innerRadius: 50,
                  },
                ]}
                margin={{ top: 10, bottom: 10, left: 10, right: 120 }}
              />
              <Stack spacing={1} sx={{ mt: 2 }}>
                {CHARGER_STATUS.map((s) => (
                  <Stack key={s.label} direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
                      <Typography variant="body2" color="text.secondary">
                        {s.label}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle2">{s.value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Connectors + Heatmap */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Conectores
              </Typography>
              <Stack spacing={2}>
                {CONNECTOR_TYPES.map((c) => {
                  const pct = c.total > 0 ? (c.inUse / c.total) * 100 : 0;
                  return (
                    <Box key={c.label}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2">{c.label}</Typography>
                          <Chip label={c.type} size="small" variant="outlined" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {c.inUse}/{c.total}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        color={c.type === 'DC' ? 'info' : 'success'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Mapa de calor — uso por día y hora
              </Typography>
              <HeatmapGrid data={HEATMAP_DATA} />
            </Card>
          </Grid>
        </Grid>

        {/* Top Lists */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Top clientes
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">Recargas</TableCell>
                      <TableCell align="right">Importe</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {TOP_CLIENTS.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell align="right">{c.recargas}</TableCell>
                        <TableCell align="right">{c.euros}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Top cargadores
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Estación</TableCell>
                      <TableCell align="right">Recargas</TableCell>
                      <TableCell align="right">Importe</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {TOP_CHARGERS.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell align="right">{c.recargas}</TableCell>
                        <TableCell align="right">{c.euros}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>

        {/* Active Chargers + Recent Transactions */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Cargadores en uso
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Estación</TableCell>
                      <TableCell>Ciudad</TableCell>
                      <TableCell align="center">Conectores</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ACTIVE_CHARGERS.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {c.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.city}</TableCell>
                        <TableCell align="center">
                          <Label color={c.full ? 'error' : 'success'} variant="soft">
                            {c.conn}
                          </Label>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Últimas recargas
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Estación</TableCell>
                      <TableCell align="right">kWh</TableCell>
                      <TableCell align="right">Importe</TableCell>
                      <TableCell align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {RECENT_TRANSACTIONS.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.user}</TableCell>
                        <TableCell>{t.station}</TableCell>
                        <TableCell align="right">{t.kwh}</TableCell>
                        <TableCell align="right">{t.euros}</TableCell>
                        <TableCell align="center">
                          <Label
                            color={t.status === 'CARGANDO' ? 'info' : 'success'}
                            variant="soft"
                          >
                            {t.status}
                          </Label>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>

        {/* Maintenance Summary */}
        <Grid container spacing={2}>
          {MAINTENANCE.map((m) => (
            <Grid size={{ xs: 6, md: 3 }} key={m.label}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {m.label}
                </Typography>
                <Typography variant="h3">{m.value}</Typography>
                <Label
                  color={m.trend === 'up' ? 'error' : m.trend === 'down' ? 'success' : 'warning'}
                  variant="soft"
                  sx={{ mt: 1 }}
                >
                  {m.delta}
                </Label>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DashboardContent>
    </>
  );
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

type KpiCardProps = {
  title: string;
  value: string;
  subtitle: string;
  delta: string;
  trend: 'up' | 'down';
  icon: string;
  color: 'success' | 'info' | 'warning' | 'error';
};

function KpiCard({ title, value, subtitle, delta, trend, icon, color }: KpiCardProps) {
  const theme = useTheme();
  const palette = theme.palette[color];

  return (
    <Card
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        borderLeft: `4px solid ${palette.main}`,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            bgcolor: alpha(palette.main, 0.12),
            color: palette.main,
          }}
        >
          <Iconify icon={icon} width={24} />
        </Box>
      </Stack>
      <Typography variant="h4">{value}</Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Label color={trend === 'up' ? 'success' : 'error'} variant="soft">
          {trend === 'up' ? '▲' : '▼'} {delta}
        </Label>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

function HeatmapGrid({ data }: { data: typeof HEATMAP_DATA }) {
  const theme = useTheme();
  const maxVal = Math.max(...data.values.flat());

  const getColor = (val: number) => {
    if (val === 0) return theme.palette.grey[100];
    const intensity = val / maxVal;
    return alpha(theme.palette.primary.main, 0.1 + intensity * 0.8);
  };

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `60px repeat(${data.days.length}, 1fr)`,
          gap: 0.5,
          minWidth: 400,
        }}
      >
        {/* Header row */}
        <Box />
        {data.days.map((day) => (
          <Typography
            key={day}
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: 'center', fontWeight: 600 }}
          >
            {day}
          </Typography>
        ))}

        {/* Data rows */}
        {data.hours.map((hour, hi) => (
          <>
            <Typography
              key={`label-${hour}`}
              variant="caption"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}
            >
              {hour}
            </Typography>
            {data.days.map((day, di) => (
              <Box
                key={`${hour}-${day}`}
                sx={{
                  height: 36,
                  borderRadius: 1,
                  bgcolor: getColor(data.values[hi][di]),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s',
                  '&:hover': { transform: 'scale(1.1)', zIndex: 1 },
                }}
              >
                <Typography variant="caption" fontWeight={600}>
                  {data.values[hi][di]}
                </Typography>
              </Box>
            ))}
          </>
        ))}
      </Box>
    </Box>
  );
}
