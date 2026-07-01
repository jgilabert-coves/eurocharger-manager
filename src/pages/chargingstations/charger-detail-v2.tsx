import 'mapbox-gl/dist/mapbox-gl.css';

import type { Sim } from 'src/types/sims';
import type { RateItem } from 'src/types/rates';
import type { Connector } from 'src/types/connector';
import type { Subscription } from 'src/types/billing';
import type { Chargepoint, ChargingStationResponse } from 'src/types/chargepoint';

import { useParams } from 'react-router';
import Map, { Marker } from 'react-map-gl';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { X, TrashIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { Tooltip } from '@mui/material';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogContentText from '@mui/material/DialogContentText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import { del, put, post, fetcher, endpoints } from 'src/lib/axios';
import { RequestSimsDialog } from 'src/pages/sims-account/components/request-sims-dialog';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { PhosphorIcon } from 'src/components/phosphor-icon';
import { useNotification } from 'src/components/notification';
import { ResetDialog } from 'src/components/ocpp/reset/dialog';
import { UnlockDialog } from 'src/components/ocpp/unlock/dialog';
import { TransactionsTable } from 'src/components/transactions-table';
import { StopTransactionDialog } from 'src/components/ocpp/stop/dialog';
import { CreateRateDialog } from 'src/components/rate/create-rate-dialog';
import { StartTransactionDialog } from 'src/components/ocpp/start/dialog';
import { AvailabilityDialog } from 'src/components/ocpp/availability/dialog';
import { LocationPicker } from 'src/components/location-picker/location-picker';
import { ConnectorStatusChip } from 'src/components/chips/connector-status-chip';
import { ConnectorTypeIcon } from 'src/components/chargepoint/connector-type-icon';

import { useAbility } from 'src/auth/hooks/use-ability';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

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
      <CardContent
        sx={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {warning && <Iconify icon="mdi:alert" width={16} sx={{ color: 'warning.main' }} />}
            <Typography variant="subtitle2" fontWeight={700}>
              {title}
            </Typography>
          </Stack>
          {action}
        </Stack>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</Box>
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

const STOP_STATUSES = new Set(['charging', 'finishing', 'suspendedev', 'suspendedevse']);

type DialogState = {
  type: 'availability' | 'unlock' | 'start' | 'stop' | null;
  connectorId?: number;
  transactionId?: number | null;
};

function ConnectorCard({
  connector,
  chargepointId,
  onAction,
  onEdit,
  onDelete,
  onRemoveRate,
  onRateAssigned,
}: {
  connector: Connector;
  chargepointId: number;
  onAction: (state: DialogState) => void;
  onEdit: (connector: Connector) => void;
  onDelete: (connector: Connector) => void;
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
  const { canOperate, isViewOnly, hasAnyRole } = useAbility();
  const { notifySuccess, notifyError } = useNotification();

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
      notifySuccess('Acción realizada con éxito');
    } catch {
      setSaveError('Error al asignar la tarifa. Inténtalo de nuevo.');
      notifyError('Ha ocurrido un error al lanzar la acción');
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
            <Stack direction="row" alignItems="stretch" justifyContent="space-between" spacing={1}>
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
                      name={
                        connector.connectorTypeId
                          ? CONNECTOR_TYPE_MAP[connector.connectorTypeId]
                          : null
                      }
                      size={30}
                    />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {connector.connectorTypeId
                      ? (CONNECTOR_TYPE_MAP[connector.connectorTypeId] ?? 'Desconocido')
                      : 'Sin asignar'}
                  </Typography>
                </Stack>

                <ConnectorStatusChip
                  label={connector.status}
                  status={connector.status}
                  sx={{ mt: 1.5 }}
                />
              </Box>

              <Stack
                alignItems="flex-end"
                justifyContent="space-between"
                spacing={0.75}
                sx={{ flexShrink: 0 }}
              >
                <Stack direction="row" spacing={0.5}>
                  {!isViewOnly() && (
                    <IconButton
                      size="small"
                      title="Editar conector"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(connector);
                      }}
                    >
                      <PencilSimpleIcon width={16} />
                    </IconButton>
                  )}
                  {hasAnyRole(['saas_admin', 'saas_owner', 'eurocharger']) && (
                    <IconButton
                      size="small"
                      title="Eliminar conector"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(connector);
                      }}
                    >
                      <PhosphorIcon icon={TrashIcon} size={16} />
                    </IconButton>
                  )}
                </Stack>
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
                  {!isViewOnly() && (
                    <>
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
                    </>
                  )}
                </Stack>
              ) : (
                !isViewOnly() && (
                  <Button variant="soft" size="small" onClick={() => setAssignOpen((o) => !o)}>
                    <Iconify icon="mdi:plus" width={14} sx={{ mr: 0.5 }} />
                    Asignar tarifa
                  </Button>
                )
              )}

              {canOperate() && (
                <Stack direction="row" spacing={0.5}>
                  {STOP_STATUSES.has(connector.status?.toLowerCase() ?? '') ? (
                    <Tooltip title="Parar recarga">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction({
                            type: 'stop',
                            connectorId: ocppConnectorId,
                            transactionId: connector.transactionId,
                          });
                        }}
                      >
                        <Iconify icon="mdi:stop" width={16} />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Iniciar recarga">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction({ type: 'start', connectorId: ocppConnectorId });
                        }}
                      >
                        <Iconify icon="mdi:play" width={16} />
                      </IconButton>
                    </Tooltip>
                  )}

                  <Tooltip title="Desbloquear conector">
                    <IconButton
                      size="small"
                      color="info"
                      title="Desbloquear conector"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction({ type: 'unlock', connectorId: ocppConnectorId });
                      }}
                    >
                      <Iconify icon="mdi:lock-open-outline" width={16} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Cambiar disponibilidad">
                    <IconButton
                      size="small"
                      color="success"
                      title="Cambiar disponibilidad"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction({ type: 'availability', connectorId: ocppConnectorId });
                      }}
                    >
                      <Iconify icon="mdi:swap-horizontal" width={16} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
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
  const { notifySuccess, notifyError } = useNotification();

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
      notifySuccess('Acción realizada con éxito');
    } catch {
      setSaveError('Error al guardar. Inténtalo de nuevo.');
      notifyError('Ha ocurrido un error al lanzar la acción');
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
              <PhosphorIcon icon={X} size={16} />
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
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [chargepoint, setChargepoint] = useState<Chargepoint | undefined>();
  const [loading, setLoading] = useState(true);
  const [ocppConnected, setOcppConnected] = useState<boolean | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: null });
  const [resetOpen, setResetOpen] = useState(false);
  const [editState, setEditState] = useState<
    { mode: 'idle' } | { mode: 'add' } | { mode: 'edit'; connectorId: number }
  >({ mode: 'idle' });
  const [deleteConfirm, setDeleteConfirm] = useState<Connector | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { canOperate, isViewOnly, hasAnyRole, hasRole } = useAbility();
  const { notifySuccess, notifyError } = useNotification();

  // ── Edit chargepoint state ──────────────────────────────────────────────────
  // ── Editar cargador: identidad + ubicación ──────────────────────────────────
  const [editChargerOpen, setEditChargerOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Servicios adicionales: SIM, Call Center, tiempo máx. recarga ─────────────
  const [servicesEditOpen, setServicesEditOpen] = useState(false);
  const [servicesConfirmOpen, setServicesConfirmOpen] = useState(false);
  const [editHasCallCenter, setEditHasCallCenter] = useState(false);
  const [editSimCard, setEditSimCard] = useState('');
  const [editMaxRechargeTime, setEditMaxRechargeTime] = useState('');
  const [editShareEnergy, setEditShareEnergy] = useState(false);
  const [servicesSaving, setServicesSaving] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [simToAssign, setSimToAssign] = useState<number | ''>('');

  // ── Asignar estación (rol eurocharger) ──────────────────────────────────────
  const [assignStationOpen, setAssignStationOpen] = useState(false);
  const [stationSearch, setStationSearch] = useState('');
  const [stationOptions, setStationOptions] = useState<
    { id: number; name: string | null; address?: string | null }[]
  >([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [assigningStationId, setAssigningStationId] = useState<number | null>(null);

  const accountId = user?.account_id ?? 0;

  const { data: subscriptionData } = useQuery<{ data: Subscription }>({
    queryKey: ['account-subscription', accountId],
    queryFn: () => fetcher(endpoints.accounts.subscription(accountId)),
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
  });
  const callCenterItem = subscriptionData?.data?.items?.find((i) => i.type === 'call_center');
  const callCenterUnitPrice = callCenterItem?.unit_price_cents;

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')} €/mes`;

  const loadChargepoint = async () => {
    try {
      const response: ChargingStationResponse = await fetcher(
        endpoints.chargepoints.single(Number(id))
      );
      setChargepoint(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching chargepoint:', err);
      return undefined;
    }
  };

  // ── SIM mutations ──────────────────────────────────────────────────────────
  // El pedido de tarjetas es a nivel de cuenta (diálogo RequestSimsDialog), ya no
  // una solicitud por cargador.
  const [requestSimsOpen, setRequestSimsOpen] = useState(false);

  const { mutate: removeSimAssignment, isPending: isRemovingSimMutation } = useMutation({
    mutationFn: () => del(endpoints.sims.removeAssignment(Number(id))),
    onSuccess: () => {
      loadChargepoint();
      notifySuccess('Solicitud de retirada de SIM enviada');
    },
    onError: () => {
      notifyError('Ha ocurrido un error al lanzar la acción');
    },
  });

  const { data: simConnectivityData, isLoading: isLoadingSimConnectivity } = useQuery<{
    data: { status: 'ONLINE' | 'ATTACHED' | 'OFFLINE' | 'BLOCKED' | 'UNKNOWN' };
  }>({
    queryKey: ['sim-connectivity', chargepoint?.sim_card],
    queryFn: () => fetcher(endpoints.sims.connectivity(chargepoint!.sim_card!)),
    enabled: !!chargepoint?.sim_card && hasAnyRole(['saas_owner', 'eurocharger']),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
  const simConnectivity = simConnectivityData?.data?.status ?? 'UNKNOWN';

  // SIMs visibles solo para saas_owner o eurocharger.
  const canManageSim = hasAnyRole(['saas_owner', 'eurocharger']);

  // SIMs asignables = las de la cuenta sin cargador asignado (el eurocharger las
  // asigna primero a la cuenta desde el panel /sims; aquí se asignan a un cargador).
  const { data: mySimsData } = useQuery<{ data: Sim[] }>({
    queryKey: ['sims', 'mine'],
    queryFn: () => fetcher(endpoints.sims.mine),
    enabled: servicesEditOpen && hasAnyRole(['saas_owner', 'eurocharger']),
    staleTime: 30 * 1000,
  });
  const availableSims = (mySimsData?.data ?? []).filter((s) => s.chargepoint_id == null);

  const { mutate: assignSim, isPending: isAssigningSim } = useMutation({
    mutationFn: (simId: number) =>
      put(endpoints.sims.update(simId), { chargepoint_id: Number(id) }),
    onSuccess: () => {
      setSimToAssign('');
      queryClient.invalidateQueries({ queryKey: ['sims'] });
      loadChargepoint();
      notifySuccess('SIM asignada con éxito');
    },
    onError: () => notifyError('Ha ocurrido un error al asignar la SIM'),
  });

  const openEditCharger = () => {
    if (!chargepoint) return;
    setEditName(chargepoint.name ?? '');
    setEditIsPrivate(chargepoint.is_private ?? false);
    setEditAddress(chargepoint.address ?? '');
    setEditPostalCode(chargepoint.postal_code ?? '');
    setEditCity(chargepoint.city ?? '');
    setEditLatitude(chargepoint.latitude != null ? String(chargepoint.latitude) : '');
    setEditLongitude(chargepoint.longitude != null ? String(chargepoint.longitude) : '');
    setEditError(null);
    setEditChargerOpen(true);
  };

  const handleSaveCharger = async () => {
    try {
      setEditSaving(true);
      setEditError(null);
      await put(endpoints.chargepoints.update(Number(id)), {
        name: editName.trim() || undefined,
        is_private: editIsPrivate,
        address: editAddress.trim() || null,
        postal_code: editPostalCode.trim() || null,
        city: editCity.trim() || null,
        latitude: editLatitude.trim() !== '' ? Number(editLatitude) : null,
        longitude: editLongitude.trim() !== '' ? Number(editLongitude) : null,
      });
      setEditChargerOpen(false);
      await loadChargepoint();
      notifySuccess('Acción realizada con éxito');
    } catch {
      setEditError('Error al guardar los cambios. Inténtalo de nuevo.');
      notifyError('Ha ocurrido un error al lanzar la acción');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Servicios adicionales ──────────────────────────────────────────────────
  const openEditServices = () => {
    if (!chargepoint) return;
    setEditHasCallCenter(chargepoint.has_call_center ?? false);
    setEditSimCard(chargepoint.sim_card != null ? String(chargepoint.sim_card) : '');
    setEditMaxRechargeTime(
      chargepoint.max_recharge_time != null ? String(chargepoint.max_recharge_time) : ''
    );
    setEditShareEnergy(chargepoint.share_energy ?? false);
    setSimToAssign('');
    setServicesError(null);
    setServicesEditOpen(true);
  };

  // El cambio de SIM / Call Center conlleva coste en la suscripción: pedimos
  // confirmación antes de aplicar.
  const requestSaveServices = () => {
    setServicesEditOpen(false);
    setServicesConfirmOpen(true);
  };

  const confirmSaveServices = async () => {
    try {
      setServicesSaving(true);
      setServicesError(null);
      await put(endpoints.chargepoints.update(Number(id)), {
        has_call_center: editHasCallCenter,
        sim_card: editSimCard !== '' ? Number(editSimCard) : null,
        max_recharge_time: editMaxRechargeTime.trim() !== '' ? Number(editMaxRechargeTime) : null,
        share_energy: editShareEnergy,
      });
      setServicesConfirmOpen(false);
      await loadChargepoint();
      queryClient.invalidateQueries({ queryKey: ['account-subscription', accountId] });
      notifySuccess('Servicios actualizados correctamente');
    } catch {
      setServicesError('Error al guardar los servicios. Inténtalo de nuevo.');
      notifyError('Ha ocurrido un error al lanzar la acción');
      setServicesConfirmOpen(false);
      setServicesEditOpen(true);
    } finally {
      setServicesSaving(false);
    }
  };

  const handleAssignStation = async (stationId: number) => {
    try {
      setAssigningStationId(stationId);
      await put(endpoints.chargepoints.update(Number(id)), {
        charging_station_id: stationId,
      });
      setAssignStationOpen(false);
      setStationSearch('');
      await loadChargepoint();
      notifySuccess('Estación asignada correctamente');
    } catch {
      notifyError('No se pudo asignar la estación');
    } finally {
      setAssigningStationId(null);
    }
  };

  useEffect(() => {
    if (!assignStationOpen) return () => {};
    let cancelled = false;
    setLoadingStations(true);
    const timer = setTimeout(
      async () => {
        try {
          const res = await fetcher([
            endpoints.locations.list,
            { params: { page: 0, pageSize: 20, searchQuery: stationSearch } },
          ]);
          if (!cancelled) setStationOptions(res?.data ?? []);
        } catch {
          // ignore
        } finally {
          if (!cancelled) setLoadingStations(false);
        }
      },
      stationSearch ? 300 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [assignStationOpen, stationSearch]);

  const loadOcppStatus = async () => {
    try {
      const response = await fetcher(endpoints.chargepoints.isConnected(Number(id)));
      setOcppConnected(response?.data?.connected ?? false);
    } catch {
      setOcppConnected(false);
    }
  };

  const handleDeleteConnectorConfirm = async () => {
    if (!deleteConfirm || !chargepoint) return;
    try {
      setDeleting(true);
      await del(endpoints.connectors.delete(chargepoint.id, deleteConfirm.id));
      setDeleteConfirm(null);
      loadChargepoint();
      notifySuccess('Acción realizada con éxito');
    } catch (err: any) {
      const message = err?.error ?? 'Error al eliminar el conector. Inténtalo de nuevo.';
      setDeleteError(message);
      setDeleteConfirm(null);
      notifyError('Ha ocurrido un error al lanzar la acción');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const cp = await loadChargepoint();
      // El estado de conexión OCPP no aplica a Roaming/OCPI (no son cargadores propios).
      if (cp && cp.source !== 'hubject' && cp.source !== 'ocpi') {
        await loadOcppStatus();
      }
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

  // En cargadores Roaming/OCPI no tenemos acceso a la configuración OCPP.
  const showOcppConfig = chargepoint?.source !== 'hubject' && chargepoint?.source !== 'ocpi';

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

            {canOperate() && (
              <Button
                variant="contained"
                size="small"
                color="error"
                startIcon={<Iconify icon="mdi:reload" />}
                onClick={() => setResetOpen(true)}
              >
                Reiniciar
              </Button>
            )}
          </Stack>

          {/* ── Warning banner ──────────────────────────────────────────────── */}
          {missingConnectors && (
            <Alert severity="warning">Este cargador no tiene conectores configurados.</Alert>
          )}

          {/* ── Información + OCPP ──────────────────────────────────────────── */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard
                title="Información"
                action={
                  !hasRole('saas_guest') ? (
                    <IconButton size="small" title="Editar cargador" onClick={openEditCharger}>
                      <PencilSimpleIcon width={16} />
                    </IconButton>
                  ) : undefined
                }
              >
                <InfoRow label="Nombre" value={chargepoint.name} />
                <InfoRow label="Dirección" value={chargepoint.address} />
                {(chargepoint.postal_code || chargepoint.city) && (
                  <InfoRow
                    label="Ciudad"
                    value={[chargepoint.postal_code, chargepoint.city].filter(Boolean).join(' ')}
                  />
                )}
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
                {hasAnyRole(['eurocharger']) && (
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                    sx={{ py: 0.5 }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      Estación
                    </Typography>
                    {chargepoint.charging_station_id != null ? (
                      <Button
                        variant="text"
                        size="small"
                        endIcon={<Iconify icon="mdi:open-in-new" width={14} />}
                        onClick={() =>
                          window.open(
                            paths.locations.detail(String(chargepoint.charging_station_id)),
                            '_blank',
                            'noopener,noreferrer'
                          )
                        }
                        sx={{ py: 0, minWidth: 0 }}
                      >
                        {chargepoint.charging_station_name ??
                          `Estación ${chargepoint.charging_station_id}`}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Iconify icon="mdi:link-variant-plus" width={14} />}
                        onClick={() => setAssignStationOpen(true)}
                      >
                        Asignar estación
                      </Button>
                    )}
                  </Stack>
                )}
                {/*chargepoint.sim_card != null && (
                  <InfoRow label="SIM" value={chargepoint.sim_card} />
                )*/}

                {hasLocation && (
                  <Box
                    sx={{ mt: 2, borderRadius: 1.5, overflow: 'hidden', flex: 1, minHeight: 150 }}
                  >
                    <Map
                      mapboxAccessToken={CONFIG.mapboxApiKey}
                      initialViewState={{
                        longitude: chargepoint.longitude ?? undefined,
                        latitude: chargepoint.latitude ?? undefined,
                        zoom: 14,
                      }}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      style={{ width: '100%', height: '100%' }}
                      dragPan={false}
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
              <Stack spacing={2} sx={{ height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {showOcppConfig ? (
                    <SectionCard
                      title="Configuración OCPP"
                      action={
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: ocppConnected ? 'success.main' : 'error.main',
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color={ocppConnected ? 'success.main' : 'error.main'}
                          >
                            {ocppConnected ? 'Conectado' : 'Desconectado'}
                          </Typography>
                        </Stack>
                      }
                    >
                      <InfoRow label="OCPP ID" value={chargepoint.ocpp_id} />
                      <InfoRow
                        label="Endpoint"
                        value={'ws://' + chargepoint.endpointAddress + ':' + chargepoint.port}
                      />
                      {chargepoint.client_cp_id != null && (
                        <InfoRow label="Client CP ID" value={chargepoint.client_cp_id} mono />
                      )}
                      <InfoRow label="Protocolo" value="OCPP 1.6J" />
                      {hasAnyRole(['saas_admin', 'saas_owner', 'eurocharger']) && (
                        <Box
                          sx={{ mt: 'auto', pt: 1.5, display: 'flex', justifyContent: 'flex-end' }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Iconify icon="mingcute:settings-3-line" width={16} />}
                            onClick={() =>
                              router.push(paths.chargingstations.ocppConfig(String(chargepoint.id)))
                            }
                          >
                            Ver configuración
                          </Button>
                        </Box>
                      )}
                    </SectionCard>
                  ) : (
                    <SectionCard
                      title="Operador"
                      action={
                        <Label
                          color={chargepoint.source === 'ocpi' ? 'info' : 'warning'}
                          variant="soft"
                        >
                          {chargepoint.source === 'ocpi' ? 'OCPI' : 'Roaming'}
                        </Label>
                      }
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            bgcolor: 'background.neutral',
                          }}
                        >
                          {chargepoint.operator_logo_url ? (
                            <Box
                              component="img"
                              // ?v fuerza una clave de caché nueva en el edge de Google: la URL
                              // sin query tenía cacheado un objeto con Cache-Control malformado
                              // que rompía HTTP/2 (ERR_HTTP2_PROTOCOL_ERROR).
                              src={`${chargepoint.operator_logo_url}?v=1`}
                              alt={chargepoint.operator_name ?? 'Operador'}
                              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <Iconify icon="mdi:transit-connection-variant" width={24} />
                          )}
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {chargepoint.operator_name ?? 'Operador externo'}
                        </Typography>
                      </Stack>
                      {chargepoint.operator_code && (
                        <InfoRow label="ID operador" value={chargepoint.operator_code} mono />
                      )}
                    </SectionCard>
                  )}
                </Box>

                {showOcppConfig && (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <SectionCard
                      title="Configuración adicional"
                      action={
                        !hasRole('saas_guest') ? (
                          <IconButton
                            size="small"
                            title="Editar configuración adicional"
                            onClick={openEditServices}
                          >
                            <PencilSimpleIcon width={16} />
                          </IconButton>
                        ) : undefined
                      }
                    >
                      <InfoRow
                        label="Call Center"
                        value={chargepoint.has_call_center ? 'Activo' : 'Inactivo'}
                      />
                      <InfoRow
                        label="Comparte energía"
                        value={chargepoint.share_energy ? 'Sí' : 'No'}
                      />
                      <InfoRow
                        label="Tiempo máx. recarga"
                        value={
                          chargepoint.max_recharge_time != null
                            ? `${chargepoint.max_recharge_time} min`
                            : '—'
                        }
                      />

                      {canManageSim && (
                        <InfoRow
                          label="SIM"
                          value={
                            chargepoint.sim_card != null
                              ? (chargepoint.sim_iccid ?? `SIM #${chargepoint.sim_card}`)
                              : chargepoint.sim_requested
                                ? 'Pendiente'
                                : 'No asignada'
                          }
                        />
                      )}

                      {canManageSim && chargepoint.sim_card != null && (
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={1}
                          sx={{ py: 0.5 }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ flexShrink: 0 }}
                          >
                            Conectividad SIM
                          </Typography>
                          <Tooltip
                            title={
                              simConnectivity === 'ONLINE'
                                ? 'El endpoint tiene una conexión de datos activa.'
                                : simConnectivity === 'ATTACHED'
                                  ? 'El dispositivo se ha conectado a la red en el pasado. Se mostrará como CONECTADO hasta que la red visitada indique inactividad (puede tardar 1-2 días).'
                                  : simConnectivity === 'OFFLINE'
                                    ? 'El endpoint no se ha conectado a la red o no ha tenido actividad en los últimos 1-2 días.'
                                    : simConnectivity === 'BLOCKED'
                                      ? 'El dispositivo no tiene servicio permitido (límites de tráfico superados).'
                                      : ''
                            }
                            arrow
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isLoadingSimConnectivity ? (
                                <CircularProgress size={12} />
                              ) : (
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor:
                                      simConnectivity === 'ONLINE'
                                        ? 'success.main'
                                        : simConnectivity === 'ATTACHED'
                                          ? 'warning.main'
                                          : simConnectivity === 'BLOCKED'
                                            ? 'error.dark'
                                            : simConnectivity === 'OFFLINE'
                                              ? 'error.main'
                                              : 'grey.400',
                                  }}
                                />
                              )}
                              <Typography
                                variant="caption"
                                fontWeight={600}
                                color={
                                  simConnectivity === 'ONLINE'
                                    ? 'success.main'
                                    : simConnectivity === 'ATTACHED'
                                      ? 'warning.main'
                                      : simConnectivity === 'BLOCKED'
                                        ? 'error.dark'
                                        : simConnectivity === 'OFFLINE'
                                          ? 'error.main'
                                          : 'text.disabled'
                                }
                              >
                                {simConnectivity === 'ONLINE'
                                  ? 'Online'
                                  : simConnectivity === 'ATTACHED'
                                    ? 'Conectado'
                                    : simConnectivity === 'OFFLINE'
                                      ? 'Offline'
                                      : simConnectivity === 'BLOCKED'
                                        ? 'Bloqueado'
                                        : 'Sin datos'}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Stack>
                      )}
                    </SectionCard>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>

          {/* ── Conectores ──────────────────────────────────────────────────── */}
          <SectionCard
            title={`Conectores (${chargepoint.connectors.length})`}
            warning={missingConnectors}
            action={
              editState.mode === 'idle' &&
              !isViewOnly() && (
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
                      onDelete={(c) => setDeleteConfirm(c)}
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
              showStatus
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
      <StartTransactionDialog
        open={dialog.type === 'start'}
        data={{
          chargepointId: chargepoint.id,
          connectorOcppId: dialog.connectorId ?? 0,
        }}
        onClose={closeDialog}
      />
      <StopTransactionDialog
        open={dialog.type === 'stop'}
        data={{
          chargepointId: chargepoint.id,
          ocppId: chargepoint.ocpp_id ?? '',
          transactionId: dialog.transactionId ?? null,
        }}
        onClose={closeDialog}
      />

      {/* Delete connector confirmation dialog */}
      <Dialog open={deleteConfirm !== null} onClose={() => !deleting && setDeleteConfirm(null)}>
        <DialogTitle>Eliminar conector</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`¿Eliminar conector ${deleteConfirm?.name ?? deleteConfirm?.id}? Esta acción no se puede deshacer.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConnectorConfirm}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error snackbar for delete failures (e.g. connector has transactions) */}
      <Snackbar
        open={deleteError !== null}
        autoHideDuration={6000}
        onClose={() => setDeleteError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setDeleteError(null)} sx={{ width: '100%' }}>
          {deleteError}
        </Alert>
      </Snackbar>

      {/* Edit chargepoint dialog */}
      <Dialog
        open={editChargerOpen}
        onClose={() => !editSaving && setEditChargerOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar cargador</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {editError && <Alert severity="error">{editError}</Alert>}

            {/* ── Identidad y privacidad ── */}
            <Typography variant="subtitle2" fontWeight={700}>
              Identidad y privacidad
            </Typography>
            <TextField
              label="Nombre"
              size="small"
              fullWidth
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editIsPrivate}
                  onChange={(e) => setEditIsPrivate(e.target.checked)}
                  size="small"
                />
              }
              label="Acceso privado"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
              Un cargador privado solo es visible para los usuarios añadidos en Autorizaciones. Si
              todos los cargadores de la estación son privados, la estación queda oculta.
            </Typography>

            <Divider />

            {/* ── Ubicación (mismo selector que en estaciones) ── */}
            <Typography variant="subtitle2" fontWeight={700}>
              Ubicación
            </Typography>
            <TextField
              label="Dirección"
              size="small"
              fullWidth
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Código postal"
                size="small"
                fullWidth
                value={editPostalCode}
                onChange={(e) => setEditPostalCode(e.target.value)}
              />
              <TextField
                label="Ciudad"
                size="small"
                fullWidth
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
              />
            </Stack>
            <LocationPicker
              value={{
                latitude: editLatitude,
                longitude: editLongitude,
                address: editAddress,
                city: editCity,
                postalCode: editPostalCode,
              }}
              onChange={(patch) => {
                if (patch.latitude !== undefined) setEditLatitude(patch.latitude);
                if (patch.longitude !== undefined) setEditLongitude(patch.longitude);
                if (patch.address !== undefined) setEditAddress(patch.address);
                if (patch.city !== undefined) setEditCity(patch.city);
                if (patch.postalCode !== undefined) setEditPostalCode(patch.postalCode);
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditChargerOpen(false)} disabled={editSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCharger}
            disabled={editSaving || editName.trim() === ''}
            startIcon={editSaving ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Editar servicios adicionales (SIM, Call Center, tiempo máx. recarga) */}
      <Dialog
        open={servicesEditOpen}
        onClose={() => !servicesSaving && setServicesEditOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Editar configuración adicional</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {servicesError && <Alert severity="error">{servicesError}</Alert>}

            {/* ── SIM ── */}
            {canManageSim && chargepoint && (
              <>
                <Typography variant="subtitle2" fontWeight={700}>
                  SIM
                </Typography>

                {chargepoint.sim_card != null ? (
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Chip
                      size="small"
                      color="success"
                      icon={<Iconify icon="solar:sim-card-bold" />}
                      label={chargepoint.sim_iccid ?? `SIM #${chargepoint.sim_card}`}
                    />
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => removeSimAssignment()}
                      disabled={isRemovingSimMutation}
                    >
                      Quitar SIM
                    </Button>
                  </Stack>
                ) : availableSims.length > 0 ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="SIM de la cuenta"
                      value={simToAssign}
                      onChange={(e) => setSimToAssign(Number(e.target.value))}
                    >
                      {availableSims.map((sim) => (
                        <MenuItem key={sim.id} value={sim.id}>
                          {sim.iccid}
                          {sim.name ? ` — ${sim.name}` : ''}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => simToAssign !== '' && assignSim(Number(simToAssign))}
                      disabled={simToAssign === '' || isAssigningSim}
                    >
                      Asignar
                    </Button>
                  </Stack>
                ) : (
                  <Stack spacing={1} alignItems="flex-start">
                    <Typography variant="caption" color="text.secondary">
                      No tienes tarjetas libres en la cuenta.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Iconify icon="solar:sim-card-bold" />}
                      onClick={() => setRequestSimsOpen(true)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Solicitar tarjetas
                    </Button>
                  </Stack>
                )}

                <Divider />
              </>
            )}

            <FormControlLabel
              sx={{ ml: 0 }}
              control={
                <Switch
                  checked={editHasCallCenter}
                  onChange={(e) => setEditHasCallCenter(e.target.checked)}
                  size="small"
                />
              }
              label={
                callCenterUnitPrice !== undefined
                  ? `Call Center – ${formatPrice(callCenterUnitPrice)}`
                  : 'Call Center'
              }
            />
            <FormControlLabel
              sx={{ ml: 0 }}
              control={
                <Switch
                  checked={editShareEnergy}
                  onChange={(e) => setEditShareEnergy(e.target.checked)}
                  size="small"
                />
              }
              label="Potencia limitada"
            />
            <TextField
              label="Tiempo limitado (min)"
              size="small"
              fullWidth
              type="number"
              value={editMaxRechargeTime}
              onChange={(e) => setEditMaxRechargeTime(e.target.value.replace(/[^\d]/g, ''))}
              slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
              placeholder="Opcional"
            />

            {editHasCallCenter &&
              !chargepoint.has_call_center &&
              callCenterUnitPrice !== undefined && (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                    Coste adicional en tu suscripción:
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    • Call Center: +{formatPrice(callCenterUnitPrice)}
                  </Typography>
                </Alert>
              )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServicesEditOpen(false)} disabled={servicesSaving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={requestSaveServices} disabled={servicesSaving}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de coste al guardar servicios */}
      <Dialog
        open={servicesConfirmOpen}
        onClose={() => !servicesSaving && setServicesConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar cambios</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Estos servicios tienen un coste en tu suscripción:
            <Box component="ul" sx={{ mt: 1, mb: 1, pl: 2.5 }}>
              {editHasCallCenter && callCenterUnitPrice !== undefined ? (
                <li>Call Center: {formatPrice(callCenterUnitPrice)}</li>
              ) : (
                <li>Sin servicios de pago activos.</li>
              )}
            </Box>
            ¿Quieres confirmar los cambios?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setServicesConfirmOpen(false);
              setServicesEditOpen(true);
            }}
            disabled={servicesSaving}
          >
            Volver
          </Button>
          <Button
            variant="contained"
            onClick={confirmSaveServices}
            disabled={servicesSaving}
            startIcon={servicesSaving ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Asignar estación (rol eurocharger) */}
      <Dialog
        open={assignStationOpen}
        onClose={() => assigningStationId === null && setAssignStationOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Asignar estación</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Buscar estación"
              size="small"
              fullWidth
              value={stationSearch}
              onChange={(e) => setStationSearch(e.target.value)}
              placeholder="Nombre, dirección o ciudad"
            />
            {loadingStations ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={20} />
              </Box>
            ) : stationOptions.length === 0 ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ py: 2, textAlign: 'center' }}
              >
                No se han encontrado estaciones.
              </Typography>
            ) : (
              <Stack spacing={0.5} sx={{ maxHeight: 320, overflowY: 'auto' }}>
                {stationOptions.map((station) => (
                  <Button
                    key={station.id}
                    fullWidth
                    variant="text"
                    onClick={() => handleAssignStation(station.id)}
                    disabled={assigningStationId !== null}
                    startIcon={
                      assigningStationId === station.id ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : undefined
                    }
                    sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    <Stack alignItems="flex-start" spacing={0}>
                      <Typography variant="body2" fontWeight={600}>
                        {station.name ?? `Estación ${station.id}`}
                      </Typography>
                      {station.address && (
                        <Typography variant="caption" color="text.secondary">
                          {station.address}
                        </Typography>
                      )}
                    </Stack>
                  </Button>
                ))}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAssignStationOpen(false)}
            disabled={assigningStationId !== null}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <RequestSimsDialog
        open={requestSimsOpen}
        onClose={() => setRequestSimsOpen(false)}
        onSuccess={() => loadChargepoint()}
      />
    </>
  );
}
