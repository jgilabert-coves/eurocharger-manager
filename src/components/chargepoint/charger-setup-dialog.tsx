import type { RateItem } from 'src/types/rates';
import type { Connector } from 'src/types/connector';
import type { Chargepoint, ChargingStationResponse } from 'src/types/chargepoint';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { del, put, post, fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CreateRateDialog } from 'src/components/rate/create-rate-dialog';
import { ConnectorTypeIcon } from 'src/components/chargepoint/connector-type-icon';
import { ChargerStatusLabel } from 'src/components/chargepoint/charger-status-label';

// ----------------------------------------------------------------------

const CONNECTOR_TYPE_MAP: Record<number, string> = {
  1: 'Mennekes',
  2: 'CHAdeMO',
  3: 'Schuko',
  4: 'CCS',
  5: 'J1772',
  6: 'Tesla',
};

const CONNECTOR_TYPES = [
  { id: 1, label: 'Mennekes (Tipo 2)' },
  { id: 2, label: 'CHAdeMO' },
  { id: 3, label: 'Schuko' },
  { id: 4, label: 'CCS (Combo 2)' },
  { id: 5, label: 'J1772 (Tipo 1)' },
  { id: 6, label: 'Tesla' },
];

// ----------------------------------------------------------------------

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
    <Card variant="outlined" sx={{ borderColor: 'primary.main', borderStyle: 'dashed' }}>
      <Box sx={{ p: 1.75 }}>
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

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
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
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

function ConnectorCard({
  connector,
  chargepointId,
  onEdit,
  onRemoveRate,
  onRateAssigned,
}: {
  connector: Connector;
  chargepointId: number;
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

  return (
    <>
      <Card variant="outlined">
        <Box sx={{ p: 1.75 }}>
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
                      name={CONNECTOR_TYPE_MAP[connector.connectorTypeId || 1]}
                      size={28}
                    />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {CONNECTOR_TYPE_MAP[connector.connectorTypeId || 1] ?? 'Desconocido'}
                  </Typography>
                </Stack>
              </Box>

              <Stack alignItems="flex-end" spacing={0.5} sx={{ flexShrink: 0 }}>
                <ChargerStatusLabel status={connector.status} />
                {connector.power != null && (
                  <Typography variant="caption" color="text.secondary">
                    {connector.power} kW
                  </Typography>
                )}
              </Stack>
            </Stack>

            <Divider />

            {/* Rate + edit */}
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
            </Stack>

            {/* Inline assignment panel */}
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
                    <Box sx={{ maxHeight: 140, overflowY: 'auto' }}>
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
        </Box>
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

export type ChargerSetupDialogProps = {
  open: boolean;
  chargepointId: number | null;
  onClose: () => void;
};

export function ChargerSetupDialog({ open, chargepointId, onClose }: ChargerSetupDialogProps) {
  const router = useRouter();
  const [chargepoint, setChargepoint] = useState<Chargepoint | null>(null);
  const [loadingCp, setLoadingCp] = useState(false);
  const [editState, setEditState] = useState<
    { mode: 'idle' } | { mode: 'add' } | { mode: 'edit'; connectorId: number }
  >({ mode: 'idle' });

  const loadChargepoint = async (id: number) => {
    setLoadingCp(true);
    try {
      const res: ChargingStationResponse = await fetcher(endpoints.chargepoints.single(id));
      setChargepoint(res.data);
    } catch {
      setChargepoint(null);
    } finally {
      setLoadingCp(false);
    }
  };

  useEffect(() => {
    if (open && chargepointId != null) {
      loadChargepoint(chargepointId);
    } else {
      setChargepoint(null);
      setEditState({ mode: 'idle' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chargepointId]);

  const handleClose = () => {
    setEditState({ mode: 'idle' });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6">Configurar cargador</Typography>
          {chargepoint && (
            <Typography variant="body2" color="text.secondary">
              — {chargepoint.name}
            </Typography>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {loadingCp ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : !chargepoint ? (
          <Alert severity="error">No se pudo cargar el cargador.</Alert>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" fontWeight={700}>
                Conectores ({chargepoint.connectors.length})
              </Typography>
              {editState.mode === 'idle' && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="mdi:plus" width={16} />}
                  onClick={() => setEditState({ mode: 'add' })}
                >
                  Añadir conector
                </Button>
              )}
            </Stack>

            <Grid container spacing={2}>
              {chargepoint.connectors.map((conn) => {
                if (editState.mode === 'edit' && editState.connectorId === conn.id) {
                  return (
                    <Grid key={conn.id} size={{ xs: 12, sm: 6 }}>
                      <ConnectorFormCard
                        chargepointId={chargepoint.id}
                        connector={conn}
                        onCancel={() => setEditState({ mode: 'idle' })}
                        onSuccess={() => {
                          setEditState({ mode: 'idle' });
                          loadChargepoint(chargepoint.id);
                        }}
                      />
                    </Grid>
                  );
                }
                return (
                  <Grid key={conn.id} size={{ xs: 12, sm: 6 }}>
                    <ConnectorCard
                      connector={conn}
                      chargepointId={chargepoint.id}
                      onEdit={(c) => setEditState({ mode: 'edit', connectorId: c.id })}
                      onRemoveRate={() => {
                        if (conn.rateId != null){ 
                          del(endpoints.connectors.deassign(chargepoint.id, conn.id, conn.rateId)).then(() =>
                            loadChargepoint(chargepoint.id)
                          );
                        }
                      }}
                      onRateAssigned={() => loadChargepoint(chargepoint.id)}
                    />
                  </Grid>
                );
              })}

              {editState.mode === 'add' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ConnectorFormCard
                    chargepointId={chargepoint.id}
                    onCancel={() => setEditState({ mode: 'idle' })}
                    onSuccess={() => {
                      setEditState({ mode: 'idle' });
                      loadChargepoint(chargepoint.id);
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
                      Sin conectores configurados. Añade uno para empezar.
                    </Typography>
                  </Stack>
                </Grid>
              )}
            </Grid>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={() => {
            handleClose();
            if (chargepointId != null) {
              router.push(paths.chargingstations.detail(String(chargepointId)));
            }
          }}
        >
          Finalizar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
