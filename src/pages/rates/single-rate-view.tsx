import type { RateDetail, RateStretch, RateDetailResponse } from 'src/types/rates';

import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid2';
import {
  Box,
  Card,
  Chip,
  Stack,
  Divider,
  Typography,
  CardHeader,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { CONFIG } from 'src/global-config';
import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

const HUBJECT_CLIENT_ID = 18;

const DAYS: { key: keyof RateStretch; label: string }[] = [
  { key: 'monday', label: 'L' },
  { key: 'tuesday', label: 'M' },
  { key: 'wednesday', label: 'X' },
  { key: 'thursday', label: 'J' },
  { key: 'friday', label: 'V' },
  { key: 'saturday', label: 'S' },
  { key: 'sunday', label: 'D' },
];

// ----------------------------------------------------------------------

function StretchCard({ stretch, typeName }: { stretch: RateStretch; typeName: string }) {
  const isTimeBased = stretch.start_time !== null && stretch.end_time !== null;
  const isKwhBased = stretch.stretch_start !== null || stretch.stretch_end !== null;

  const formatTime = (t: string) => t.slice(0, 5);

  return (
    <Card variant="outlined">
      <CardContent>
        {/* Day chips */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
          {DAYS.map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              size="small"
              color={stretch[key] ? 'primary' : 'default'}
              variant={stretch[key] ? 'filled' : 'outlined'}
              sx={{ minWidth: 32, fontWeight: 700 }}
            />
          ))}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {/* Range */}
          <Grid size={12}>
            {isTimeBased && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Horario
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatTime(stretch.start_time!)} – {formatTime(stretch.end_time!)}
                </Typography>
              </Box>
            )}
            {isKwhBased && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rango kWh
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {stretch.stretch_start ?? 0} – {stretch.stretch_end ?? '∞'} kWh
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Price */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'primary.lighter',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Precio
              </Typography>
              <Typography variant="h6" color="primary.darkest" fontWeight="bold">
                {stretch.price.toFixed(3)} {typeName}
              </Typography>
            </Box>
          </Grid>

          {/* Inactivity fee */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: stretch.inactivity_fee > 0 ? 'warning.lighter' : 'action.hover',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Inactividad
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={stretch.inactivity_fee > 0 ? 'warning.dark' : 'text.disabled'}
              >
                {stretch.inactivity_fee > 0 ? `${stretch.inactivity_fee.toFixed(3)} €/min` : '—'}
              </Typography>
            </Box>
          </Grid>

          {/* Fixed price */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: stretch.fixed_price > 0 ? 'info.lighter' : 'action.hover',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Precio fijo
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={stretch.fixed_price > 0 ? 'info.dark' : 'text.disabled'}
              >
                {stretch.fixed_price > 0 ? `${stretch.fixed_price.toFixed(3)} €` : '—'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

export default function SingleRateView() {
  const { id } = useParams();
  const [rate, setRate] = useState<RateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetcher(endpoints.rates.single + id)
      .then((res: RateDetailResponse) => setRate(res.data))
      .catch((err) => console.error('Error fetching rate:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const isHubject = rate?.client_id === HUBJECT_CLIENT_ID;

  return (
    <>
      <Helmet>
        <title>{CONFIG.appName}</title>
      </Helmet>
      <DashboardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* ── Header ── */}
            <Box sx={{ mb: 5 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                <Typography variant="h3">{rate?.name}</Typography>
                <Chip
                  label={rate?.type_name ?? '—'}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                {isHubject ? (
                  <Chip label="Hubject" color="warning" size="small" />
                ) : rate?.client_id ? (
                  <Chip label={`${rate?.client_name ?? 'EuroCharger'}`} color="default" size="small" />
                ) : (
                  <Chip label="Tarifa Eurocharger" color="success" size="small" />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Tarifa #{rate?.id} · Creada el{' '}
                {rate?.created_at ? new Date(rate.created_at).toLocaleDateString('es-ES') : '—'}
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* ── Stretches ── */}
              <Grid size={{ xs: 12, md: isHubject ? 7 : 12 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Tramos
                </Typography>
                {rate?.stretches?.length ? (
                  <Stack spacing={2}>
                    {rate.stretches.map((stretch) => (
                      <StretchCard
                        key={stretch.id}
                        stretch={stretch}
                        typeName={rate.type_name ?? 'kWh'}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">No hay tramos definidos.</Typography>
                )}
              </Grid>

              {/* ── Hubject data ── */}
              {isHubject && rate?.hubjectRate && (
                <Grid size={{ xs: 12, md: 5 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Configuración Hubject
                  </Typography>
                  <Card variant="outlined">
                    <CardHeader
                      title={rate.hubjectRate.hubject_product_id}
                      subheader={`CPO ${rate.hubjectRate.operator_name}`}
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                    />
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Precio
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {rate.hubjectRate.hubject_price.toFixed(3)} {rate.type_name}
                          </Typography>
                        </Box>
                        {rate.hubjectRate.hubject_fixed_price !== null && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              Precio fijo
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {rate.hubjectRate.hubject_fixed_price.toFixed(3)} €
                            </Typography>
                          </Box>
                        )}
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Potencia máxima
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {rate.hubjectRate.charging_power} kW
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Potencia mínima
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {rate.hubjectRate.min_charging_power} kW
                          </Typography>
                        </Box>
                        {rate.hubjectRate.additional_reference && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              Referencia adicional
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {rate.hubjectRate.additional_reference}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </DashboardContent>
    </>
  );
}
