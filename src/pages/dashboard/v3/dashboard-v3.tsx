import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { DashboardContent } from '../../../layouts/dashboard';

import { tk } from './tokens';
import { SPARK_A, SPARK_B, TOP_CLIENTS, TOP_CHARGERS } from './data';
import { Topbar } from './topbar';
import { SparkCard } from './spark-card';
import { StatsCard } from './stats-card';
import { ChargersCard } from './chargers-card';
import { ConectoresCard } from './conectores-card';
import { ConnTypeCard } from './conn-type-card';
import { TopList } from './top-list';
import { InUseTable, TransTable } from './tables';
import { HeatmapCard } from './heatmap-card';
import { MantenimientoCard } from './mantenimiento-card';

const metadata = { title: `Dashboard V3 | ${CONFIG.appName}` };

export default function DashboardV3Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent disablePadding>
        <div
          style={{
            background: tk.skyLighter,
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
          }}
        >
          <Topbar />
          <div
            style={{
              overflowY: 'auto',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Row 1: Spark cards + Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
              <SparkCard
                title="Energía"
                value="842 kWh"
                sub="≈ 84 kWh por cargador"
                delta="+12.2%"
                up
                spark={SPARK_A}
                color={tk.green}
              />
              <SparkCard
                title="Recargas"
                value="71"
                sub="≈ 7.3 por cargador"
                delta="+2%"
                up
                spark={SPARK_B}
                color={tk.blueBase}
              />
              <StatsCard />
            </div>

            {/* Row 2: Chargers + Connectors */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                alignItems: 'stretch',
              }}
            >
              <ChargersCard />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ConectoresCard />
                <ConnTypeCard />
              </div>
            </div>

            {/* Row 3: Top lists */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TopList title="Top clientes" items={TOP_CLIENTS} isClient />
              <TopList title="Top cargadores" items={TOP_CHARGERS} />
            </div>

            {/* Row 4: Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InUseTable />
              <TransTable />
            </div>

            {/* Row 5: Heatmap + Maintenance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <HeatmapCard />
              <MantenimientoCard />
            </div>
          </div>
        </div>
      </DashboardContent>
    </>
  );
}
