import 'mapbox-gl/dist/mapbox-gl.css';

import type { Subscription } from 'src/types/billing';
import type { GeocodingFeature } from 'src/lib/geocoding';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl';
import type { BasicChargingStationInfo } from 'src/types/charging_stations';

import Map, { Marker } from 'react-map-gl';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { CONFIG } from 'src/global-config';
import { post, fetcher, endpoints } from 'src/lib/axios';
import {
  COUNTRY_MAP,
  parseLatLon,
  geocodeQuery,
  POSTAL_CODE_TO_PROVINCE,
  extractAddressComponents,
} from 'src/lib/geocoding';

import { Iconify } from 'src/components/iconify';

import { useAbility } from 'src/auth/hooks/use-ability';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

const STEPS_EUROCHARGER = ['Propietario', 'Estación', 'Cargador', 'Resumen'];
const STEPS_CLIENT = ['Estación', 'Cargador', 'Resumen'];

type StationMode = 'existing' | 'new';
type GroupMode = 'existing' | 'new';

type Account = { id: number; business_name: string };
type AccountsResponse = { data: Account[]; total: number };

const SPAIN_PROVINCES = [
  'Álava',
  'Albacete',
  'Alicante',
  'Almería',
  'Asturias',
  'Ávila',
  'Badajoz',
  'Barcelona',
  'Burgos',
  'Cáceres',
  'Cádiz',
  'Cantabria',
  'Castellón',
  'Ciudad Real',
  'Córdoba',
  'Cuenca',
  'Girona',
  'Granada',
  'Guadalajara',
  'Gipuzkoa',
  'Huelva',
  'Huesca',
  'Illes Balears',
  'Jaén',
  'La Coruña',
  'La Rioja',
  'Las Palmas',
  'León',
  'Lleida',
  'Lugo',
  'Madrid',
  'Málaga',
  'Murcia',
  'Navarra',
  'Ourense',
  'Palencia',
  'Pontevedra',
  'Salamanca',
  'Santa Cruz de Tenerife',
  'Segovia',
  'Sevilla',
  'Soria',
  'Tarragona',
  'Teruel',
  'Toledo',
  'Valencia',
  'Valladolid',
  'Bizkaia',
  'Zamora',
  'Zaragoza',
];

const COUNTRIES = [
  'España',
  'Portugal',
  'Francia',
  'Alemania',
  'Italia',
  'Reino Unido',
  'Países Bajos',
  'Bélgica',
  'Suiza',
  'Austria',
  'Luxemburgo',
];

type NewStationForm = {
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  latitude: string;
  longitude: string;
};

const DEFAULT_NEW_STATION: NewStationForm = {
  address: '',
  city: '',
  postalCode: '',
  province: '',
  country: 'España',
  latitude: '',
  longitude: '',
};

function formatStationId(id: number): string {
  return `EUR*${String(id).padStart(4, '0')}`;
}

export type NewChargepointDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newChargepointId: number | null) => void;
};

