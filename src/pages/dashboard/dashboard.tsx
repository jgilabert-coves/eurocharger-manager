import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';

import { formatNumber } from 'src/utils/format-number';

import { CONFIG } from 'src/global-config';
import { endpoints, fetcher } from 'src/lib/axios';

import { StatsChart } from 'src/components/cards/stats-chart';

import {
  type DashboardGrowthStats,
  type DashboardRevenueStats,
  type DashboardChargingStats,
} from 'src/types/dashboard';

import { TopList } from './top-list';
import { TransTable } from './tables';
import { HeatmapCard } from './heatmap-card';
import { ChargersCard } from './chargers-card';
import { ConnTypeCard } from './conn-type-card';
import { ConectoresCard } from './conectores-card';
import { MantenimientoCard } from './mantenimiento-card';
import { KpiCard } from '../../components/cards/kpi-card';
import { DashboardContent } from '../../layouts/dashboard';

const metadata = { title: `Dashboard | ${CONFIG.appName}` };

export default function DashboardV6Page() {
  const { data: chargesRes } = useQuery({
    queryKey: ['dashboard', 'activeTransactions'],
    queryFn: () => fetcher(endpoints.dashboard.activeTransactions),
  });
  const { data: revenueRes } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: () => fetcher(endpoints.dashboard.revenue),
  });
  const { data: usersRes } = useQuery({
    queryKey: ['dashboard', 'activeUsers'],
    queryFn: () => fetcher(endpoints.dashboard.activeUsers),
  });
  const { data: alarmsRes } = useQuery({
    queryKey: ['dashboard', 'alarms'],
    queryFn: () => fetcher(endpoints.dashboard.alarms),
  });

  const activeCharges = chargesRes?.data as DashboardChargingStats | undefined;
  const revenueStats = revenueRes?.data as DashboardRevenueStats | undefined;
  const appUserGrowth = usersRes?.data as DashboardGrowthStats | undefined;
  const alarmsGrowth = alarmsRes?.data as DashboardGrowthStats | undefined;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Resumen general
        </Typography>

        {/* KPI Cards — 4 columns */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              title="Recargas activas"
              value={activeCharges ? formatNumber(activeCharges.activeCharges) : '...'}
              subtitle={
                activeCharges
                  ? `Promedio por cargador: ${formatNumber(activeCharges.avgChargesPerChargepoint, { decimals: 2 })}`
                  : '...'
              }
              icon="solar:battery-charge-bold"
              palette="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              title="Ingresos"
              value={
                revenueStats
                  ? formatNumber(revenueStats.totalRevenue, { decimals: 2, suffix: '€' })
                  : '...'
              }
              subtitle={
                revenueStats
                  ? `Promedio por recarga: ${formatNumber(revenueStats.avgRevenuePerCharge, { decimals: 2, suffix: '€' })}`
                  : '...'
              }
              icon="solar:wallet-money-bold"
              palette="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              title="Usuarios activos"
              value={appUserGrowth ? formatNumber(appUserGrowth.total) : '...'}
              subtitle={
                appUserGrowth
                  ? `+${formatNumber(appUserGrowth.todayGrowth, { decimals: 2 })} respecto a ayer`
                  : '...'
              }
              icon="solar:users-group-rounded-bold"
              palette="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              title="Alarmas activas"
              value={alarmsGrowth ? formatNumber(alarmsGrowth.total) : '...'}
              subtitle={
                alarmsGrowth
                  ? `+${formatNumber(alarmsGrowth.todayGrowth, { decimals: 2 })} respecto a ayer`
                  : '...'
              }
              icon="solar:bell-bing-bold"
              palette="primary"
            />
          </Grid>
        </Grid>

        {/* Stats — full width */}
        <Box sx={{ mb: 3 }}>
          <StatsChart
            icon="solar:chart-bold"
            label="Estadísticas"
            endpoint={endpoints.dashboard.stats}
          />
        </Box>

        {/* Chargers + Connectors */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChargersCard />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ConectoresCard />
            <ConnTypeCard />
          </Grid>
        </Grid>

        {/* Top lists */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TopList title="Top clientes" isClient />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TopList title="Top cargadores" />
          </Grid>
        </Grid>

        {/* Tables */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 12 }}>
            <TransTable />
          </Grid>
        </Grid>

        {/* Heatmap + Maintenance */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <HeatmapCard />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <MantenimientoCard />
          </Grid>
        </Grid>
      </DashboardContent>
    </>
  );
}
