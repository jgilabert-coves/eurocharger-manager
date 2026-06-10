import type { Chargepoint } from 'src/types/chargepoint';

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useDebounce } from 'src/hooks/use-debounce';

import { put, del, post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { ChargerDualPicker } from 'src/components/chargepoint/charger-dual-picker';

import { useAuthContext } from 'src/auth/hooks';
import { useAbility } from 'src/auth/hooks/use-ability';

// ----------------------------------------------------------------------

type Account = { id: number; business_name: string };
type AccountsResponse = { data: Account[]; total: number };

type ChargepointsApiResponse = {
  data: Chargepoint[];
  total: number;
};

// ----------------------------------------------------------------------

function CreateGroupDialog({
  accountId,
  chargepoints,
  open,
  onClose,
  onSuccess,
  isEurocharger,
}: {
  accountId: number;
  chargepoints: Chargepoint[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isEurocharger: boolean;
}) {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
  const [accountSearch, setAccountSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: accountsData } = useQuery<AccountsResponse>({
    queryKey: ['accounts-list'],
    queryFn: () => fetcher([endpoints.accounts.list, { params: { pageSize: 1000 } }]),
    enabled: isEurocharger && open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: accountChargepointsData } = useQuery<ChargepointsApiResponse>({
    queryKey: ['chargepoints-by-account', selectedAccountId],
    queryFn: () =>
      fetcher([
        endpoints.chargepoints.list,
        { params: { account_id: selectedAccountId, pageSize: 1000 } },
      ]),
    enabled: isEurocharger && !!selectedAccountId,
    staleTime: 2 * 60 * 1000,
  });

  const accounts: Account[] = accountsData?.data ?? [];
  const availableChargepoints = isEurocharger
    ? (accountChargepointsData?.data ?? [])
    : chargepoints;

  const targetAccountId = isEurocharger ? (selectedAccountId as number) : accountId;

  const toggle = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleClose = () => {
    setName('');
    setSelectedIds([]);
    setSelectedAccountId('');
    setAccountSearch('');
    setError(null);
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    if (isEurocharger && !selectedAccountId) return;
    setLoading(true);
    setError(null);
    try {
      await post(endpoints.accounts.chargerGroups(targetAccountId), {
        name: name.trim(),
        chargerIds: selectedIds,
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err?.error ?? 'Error al crear el propietario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Nuevo propietario
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
        >
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isEurocharger && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.75, display: 'block' }}
            >
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
                maxHeight: 180,
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
                        setSelectedIds([]);
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
        )}

        <TextField
          label="Nombre del propietario"
          required
          size="small"
          fullWidth
          autoFocus={!isEurocharger}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Ayuntamiento de X"
          sx={{ mb: 2 }}
        />
        <Typography variant="subtitle2" sx={{ mb: 0 }}>
          Cargadores a incluir (opcional)
        </Typography>
        <ChargerDualPicker
          available={availableChargepoints}
          selected={selectedIds}
          onChange={setSelectedIds}
          emptyText={
            isEurocharger && !selectedAccountId
              ? 'Selecciona una cuenta primero.'
              : 'No hay cargadores disponibles.'
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!name.trim() || (isEurocharger && !selectedAccountId) || loading}
          onClick={handleCreate}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Crear propietario
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

function RenameDialog({
  accountId,
  group,
  open,
  onClose,
  onSuccess,
}: {
  accountId: number;
  group: ChargerGroup | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(group?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRename = async () => {
    if (!group || !name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await put(endpoints.accounts.chargerGroup(accountId, group.id), { name: name.trim() });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.error ?? 'Error al renombrar el propietario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Renombrar propietario</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Nombre"
          size="small"
          fullWidth
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!name.trim() || loading}
          onClick={handleRename}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

function AddChargersDialog({
  accountId,
  group,
  chargepoints,
  open,
  onClose,
  onSuccess,
  isEurocharger,
}: {
  accountId: number;
  group: ChargerGroup | null;
  chargepoints: Chargepoint[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isEurocharger: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: accountChargepointsData } = useQuery<ChargepointsApiResponse>({
    queryKey: ['chargepoints-by-account', group?.account_id],
    queryFn: () =>
      fetcher([
        endpoints.chargepoints.list,
        { params: { account_id: group!.account_id, pageSize: 1000 } },
      ]),
    enabled: isEurocharger && open && !!group,
    staleTime: 2 * 60 * 1000,
  });

  const allChargepoints = isEurocharger ? (accountChargepointsData?.data ?? []) : chargepoints;
  const available = allChargepoints.filter(
    (cp) => !group?.chargers.some((item) => Number(item.id) === cp.id)
  );

  const targetAccountId = isEurocharger ? (group?.account_id ?? accountId) : accountId;

  const handleClose = () => {
    setSelectedIds([]);
    setError(null);
    onClose();
  };

  const handleAdd = async () => {
    if (!group || selectedIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await post(endpoints.accounts.chargerGroupChargers(targetAccountId, group.id), {
        chargerIds: selectedIds,
      });
      handleClose();
      onSuccess();
    } catch (err: any) {
      setError(err?.error ?? 'Error al añadir cargadores.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Añadir cargadores a {group?.name}
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
        >
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <ChargerDualPicker
          available={available}
          selected={selectedIds}
          onChange={setSelectedIds}
          emptyText={
            isEurocharger && !accountChargepointsData
              ? 'Cargando...'
              : 'Todos los cargadores ya están en este propietario.'
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={selectedIds.length === 0 || loading}
          onClick={handleAdd}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Añadir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

export default function ChargerGroupsView() {
  const navigate = useNavigate();
  const { hasRole, isViewOnly } = useAbility();
  const { user } = useAuthContext();
  const isEurocharger = hasRole('eurocharger');
  const accountId = user?.account_id ?? 0;
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameGroup, setRenameGroup] = useState<ChargerGroup | null>(null);
  const [addChargersGroup, setAddChargersGroup] = useState<ChargerGroup | null>(null);
  const [accountFilter, setAccountFilter] = useState('');
  const debouncedAccountFilter = useDebounce(accountFilter);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data: groupsData, isLoading: groupsLoading } = useQuery<ChargerGroupsResponse>({
    queryKey: isEurocharger
      ? ['charger-groups-all', page, pageSize, debouncedAccountFilter]
      : ['charger-groups', accountId],
    queryFn: () =>
      isEurocharger
        ? fetcher([
            endpoints.chargerGroupsAll,
            { params: { page, pageSize, searchQuery: debouncedAccountFilter } },
          ])
        : fetcher(endpoints.accounts.chargerGroups(accountId)),
    enabled: isEurocharger || !!accountId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: chargepointsData } = useQuery<ChargepointsApiResponse>({
    queryKey: ['chargepoints-all'],
    queryFn: () => fetcher([endpoints.chargepoints.list, { params: { pageSize: 1000 } }]),
    enabled: !isEurocharger && !!accountId,
    staleTime: 2 * 60 * 1000,
  });

  const groups: ChargerGroup[] = groupsData?.data ?? [];
  const total: number = groupsData?.total ?? 0;
  const chargepoints: Chargepoint[] = chargepointsData?.data ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: isEurocharger ? ['charger-groups-all'] : ['charger-groups', accountId],
    });

  const deleteGroup = useMutation({
    mutationFn: ({ groupId, acctId }: { groupId: string; acctId: number }) =>
      del(endpoints.accounts.chargerGroup(acctId, groupId)),
    onSuccess: invalidate,
  });

  const removeCharger = useMutation({
    mutationFn: ({
      groupId,
      chargerId,
      acctId,
    }: {
      groupId: string;
      chargerId: number;
      acctId: number;
    }) => del(endpoints.accounts.chargerGroupCharger(acctId, groupId, chargerId)),
    onSuccess: invalidate,
  });

  const getGroupAccountId = (group: ChargerGroup) => (isEurocharger ? group.account_id : accountId);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Propietarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEurocharger
              ? 'Vista global de todos los propietarios de la plataforma.'
              : 'Organiza tus cargadores por propietario para asignar acceso a los invitados.'}
          </Typography>
        </Box>
        {!isViewOnly() && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setCreateOpen(true)}
          >
            Nuevo propietario
          </Button>
        )}
      </Stack>

      {isEurocharger && (
        <TextField
          size="small"
          fullWidth
          placeholder="Filtrar por cuenta..."
          value={accountFilter}
          onChange={(e) => {
            setAccountFilter(e.target.value);
            setPage(0);
          }}
          sx={{ mb: 3 }}
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
      )}

      {groupsLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!groupsLoading && groups.length === 0 && (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Iconify
            icon="solar:box-minimalistic-outline"
            width={48}
            sx={{ color: 'text.disabled', mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary">
            {isEurocharger ? 'No se encontraron propietarios' : 'Aún no tienes propietarios'}
          </Typography>
          {!isEurocharger && !isViewOnly() && (
            <>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                Crea un propietario para organizar tus cargadores y asignar acceso a los invitados.
              </Typography>
              <Button variant="outlined" onClick={() => setCreateOpen(true)}>
                Crear primer propietario
              </Button>
            </>
          )}
        </Card>
      )}

      <Stack spacing={2}>
        {groups.map((group) => (
          <Card key={group.id} sx={{ p: 3 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Box>
                {isEurocharger && group.account_name && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.25 }}
                  >
                    {group.account_name}
                  </Typography>
                )}
                <Typography variant="subtitle1" fontWeight={600}>
                  {group.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {group.chargers.length} cargador{group.chargers.length !== 1 ? 'es' : ''}
                </Typography>
              </Box>
              {!isViewOnly() && (
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    title="Añadir cargadores"
                    onClick={() => setAddChargersGroup(group)}
                  >
                    <Iconify icon="mingcute:add-line" width={18} />
                  </IconButton>
                  <IconButton size="small" title="Renombrar" onClick={() => setRenameGroup(group)}>
                    <Iconify icon="solar:pen-bold" width={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    title="Eliminar propietario"
                    color="error"
                    onClick={() =>
                      deleteGroup.mutate({ groupId: group.id, acctId: getGroupAccountId(group) })
                    }
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                </Stack>
              )}
            </Stack>

            {group.chargers.length > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {group.chargers.map((item) => (
                    <Chip
                      key={item.id}
                      size="small"
                      label={item.name}
                      onClick={() => navigate(paths.chargingstations.detail(item.id))}
                      onDelete={
                        !isViewOnly()
                          ? () =>
                              removeCharger.mutate({
                                groupId: group.id,
                                chargerId: Number(item.id),
                                acctId: getGroupAccountId(group),
                              })
                          : undefined
                      }
                    />
                  ))}
                </Box>
              </>
            )}
          </Card>
        ))}
      </Stack>

      {isEurocharger && (
        <TablePagination
          component="div"
          count={total || -1}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
          slotProps={{
            actions: {
              nextButton: { disabled: groups.length < pageSize },
            },
          }}
        />
      )}

      <CreateGroupDialog
        accountId={accountId}
        chargepoints={chargepoints}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={invalidate}
        isEurocharger={isEurocharger}
      />

      <RenameDialog
        accountId={renameGroup ? getGroupAccountId(renameGroup) : accountId}
        group={renameGroup}
        open={!!renameGroup}
        onClose={() => setRenameGroup(null)}
        onSuccess={invalidate}
      />

      <AddChargersDialog
        accountId={accountId}
        group={addChargersGroup}
        chargepoints={chargepoints}
        open={!!addChargersGroup}
        onClose={() => setAddChargersGroup(null)}
        onSuccess={invalidate}
        isEurocharger={isEurocharger}
      />
    </Box>
  );
}
