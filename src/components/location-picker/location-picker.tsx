import 'mapbox-gl/dist/mapbox-gl.css';

import type { GeocodingFeature } from 'src/lib/geocoding';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl';

import Map, { Marker } from 'react-map-gl';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/global-config';
import { parseLatLon, geocodeQuery, extractAddressComponents } from 'src/lib/geocoding';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type LocationPickerValue = {
  latitude: string;
  longitude: string;
  address: string;
  city: string;
  postalCode: string;
};

type Props = {
  value: LocationPickerValue;
  onChange: (patch: Partial<LocationPickerValue>) => void;
  label?: string;
  height?: number;
};

/**
 * Selector de ubicación con buscador geocodificado (Mapbox) + mapa con
 * chincheta arrastrable. Mismo comportamiento que en la edición de estaciones;
 * se comparte para no duplicar la lógica.
 */
export function LocationPicker({
  value,
  onChange,
  label = 'Ubicación en el mapa',
  height = 300,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const coordsText = (lat: string, lng: string) =>
    lat !== '' && lng !== '' ? `${lat}, ${lng}` : '';
  // Por defecto el buscador muestra la lat/lng del valor recibido (p.ej. la del cargador).
  const [mapSearch, setMapSearch] = useState(() => coordsText(value.latitude, value.longitude));
  const [mapOptions, setMapOptions] = useState<GeocodingFeature[]>([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  // Evita que un texto de coordenadas puesto por código (valor por defecto o cambio
  // externo de value) dispare la búsqueda/reverse-geocode automática.
  const skipSearchRef = useRef(value.latitude !== '' && value.longitude !== '');

  const { latitude, longitude } = value;

  function applyGeocodingFeature(feature: GeocodingFeature) {
    const [lng, lat] = feature.center;
    const components = extractAddressComponents(feature);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
    onChange({
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      ...(components.address ? { address: components.address } : {}),
      ...(components.city ? { city: components.city } : {}),
      ...(components.postalCode ? { postalCode: components.postalCode } : {}),
    });
  }

  async function handleLatLonSearch(lat: number, lng: number) {
    setMapSearchLoading(true);
    const results = await geocodeQuery(`${lng},${lat}`, CONFIG.mapboxApiKey);
    setMapSearchLoading(false);
    if (results.length > 0) {
      applyGeocodingFeature(results[0]);
    } else {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
      onChange({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
    }
  }

  function handleGeocodingSelect(feature: GeocodingFeature | null) {
    if (!feature) return;
    applyGeocodingFeature(feature);
    // El buscador reflejará las coordenadas resultantes vía el efecto de sync.
    setMapOptions([]);
  }

  // Refleja en el buscador la lat/lng del valor recibido (por defecto y ante
  // cambios externos), sin disparar búsqueda.
  useEffect(() => {
    const text = coordsText(value.latitude, value.longitude);
    if (!text) return;
    setMapSearch((prev) => {
      if (prev === text) return prev;
      skipSearchRef.current = true;
      return text;
    });
     
  }, [value.latitude, value.longitude]);

  // Búsqueda geocodificada con debounce para la barra del mapa.
  useEffect(() => {
    if (!mapSearch.trim()) {
      setMapOptions([]);
      return undefined;
    }
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
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

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
        {label}
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
                    <Iconify icon="eva:search-fill" width={16} sx={{ color: 'text.disabled' }} />
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
          height,
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
            onChange({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
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
                onChange({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
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
    </Box>
  );
}
