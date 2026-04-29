import 'mapbox-gl/dist/mapbox-gl.css';

import type { RateItem } from 'src/types/rates';
import type { Connector } from 'src/types/connector';
import type { Chargepoint, ChargingStationResponse } from 'src/types/chargepoint';

import { useParams } from 'react-router';
import Map, { Marker } from 'react-map-gl';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import { del, put, post, fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ResetDialog } from 'src/components/ocpp/reset/dialog';
import { UnlockDialog } from 'src/components/ocpp/unlock/dialog';
import { TransactionsTable } from 'src/components/transactions-table';
import { CreateRateDialog } from 'src/components/rate/create-rate-dialog';
import { AvailabilityDialog } from 'src/components/ocpp/availability/dialog';
import { ConnectorTypeIcon } from 'src/components/chargepoint/connector-type-icon';
import { ChargerStatusLabel } from 'src/components/chargepoint/charger-status-label';

// ----------------------------------------------------------------------

const STATUS_BG_COLOR: Record<string, string> = {
  available: 'secondary.light',
  charging: 'secondary.light',
  preparing: 'secondary.light',
  finishing: 'secondary.light',
  suspendedev: 'secondary.light',
  suspendedevse: 'secondary.light',
  reserved: 'secondary.light',
  unavailable: 'secondary.light',
  faulted: 'secondary.light',
};

const CONNECTOR_TYPE_MAP: Record<number, string> = {
  1: 'Mennekes',
  2: 'CHAdeMO',
  3: 'Schuko',
  4: 'CCS',
  5: 'J1772',
  6: 'Tesla',
};

// ----------------------------------------------------------------------

