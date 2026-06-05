import type { OCPPConfigurationItem } from 'src/types/ocpp';

import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import { post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type PendingEdit = { key: string; originalValue: string; newValue: string };
type SaveStatus = 'ok' | 'rejected' | 'reboot' | 'error';

function ConfigSkeleton() {
  return (
    <Stack spacing={1}>
      {Array.from({ length: 8 }).map((_, i) => (
         
        <Skeleton key={i} variant="rounded" height={52} />
      ))}
    </Stack>
  );
}

// ----------------------------------------------------------------------

export default function ChargerOcppConfig() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [search, setSearch] = useState('');
  const [pendingEdits, setPendingEdits] = useState<Map<string, PendingEdit>>(new Map());
  const [saving, setSaving] = useState(false);
  const [saveResults, setSaveResults] = useState<Map<string, SaveStatus>>(new Map());
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isFetching, isError, error } = useQuery<{
    data: { configuration_key: OCPPConfigurationItem[] };
  }>({
    queryKey: ['ocpp-config', id],
    queryFn: () => fetcher(endpoints.chargepoints.ocppConfig(Number(id))),
    enabled: !!id,
    staleTime: 0,
    retry: false,
  });

  const allKeys: OCPPConfigurationItem[] = data?.data?.configuration_key ?? [];

  const filteredKeys = search.trim()
    ? allKeys.filter((item) => item.key.toLowerCase().includes(search.trim().toLowerCase()))
    : allKeys;

  const handleEdit = useCallback((key: string, originalValue: string, newValue: string) => {
    setPendingEdits((prev) => {
      const next = new Map(prev);
      if (newValue === originalValue) {
        next.delete(key);
      } else {
        next.set(key, { key, originalValue, newValue });
      }
      return next;
    });
    setSaveResults((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (pendingEdits.size === 0) return;
    setSaving(true);
    setSaveError(null);
    const entries = Array.from(pendingEdits.values());

    const results = await Promise.allSettled(
      entries.map((e) =>
        post(endpoints.chargepoints.ocppChangeConfig(Number(id)), { key: e.key, value: e.newValue }),
      ),
    );

    const newResults = new Map<string, SaveStatus>();
    let needsReboot = false;

    results.forEach((result, idx) => {
      const key = entries[idx].key;
      if (result.status === 'fulfilled') {
        const status = result.value?.data?.status as string | undefined;
        if (status === 'Accepted') {
          newResults.set(key, 'ok');
        } else if (status === 'RebootRequired') {
          newResults.set(key, 'reboot');
          needsReboot = true;
        } else {
          newResults.set(key, 'rejected');
        }
      } else {
        newResults.set(key, 'error');
      }
    });

    setSaveResults(newResults);
    if (needsReboot) {
      setSaveError('reboot');
    }

    // Remove successfully applied edits from pending
    const newPending = new Map(pendingEdits);
    newResults.forEach((status, key) => {
      if (status === 'ok' || status === 'reboot') {
        newPending.delete(key);
      }
    });
    setPendingEdits(newPending);
    setSaving(false);
  };

  const pendingCount = pendingEdits.size;

  return (
    <>
      <Helmet>
        <title>Configuración OCPP | {CONFIG.appName}</title>
      </Helmet>

      <DashboardContent>
        <Stack spacing={2.5}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton
              onClick={() => router.push(paths.chargingstations.detail(String(id)))}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <Iconify icon="mingcute:arrow-left-line" width={20} />
            </IconButton>
            <Typography variant="h5" sx={{ flex: 1 }}>
              Configuración OCPP
            </Typography>
          </Stack>

          {/* Reboot warning */}
          {saveError === 'reboot' && (
            <Alert
              severity="warning"
              onClose={() => setSaveError(null)}
            >
              Algunos cambios requieren reiniciar el cargador para aplicarse.
            </Alert>
          )}

          {/* Error loading */}
          {isError && (
            <Alert severity="error">
              {(error as any)?.error ?? 'Error al obtener la configuración OCPP. Comprueba que el cargador está conectado.'}
            </Alert>
          )}

          {/* Toolbar: search + save */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ sm: 'center' }}
          >
            <TextField
              size="small"
              placeholder="Buscar clave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="mingcute:search-line" width={18} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}>
                        <Iconify icon="mingcute:close-line" width={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
            <Badge badgeContent={pendingCount} color="primary" invisible={pendingCount === 0}>
              <Button
                variant="contained"
                disabled={pendingCount === 0 || saving}
                onClick={handleSave}
                startIcon={
                  saving ? (
                    <Iconify icon="mingcute:loading-line" width={18} sx={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Iconify icon="mingcute:save-line" width={18} />
                  )
                }
                sx={{ whiteSpace: 'nowrap' }}
              >
                {saving
                  ? 'Guardando...'
                  : pendingCount > 0
                    ? `Guardar ${pendingCount} ${pendingCount === 1 ? 'cambio' : 'cambios'}`
                    : 'Sin cambios'}
              </Button>
            </Badge>
          </Stack>

          {/* Config list */}
          {isFetching ? (
            <ConfigSkeleton />
          ) : (
            <Stack spacing={0} divider={<Divider />}>
              {/* Desktop header */}
              {!isMobile && allKeys.length > 0 && (
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ px: 1.5, py: 1, bgcolor: 'background.neutral', borderRadius: 1 }}
                  spacing={2}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ flex: '0 0 280px' }}>
                    CLAVE
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                    VALOR
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ width: 90, textAlign: 'right' }}>
                    ESTADO
                  </Typography>
                </Stack>
              )}

              {filteredKeys.length === 0 && !isFetching && !isError && (
                <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>
                  {search ? 'No hay resultados para la búsqueda.' : 'No hay claves de configuración disponibles.'}
                </Typography>
              )}

              {filteredKeys.map((item) => (
                <ConfigRow
                  key={item.key}
                  item={item}
                  isMobile={isMobile}
                  pendingValue={pendingEdits.get(item.key)?.newValue}
                  saveStatus={saveResults.get(item.key)}
                  onEdit={handleEdit}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </DashboardContent>
    </>
  );
}

// ----------------------------------------------------------------------

type ConfigRowProps = {
  item: OCPPConfigurationItem;
  isMobile: boolean;
  pendingValue: string | undefined;
  saveStatus: SaveStatus | undefined;
  onEdit: (key: string, originalValue: string, newValue: string) => void;
};

function ConfigRow({ item, isMobile, pendingValue, saveStatus, onEdit }: ConfigRowProps) {
  const isDirty = pendingValue !== undefined;
  const currentDisplayValue = pendingValue ?? item.value;

  const statusNode = (() => {
    if (item.readonly) {
      return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="mingcute:lock-line" width={14} sx={{ color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
            Solo lectura
          </Typography>
        </Stack>
      );
    }
    if (saveStatus === 'ok') {
      return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="mingcute:check-circle-line" width={14} sx={{ color: 'success.main' }} />
          <Typography variant="caption" color="success.main">
            Aceptado
          </Typography>
        </Stack>
      );
    }
    if (saveStatus === 'reboot') {
      return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="mingcute:refresh-line" width={14} sx={{ color: 'warning.main' }} />
          <Typography variant="caption" color="warning.main">
            Reinicio
          </Typography>
        </Stack>
      );
    }
    if (saveStatus === 'rejected') {
      return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="mingcute:close-circle-line" width={14} sx={{ color: 'error.main' }} />
          <Typography variant="caption" color="error.main">
            Rechazado
          </Typography>
        </Stack>
      );
    }
    if (saveStatus === 'error') {
      return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="mingcute:warning-line" width={14} sx={{ color: 'error.main' }} />
          <Typography variant="caption" color="error.main">
            Error
          </Typography>
        </Stack>
      );
    }
    if (isDirty) {
      return (
        <Typography variant="caption" color="primary.main" fontWeight={600}>
          Modificado
        </Typography>
      );
    }
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Iconify icon="mingcute:edit-line" width={14} sx={{ color: 'text.disabled' }} />
        <Typography variant="caption" color="text.disabled">
          Editable
        </Typography>
      </Stack>
    );
  })();

  const valueField = item.readonly ? (
    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
      {item.value || <span style={{ opacity: 0.4 }}>—</span>}
    </Typography>
  ) : (
    <TextField
      size="small"
      value={currentDisplayValue}
      onChange={(e) => onEdit(item.key, item.value, e.target.value)}
      fullWidth
      sx={{
        '& .MuiOutlinedInput-root': {
          ...(isDirty && {
            '& fieldset': { borderColor: 'primary.main' },
          }),
        },
      }}
      slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: 13 } } }}
    />
  );

  if (isMobile) {
    return (
      <Box
        sx={{
          py: 1.5,
          px: 0.5,
          ...(isDirty && { bgcolor: 'primary.lighter', borderRadius: 1 }),
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
          <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
            {item.key}
          </Typography>
          {statusNode}
        </Stack>
        {valueField}
      </Box>
    );
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        px: 1.5,
        py: 1.25,
        ...(isDirty && { bgcolor: 'primary.lighter', borderRadius: 1 }),
      }}
    >
      <Typography
        variant="body2"
        fontWeight={500}
        sx={{ flex: '0 0 280px', wordBreak: 'break-all' }}
      >
        {item.key}
      </Typography>
      <Box sx={{ flex: 1 }}>{valueField}</Box>
      <Box sx={{ width: 90, display: 'flex', justifyContent: 'flex-end' }}>{statusNode}</Box>
    </Stack>
  );
}
