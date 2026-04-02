import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { fDateTime, fToNow } from 'src/utils/format-time';

import { type Alarm } from 'src/types/alarms';

// ----------------------------------------------------------------------

const STATUS_COLORS: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  ACTIVE: 'error',
  FAULTED: 'error',
  RESOLVED: 'success',
  PENDING: 'warning',
};

type Props = { alarm: Alarm };

export function AlarmCard({ alarm }: Props) {
  const station = alarm.chargingStation;
  const allConnectors = station?.chargepoints?.flatMap((cp) => cp.connectors ?? []) ?? [];

  const statusKey = alarm.status?.toUpperCase();

  return (
    <Card sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            {station?.name ?? '—'}
          </Typography>
          {station?.address && (
            <Typography variant="caption" color="text.secondary">
              {station.address}
            </Typography>
          )}
        </Stack>
        <Chip
          label={alarm.status}
          color={STATUS_COLORS[statusKey] ?? 'default'}
          size="small"
          sx={{ fontWeight: 600, flexShrink: 0 }}
        />
      </Stack>

      <Divider />

      {/* Rows */}
      <Stack spacing={1}>
        {/* Error */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="caption" color="text.disabled" sx={{ minWidth: 80 }}>
            Error
          </Typography>
          <Stack alignItems="flex-end">
            <Typography variant="caption" fontWeight={700}>
              {alarm.errorCode ?? '—'}
            </Typography>
            {alarm.errorInfo && (
              <Typography variant="caption" color="text.secondary">
                {alarm.errorInfo}
              </Typography>
            )}
          </Stack>
        </Stack>

        {/* Conectores */}
        {allConnectors.length > 0 && (
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.disabled" sx={{ minWidth: 80 }}>
              Conectores
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5} justifyContent="flex-end">
              {allConnectors.map((conn) => (
                <Chip
                  key={conn.id}
                  label={`${conn.name ?? `C${conn.id}`}${conn.power ? ` · ${conn.power} kW` : ''}`}
                  size="small"
                  variant="soft"
                  color="default"
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
              ))}
            </Stack>
          </Stack>
        )}

        {/* Fecha */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.disabled" sx={{ minWidth: 80 }}>
            Fecha
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption">{alarm.date ? fDateTime(alarm.date) : '—'}</Typography>
            {alarm.date && (
              <Typography variant="caption" color="text.secondary">
                {fToNow(alarm.date)}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}