function SectionCard({
  title,
  children,
  action,
  warning,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderColor: warning ? 'warning.main' : 'divider',
        bgcolor: warning ? 'warning.lighter' : 'background.paper',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {warning && <Iconify icon="mdi:alert" width={16} sx={{ color: 'warning.main' }} />}
            <Typography variant="subtitle2" fontWeight={700}>
              {title}
            </Typography>
          </Stack>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={1}
      sx={{ py: 0.5 }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        fontWeight={600}
        fontFamily={mono ? 'monospace' : undefined}
        textAlign="right"
        sx={{ wordBreak: 'break-all' }}
      >
        {value ?? '-'}
      </Typography>
    </Stack>
  );
}

// ----------------------------------------------------------------------

type DialogState = {
  type: 'availability' | 'unlock' | null;
  connectorId?: number;
};

function ConnectorCard({
  connector,
  chargepointId,
  onAction,
  onEdit,
  onRemoveRate,
  onRateAssigned,
}: {
  connector: Connector;
  chargepointId: number;
  onAction: (state: DialogState) => void;
  onEdit: (connector: Connector) => void;
  onRemoveRate: () => void;
  onRateAssigned: () => void;
}) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [createRateOpen, setCreateRateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [rates, setRates] = useState<RateItem[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignOpen) return () => {};
    let cancelled = false;
    setLoadingRates(true);
    const timer = setTimeout(
      async () => {
        try {
          const res = await fetcher([
            endpoints.rates.list,
            { params: { page: 0, pageSize: 20, searchQuery: search } },
          ]);
          if (!cancelled) setRates(res?.data ?? []);
        } catch {
          // ignore
        } finally {
          if (!cancelled) setLoadingRates(false);
        }
      },
      search ? 300 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [assignOpen, search]);

  const handleAssign = async () => {
    if (!selectedRateId) return;
    try {
      setSaving(true);
      setSaveError(null);
      await put(endpoints.connectors.assign(chargepointId, connector.id), {
        rate_id: selectedRateId,
      });
      setAssignOpen(false);
      setSelectedRateId(null);
      onRateAssigned();
    } catch {
      setSaveError('Error al asignar la tarifa. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const statusKey = connector.status?.toLowerCase() ?? '';
  const powerBg = STATUS_BG_COLOR[statusKey] ?? 'grey.100';
  const ocppConnectorId = connector.ocppId ?? connector.id;

  return (
    <>
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
          <Stack spacing={1.5}>
            {/* Header */}
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1}
            >
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                  }}
                >
                  Conector {connector.ocppId}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ color: 'text.primary', display: 'flex' }}>
                    <ConnectorTypeIcon
                      name={connector.connectorTypeId ? CONNECTOR_TYPE_MAP[connector.connectorTypeId] : null}
                      size={30}
                    />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {connector.connectorTypeId ? (CONNECTOR_TYPE_MAP[connector.connectorTypeId] ?? 'Desconocido') : 'Sin asignar'}
                  </Typography>
                </Stack>
              </Box>

              <Stack alignItems="flex-end" spacing={0.75} sx={{ flexShrink: 0 }}>
                <ChargerStatusLabel status={connector.status} />
                {connector.power != null && (
                  <Box
                    sx={{
                      textAlign: 'center',
                      bgcolor: powerBg,
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ fontSize: '0.6rem' }}
                    >
                      Potencia
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {connector.power} kW
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Stack>

            <Divider />

            {/* Tariff + actions */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              {connector.rateName ? (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Label color="success" variant="soft">
                    💶 {connector.rateName}
                  </Label>
                  <IconButton
                    size="small"
                    title="Quitar tarifa"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRate();
                    }}
                    sx={{ color: 'error.main' }}
                  >
                    <Iconify icon="mingcute:close-line" width={14} />
                  </IconButton>
                  <Button variant="soft" size="small" onClick={() => setAssignOpen((o) => !o)}>
                    <Iconify icon="mdi:pencil" width={14} sx={{ mr: 0.5 }} />
                    Cambiar
                  </Button>
                </Stack>
              ) : (
                <Button variant="soft" size="small" onClick={() => setAssignOpen((o) => !o)}>
                  <Iconify icon="mdi:plus" width={14} sx={{ mr: 0.5 }} />
                  Asignar tarifa
                </Button>
              )}

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  title="Editar conector"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(connector);
                  }}
                >
                  <Iconify icon="mdi:pencil-outline" width={16} />
                </IconButton>
                <IconButton
                  size="small"
                  title="Cambiar disponibilidad"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction({ type: 'availability', connectorId: ocppConnectorId });
                  }}
                >
                  <Iconify icon="mdi:swap-horizontal" width={16} />
                </IconButton>
                <IconButton
                  size="small"
                  title="Desbloquear conector"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction({ type: 'unlock', connectorId: ocppConnectorId });
                  }}
                >
                  <Iconify icon="mdi:lock-open-outline" width={16} />
                </IconButton>
              </Stack>
            </Stack>

            {/* Inline rate assignment panel */}
            {assignOpen && (
              <>
                <Divider />
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.65rem',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Seleccionar tarifa
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Iconify icon="mdi:plus" width={14} />}
                      onClick={() => setCreateRateOpen(true)}
                    >
                      Nueva tarifa
                    </Button>
                  </Stack>

                  <TextField
                    label="Buscar"
                    size="small"
                    fullWidth
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nombre de tarifa..."
                  />

                  {loadingRates ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : (
                    <Box sx={{ maxHeight: 160, overflowY: 'auto' }}>
                      <Stack spacing={0.5}>
                        {rates.length === 0 ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ py: 1, textAlign: 'center', display: 'block' }}
                          >
                            Sin tarifas disponibles
                          </Typography>
                        ) : (
                          rates.map((r) => (
                            <Box
                              key={r.id}
                              onClick={() => setSelectedRateId(r.id)}
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                cursor: 'pointer',
                                border: '1px solid',
                                borderColor: selectedRateId === r.id ? 'primary.main' : 'divider',
                                bgcolor:
                                  selectedRateId === r.id ? 'primary.lighter' : 'transparent',
                                '&:hover': {
                                  bgcolor:
                                    selectedRateId === r.id ? 'primary.lighter' : 'action.hover',
                                },
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography variant="caption" fontWeight={600}>
                                  {r.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {r.type_name}
                                </Typography>
                              </Stack>
                            </Box>
                          ))
                        )}
                      </Stack>
                    </Box>
                  )}

                  {saveError && (
                    <Typography variant="caption" color="error">
                      {saveError}
                    </Typography>
                  )}

                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button
                      size="small"
                      onClick={() => {
                        setAssignOpen(false);
                        setSelectedRateId(null);
                        setSaveError(null);
                      }}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={selectedRateId === null || saving}
                      onClick={handleAssign}
                      startIcon={
                        saving ? (
                          <Box component={CircularProgress} size={12} color="inherit" />
                        ) : undefined
                      }
                    >
                      Asignar
                    </Button>
                  </Stack>
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      <CreateRateDialog
        open={createRateOpen}
        onClose={() => setCreateRateOpen(false)}
        connectorId={connector.id}
        chargepointId={chargepointId}
        onSuccess={() => {
          setCreateRateOpen(false);
          setAssignOpen(false);
          onRateAssigned();
        }}
      />
    </>
  );
}

// ----------------------------------------------------------------------

const CONNECTOR_TYPES = [
  { id: 1, label: 'Mennekes (Tipo 2)' },
  { id: 2, label: 'CHAdeMO' },
  { id: 3, label: 'Schuko' },
  { id: 4, label: 'CCS (Combo 2)' },
  { id: 5, label: 'J1772 (Tipo 1)' },
  { id: 6, label: 'Tesla' },
];

