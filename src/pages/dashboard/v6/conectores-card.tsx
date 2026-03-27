import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { fetcher, endpoints } from 'src/lib/axios';

import { type ConnectorTypeBreakdown, type ConnectorTypesMetricsResponse } from 'src/types/dashboard';

import { tk } from './tokens';
import { CardHeader } from './primitives';
import { IcSignal, IcTotal, IcMenunekes, IcCCS, IcChademo, IcSchuko } from './icons';

// ----------------------------------------------------------------------

/** Column config: maps API key → display label + icon */
const COLUMNS = [
  { key: 'total', label: 'Total', Icon: IcTotal },
  { key: 'mennekes', label: 'Mennekes', Icon: IcMenunekes },
  { key: 'ccs2', label: 'CCS', Icon: IcCCS },
  { key: 'chademo', label: 'CHAdeMO', Icon: IcChademo },
  { key: 'schuko', label: 'Schuko', Icon: IcSchuko },
] as const;

type ConnectorKey = (typeof COLUMNS)[number]['key'];

function pct(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

// ----------------------------------------------------------------------

export function ConectoresCard() {
  const [metrics, setMetrics] = useState<Record<ConnectorKey, ConnectorTypeBreakdown | null>>({
    total: null,
    mennekes: null,
    ccs2: null,
    chademo: null,
    schuko: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const response: {
          status_code: number;
          data: ConnectorTypesMetricsResponse | null;
          error: string | null;
        } = await fetcher(endpoints.dashboard.connectors.typesMetrics);

        if (cancelled || !response.data) return;

        const byKey: Record<string, ConnectorTypeBreakdown> = {};
        const totals: ConnectorTypeBreakdown = {
          connectorType: 'total',
          total: 0,
          available: 0,
          inUse: 0,
          faulted: 0,
          disconnected: 0,
        };

        for (const connector of response.data.data) {
          const key = connector.connectorType.toLowerCase();
          byKey[key] = connector;

          totals.total += connector.total;
          totals.available += connector.available;
          totals.inUse += connector.inUse;
          totals.faulted += connector.faulted;
          totals.disconnected += connector.disconnected;
        }

        setMetrics({
          total: totals,
          mennekes: byKey.mennekes ?? null,
          ccs2: byKey.ccs2 ?? null,
          chademo: byKey.chademo ?? null,
          schuko: byKey.schuko ?? null,
        });
      } catch (error) {
        console.error('Error fetching connectors metrics:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <Card sx={{ p: 3 }}>
      <CardHeader icon={IcSignal} label="Información por tipos de conector" />
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${COLUMNS.length},1fr)`, gap: 0.5 }}>

        {/* Row 1: Icons + labels */}
        {COLUMNS.map(({ key, label, Icon }) => (
          <Box
            key={key}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, pb: 1 }}
          >
            <Icon size={20} color={tk.inkDark} />
            <Typography variant="caption" sx={{ color: tk.inkLighter, textAlign: 'center', lineHeight: 1.2 }}>
              {loading ? <Skeleton width={40} /> : (metrics[key] ? label : '...')}
            </Typography>
          </Box>
        ))}

        {/* Section: Disponibilidad */}
        <Box sx={{ gridColumn: '1/-1', bgcolor: tk.skyLighter, borderRadius: 1.5, p: '4px 10px', mb: 1, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: tk.inkLight }}>
            Disponibilidad
          </Typography>
        </Box>

        {COLUMNS.map(({ key }) => (
          <Box key={`${key}-av`} sx={{ textAlign: 'center', pb: 1 }}>
            <Typography variant="h6" sx={{ color: tk.inkDarkest }}>
              {loading ? <Skeleton width={30} sx={{ mx: 'auto' }} /> : pct(metrics[key]?.available ?? 0, metrics[key]?.total ?? 0)}
            </Typography>
          </Box>
        ))}

        {/* Section: En uso */}
        <Box sx={{ gridColumn: '1/-1', bgcolor: tk.skyLighter, borderRadius: 1.5, p: '4px 10px', mb: 1, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: tk.inkLight }}>
            En uso
          </Typography>
        </Box>

        {COLUMNS.map(({ key }) => (
          <Box key={`${key}-oc`} sx={{ textAlign: 'center', pb: 1 }}>
            <Typography variant="h6" sx={{ color: tk.inkDarkest }}>
              {loading ? <Skeleton width={30} sx={{ mx: 'auto' }} /> : pct(metrics[key]?.inUse ?? 0, metrics[key]?.total ?? 0)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
