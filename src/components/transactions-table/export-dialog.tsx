import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

import { CONFIG } from 'src/global-config';
import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';
import { DateRangeFilter } from 'src/components/date-range-filter';

import { JWT_STORAGE_KEY } from 'src/auth/context/jwt';

dayjs.extend(utc);

// ----------------------------------------------------------------------

type ExportStatus = 'all' | 'CARGANDO' | 'FINALIZADO';
type ExportFormat = 'xlsx' | 'csv';

type ExportColumn = { key: string; header: string; default: boolean };
type ExportGroup = { id: string; name: string; account_name: string };

// Al escribir se busca por el nombre del grupo y por el de su cuenta.
const filterGroups = createFilterOptions<ExportGroup>({
  stringify: (group) => `${group.name} ${group.account_name}`,
});

export type TransactionsExportFilters = {
  from: Dayjs | null;
  to: Dayjs | null;
  /** Ya en minúsculas, como en el listado. Solo los envía eurocharger. */
  source?: string;
  price?: string;
  search: string;
};

type Props = {
  onClose: () => void;
  /** Filtros de la tabla en el momento de abrir: el diálogo parte de ellos. */
  initialFilters: TransactionsExportFilters;
};

// Última selección de columnas del usuario (conveniencia; si falla no pasa nada).
const COLUMNS_STORAGE_KEY = 'transactions-export-columns';

function readStoredColumns(): string[] | null {
  try {
    const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : null;
  } catch {
    return null;
  }
}

function storeColumns(keys: string[]) {
  try {
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // Almacenamiento no disponible (modo privado, etc.): solo se pierde la preferencia.
  }
}

// ----------------------------------------------------------------------

/**
 * Exporta las recargas a Excel o CSV.
 *
 * El fichero lo genera la API con el mismo ámbito por rol que el listado. Se monta
 * al abrirse, así que cada apertura parte de los filtros actuales de la tabla.
 */