function ConnectorFormCard({
  chargepointId,
  connector,
  onCancel,
  onSuccess,
}: {
  chargepointId: number;
  connector?: Connector;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const isEdit = connector != null;

  const [typeId, setTypeId] = useState(String(connector?.connectorTypeId ?? ''));
  const [name, setName] = useState(connector?.name ?? '');
  const [power, setPower] = useState(connector?.power != null ? String(connector.power) : '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave = typeId !== '' && power.trim() !== '' && !isNaN(Number(power));

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      const payload = {
        ...(name.trim() && { name: name.trim() }),
        connector_type_id: Number(typeId),
        power: parseFloat(power),
      };
      if (isEdit) {
        await put(endpoints.connectors.update(chargepointId, connector.id), payload);
      } else {
        await post(endpoints.connectors.create(chargepointId), payload);
      }
      onSuccess();
    } catch {
      setSaveError('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ height: '100%', borderColor: 'primary.main', borderStyle: 'dashed' }}
    >
      <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              variant="caption"
              color="primary"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                fontSize: '0.65rem',
              }}
            >
              {isEdit ? 'Editar conector' : 'Nuevo conector'}
            </Typography>
            <IconButton size="small" onClick={onCancel} disabled={saving}>
              <Iconify icon="mingcute:close-line" width={16} />
            </IconButton>
          </Stack>

          <TextField
            select
            label="Tipo"
            required
            size="small"
            fullWidth
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
          >
            {CONNECTOR_TYPES.map((t) => (
              <MenuItem key={t.id} value={String(t.id)}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={1}>
            <TextField
              label="Nombre (opcional)"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Derecho"
            />
            <TextField
              label="kW"
              required
              size="small"
              sx={{ width: 90 }}
              type="number"
              value={power}
              onChange={(e) => setPower(e.target.value)}
              placeholder="22"
              slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
            />
          </Stack>

          {saveError && (
            <Typography variant="caption" color="error">
              {saveError}
            </Typography>
          )}

          <Divider />

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button size="small" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={!canSave || saving}
              onClick={handleSave}
              startIcon={saving ? <CircularProgress size={12} color="inherit" /> : undefined}
            >
              {isEdit ? 'Guardar' : 'Añadir'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

export default function ChargerDetailV2() {
  const { id } = useParams();
  const router = useRouter();

  const [chargepoint, setChargepoint] = useState<Chargepoint | undefined>();
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogState>({ type: null });
  const [resetOpen, setResetOpen] = useState(false);
  const [editState, setEditState] = useState<
    { mode: 'idle' } | { mode: 'add' } | { mode: 'edit'; connectorId: number }
  >({ mode: 'idle' });

  const loadChargepoint = async () => {
    try {
      const response: ChargingStationResponse = await fetcher(
        endpoints.chargepoints.single(Number(id))
      );
      setChargepoint(response.data);
    } catch (err) {
      console.error('Error fetching chargepoint:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadChargepoint();
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const closeDialog = () => setDialog({ type: null });

  const hasLocation =
    chargepoint?.latitude != null &&
    chargepoint?.longitude != null &&
    chargepoint.latitude !== 0 &&
    chargepoint.longitude !== 0;

  const missingConnectors = (chargepoint?.connectors.length ?? 0) === 0;

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (!chargepoint) {
    return (
      <DashboardContent>
        <Alert severity="error">No se encontró el cargador.</Alert>
      </DashboardContent>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {chargepoint.name ?? 'Cargador'} | {CONFIG.appName}
        </title>
      </Helmet>

      <DashboardContent>
        <Stack spacing={2.5}>
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton
              onClick={() => router.back()}
              size="small"
              sx={{ color: 'text.secondary', flexShrink: 0 }}
            >
              <Iconify icon="eva:arrow-ios-back-fill" width={22} />
            </IconButton>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Typography variant="h5" noWrap>
                  {chargepoint.name ?? '-'}
                </Typography>
                {chargepoint.is_private && (
                  <Label color="default" variant="outlined">
                    Privado
                  </Label>
                )}
              </Stack>

              {chargepoint.address && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                  <Iconify
                    icon="mdi:map-marker-outline"
                    width={14}
                    sx={{ color: 'text.disabled', flexShrink: 0 }}
                  />
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {chargepoint.address}
                  </Typography>
                </Stack>
              )}
            </Box>

            <ChargerStatusLabel status={chargepoint.status} />
          </Stack>

          {/* ── Warning banner ──────────────────────────────────────────────── */}
          {missingConnectors && (
            <Alert severity="warning">Este cargador no tiene conectores configurados.</Alert>
          )}

          {/* ── Información + OCPP ──────────────────────────────────────────── */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="Información">
                <InfoRow label="Nombre" value={chargepoint.name} />
                <InfoRow label="Dirección" value={chargepoint.address} />
                {hasLocation && (
                  <InfoRow
                    label="Coordenadas"
                    value={`${chargepoint.latitude?.toFixed(5)}, ${chargepoint.longitude?.toFixed(5)}`}
                  />
                )}
                {chargepoint.client_id != null && (
                  <InfoRow label="ID cliente" value={chargepoint.client_id} />
                )}
                <InfoRow label="Acceso" value={chargepoint.is_private ? 'Privado' : 'Público'} />

                {hasLocation && (
                  <Box sx={{ mt: 2, borderRadius: 1.5, overflow: 'hidden', height: 180 }}>
                    <Map
                      mapboxAccessToken={CONFIG.mapboxApiKey}
                      initialViewState={{
                        longitude: chargepoint.longitude,
                        latitude: chargepoint.latitude,
                        zoom: 14,
                      }}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      style={{ width: '100%', height: '100%' }}
                    >
                      <Marker
                        longitude={chargepoint.longitude ?? 0}
                        latitude={chargepoint.latitude ?? 0}
                        color="#2DE21D"
                      />
                    </Map>
                  </Box>
                )}
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="Configuración OCPP">
                <InfoRow label="OCPP ID" value={chargepoint.ocpp_id} />
                <InfoRow
                  label="Endpoint"
                  value={'ws://' + chargepoint.endpointAddress + ':' + chargepoint.port}
                />
                <InfoRow label="Client CP ID" value={chargepoint.client_cp_id} mono />
                <InfoRow label="Protocolo" value="OCPP 1.6J" />
              </SectionCard>
            </Grid>
          </Grid>

          {/* ── Conectores ──────────────────────────────────────────────────── */}
          <SectionCard
            title={`Conectores (${chargepoint.connectors.length})`}
            warning={missingConnectors}
            action={
              editState.mode === 'idle' && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="mdi:plus" width={16} />}
                  onClick={() => setEditState({ mode: 'add' })}
                >
                  Añadir
                </Button>
              )
            }
          >
            <Grid container spacing={2}>
              {chargepoint.connectors.map((conn) => {
                if (editState.mode === 'edit' && editState.connectorId === conn.id) {
                  return (
                    <Grid key={conn.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <ConnectorFormCard
                        chargepointId={chargepoint.id}
                        connector={conn}
                        onCancel={() => setEditState({ mode: 'idle' })}
                        onSuccess={() => {
                          setEditState({ mode: 'idle' });
                          loadChargepoint();
                        }}
                      />
                    </Grid>
                  );
                }
                return (
                  <Grid key={conn.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <ConnectorCard
                      connector={conn}
                      chargepointId={chargepoint.id}
                      onAction={setDialog}
                      onEdit={(c) => {
                        setEditState({ mode: 'edit', connectorId: c.id });
                      }}
                      onRemoveRate={() => {
                        if (conn.rateId != null) {
                          del(
                            endpoints.connectors.deassign(chargepoint.id, conn.id, conn.rateId)
                          ).then(() => loadChargepoint());
                        }
                      }}
                      onRateAssigned={loadChargepoint}
                    />
                  </Grid>
                );
              })}
              {editState.mode === 'add' && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <ConnectorFormCard
                    chargepointId={chargepoint.id}
                    onCancel={() => setEditState({ mode: 'idle' })}
                    onSuccess={() => {
                      setEditState({ mode: 'idle' });
                      loadChargepoint();
                    }}
                  />
                </Grid>
              )}
              {chargepoint.connectors.length === 0 && editState.mode !== 'add' && (
                <Grid size={12}>
                  <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
                    <Iconify
                      icon="mdi:power-plug-off-outline"
                      width={40}
                      sx={{ color: 'text.disabled' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Sin conectores configurados
                    </Typography>
                  </Stack>
                </Grid>
              )}
            </Grid>
          </SectionCard>

          {/* ── Recargas ────────────────────────────────────────────────────── */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Recargas
            </Typography>
            <TransactionsTable
              endpoint={`/chargingstations/${id}/transactions`}
              defaultPageSize={3}
              enableSearch={false}
            />
          </Box>
        </Stack>
      </DashboardContent>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <ResetDialog
        open={resetOpen}
        chargepointId={chargepoint.id}
        onClose={() => setResetOpen(false)}
      />
      <AvailabilityDialog
        open={dialog.type === 'availability'}
        chargepointId={chargepoint.id}
        connectorId={dialog.connectorId ?? 0}
        onClose={closeDialog}
      />
      <UnlockDialog
        open={dialog.type === 'unlock'}
        chargepointId={chargepoint.id}
        connectorId={dialog.connectorId ?? 0}
        onClose={closeDialog}
      />
    </>
  );
}
