import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { ConnectorTypeIcon } from 'src/components/chargepoint/connector-type-icon';
import { ChargerStatusLabel } from 'src/components/chargepoint/charger-status-label';

import { CONFIG } from '../../global-config';

type ChipColor = 'default' | 'success' | 'warning' | 'error' | 'info';

const CONNECTOR_STATUS_COLOR: Record<string, ChipColor> = {
  available: 'success',
  charging: 'info',
  preparing: 'info',
  finishing: 'info',
  suspendedev: 'warning',
  suspendedevse: 'warning',
  reserved: 'warning',
  unavailable: 'error',
  faulted: 'error',
};

// ----------------------------------------------------------------------

const metadata = { title: `Estación | ${CONFIG.appName}` };

// Types matching the actual API response (camelCase)
type LocationConnector = {
  id: number;
  name: string | null;
  ocppId: number | null;
  connectorTypeId: number | null;
  status: string;
  power: number | null;
  wire: number | null;
  voltage: number | null;
  current: number | null;
  rateId: number | null;
  rateName: string | null;
};

type LocationChargepoint = {
  id: number;
  ocppId: string | null;
  name: string | null;
  clientCpId: string | null;
  address: string | null;
  status: string | null;
  isPrivate: number;
  connectors: LocationConnector[];
};

type LocationDetail = {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  status: string | null;
  minPower: number | null;
  maxPower: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  chargepoints: LocationChargepoint[];
};

// ----------------------------------------------------------------------

export default function LocationDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: location, isLoading } = useQuery<LocationDetail>({
    queryKey: ['locations', 'detail', id],
    queryFn: () => fetcher(endpoints.locations.single(Number(id))).then((res: any) => res.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (!location) {
    return (
      <DashboardContent>
        <Typography variant="body2" color="text.secondary">
          Localización no encontrada.
        </Typography>
      </DashboardContent>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${location.name} | ${metadata.title}`}</title>
      </Helmet>

      <DashboardContent>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 4 }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h4">{location.name}</Typography>
            {location.address && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon="eva:pin-fill" width={16} sx={{ color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary">
                  {location.address}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>

        {/* Info cards */}
        {(location.minPower != null || location.minPrice != null) && (
          <Stack direction="row" spacing={2} sx={{ mb: 4 }} flexWrap="wrap">
            {location.minPower != null && location.maxPower != null && (
              <Card sx={{ px: 2.5, py: 2, borderRadius: 2, minWidth: 140 }}>
                <Typography variant="caption" color="text.secondary">
                  Potencia
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {location.minPower} – {location.maxPower} kW
                </Typography>
              </Card>
            )}
            {location.minPrice != null && location.maxPrice != null && (
              <Card sx={{ px: 2.5, py: 2, borderRadius: 2, minWidth: 140 }}>
                <Typography variant="caption" color="text.secondary">
                  Precio
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {location.minPrice} – {location.maxPrice} €/kWh
                </Typography>
              </Card>
            )}
          </Stack>
        )}

        {/* Chargepoints table */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Cargadores ({location.chargepoints?.length ?? 0})
        </Typography>

        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Conectores</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>
                {!location.chargepoints?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Sin cargadores asociados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  location.chargepoints.map((cp) => (
                    <TableRow key={cp.id} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {cp.id}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {cp.name && cp.name !== 'undefined' ? cp.name : `Cargador ${cp.id}`}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap">
                          {cp.connectors?.length ? (
                            cp.connectors.map((conn) => (
                              <Chip
                                key={conn.id}
                                size="small"
                                variant="soft"
                                color={CONNECTOR_STATUS_COLOR[conn.status?.toLowerCase()] ?? 'default'}
                                label={`${conn.power ?? '?'} kW - ${conn.status}`}
                                icon={
                                  <ConnectorTypeIcon
                                    name={conn.connectorTypeId?.toString() ?? ''}
                                    size={14}
                                  />
                                }
                              />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              —
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        <Link
                          to={paths.chargingstations.detail(String(cp.id))}
                          style={{ textDecoration: 'none' }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            endIcon={<Iconify icon="eva:arrow-forward-fill" width={16} />}
                          >
                            Ver detalle
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </DashboardContent>
    </>
  );
}
