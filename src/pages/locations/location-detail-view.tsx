import 'mapbox-gl/dist/mapbox-gl.css';

import type { GeocodingFeature } from 'src/lib/geocoding';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl';

import Map, { Marker } from 'react-map-gl';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router';
import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { put, post, fetcher, endpoints } from 'src/lib/axios';
import { parseLatLon, geocodeQuery, extractAddressComponents } from 'src/lib/geocoding';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';
import { ConnectorTypeIcon } from 'src/components/chargepoint/connector-type-icon';

import { useAbility } from 'src/auth/hooks/use-ability';

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

const STATION_STATUS_COLOR: Record<string, ChipColor> = {
  available: 'success',
  charging: 'info',
  reserved: 'warning',
  unavailable: 'error',
  disconnected: 'default',
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
  internalName: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  status: string | null;
  minPower: number | null;
  maxPower: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  hasMennekes: boolean;
  hasChademo: boolean;
  hasSchuko: boolean;
  hasTesla: boolean;
  hasJ1772: boolean;
  hasCcs: boolean;
  deletedAt: string | null;
  chargepoints: LocationChargepoint[];
};

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

// ----------------------------------------------------------------------

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderColor: 'divider' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
          {action}
        </Stack>
        <Box sx={{ flex: 1 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={1}
      sx={{ py: 0.5 }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: 'right', minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}

function TextValue({ value }: { value?: string | number | null }) {
  return (
    <Typography variant="caption" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
      {value ?? '—'}
    </Typography>
  );
}

// ----------------------------------------------------------------------

export default function LocationDetailView() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { hasAnyRole } = useAbility();
  const { notifySuccess, notifyError } = useNotification();

  const { data: location, isLoading } = useQuery<LocationDetail>({
    queryKey: ['locations', 'detail', id],
    queryFn: () => fetcher(endpoints.locations.single(Number(id))).then((res: any) => res.data),
    enabled: !!id,
  });

  // ── Estado de edición ───────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [internalName, setInternalName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [visible, setVisible] = useState(true);

  // ── Mapa + buscador (geocoder), igual que en el alta de cargadores ──────────
  const mapRef = useRef<MapRef>(null);
  const [mapSearch, setMapSearch] = useState('');
  const [mapOptions, setMapOptions] = useState<GeocodingFeature[]>([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);

  function applyGeocodingFeature(feature: GeocodingFeature) {
    const [lng, lat] = feature.center;
    const components = extractAddressComponents(feature);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    if (components.address) setAddress(components.address);
    if (components.city) setCity(components.city);
    if (components.postalCode) setPostalCode(components.postalCode);
  }

  async function handleLatLonSearch(lat: number, lng: number) {
    setMapSearchLoading(true);
    const results = await geocodeQuery(`${lng},${lat}`, CONFIG.mapboxApiKey);
    setMapSearchLoading(false);
    if (results.length > 0) {
      applyGeocodingFeature(results[0]);
    } else {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
    }
  }

  function handleGeocodingSelect(feature: GeocodingFeature | null) {
    if (!feature) return;
    applyGeocodingFeature(feature);
    setMapSearch('');
    setMapOptions([]);
  }

  // Búsqueda geocodificada con debounce para la barra del mapa.
  useEffect(() => {
    if (!mapSearch.trim()) {
      setMapOptions([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      const latLon = parseLatLon(mapSearch);
      if (latLon) {
        await handleLatLonSearch(latLon.lat, latLon.lng);
        return;
      }
      setMapSearchLoading(true);
      const results = await geocodeQuery(mapSearch, CONFIG.mapboxApiKey);
      setMapOptions(results);
      setMapSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapSearch]);

  const syncForm = (loc: LocationDetail) => {
    setName(loc.name ?? '');
    setInternalName(loc.internalName ?? '');
    setAddress(loc.address ?? '');
    setCity(loc.city ?? '');
    setPostalCode(loc.postalCode ?? '');
    setLatitude(loc.latitude != null ? String(loc.latitude) : '');
    setLongitude(loc.longitude != null ? String(loc.longitude) : '');
    setVisible(loc.deletedAt == null);
  };

  // Mantener el formulario sincronizado mientras no se esté editando.
  useEffect(() => {
    if (location && !editing) {
      syncForm(location);
    }
  }, [location, editing]);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      put(endpoints.locations.update(Number(id)), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', 'detail', id] });
      setEditing(false);
      notifySuccess('Estación actualizada correctamente');
    },
    onError: () => notifyError('No se pudieron guardar los cambios'),
  });

  const recomputeMutation = useMutation({
    mutationFn: () => post(endpoints.locations.recompute(Number(id)), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', 'detail', id] });
      notifySuccess('Datos recalculados correctamente');
    },
    onError: () => notifyError('No se pudieron recalcular los datos'),
  });

  const handleEdit = () => {
    if (location) syncForm(location);
    setMapSearch('');
    setMapOptions([]);
    setEditing(true);
  };

  const handleCancel = () => {
    if (location) syncForm(location);
    setMapSearch('');
    setMapOptions([]);
    setEditing(false);
  };

  const handleSave = () => {
    updateMutation.mutate({
      name: name.trim(),
      internal_name: emptyToNull(internalName),
      address: emptyToNull(address),
      city: emptyToNull(city),
      postal_code: emptyToNull(postalCode),
      latitude: latitude.trim() === '' ? null : Number(latitude),
      longitude: longitude.trim() === '' ? null : Number(longitude),
      visible,
    });
  };

  const canEdit = hasAnyRole(['saas_admin', 'saas_owner', 'eurocharger']);
  const saving = updateMutation.isPending;
  const recomputing = recomputeMutation.isPending;

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

  // Tipos de conector autocalculados (se omite ccs2, duplicado de CCS en BD).
  const connectorTypes = [
    { on: location.hasMennekes, label: 'Mennekes', typeId: 1 },
    { on: location.hasChademo, label: 'CHAdeMO', typeId: 2 },
    { on: location.hasSchuko, label: 'Schuko', typeId: 3 },
    { on: location.hasCcs, label: 'CCS', typeId: 4 },
    { on: location.hasJ1772, label: 'J1772', typeId: 5 },
    { on: location.hasTesla, label: 'Tesla', typeId: 6 },
  ].filter((t) => t.on);

  // Si la estación tiene cargadores y TODOS son privados, queda oculta del mapa
  // automáticamente (regla derivada en backend vía deleted_at). En ese caso el
  // toggle manual de visibilidad no aplica.
  const allChargersPrivate =
    (location.chargepoints?.length ?? 0) > 0 &&
    location.chargepoints.every((cp) => Boolean(cp.isPrivate));

  return (
    <>
      <Helmet>
        <title>{`${location.internalName || location.name} | ${metadata.title}`}</title>
      </Helmet>

      <DashboardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 4 }}>
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h4">{location.internalName || location.name}</Typography>
              {location.deletedAt != null && (
                <Chip size="small" color="default" variant="soft" label="Oculta en el mapa" />
              )}
            </Stack>
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

        {/* ── Datos de la estación ─────────────────────────────────────────────── */}
        {editing ? (
          <Card sx={{ p: 3, borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Editar datos de la estación
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nombre"
                  fullWidth
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={name.trim() === ''}
                  helperText={name.trim() === '' ? 'El nombre es obligatorio' : ' '}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nombre interno"
                  fullWidth
                  size="small"
                  value={internalName}
                  onChange={(e) => setInternalName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Dirección"
                  fullWidth
                  size="small"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Ciudad"
                  fullWidth
                  size="small"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Código postal"
                  fullWidth
                  size="small"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
                  Ubicación en el mapa
                </Typography>

                <Autocomplete
                  freeSolo
                  size="small"
                  options={mapOptions}
                  loading={mapSearchLoading}
                  getOptionLabel={(o) => (typeof o === 'string' ? o : o.place_name)}
                  inputValue={mapSearch}
                  onInputChange={(_, v) => setMapSearch(v)}
                  onChange={(_, v) => {
                    if (v && typeof v !== 'string') handleGeocodingSelect(v);
                  }}
                  filterOptions={(x) => x}
                  sx={{ mb: 1 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Buscar dirección o lat, lng..."
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <Iconify
                                icon="eva:search-fill"
                                width={16}
                                sx={{ color: 'text.disabled' }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: mapSearchLoading ? (
                            <InputAdornment position="end">
                              <CircularProgress size={14} />
                            </InputAdornment>
                          ) : (
                            params.InputProps.endAdornment
                          ),
                        },
                      }}
                    />
                  )}
                />

                <Box
                  sx={{
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    height: 300,
                    border: '1px solid',
                    borderColor: latitude ? 'primary.main' : 'divider',
                    cursor: 'crosshair',
                  }}
                >
                  <Map
                    ref={mapRef}
                    mapboxAccessToken={CONFIG.mapboxApiKey}
                    initialViewState={{
                      longitude: longitude !== '' ? Number(longitude) : -3.7,
                      latitude: latitude !== '' ? Number(latitude) : 40.4,
                      zoom: latitude !== '' ? 15 : 5,
                    }}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                    style={{ width: '100%', height: '100%' }}
                    onClick={(e: MapLayerMouseEvent) => {
                      const { lng, lat } = e.lngLat;
                      setLatitude(lat.toFixed(6));
                      setLongitude(lng.toFixed(6));
                      setMapSearch(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                    }}
                  >
                    {latitude !== '' && longitude !== '' && (
                      <Marker
                        longitude={Number(longitude)}
                        latitude={Number(latitude)}
                        draggable
                        onDragEnd={(e) => {
                          const { lat, lng } = e.lngLat;
                          setLatitude(lat.toFixed(6));
                          setLongitude(lng.toFixed(6));
                          setMapSearch(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                        }}
                        color="#2DE21D"
                      />
                    )}
                  </Map>
                </Box>
                {latitude !== '' && longitude !== '' ? (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {latitude}, {longitude}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                    Busca una dirección o haz clic en el mapa para colocar la chincheta
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={allChargersPrivate ? false : visible}
                      disabled={allChargersPrivate}
                      onChange={(e) => setVisible(e.target.checked)}
                    />
                  }
                  label="Visible en el mapa"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  {allChargersPrivate
                    ? 'Todos los cargadores son privados: la estación permanece oculta del mapa y solo es visible para los usuarios autorizados.'
                    : 'Si se desactiva, la estación se oculta del mapa.'}
                </Typography>
              </Grid>
            </Grid>

            <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
              Estado, potencia, precio y tipos de conector se calculan automáticamente a partir de
              los cargadores y no son editables.
            </Alert>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || name.trim() === ''}
                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
              >
                Guardar
              </Button>
            </Stack>
          </Card>
        ) : (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {/* Información */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard
                title="Información"
                action={
                  canEdit ? (
                    <IconButton size="small" title="Editar estación" onClick={handleEdit}>
                      <Iconify icon="mdi:pencil-outline" width={16} />
                    </IconButton>
                  ) : undefined
                }
              >
                <DataRow label="Nombre">
                  <TextValue value={location.name} />
                </DataRow>
                <DataRow label="Nombre interno">
                  <TextValue value={location.internalName} />
                </DataRow>
                <DataRow label="Dirección">
                  <TextValue value={location.address} />
                </DataRow>
                <DataRow label="Ciudad">
                  <TextValue value={location.city} />
                </DataRow>
                <DataRow label="Código postal">
                  <TextValue value={location.postalCode} />
                </DataRow>
                <DataRow label="Coordenadas">
                  <TextValue
                    value={
                      location.latitude != null && location.longitude != null
                        ? `${location.latitude}, ${location.longitude}`
                        : null
                    }
                  />
                </DataRow>
                <DataRow label="Visible en el mapa">
                  <Stack alignItems="flex-end" spacing={0.25}>
                    <Chip
                      size="small"
                      variant="soft"
                      color={location.deletedAt == null ? 'success' : 'default'}
                      label={location.deletedAt == null ? 'Sí' : 'No'}
                    />
                    {allChargersPrivate && (
                      <Typography variant="caption" color="text.secondary">
                        Oculta: todos los cargadores son privados
                      </Typography>
                    )}
                  </Stack>
                </DataRow>
              </SectionCard>
            </Grid>

            {/* Datos calculados */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard
                title="Datos de cargadores"
                action={
                  canEdit ? (
                    <Tooltip title="Recalcular estado, potencia y tipos de conector desde los cargadores">
                      <span>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => recomputeMutation.mutate()}
                          disabled={recomputing}
                          startIcon={
                            recomputing ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <Iconify icon="mdi:refresh" width={16} />
                            )
                          }
                        >
                          Recalcular
                        </Button>
                      </span>
                    </Tooltip>
                  ) : undefined
                }
              >
                <DataRow label="Estado">
                  {location.status ? (
                    <Chip
                      size="small"
                      variant="soft"
                      color={STATION_STATUS_COLOR[location.status.toLowerCase()] ?? 'default'}
                      label={location.status}
                    />
                  ) : (
                    <TextValue value={null} />
                  )}
                </DataRow>
                <DataRow label="Potencia">
                  <TextValue
                    value={
                      location.minPower != null && location.maxPower != null
                        ? `${location.minPower} – ${location.maxPower} kW`
                        : null
                    }
                  />
                </DataRow>
                <DataRow label="Precio">
                  <TextValue
                    value={
                      location.minPrice != null && location.maxPrice != null
                        ? `${location.minPrice} – ${location.maxPrice} €/kWh`
                        : null
                    }
                  />
                </DataRow>
                <DataRow label="Tipos de conector">
                  {connectorTypes.length ? (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="flex-end">
                      {connectorTypes.map((t) => (
                        <Chip
                          key={t.label}
                          size="small"
                          variant="soft"
                          label={t.label}
                          icon={<ConnectorTypeIcon name={String(t.typeId)} size={14} />}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <TextValue value={null} />
                  )}
                </DataRow>
              </SectionCard>
            </Grid>
          </Grid>
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
                                color={
                                  CONNECTOR_STATUS_COLOR[conn.status?.toLowerCase()] ?? 'default'
                                }
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