export function NewChargepointDialog({ open, onClose, onSuccess }: NewChargepointDialogProps) {
  const { hasRole } = useAbility();
  const { user } = useAuthContext();
  const isEurocharger = hasRole('eurocharger');
  const STEPS = isEurocharger ? STEPS_EUROCHARGER : STEPS_CLIENT;

  const [step, setStep] = useState(0);

  // Step 0 (Eurocharger only) – Account + Group
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
  const [selectedAccountName, setSelectedAccountName] = useState('');
  const [accountSearch, setAccountSearch] = useState('');

  // Step 1 – Station
  const [stationMode, setStationMode] = useState<StationMode>('existing');
  const [stationSearch, setStationSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState<BasicChargingStationInfo | null>(null);
  const [newStation, setNewStation] = useState<NewStationForm>(DEFAULT_NEW_STATION);

  // Map search
  const mapRef = useRef<MapRef>(null);
  const [mapSearch, setMapSearch] = useState('');
  const [mapOptions, setMapOptions] = useState<GeocodingFeature[]>([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);

  // Group – set in step 0 for eurocharger, step 2 for others
  const [chargerGroupId, setChargerGroupId] = useState('');
  const [groupMode, setGroupMode] = useState<GroupMode>('existing');
  const [newGroupName, setNewGroupName] = useState('');

  // Step 2 – Charger
  const [chargerName, setChargerName] = useState('');
  const [chargerIsPrivate, setChargerIsPrivate] = useState(false);
  const [chargerHasCallCenter, setChargerHasCallCenter] = useState(false);

  // Submit
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupAccountId = isEurocharger ? (selectedAccountId as number) : (user?.account_id ?? 0);

  // Accounts list for eurocharger
  const { data: accountsData } = useQuery<AccountsResponse>({
    queryKey: ['accounts-list'],
    queryFn: () => fetcher([endpoints.accounts.list, { params: { pageSize: 1000 } }]),
    enabled: isEurocharger && open,
    staleTime: 5 * 60 * 1000,
  });
  const accounts: Account[] = accountsData?.data ?? [];

  const { data: groupsData, isLoading: groupsLoading } = useQuery<ChargerGroupsResponse>({
    queryKey: ['charger-groups', groupAccountId],
    queryFn: () => fetcher(endpoints.accounts.chargerGroups(groupAccountId)),
    enabled: open && !!groupAccountId,
    staleTime: 2 * 60 * 1000,
  });
  const groups: ChargerGroup[] = groupsData?.data ?? [];

  const { data: subscriptionData } = useQuery<{ data: Subscription }>({
    queryKey: ['account-subscription', groupAccountId],
    queryFn: () => fetcher(endpoints.accounts.subscription(groupAccountId)),
    enabled: open && !!groupAccountId,
    staleTime: 2 * 60 * 1000,
  });
  const callCenterItem = subscriptionData?.data?.items?.find((i) => i.type === 'call_center');
  const callCenterUnitPrice = callCenterItem?.unit_price_cents;

  const { data: stations = [], isLoading: stationsLoading } = useQuery<BasicChargingStationInfo[]>({
    queryKey: ['locations', stationSearch],
    queryFn: async () => {
      const res = await fetcher([
        endpoints.locations.list,
        { params: { page: 0, pageSize: 5, searchQuery: stationSearch } },
      ]);
      return res.data ?? [];
    },
    enabled: open && stationMode === 'existing',
  });

  useEffect(() => {
    if (!isEurocharger && groups.length === 1 && chargerGroupId === '') {
      setChargerGroupId(groups[0].id);
    }
  }, [groups, chargerGroupId, isEurocharger]);

  // Debounced geocoding search for the map search bar
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

  function applyGeocodingFeature(feature: GeocodingFeature) {
    const [lng, lat] = feature.center;
    const components = extractAddressComponents(feature);
    const countryEs = components.country ? (COUNTRY_MAP[components.country] ?? '') : '';
    const prefix = components.postalCode?.slice(0, 2) ?? '';
    const province = countryEs === 'España' ? (POSTAL_CODE_TO_PROVINCE[prefix] ?? '') : '';

    mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });

    setNewStation((p) => ({
      ...p,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      address: components.address || p.address,
      city: components.city || p.city,
      postalCode: components.postalCode || p.postalCode,
      country: countryEs || p.country,
      province: countryEs === 'España' ? province : '',
    }));
  }

  function handleGeocodingSelect(feature: GeocodingFeature | null) {
    if (!feature) return;
    applyGeocodingFeature(feature);
    setMapSearch('');
    setMapOptions([]);
  }

  async function handleLatLonSearch(lat: number, lng: number) {
    setMapSearchLoading(true);
    const results = await geocodeQuery(`${lng},${lat}`, CONFIG.mapboxApiKey);
    setMapSearchLoading(false);
    if (results.length > 0) {
      applyGeocodingFeature(results[0]);
    } else {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
      setNewStation((p) => ({
        ...p,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    }
  }

  async function handleGeocodeFromAddress() {
    const query = [newStation.address, newStation.city, newStation.postalCode, newStation.country]
      .filter(Boolean)
      .join(', ');
    if (!query.trim()) return;
    const results = await geocodeQuery(query, CONFIG.mapboxApiKey);
    if (results.length > 0) {
      applyGeocodingFeature(results[0]);
      const [lng, lat] = results[0].center;
      setMapSearch(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  }

  async function handlePostalCodeBlur() {
    const code = newStation.postalCode.trim();
    if (code.length < 4) return;

    const results = await geocodeQuery(`${code} ${newStation.country}`, CONFIG.mapboxApiKey, {
      types: 'postcode',
    });
    if (results.length === 0) return;

    const components = extractAddressComponents(results[0]);
    const countryEs = components.country ? (COUNTRY_MAP[components.country] ?? '') : '';
    const prefix = code.slice(0, 2);
    const province = countryEs === 'España' ? (POSTAL_CODE_TO_PROVINCE[prefix] ?? '') : '';

    setNewStation((p) => ({
      ...p,
      city: p.city || components.city || '',
      country: countryEs || p.country,
      province: countryEs === 'España' ? province || p.province : p.province,
    }));
  }

  const handleClose = () => {
    setStep(0);
    setSelectedAccountId('');
    setSelectedAccountName('');
    setAccountSearch('');
    setStationMode('existing');
    setSelectedStation(null);
    setNewStation(DEFAULT_NEW_STATION);
    setStationSearch('');
    setMapSearch('');
    setMapOptions([]);
    setChargerName('');
    setChargerIsPrivate(false);
    setChargerHasCallCenter(false);
    setChargerGroupId('');
    setGroupMode('existing');
    setNewGroupName('');
    setError(null);
    onClose();
  };

  const stationStepIndex = isEurocharger ? 1 : 0;
  const chargerStepIndex = isEurocharger ? 2 : 1;

  const canNext = (() => {
    if (isEurocharger && step === 0) {
      if (!selectedAccountId) return false;
      if (groupMode === 'new') return newGroupName.trim() !== '';
      return chargerGroupId !== '';
    }
    if (step === stationStepIndex) {
      if (stationMode === 'existing') return selectedStation !== null;
      const provinceOk = newStation.country !== 'España' || newStation.province !== '';
      return (
        newStation.address.trim() !== '' &&
        newStation.city.trim() !== '' &&
        newStation.postalCode.trim() !== '' &&
        provinceOk &&
        newStation.country !== '' &&
        newStation.latitude !== '' &&
        newStation.longitude !== ''
      );
    }
    if (step === chargerStepIndex) {
      if (!isEurocharger) {
        if (groupMode === 'new') return chargerName.trim() !== '' && newGroupName.trim() !== '';
        return chargerName.trim() !== '' && chargerGroupId !== '';
      }
      return chargerName.trim() !== '';
    }
    return true;
  })();

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      let locationId: number;
      if (stationMode === 'new') {
        const res = await post(endpoints.locations.create, {
          address: newStation.address.trim(),
          city: newStation.city.trim(),
          postal_code: newStation.postalCode.trim(),
          ...(newStation.province && { province: newStation.province }),
          country: newStation.country,
          latitude: parseFloat(newStation.latitude),
          longitude: parseFloat(newStation.longitude),
        });
        locationId = res.data?.id ?? res.id;
      } else {
        locationId = selectedStation!.id;
      }

      let resolvedGroupId = chargerGroupId;
      if (groupMode === 'new') {
        const groupRes = await post(endpoints.accounts.chargerGroups(groupAccountId), {
          name: newGroupName.trim(),
          chargerIds: [],
        });
        resolvedGroupId = groupRes?.data?.id ?? groupRes?.id;
      }

      const res = await post(endpoints.chargepoints.create, {
        name: chargerName.trim(),
        is_private: chargerIsPrivate,
        location_id: locationId,
        chargerGroupId: resolvedGroupId,
        ...(chargerHasCallCenter && { has_call_center: true }),
      });

      const newId = res?.data?.id ?? res?.id ?? null;
      onSuccess?.(newId);
      handleClose();
    } catch {
      setError('Error al crear el cargador. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step renderers ──────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Selecciona la cuenta y el propietario al que pertenecerá el cargador.
      </Typography>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
          Cuenta <span style={{ color: 'inherit' }}>*</span>
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar cuenta..."
          value={accountSearch}
          onChange={(e) => setAccountSearch(e.target.value)}
          sx={{ mb: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={16} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box
          sx={{
            maxHeight: 200,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          {accounts
            .filter((a) => a.business_name.toLowerCase().includes(accountSearch.toLowerCase()))
            .map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <Box
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setSelectedAccountName(acc.business_name);
                    setChargerGroupId('');
                    setGroupMode('existing');
                    setNewGroupName('');
                  }}
                  sx={(t) => ({
                    px: 1.5,
                    py: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
                    borderBottom: `1px solid ${t.vars.palette.divider}`,
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { bgcolor: isSelected ? 'primary.lighter' : 'action.hover' },
                  })}
                >
                  <Typography variant="body2">{acc.business_name}</Typography>
                  {isSelected && (
                    <Iconify
                      icon="eva:checkmark-circle-2-fill"
                      width={18}
                      sx={{ color: 'primary.main', flexShrink: 0 }}
                    />
                  )}
                </Box>
              );
            })}
          {accounts.filter((a) =>
            a.business_name.toLowerCase().includes(accountSearch.toLowerCase())
          ).length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
              No se encontraron cuentas.
            </Typography>
          )}
        </Box>
      </Box>

      {!!selectedAccountId && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
            Propietario <span style={{ color: 'inherit' }}>*</span>
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <Button
              size="small"
              variant={groupMode === 'existing' ? 'contained' : 'outlined'}
              onClick={() => setGroupMode('existing')}
              sx={{ flex: 1 }}
            >
              Propietario existente
            </Button>
            <Button
              size="small"
              variant={groupMode === 'new' ? 'contained' : 'outlined'}
              onClick={() => setGroupMode('new')}
              sx={{ flex: 1 }}
            >
              Nuevo propietario
            </Button>
          </Stack>

          {groupMode === 'existing' ? (
            <TextField
              select
              size="small"
              fullWidth
              value={chargerGroupId}
              onChange={(e) => setChargerGroupId(e.target.value)}
              disabled={groupsLoading || groups.length === 0}
              helperText={
                groupsLoading
                  ? 'Cargando propietarios...'
                  : groups.length === 0
                    ? 'No hay propietarios. Crea uno nuevo.'
                    : undefined
              }
            >
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField
              size="small"
              fullWidth
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ej. Ayuntamiento de X"
              helperText="Se creará un nuevo propietario con este nombre"
            />
          )}
        </Box>
      )}
    </Stack>
  );

  const renderStep1 = () => (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant={stationMode === 'existing' ? 'contained' : 'outlined'}
          onClick={() => setStationMode('existing')}
          sx={{ flex: 1 }}
        >
          Estación existente
        </Button>
        <Button
          size="small"
          variant={stationMode === 'new' ? 'contained' : 'outlined'}
          onClick={() => setStationMode('new')}
          sx={{ flex: 1 }}
        >
          Nueva estación
        </Button>
      </Stack>

      {stationMode === 'existing' ? (
        <>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar por nombre, dirección o EUR*..."
            value={stationSearch}
            onChange={(e) => setStationSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={16} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
            {stationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : stations.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No se encontraron estaciones
              </Typography>
            ) : (
              <Stack spacing={0.75}>
                {stations.map((s) => {
                  const isSelected = selectedStation?.id === s.id;
                  return (
                    <Box
                      key={s.id}
                      onClick={() => setSelectedStation(s)}
                      sx={(t) => ({
                        p: 1.5,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        border: `1px solid ${isSelected ? t.vars.palette.primary.main : t.vars.palette.divider}`,
                        bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': { bgcolor: isSelected ? 'primary.lighter' : 'action.hover' },
                      })}
                    >
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{s.name}</Typography>
                        {s.address && (
                          <Typography variant="caption" color="text.secondary">
                            {s.address}
                          </Typography>
                        )}
                      </Stack>
                      {isSelected && (
                        <Iconify
                          icon="eva:checkmark-circle-2-fill"
                          width={20}
                          sx={{ color: 'primary.main', flexShrink: 0 }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </>
      ) : (
        <>
          <TextField
            label="Dirección"
            required
            size="small"
            fullWidth
            value={newStation.address}
            onChange={(e) => setNewStation((p) => ({ ...p, address: e.target.value }))}
            placeholder="Ej. C/ Mayor, 2"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Localizar en mapa">
                      <IconButton size="small" onClick={handleGeocodeFromAddress} edge="end">
                        <Iconify icon="eva:pin-fill" width={16} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Ciudad"
              required
              size="small"
              fullWidth
              value={newStation.city}
              onChange={(e) => setNewStation((p) => ({ ...p, city: e.target.value }))}
              placeholder="Ej. Madrid"
            />
            <TextField
              label="Código postal"
              required
              size="small"
              sx={{ minWidth: 130 }}
              value={newStation.postalCode}
              onChange={(e) => setNewStation((p) => ({ ...p, postalCode: e.target.value }))}
              onBlur={handlePostalCodeBlur}
              placeholder="29006"
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              select
              label="País"
              required
              size="small"
              fullWidth
              value={newStation.country}
              onChange={(e) =>
                setNewStation((p) => ({ ...p, country: e.target.value, province: '' }))
              }
            >
              {COUNTRIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Provincia"
              required={newStation.country === 'España'}
              disabled={newStation.country !== 'España'}
              size="small"
              fullWidth
              value={newStation.province}
              onChange={(e) => setNewStation((p) => ({ ...p, province: e.target.value }))}
            >
              {SPAIN_PROVINCES.map((prov) => (
                <MenuItem key={prov} value={prov}>
                  {prov}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.75, display: 'block' }}
            >
              Ubicación en el mapa <span style={{ color: 'inherit' }}>*</span>
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
                borderColor: newStation.latitude ? 'primary.main' : 'divider',
                cursor: 'crosshair',
              }}
            >
              <Map
                ref={mapRef}
                mapboxAccessToken={CONFIG.mapboxApiKey}
                initialViewState={{ longitude: -3.7, latitude: 40.4, zoom: 5 }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                style={{ width: '100%', height: '100%' }}
                onClick={(e: MapLayerMouseEvent) => {
                  const { lng, lat } = e.lngLat;
                  setNewStation((p) => ({
                    ...p,
                    latitude: lat.toFixed(6),
                    longitude: lng.toFixed(6),
                  }));
                  setMapSearch(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                }}
              >
                {newStation.latitude && newStation.longitude && (
                  <Marker
                    longitude={parseFloat(newStation.longitude)}
                    latitude={parseFloat(newStation.latitude)}
                    draggable
                    onDragEnd={(e) => {
                      const { lat, lng } = e.lngLat;
                      setNewStation((p) => ({
                        ...p,
                        latitude: lat.toFixed(6),
                        longitude: lng.toFixed(6),
                      }));
                      setMapSearch(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                    }}
                    color="#2DE21D"
                  />
                )}
              </Map>
            </Box>
            {newStation.latitude && newStation.longitude ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {newStation.latitude}, {newStation.longitude}
              </Typography>
            ) : (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ mt: 0.5, display: 'block' }}
              >
                Busca una dirección o haz clic en el mapa para colocar la chincheta
              </Typography>
            )}
          </Box>
        </>
      )}
    </Stack>
  );

  const renderStep2 = () => (
    <Stack spacing={1.5} pt={3}>
      <TextField
        label="Nombre del cargador"
        required
        size="small"
        fullWidth
        value={chargerName}
        onChange={(e) => setChargerName(e.target.value)}
        placeholder="Ej. Parking Centro 1"
      />
      <FormControlLabel
        control={
          <Switch
            checked={chargerIsPrivate}
            onChange={(e) => setChargerIsPrivate(e.target.checked)}
            size="small"
          />
        }
        label="Acceso privado"
      />

      {callCenterUnitPrice !== undefined && (
        <FormControlLabel
          control={
            <Switch
              checked={chargerHasCallCenter}
              onChange={(e) => setChargerHasCallCenter(e.target.checked)}
              size="small"
            />
          }
          label={`Call Center – ${(callCenterUnitPrice / 100).toFixed(2).replace('.', ',')} €/mes`}
        />
      )}

      {!isEurocharger && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
            Propietario <span style={{ color: 'inherit' }}>*</span>
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <Button
              size="small"
              variant={groupMode === 'existing' ? 'contained' : 'outlined'}
              onClick={() => setGroupMode('existing')}
              sx={{ flex: 1 }}
            >
              Propietario existente
            </Button>
            <Button
              size="small"
              variant={groupMode === 'new' ? 'contained' : 'outlined'}
              onClick={() => setGroupMode('new')}
              sx={{ flex: 1 }}
            >
              Nuevo propietario
            </Button>
          </Stack>

          {groupMode === 'existing' ? (
            <TextField
              select
              size="small"
              fullWidth
              value={chargerGroupId}
              onChange={(e) => setChargerGroupId(e.target.value)}
              disabled={groupsLoading || groups.length === 0}
              helperText={
                groupsLoading
                  ? 'Cargando propietarios...'
                  : groups.length === 0
                    ? 'No hay propietarios. Crea uno nuevo o ve a la sección Propietarios.'
                    : undefined
              }
            >
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField
              size="small"
              fullWidth
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ej. Ayuntamiento de X"
              helperText="Se creará un nuevo propietario con este nombre"
            />
          )}
        </Box>
      )}
    </Stack>
  );

  const renderStep3 = () => {
    const selectedGroup =
      groupMode === 'new'
        ? { name: newGroupName }
        : (groups.find((g) => g.id === chargerGroupId) ?? null);
    const stationLabel =
      stationMode === 'existing'
        ? {
            id: formatStationId(selectedStation!.id),
            name: selectedStation!.name,
            address: selectedStation!.address,
          }
        : {
            id: 'Nueva',
            name: undefined as string | undefined,
            address: [
              newStation.address,
              newStation.city,
              newStation.postalCode,
              newStation.province,
              newStation.country,
            ]
              .filter(Boolean)
              .join(', '),
          };

    return (
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}

        {isEurocharger && (
          <Box
            sx={(t) => ({ p: 2, borderRadius: 1.5, border: `1px solid ${t.vars.palette.divider}` })}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              display="block"
              sx={{
                mb: 1,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
              }}
            >
              Empresa
            </Typography>
            <Typography variant="subtitle2">{selectedAccountName}</Typography>
          </Box>
        )}

        <Box
          sx={(t) => ({ p: 2, borderRadius: 1.5, border: `1px solid ${t.vars.palette.divider}` })}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            display="block"
            sx={{
              mb: 1,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
            }}
          >
            Propietario
          </Typography>
          <Typography variant="subtitle2">{selectedGroup?.name}</Typography>
        </Box>

        <Box
          sx={(t) => ({ p: 2, borderRadius: 1.5, border: `1px solid ${t.vars.palette.divider}` })}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            display="block"
            sx={{ mb: 1, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}
          >
            Estación
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              fontFamily="monospace"
              sx={{ color: 'primary.main' }}
            >
              {stationLabel.id}
            </Typography>
            <Typography variant="subtitle2">{stationLabel.name}</Typography>
          </Stack>
          {stationLabel.address && (
            <Typography variant="caption" color="text.secondary">
              {stationLabel.address}
            </Typography>
          )}
        </Box>

        <Box
          sx={(t) => ({ p: 2, borderRadius: 1.5, border: `1px solid ${t.vars.palette.divider}` })}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            display="block"
            sx={{ mb: 1, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}
          >
            Cargador
          </Typography>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="mdi:ev-station" width={16} sx={{ color: 'common.black' }} />
              <Stack spacing={0.25}>
                <Typography variant="caption" fontWeight={600}>
                  {chargerName}
                </Typography>
                {chargerHasCallCenter && (
                  <Typography variant="caption" color="primary.main">
                    + Call Center
                  </Typography>
                )}
              </Stack>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {chargerIsPrivate ? 'Privado' : 'Público'}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: 720 } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        Nuevo cargador
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
        >
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 2 }}>
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Divider />

      <DialogContent sx={{ overflowY: 'auto' }}>
        <Box sx={{ pt: 1 }}>
          {isEurocharger && step === 0 && renderStep0()}
          {step === stationStepIndex && renderStep1()}
          {step === chargerStepIndex && renderStep2()}
          {step === STEPS.length - 1 && renderStep3()}
        </Box>
      </DialogContent>

      <DialogActions>
        {step === 0 ? (
          <Button onClick={handleClose}>Cancelar</Button>
        ) : (
          <Button
            onClick={() => {
              setError(null);
              setStep((s) => s - 1);
            }}
            disabled={loading}
          >
            Atrás
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button variant="contained" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={loading}
            onClick={handleSubmit}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Crear cargador
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
