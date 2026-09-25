import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { CONFIG } from 'src/global-config';
import { fetcher, endpoints } from 'src/lib/axios';

import { useNotification } from 'src/components/notification';
import { DateRangeFilter } from 'src/components/date-range-filter';

import { JWT_STORAGE_KEY } from 'src/auth/context/jwt';

dayjs.extend(utc);

// ----------------------------------------------------------------------

type ExportStatus = 'all' | 'CARGANDO' | 'FINALIZADO';
type ExportFormat = 'xlsx' | 'csv';

type ExportColumn = { key: string; header: string; default: boolean };

export type TransactionsExportFilters = {
  from: Dayjs | null;
  to: Dayjs | null;
  status: 'CARGANDO' | 'FINALIZADO';
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
  const [status, setStatus] = useState<ExportStatus>(initialFilters.status);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [selected, setSelected] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  const columnsQuery = useQuery({
    queryKey: ['transactions-export-columns'],
    queryFn: async () =>
      (await fetcher(endpoints.transactions.exportColumns)).data as ExportColumn[],
  });
  const columns = useMemo(() => columnsQuery.data ?? [], [columnsQuery.data]);

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

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={downloading ? undefined : onClose}>
      <DialogTitle>Exportar recargas</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Rango de fechas (inicio de la recarga)</Typography>
            <DateRangeFilter
              from={from}
              to={to}
              onChange={(f, t) => {
                setFrom(f);
                setTo(t);
              }}
            />
            {!(from && to) && (
              <Typography variant="caption" color="text.secondary">
                Elige un rango para exportar.
              </Typography>
            )}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Estado</Typography>
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

          {activeFilters.length > 0 && (
            <Alert severity="info">
              También se aplican los filtros de la tabla: {activeFilters.join(', ')}.
            </Alert>
          )}

          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">Columnas</Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setSelected(columns.map((c) => c.key))}>
                  Todas
                </Button>
                <Button size="small" onClick={() => setSelected([])}>
                  Ninguna
                </Button>
              </Stack>
            </Stack>

            {columnsQuery.isLoading && <CircularProgress size={24} />}
            {columnsQuery.isError && (
              <Alert severity="error">No se pudieron cargar las columnas.</Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              {columns.map((column) => (
                <FormControlLabel
                  key={column.key}
                  label={column.header}
                  control={
                    <Checkbox
                      size="small"
                      checked={selected.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                    />
                  }
                />
              ))}
            </Box>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Formato</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={format}
              onChange={(_, val) => {
                if (val) setFormat(val);
              }}
            >
              <ToggleButton value="xlsx">Excel (.xlsx)</ToggleButton>
              <ToggleButton value="csv">CSV</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
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
      </DialogActions>
    </Dialog>
  );
}
