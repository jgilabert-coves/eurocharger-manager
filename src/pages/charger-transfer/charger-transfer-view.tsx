import type { Chargepoint } from 'src/types/chargepoint';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';

// ----------------------------------------------------------------------

type Account = { id: number; business_name: string };
type AccountsResponse = { data: Account[]; total: number };
type ChargepointsApiResponse = { data: Chargepoint[]; total: number };

const STEPS = ['Cuenta origen', 'Cuenta destino', 'Confirmar traspaso'];

// ----------------------------------------------------------------------

function AccountSearchList({
  accounts,
  selectedId,
  excludeId,
  onSelect,
}: {
  accounts: Account[];
  selectedId: number | null;
  excludeId?: number | null;
  onSelect: (acc: Account) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = accounts.filter(
    (a) => a.id !== excludeId && a.business_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <TextField
        size="small"
        fullWidth
        placeholder="Buscar cuenta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
          maxHeight: 220,
          overflowY: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
            No se encontraron cuentas.
          </Typography>
        ) : (
          filtered.map((acc) => {
            const isSelected = selectedId === acc.id;
            return (
              <Box
                key={acc.id}
                onClick={() => onSelect(acc)}
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
          })
        )}
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function ChargerTransferView() {
  const [step, setStep] = useState(0);

  // Step 0 – source
  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [selectedChargerIds, setSelectedChargerIds] = useState<number[]>([]);
  const [chargerSearch, setChargerSearch] = useState('');

  // Step 1 – destination
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [groupMode, setGroupMode] = useState<'existing' | 'new'>('existing');
  const [toGroupId, setToGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  // Submit
  const [done, setDone] = useState(false);
  const [transferredCount, setTransferredCount] = useState(0);

  const { notifySuccess, notifyError } = useNotification();

  const { data: accountsData } = useQuery<AccountsResponse>({
    queryKey: ['accounts-list'],
    queryFn: () => fetcher([endpoints.accounts.list, { params: { pageSize: 1000 } }]),
    staleTime: 5 * 60 * 1000,
  });
  const accounts: Account[] = accountsData?.data ?? [];

  const { data: fromChargepointsData, isLoading: chargersLoading } =
    useQuery<ChargepointsApiResponse>({
      queryKey: ['chargepoints-by-account', fromAccount?.id],
      queryFn: () =>
        fetcher([
          endpoints.chargepoints.list,
          { params: { account_id: fromAccount!.id, pageSize: 1000 } },
        ]),
      enabled: !!fromAccount,
      staleTime: 2 * 60 * 1000,
    });
  const fromChargepoints: Chargepoint[] = fromChargepointsData?.data ?? [];

  const { data: toGroupsData, isLoading: groupsLoading } = useQuery<ChargerGroupsResponse>({
    queryKey: ['charger-groups', toAccount?.id],
    queryFn: () => fetcher(endpoints.accounts.chargerGroups(toAccount!.id)),
    enabled: !!toAccount,
    staleTime: 2 * 60 * 1000,
  });
  const toGroups: ChargerGroup[] = toGroupsData?.data ?? [];

  const transfer = useMutation({
    mutationFn: async () => {
      let resolvedGroupId = toGroupId;
      if (groupMode === 'new') {
        const res = await post(endpoints.accounts.chargerGroups(toAccount!.id), {
          name: newGroupName.trim(),
          chargerIds: [],
        });
        resolvedGroupId = res?.data?.id ?? res?.id;
      }
      return post(endpoints.chargepoints.transfer, {
        chargerIds: selectedChargerIds,
        fromAccountId: fromAccount!.id,
        toAccountId: toAccount!.id,
        toGroupId: resolvedGroupId,
      });
    },
    onSuccess: () => {
      notifySuccess('Cargadores traspasados con éxito');
      setTransferredCount(selectedChargerIds.length);
      setDone(true);
    },
    onError: () => {
      notifyError();
    },
  });

  const toggleCharger = (id: number) =>
    setSelectedChargerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () => {
    const visible = fromChargepoints.filter((cp) =>
      (cp.name ?? '').toLowerCase().includes(chargerSearch.toLowerCase())
    );
    const allSelected = visible.every((cp) => selectedChargerIds.includes(cp.id));
    setSelectedChargerIds((prev) =>
      allSelected
        ? prev.filter((id) => !visible.some((cp) => cp.id === id))
        : [...new Set([...prev, ...visible.map((cp) => cp.id)])]
    );
  };

  const handleReset = () => {
    setStep(0);
    setFromAccount(null);
    setSelectedChargerIds([]);
    setChargerSearch('');
    setToAccount(null);
    setGroupMode('existing');
    setToGroupId('');
    setNewGroupName('');
    setDone(false);
    setTransferredCount(0);
  };

  const canNext = (() => {
    if (step === 0) return fromAccount !== null && selectedChargerIds.length > 0;
    if (step === 1) {
      if (!toAccount) return false;
      if (groupMode === 'new') return newGroupName.trim() !== '';
      return toGroupId !== '';
    }
    return true;
  })();

  // ── Done state ────────────────────────────────────────────────────────

  if (done) {
    return (
      <Box sx={{ p: 3, maxWidth: 560, mx: 'auto', mt: 6 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Iconify
            icon="eva:checkmark-circle-2-fill"
            width={56}
            sx={{ color: 'success.main', mb: 2 }}
          />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Traspaso completado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {transferredCount} cargador{transferredCount !== 1 ? 'es' : ''} traspasado
            {transferredCount !== 1 ? 's' : ''} de <strong>{fromAccount?.business_name}</strong> a{' '}
            <strong>{toAccount?.business_name}</strong>. Las suscripciones han sido actualizadas.
          </Typography>
          <Button variant="contained" onClick={handleReset}>
            Realizar otro traspaso
          </Button>
        </Card>
      </Box>
    );
  }

  // ── Steps ─────────────────────────────────────────────────────────────

  const renderStep0 = () => {
    const visibleChargers = fromChargepoints.filter((cp) =>
      (cp.name ?? '').toLowerCase().includes(chargerSearch.toLowerCase())
    );
    const allVisible = visibleChargers.every((cp) => selectedChargerIds.includes(cp.id));

    return (
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Cuenta origen
          </Typography>
          <AccountSearchList
            accounts={accounts}
            selectedId={fromAccount?.id ?? null}
            onSelect={(acc) => {
              setFromAccount(acc);
              setSelectedChargerIds([]);
              setChargerSearch('');
            }}
          />
        </Box>

        {fromAccount && (
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">
                Cargadores a traspasar{' '}
                {selectedChargerIds.length > 0 && (
                  <Chip
                    label={selectedChargerIds.length}
                    size="small"
                    color="primary"
                    sx={{ ml: 0.5 }}
                  />
                )}
              </Typography>
              {fromChargepoints.length > 0 && (
                <Button size="small" onClick={toggleAll} sx={{ minWidth: 0 }}>
                  {allVisible ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Button>
              )}
            </Stack>

            <TextField
              size="small"
              fullWidth
              placeholder="Buscar cargador..."
              value={chargerSearch}
              onChange={(e) => setChargerSearch(e.target.value)}
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
                maxHeight: 300,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 0.5,
              }}
            >
              {chargersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : visibleChargers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                  {fromChargepoints.length === 0
                    ? 'Esta cuenta no tiene cargadores.'
                    : 'No se encontraron cargadores.'}
                </Typography>
              ) : (
                visibleChargers.map((cp) => (
                  <FormControlLabel
                    key={cp.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedChargerIds.includes(cp.id)}
                        onChange={() => toggleCharger(cp.id)}
                      />
                    }
                    label={cp.name ?? `Cargador #${cp.id}`}
                    sx={{ display: 'flex', mx: 0, px: 0.5 }}
                  />
                ))
              )}
            </Box>
          </Box>
        )}
      </Stack>
    );
  };

  const renderStep1 = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Cuenta destino
        </Typography>
        <AccountSearchList
          accounts={accounts}
          selectedId={toAccount?.id ?? null}
          excludeId={fromAccount?.id}
          onSelect={(acc) => {
            setToAccount(acc);
            setToGroupId('');
            setGroupMode('existing');
            setNewGroupName('');
          }}
        />
      </Box>

      {toAccount && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Propietario destino
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
              value={toGroupId}
              onChange={(e) => setToGroupId(e.target.value)}
              disabled={groupsLoading || toGroups.length === 0}
              helperText={
                groupsLoading
                  ? 'Cargando propietarios...'
                  : toGroups.length === 0
                    ? 'No hay propietarios en esta cuenta. Crea uno nuevo.'
                    : undefined
              }
            >
              {toGroups.map((g) => (
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
              placeholder="Nombre del nuevo propietario"
              helperText="Se creará automáticamente al confirmar el traspaso"
            />
          )}
        </Box>
      )}
    </Stack>
  );

  const selectedChargers = fromChargepoints.filter((cp) => selectedChargerIds.includes(cp.id));
  const destinationGroup =
    groupMode === 'new' ? newGroupName : (toGroups.find((g) => g.id === toGroupId)?.name ?? '');

  const renderStep2 = () => (
    <Stack spacing={2}>
      {transfer.isError && (
        <Alert severity="error">
          {(transfer.error as any)?.error ?? 'Error al realizar el traspaso. Inténtalo de nuevo.'}
        </Alert>
      )}

      <Alert severity="warning" icon={<Iconify icon="solar:danger-triangle-bold" width={20} />}>
        Esta operación es irreversible. Los cargadores y las suscripciones se actualizarán de
        inmediato.
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Card
          variant="outlined"
          sx={{ flex: 1, p: 2, borderColor: 'error.light', bgcolor: 'error.lighter' }}
        >
          <Typography
            variant="caption"
            color="error.dark"
            fontWeight={700}
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '0.65rem',
              display: 'block',
              mb: 0.5,
            }}
          >
            Pierde
          </Typography>
          <Typography variant="subtitle2">{fromAccount?.business_name}</Typography>
          <Typography variant="caption" color="text.secondary">
            −{selectedChargerIds.length} cargador{selectedChargerIds.length !== 1 ? 'es' : ''}
          </Typography>
        </Card>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Iconify icon="solar:arrow-right-bold" width={24} sx={{ color: 'text.disabled' }} />
        </Box>

        <Card
          variant="outlined"
          sx={{ flex: 1, p: 2, borderColor: 'success.light', bgcolor: 'success.lighter' }}
        >
          <Typography
            variant="caption"
            color="success.dark"
            fontWeight={700}
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '0.65rem',
              display: 'block',
              mb: 0.5,
            }}
          >
            Recibe
          </Typography>
          <Typography variant="subtitle2">{toAccount?.business_name}</Typography>
          <Typography variant="caption" color="text.secondary">
            +{selectedChargerIds.length} cargador{selectedChargerIds.length !== 1 ? 'es' : ''}
          </Typography>
        </Card>
      </Stack>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '0.65rem',
            display: 'block',
            mb: 1,
          }}
        >
          Propietario destino
        </Typography>
        <Typography variant="subtitle2">{destinationGroup}</Typography>
      </Card>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '0.65rem',
            display: 'block',
            mb: 1,
          }}
        >
          Cargadores a traspasar ({selectedChargers.length})
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {selectedChargers.map((cp) => (
            <Chip key={cp.id} size="small" label={cp.name ?? `#${cp.id}`} />
          ))}
        </Box>
      </Card>
    </Stack>
  );

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3, maxWidth: 680, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Traspasar cargadores
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Transfiere cargadores entre cuentas. Las suscripciones de ambas cuentas se actualizarán
        automáticamente.
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Divider sx={{ mb: 4 }} />

      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
        <Button
          onClick={() => {
            if (step === 0) return;
            transfer.reset();
            setStep((s) => s - 1);
          }}
          disabled={step === 0 || transfer.isPending}
        >
          Atrás
        </Button>

        {step < STEPS.length - 1 ? (
          <Button variant="contained" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            disabled={transfer.isPending}
            onClick={() => transfer.mutate()}
            startIcon={
              transfer.isPending ? <CircularProgress size={14} color="inherit" /> : undefined
            }
          >
            {transfer.isPending ? 'Traspasando...' : 'Confirmar traspaso'}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
