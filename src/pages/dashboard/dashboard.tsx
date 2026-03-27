import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

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
  const [activeCharges, setActiveCharges] = useState<DashboardChargingStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<DashboardRevenueStats | null>(null);
  const [appUserGrowth, setAppUserGrowth] = useState<DashboardGrowthStats | null>(null);
  const [alarmsGrowth, setAlarmsGrowth] = useState<DashboardGrowthStats | null>(null);
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      Promise.all([
        fetcher(endpoints.dashboard.activeTransactions),
        fetcher(endpoints.dashboard.revenue),
        fetcher(endpoints.dashboard.activeUsers),
        fetcher(endpoints.dashboard.alarms),
      ]).then(([chargesData, revenueData, appUserGrowthData, alarmsGrowthData]) => {
        console.log('Dashboard data fetched:', {
          chargesData,
          revenueData,
          appUserGrowthData,
          alarmsGrowthData,
        });
        setActiveCharges(chargesData.data);
        setRevenueStats(revenueData.data);
        setAppUserGrowth(appUserGrowthData.data);
        setAlarmsGrowth(alarmsGrowthData.data);
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

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
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key="active-charges">
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key="revenue-stats">
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key="active-users">
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key="active-alarms">
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
