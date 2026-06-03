import type { AxiosRequestConfig } from 'axios';
import type { Chargepoint } from 'src/types/chargepoint';

import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useRouter } from 'src/routes/hooks';

import { useDebounce } from 'src/hooks/use-debounce';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConnectorStatusChip } from 'src/components/chips/connector-status-chip';
import { ChargerSetupDialog } from 'src/components/chargepoint/charger-setup-dialog';
import { NewChargepointDialog } from 'src/components/chargepoint/new-chargepoint-dialog';

import { useAbility } from 'src/auth/hooks/use-ability';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Cargadores | ${CONFIG.appName}` };

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'OCCUPIED', label: 'Cargando' },
  { value: 'RESERVED', label: 'Reservado' },
  { value: 'OUT_OF_ORDER', label: 'Fuera de servicio' },
  { value: 'DISCONNECTED', label: 'Desconectado' },
];

type ChargepointsResponse = {
  data: Chargepoint[];
  total: number;
};

// ----------------------------------------------------------------------

export default function ChargepointsListV2() {
  const router = useRouter();

  const [rows, setRows] = useState<Chargepoint[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [setupChargepointId, setSetupChargepointId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(searchQuery);
  const { isViewOnly } = useAbility();

  const fetchChargepoints = useCallback(async () => {
    try {
      setLoading(true);
      const queryArgs: AxiosRequestConfig = {
        params: {
          roaming: 0,
          page,
          pageSize,
          searchQuery: debouncedSearch,
          sortQuery: `${orderBy}=${order}`,
          ...(statusFilter !== 'ALL' && { status: statusFilter }),
        },
      };
      const result: ChargepointsResponse = await fetcher([endpoints.chargepoints.list, queryArgs]);
      setRows(result.data ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      console.error('Error fetching chargepoints:', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, orderBy, order, statusFilter]);

  useEffect(() => {
    fetchChargepoints();
  }, [fetchChargepoints]);

  const handleSort = (field: string) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const handleStatusFilter = (_: React.MouseEvent, value: string | null) => {
    if (value !== null) {
      setStatusFilter(value);
      setPage(0);
    }
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h4">Cargadores</Typography>
            {!loading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {total} cargadores registrados
              </Typography>
            )}
          </Box>
          {!isViewOnly() && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" width={18} />}
              onClick={() => setNewDialogOpen(true)}
            >
              Nuevo cargador
            </Button>
          )}
        </Stack>

        {/* Search + status filter */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          sx={{ mb: 3 }}
        >
          <TextField
            placeholder="Buscar por nombre, dirección, ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ flex: 1, maxWidth: { md: 400 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={handleStatusFilter}
            size="small"
            sx={{ flexWrap: 'wrap' }}
          >
            {STATUS_FILTERS.map((f) => (
              <ToggleButton key={f.value} value={f.value} sx={{ px: 1.5, py: 0.5 }}>
                <Typography variant="caption" fontWeight={600}>
                  {f.label}
                </Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        {/* Table */}
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 28, pl: 3 }}>#</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Cargador
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Conectores</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <Stack alignItems="center" spacing={1.5}>
                        <Iconify
                          icon="eva:search-fill"
                          width={40}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron cargadores
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((cp, index) => {
                    const hasWarning = cp.connectors.length === 0;

                    return (
                      <TableRow
                        key={cp.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                        onClick={() => router.push(`/chargingstations/${cp.id}`)}
                      >
                        {/* Row number */}
                        <TableCell sx={{ pl: 3 }}>
                          <Typography variant="caption" color="text.disabled">
                            {page * pageSize + index + 1}
                          </Typography>
                        </TableCell>

                        {/* Charger info */}
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Iconify
                                icon="mdi:ev-station"
                                width={18}
                                sx={{ color: 'common.black', flexShrink: 0 }}
                              />
                              <Typography variant="subtitle2">{cp.name ?? '-'}</Typography>
                              {cp.client_cp_id && (
                                <Typography variant="caption" color="text.secondary">
                                  ({cp.client_cp_id})
                                </Typography>
                              )}
                            </Stack>
                          </Stack>
                        </TableCell>

                        {/* Address */}
                        <TableCell>
                          {cp.address && (
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Iconify
                                icon="mdi:map-marker-outline"
                                width={14}
                                sx={{ color: 'text.disabled', flexShrink: 0 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {cp.address}
                              </Typography>
                            </Stack>
                          )}
                        </TableCell>

                        {/* Connectors */}
                        <TableCell>
                          {hasWarning ? (
                            <Label color="warning" variant="soft">
                              Incompleto
                            </Label>
                          ) : (
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                              {cp.connectors.map((conn) => (
                                <ConnectorStatusChip
                                  label={`Conector ${conn.ocppId}`}
                                  status={conn.status}
                                  connectorType={conn.connectorTypeId}
                                />
                              ))}
                            </Stack>
                          )}
                        </TableCell>

                        {/* Arrow */}
                        <TableCell>
                          <IconButton size="small" sx={{ color: 'text.secondary' }}>
                            <Iconify icon="eva:arrow-ios-forward-fill" width={20} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

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
            rowsPerPageOptions={[10, 20, 40]}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
            slotProps={{
              actions: {
                nextButton: { disabled: rows.length < pageSize },
              },
            }}
          />
        </Card>
      </DashboardContent>

      <NewChargepointDialog
        open={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
        onSuccess={(newId) => {
          fetchChargepoints();
          if (newId != null) setSetupChargepointId(newId);
        }}
      />

      <ChargerSetupDialog
        open={setupChargepointId != null}
        chargepointId={setupChargepointId}
        onClose={() => {
          setSetupChargepointId(null);
          fetchChargepoints();
        }}
      />
    </>
  );
}
