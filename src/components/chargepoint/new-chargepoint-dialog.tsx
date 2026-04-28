import 'mapbox-gl/dist/mapbox-gl.css';

import type { Client } from 'src/types/clients';
import type { MapLayerMouseEvent } from 'react-map-gl';
import type { BasicChargingStationInfo } from 'src/types/charging_stations';

import { useState } from 'react';
import Map, { Marker } from 'react-map-gl';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { CONFIG } from 'src/global-config';
import { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { ClientSelect } from 'src/components/client/client-select';

import { useAbility } from 'src/auth/hooks/use-ability';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';


// ----------------------------------------------------------------------

const STEPS_EUROCHARGER = ['Cliente', 'Estación', 'Cargador', 'Resumen'];
const STEPS_CLIENT = ['Estación', 'Cargador', 'Resumen'];

type StationMode = 'existing' | 'new';

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
  const isEurocharger = hasRole('Eurocharger');
  const STEPS = isEurocharger ? STEPS_EUROCHARGER : STEPS_CLIENT;

  const [step, setStep] = useState(0);

  // Step 0 (Eurocharger only) – Client
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Step 1 – Station
  const [stationMode, setStationMode] = useState<StationMode>('existing');
  const [stationSearch, setStationSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState<BasicChargingStationInfo | null>(null);
  const [newStation, setNewStation] = useState<NewStationForm>(DEFAULT_NEW_STATION);

  // Step 2 – Single charger
  const [chargerName, setChargerName] = useState('');
  const [chargerIsPrivate, setChargerIsPrivate] = useState(false);

  // Submit
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleClose = () => {
    setStep(0);
    setSelectedClient(null);
    setStationMode('existing');
    setSelectedStation(null);
    setNewStation(DEFAULT_NEW_STATION);
    setStationSearch('');
    setChargerName('');
    setChargerIsPrivate(false);
    setError(null);
    onClose();
  };

  const stationStepIndex = isEurocharger ? 1 : 0;
  const chargerStepIndex = isEurocharger ? 2 : 1;

  const canNext = (() => {
    if (isEurocharger && step === 0) return selectedClient !== null;
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
    if (step === chargerStepIndex) return chargerName.trim() !== '';
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

      const res = await post(endpoints.chargepoints.create, {
        name: chargerName.trim(),
        is_private: chargerIsPrivate,
        location_id: locationId,
        client_id: isEurocharger ? selectedClient!.id : user?.client_id,
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
        Selecciona el cliente al que pertenecerá el cargador o crea uno nuevo.
      </Typography>
      <ClientSelect value={selectedClient} onChange={setSelectedClient} />
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
            <Box
              sx={{
                borderRadius: 1.5,
                overflow: 'hidden',
                height: 220,
                border: '1px solid',
                borderColor: newStation.latitude ? 'primary.main' : 'divider',
                cursor: 'crosshair',
              }}
            >
              <Map
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
                }}
              >
                {newStation.latitude && newStation.longitude && (
                  <Marker
                    longitude={parseFloat(newStation.longitude)}
                    latitude={parseFloat(newStation.latitude)}
                    draggable
                    onDragEnd={(e) =>
                      setNewStation((p) => ({
                        ...p,
                        latitude: e.lngLat.lat.toFixed(6),
                        longitude: e.lngLat.lng.toFixed(6),
                      }))
                    }
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
                Haz clic en el mapa para colocar la chincheta
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
    </Stack>
  );

  const renderStep3 = () => {
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
              sx={{ mb: 1, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}
            >
              Cliente
            </Typography>
            <Typography variant="subtitle2">{selectedClient?.business_name}</Typography>
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
              <Iconify icon="mdi:ev-station" width={16} sx={{ color: 'text.disabled' }} />
              <Typography variant="caption" fontWeight={600}>
                {chargerName}
              </Typography>
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
      PaperProps={{ sx: { height: 600 } }}
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