export function TransactionsExportDialog({ onClose, initialFilters }: Props) {
  const { notifyError } = useNotification();

  const [from, setFrom] = useState<Dayjs | null>(initialFilters.from);
  const [to, setTo] = useState<Dayjs | null>(initialFilters.to);
  // Siempre empieza en todas, sea cual sea la pestaña de la tabla.
  const [status, setStatus] = useState<ExportStatus>('all');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<ExportGroup[]>([]);
  const [downloading, setDownloading] = useState(false);

  const columnsQuery = useQuery({
    queryKey: ['transactions-export-columns'],
    queryFn: async () =>
      (await fetcher(endpoints.transactions.exportColumns)).data as ExportColumn[],
  });
  const columns = useMemo(() => columnsQuery.data ?? [], [columnsQuery.data]);

  // Grupos que este usuario puede usar como filtro (los decide la API según el rol).
  const groupsQuery = useQuery({
    queryKey: ['transactions-export-groups'],
    queryFn: async () => (await fetcher(endpoints.transactions.exportGroups)).data as ExportGroup[],
  });
  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  // Con grupos de varias cuentas (eurocharger), se agrupan por cuenta en el desplegable.
  const severalAccounts = useMemo(
    () => new Set(groups.map((g) => g.account_name)).size > 1,
    [groups]
  );

  // Selección inicial: la última guardada (solo columnas que este rol puede pedir), o las de por defecto.
  useEffect(() => {
    if (columns.length === 0) return;
    const available = new Set(columns.map((c) => c.key));
    const stored = readStoredColumns()?.filter((k) => available.has(k));
    setSelected(stored?.length ? stored : columns.filter((c) => c.default).map((c) => c.key));
  }, [columns]);

  const toggleColumn = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const canDownload = Boolean(from && to) && selected.length > 0 && !downloading;

  const handleDownload = async () => {
    if (!from || !to) return;
    setDownloading(true);
    try {
      // Mismo orden que el selector, no el orden en que se marcaron.
      const orderedColumns = columns.map((c) => c.key).filter((k) => selected.includes(k));
      const params = new URLSearchParams({
        format,
        columns: orderedColumns.join(','),
        status,
        // La hora se elige en local y se envía en UTC, igual que el filtro de la tabla.
        start_date: from.utc().format('YYYY-MM-DD HH:mm:ss'),
        end_date: to.utc().format('YYYY-MM-DD HH:mm:ss'),
        ...(initialFilters.source ? { source: initialFilters.source } : {}),
        ...(initialFilters.price ? { price: initialFilters.price } : {}),
        ...(initialFilters.search ? { searchQuery: initialFilters.search } : {}),
        ...(selectedGroups.length > 0
          ? { group_ids: selectedGroups.map((g) => g.id).join(',') }
          : {}),
      });

      // Binario: no pasa por el `fetcher` de axios (fuerza JSON). Mismo patrón que
      // la descarga del Excel de autofacturas.
      const token = localStorage.getItem(JWT_STORAGE_KEY);
      const response = await fetch(
        `${CONFIG.serverUrl}${endpoints.transactions.export}?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'No se pudo generar la exportación.');
      }

      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `recargas_${from.format('YYYYMMDD')}_${to.format('YYYYMMDD')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      storeColumns(orderedColumns);
      onClose();
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'No se pudo generar la exportación.');
    } finally {
      setDownloading(false);
    }
  };

  const activeFilters = [
    initialFilters.search && `búsqueda "${initialFilters.search}"`,
    initialFilters.source && `origen ${initialFilters.source}`,
    initialFilters.price && `precio ${initialFilters.price === 'free' ? 'gratis' : 'de pago'}`,
  ].filter(Boolean);

  const sectionLabel = (text: string) => (
    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
      {text}
    </Typography>
  );

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={downloading ? undefined : onClose}>
      <DialogTitle sx={{ pb: 1 }}>Exportar recargas</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {/* Rango y estado en la misma fila */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ sm: 'flex-end' }}
          >
            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
              {sectionLabel('Inicio de la recarga')}
              <DateRangeFilter
                from={from}
                to={to}
                placeholder="Elige un rango de fechas"
                onChange={(f, t) => {
                  setFrom(f);
                  setTo(t);
                }}
                sx={{ width: 1, justifyContent: 'flex-start' }}
              />
            </Stack>
            <Stack spacing={0.5}>
              {sectionLabel('Estado')}
              <ToggleButtonGroup
                exclusive
                size="small"
                value={status}
                onChange={(_, val) => {
                  if (val) setStatus(val);
                }}
              >
                <ToggleButton value="all">Todas</ToggleButton>
                <ToggleButton value="CARGANDO">En curso</ToggleButton>
                <ToggleButton value="FINALIZADO">Finalizadas</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>

          {groups.length > 0 && (
            <Stack spacing={0.5}>
              {sectionLabel('Grupos de cargadores')}
              <Autocomplete
                multiple
                size="small"
                limitTags={3}
                options={groups}
                value={selectedGroups}
                onChange={(_, value) => setSelectedGroups(value)}
                filterOptions={filterGroups}
                getOptionLabel={(group) => group.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                {...(severalAccounts && { groupBy: (group: ExportGroup) => group.account_name })}
                noOptionsText="Ningún grupo coincide"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={
                      selectedGroups.length === 0
                        ? 'Todos los cargadores · escribe para buscar'
                        : undefined
                    }
                  />
                )}
              />
            </Stack>
          )}

          <Stack spacing={0.75}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              {sectionLabel(`Columnas (${selected.length}/${columns.length})`)}
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  sx={{ minWidth: 0, px: 1 }}
                  onClick={() => setSelected(columns.map((c) => c.key))}
                >
                  Todas
                </Button>
                <Button size="small" sx={{ minWidth: 0, px: 1 }} onClick={() => setSelected([])}>
                  Ninguna
                </Button>
              </Stack>
            </Stack>

            {columnsQuery.isLoading && <CircularProgress size={20} />}
            {columnsQuery.isError && (
              <Alert severity="error">No se pudieron cargar las columnas.</Alert>
            )}

            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={0.75}>
              {columns.map((column) => {
                const checked = selected.includes(column.key);
                return (
                  <Chip
                    key={column.key}
                    size="small"
                    label={column.header}
                    variant={checked ? 'filled' : 'outlined'}
                    color={checked ? 'primary' : 'default'}
                    icon={checked ? <Iconify icon="eva:checkmark-fill" width={14} /> : undefined}
                    onClick={() => toggleColumn(column.key)}
                    aria-pressed={checked}
                  />
                );
              })}
            </Stack>
          </Stack>

          {activeFilters.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              También se aplican los filtros de la tabla: {activeFilters.join(', ')}.
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={format}
          onChange={(_, val) => {
            if (val) setFormat(val);
          }}
        >
          <ToggleButton value="xlsx">Excel</ToggleButton>
          <ToggleButton value="csv">CSV</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1}>
          <Button color="inherit" onClick={onClose} disabled={downloading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleDownload}
            disabled={!canDownload}
            startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Descargar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
