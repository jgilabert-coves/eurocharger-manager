import type { ChangeEvent } from 'react';
import type { Client } from 'src/types/clients';
import type { RateDraft } from 'src/types/rates';
import type { Operator } from 'src/types/operators';
import type { ChargePoint } from 'src/types/chargepoint';

import { useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import Grid from '@mui/material/Grid2';
import {
  Box,
  Card,
  Chip,
  Step,
  Alert,
  Paper,
  Table,
  Button,
  Divider,
  Stepper,
  Checkbox,
  MenuItem,
  TableRow,
  FormGroup,
  StepLabel,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  CardContent,
  ToggleButton,
  InputAdornment,
  TableContainer,
  CircularProgress,
  FormControlLabel,
  ToggleButtonGroup,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { post, fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

type Method = 'manual' | 'excel';
type AssignmentMethod = 'power' | 'excel';

const HUBJECT_CLIENT_ID = 18;

// Steps definition per flow
const MANUAL_STEPS = ['Método', 'Información básica', 'Precio', 'Estaciones', 'Resumen'];
const MANUAL_STEPS_HUBJECT = ['Método', 'Información básica', 'Precio', 'Resumen'];
const EXCEL_STEPS = ['Método', 'Cliente', 'Archivo', 'Resumen'];

// ----------------------------------------------------------------------

function applyCommission(price: number, commission: number): number {
  return price * (1 + commission / 100);
}

function formatPrice(value: number): string {
  return value.toFixed(4);
}

// ----------------------------------------------------------------------
// Step 0 – Method selection
// ----------------------------------------------------------------------

function MethodStep({
  selected,
  onChange,
}: {
  selected: Method | null;
  onChange: (m: Method) => void;
}) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        ¿Cómo quieres crear las tarifas?
      </Typography>
      <Grid container spacing={3}>
        {(['manual', 'excel'] as Method[]).map((m) => (
          <Grid key={m} size={{ xs: 12, sm: 6 }}>
            <Card
              variant="outlined"
              onClick={() => onChange(m)}
              sx={{
                cursor: 'pointer',
                borderWidth: 2,
                borderColor: selected === m ? 'primary.main' : 'divider',
                bgcolor: selected === m ? 'primary.lighter' : 'background.paper',
                transition: 'all .2s',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                  {m === 'manual' ? '✏️ Manual' : '📄 Excel'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {m === 'manual'
                    ? 'Introduce los datos de una tarifa paso a paso.'
                    : 'Sube un fichero Excel con una o más tarifas.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Step 1 (Manual) – Basic info
// ----------------------------------------------------------------------

function ManualBasicInfoStep({
  clients,
  clientId,
  setClientId,
  operatorId,
  setOperatorId,
  rateName,
  setRateName,
  isHubject,
}: {
  clients: Client[];
  clientId: number | null;
  setClientId: (id: number | null, isHubject: boolean) => void;
  operatorId: number | null;
  setOperatorId: (id: number | null) => void;
  rateName: string;
  setRateName: (v: string) => void;
  isHubject: boolean;
}) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [opLoading, setOpLoading] = useState(false);

  useEffect(() => {
    if (!isHubject) return;
    setOpLoading(true);
    fetcher(endpoints.operators.list)
      .then((res: { data: Operator[] }) => setOperators(res.data ?? []))
      .catch(() => setOperators([]))
      .finally(() => setOpLoading(false));
  }, [isHubject]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Información básica
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            label="Cliente"
            value={clientId ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              const client = clients.find((c) => c.id === val);
              setClientId(val, client?.id === HUBJECT_CLIENT_ID);
            }}
            helperText="Déjalo vacío para crear una tarifa Eurocharger"
          >
            <MenuItem value="">
              <em>Sin cliente (Eurocharger)</em>
            </MenuItem>
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.business_name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nombre de la tarifa"
            value={rateName}
            onChange={(e) => setRateName(e.target.value)}
          />
        </Grid>

        {isHubject && (
          <Grid size={{ xs: 12, sm: 6 }}>
            {opLoading ? (
              <CircularProgress size={24} />
            ) : (
              <TextField
                select
                fullWidth
                label="Operador Hubject (CPO)"
                value={operatorId ?? ''}
                onChange={(e) =>
                  setOperatorId(e.target.value === '' ? null : Number(e.target.value))
                }
              >
                {operators.map((op) => (
                  <MenuItem key={op.id} value={op.id}>
                    {op.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Step 2 (Manual) – Price & commission
// ----------------------------------------------------------------------

function PriceStep({
  commission,
  setCommission,
  price,
  setPrice,
  typeName,
}: {
  commission: number;
  setCommission: (v: number) => void;
  price: number;
  setPrice: (v: number) => void;
  typeName: string;
}) {
  const final = applyCommission(price, commission);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Precio y comisión
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Precio base"
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">€/{typeName}</InputAdornment>,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Comisión"
            type="number"
            value={commission}
            onChange={(e) => setCommission(Number(e.target.value))}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 2,
              borderRadius: 1,
              bgcolor: 'primary.lighter',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Precio final (con comisión)
            </Typography>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              {formatPrice(final)} €/{typeName}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Step 3 (Manual, non-Hubject) – Station selection
// ----------------------------------------------------------------------

function StationsStep({
  clientId,
  selectedIds,
  setSelectedIds,
}: {
  clientId: number | null;
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
}) {
  const [stations, setStations] = useState<ChargePoint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const res: { data: ChargePoint[]; total: number } = await fetcher([
        endpoints.chargepoints.list,
        { params: { page, pageSize: PAGE_SIZE, searchQuery: search, clientId } },
      ]);
      setStations(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, clientId]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const toggle = (id: number) => {
    setSelectedIds(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Estaciones de carga
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Selecciona las estaciones a las que aplicará esta tarifa.
        {selectedIds.length > 0 && (
          <Chip
            label={`${selectedIds.length} seleccionadas`}
            color="primary"
            size="small"
            sx={{ ml: 1 }}
          />
        )}
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Buscar estación..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        sx={{ mb: 2 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper variant="outlined">
          <FormGroup>
            {stations.map((s) => (
              <Box key={s.id}>
                <FormControlLabel
                  sx={{ px: 2, py: 0.5, width: '100%', m: 0 }}
                  control={
                    <Checkbox
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggle(s.id)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {s.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.address}, {s.city}
                      </Typography>
                    </Box>
                  }
                />
                <Divider />
              </Box>
            ))}
          </FormGroup>
          {stations.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No se han encontrado estaciones.
            </Typography>
          )}
        </Paper>
      )}

      {totalPages > 1 && (
        <Box
          sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 1 }}
        >
          <Button size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Typography variant="caption">
            {page + 1} / {totalPages}
          </Typography>
          <Button
            size="small"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------
// Step 1 (Excel) – Client & commission
// ----------------------------------------------------------------------

function ExcelClientStep({
  clients,
  clientId,
  setClientId,
  commission,
  setCommission,
  isHubject,
  operatorId,
  setOperatorId,
}: {
  clients: Client[];
  clientId: number | null;
  setClientId: (id: number | null) => void;
  commission: number;
  setCommission: (v: number) => void;
  isHubject: boolean;
  operatorId: number | null;
  setOperatorId: (id: number | null) => void;
}) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [opLoading, setOpLoading] = useState(false);

  useEffect(() => {
    if (!isHubject) {
      setOperators([]);
      return;
    }
    setOpLoading(true);
    fetcher(endpoints.operators.list)
      .then((res: { data: Operator[] }) => setOperators(res.data ?? []))
      .catch(() => setOperators([]))
      .finally(() => setOpLoading(false));
  }, [isHubject]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Cliente y comisión
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            label="Cliente"
            value={clientId ?? ''}
            onChange={(e) => setClientId(e.target.value === '' ? null : Number(e.target.value))}
            helperText="Déjalo vacío para tarifas Eurocharger"
          >
            <MenuItem value="">
              <em>Sin cliente (Eurocharger)</em>
            </MenuItem>
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.business_name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Comisión"
            type="number"
            value={commission}
            onChange={(e) => setCommission(Number(e.target.value))}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              },
            }}
          />
        </Grid>
        {isHubject && (
          <Grid size={{ xs: 12, sm: 6 }}>
            {opLoading ? (
              <CircularProgress size={24} />
            ) : (
              <TextField
                select
                fullWidth
                label="Operador Hubject (CPO)"
                value={operatorId ?? ''}
                onChange={(e) =>
                  setOperatorId(e.target.value === '' ? null : Number(e.target.value))
                }
              >
                {operators.map((op) => (
                  <MenuItem key={op.id} value={op.id}>
                    {op.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Step 2 (Excel) – Assignment method & file upload
// ----------------------------------------------------------------------

function ExcelFileStep({
  assignmentMethod,
  setAssignmentMethod,
  file,
  setFile,
  preview,
  previewLoading,
  onRequestPreview,
}: {
  assignmentMethod: AssignmentMethod | null;
  setAssignmentMethod: (m: AssignmentMethod) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  preview: RateDraft[];
  previewLoading: boolean;
  onRequestPreview: (file: File, method: AssignmentMethod) => void;
}) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && assignmentMethod) {
      onRequestPreview(f, assignmentMethod);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Método de asignación y archivo
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Asignar tarifas por:
      </Typography>
      <ToggleButtonGroup
        value={assignmentMethod}
        exclusive
        onChange={(_, val) => {
          if (val) {
            setAssignmentMethod(val);
            if (file) onRequestPreview(file, val);
          }
        }}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="power">Potencia</ToggleButton>
        <ToggleButton value="excel">Excel</ToggleButton>
      </ToggleButtonGroup>

      <Box
        sx={{
          border: '2px dashed',
          borderColor: file ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: file ? 'primary.lighter' : 'background.neutral',
          cursor: 'pointer',
          transition: 'all .2s',
        }}
        onClick={() => document.getElementById('excel-upload')?.click()}
      >
        <input
          id="excel-upload"
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {file ? (
          <>
            <Typography variant="body1" fontWeight="bold">
              📄 {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(file.size / 1024).toFixed(1)} KB · Haz clic para cambiar
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary">
              Arrastra o haz clic para subir el fichero Excel
            </Typography>
            <Typography variant="caption" color="text.secondary">
              .xlsx · .xls · .csv
            </Typography>
          </>
        )}
      </Box>

      {previewLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Procesando archivo...</Typography>
        </Box>
      )}

      {!previewLoading && preview.length > 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Se han detectado <strong>{preview.length}</strong> tarifa(s) en el fichero.
        </Alert>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------
// Summary step (shared)
// ----------------------------------------------------------------------

function SummaryStep({
  method,
  drafts,
  clientName,
  commission,
}: {
  method: Method;
  drafts: RateDraft[];
  clientName: string;
  commission: number;
}) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Resumen
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Revisa los datos antes de confirmar.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Método
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {method === 'manual' ? 'Manual' : 'Excel'}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Cliente
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {clientName || 'Eurocharger'}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Comisión aplicada
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {commission}%
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {drafts.length === 1 ? 'Tarifa a crear' : `Tarifas a crear (${drafts.length})`}
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell align="right">Precio base</TableCell>
              <TableCell align="right">Precio final (+comisión)</TableCell>
              <TableCell align="right">EVSE IDs</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drafts.map((d, i) => (
              <TableRow key={i}>
                <TableCell>{d.name}</TableCell>
                <TableCell align="right">{formatPrice(d.price)} €</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${formatPrice(d.priceAfterCommission)} €`}
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {d.evseIds.length > 0 ? (
                    <Chip label={d.evseIds.length} size="small" />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Main view
// ----------------------------------------------------------------------

export default function CreateRateView() {
  const navigate = useNavigate();

  // ── Shared state ──
  const [stepIndex, setStepIndex] = useState(0);
  const [method, setMethod] = useState<Method | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Manual
  const [clientId, setClientIdRaw] = useState<number | null>(null);
  const [isHubject, setIsHubject] = useState(false);
  const [operatorId, setOperatorId] = useState<number | null>(null);
  const [rateName, setRateName] = useState('');
  const [commission, setCommission] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [selectedStationIds, setSelectedStationIds] = useState<number[]>([]);

  // Excel
  const [excelClientId, setExcelClientId] = useState<number | null>(null);
  const [excelOperatorId, setExcelOperatorId] = useState<number | null>(null);
  const [excelCommission, setExcelCommission] = useState<number>(0);

  const excelIsHubject = excelClientId === HUBJECT_CLIENT_ID;
  const [assignmentMethod, setAssignmentMethod] = useState<AssignmentMethod | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<RateDraft[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Derived ──
  const activeClientId = method === 'excel' ? excelClientId : clientId;
  const activeClientName = clients.find((c) => c.id === activeClientId)?.business_name ?? '';

  const steps = method === 'excel' ? EXCEL_STEPS : isHubject ? MANUAL_STEPS_HUBJECT : MANUAL_STEPS;

  // ── Load clients ──
  useEffect(() => {
    fetcher(endpoints.clients.list)
      .then((res: { data: Client[] }) => setClients(res.data ?? []))
      .catch(() => setClients([]))
      .finally(() => setClientsLoading(false));
  }, []);

  // ── Handlers ──
  const setClientId = (id: number | null, hubject: boolean) => {
    setClientIdRaw(id);
    setIsHubject(hubject);
    if (!hubject) setOperatorId(null);
  };

  const handleRequestPreview = async (file: File, aMethod: AssignmentMethod) => {
    setPreviewLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignmentMethod', aMethod);
      if (excelClientId) formData.append('clientId', String(excelClientId));
      formData.append('commission', String(excelCommission));
      const res: { data: RateDraft[] } = await post(endpoints.rates.previewExcel, formData);
      setExcelPreview(res.data ?? []);
    } catch {
      // If preview endpoint not available, mock a placeholder
      setExcelPreview([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Build summary drafts (manual)
  const buildManualDraft = (): RateDraft => ({
    name: rateName,
    price,
    priceAfterCommission: applyCommission(price, commission),
    commission,
    evseIds: selectedStationIds.map(String),
  });

  const summaryDrafts: RateDraft[] =
    method === 'manual' ? [buildManualDraft()] : excelPreview.length > 0 ? excelPreview : [];

  // ── Validation per step ──
  const canContinue = (): boolean => {
    if (stepIndex === 0) return method !== null;
    if (method === 'manual') {
      if (stepIndex === 1) return rateName.trim().length > 0;
      if (stepIndex === 2) return price > 0;
      return true;
    }
    if (method === 'excel') {
      if (stepIndex === 1) return true;
      if (stepIndex === 2) return excelFile !== null && assignmentMethod !== null;
      return true;
    }
    return true;
  };

  const isLastStep = stepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setStepIndex((s) => s + 1);
    }
  };

  const handleBack = () => setStepIndex((s) => s - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (method === 'manual') {
        await post(endpoints.rates.create, {
          clientId,
          operatorId: isHubject ? operatorId : null,
          rateName,
          commission,
          price,
          stationIds: selectedStationIds,
        });
      } else {
        const formData = new FormData();
        if (excelClientId) formData.append('clientId', String(excelClientId));
        if (excelIsHubject && excelOperatorId) formData.append('operatorId', String(excelOperatorId));
        formData.append('commission', String(excelCommission));
        formData.append('assignmentMethod', assignmentMethod!);
        formData.append('file', excelFile!);
        await post(endpoints.rates.createFromExcel, formData);
      }
      navigate(paths.rates.list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ha ocurrido un error al crear la tarifa.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step content renderer ──
  const renderStepContent = () => {
    if (stepIndex === 0) {
      return (
        <MethodStep
          selected={method}
          onChange={(m) => {
            setMethod(m);
          }}
        />
      );
    }

    if (method === 'manual') {
      const offset = stepIndex; // 1-based
      if (offset === 1) {
        return (
          <ManualBasicInfoStep
            clients={clients}
            clientId={clientId}
            setClientId={setClientId}
            operatorId={operatorId}
            setOperatorId={setOperatorId}
            rateName={rateName}
            setRateName={setRateName}
            isHubject={isHubject}
          />
        );
      }
      if (offset === 2) {
        return (
          <PriceStep
            commission={commission}
            setCommission={setCommission}
            price={price}
            setPrice={setPrice}
            typeName="kWh"
          />
        );
      }
      // Step 3: stations (non-hubject) OR summary (hubject)
      if (!isHubject && offset === 3) {
        return (
          <StationsStep
            clientId={clientId}
            selectedIds={selectedStationIds}
            setSelectedIds={setSelectedStationIds}
          />
        );
      }
      // Summary (last step)
      return (
        <SummaryStep
          method="manual"
          drafts={summaryDrafts}
          clientName={activeClientName}
          commission={commission}
        />
      );
    }

    if (method === 'excel') {
      if (stepIndex === 1) {
        return (
          <ExcelClientStep
            clients={clients}
            clientId={excelClientId}
            setClientId={(id) => {
              setExcelClientId(id);
              if (id !== HUBJECT_CLIENT_ID) setExcelOperatorId(null);
            }}
            commission={excelCommission}
            setCommission={setExcelCommission}
            isHubject={excelIsHubject}
            operatorId={excelOperatorId}
            setOperatorId={setExcelOperatorId}
          />
        );
      }
      if (stepIndex === 2) {
        return (
          <ExcelFileStep
            assignmentMethod={assignmentMethod}
            setAssignmentMethod={setAssignmentMethod}
            file={excelFile}
            setFile={setExcelFile}
            preview={excelPreview}
            previewLoading={previewLoading}
            onRequestPreview={handleRequestPreview}
          />
        );
      }
      // Summary
      return (
        <SummaryStep
          method="excel"
          drafts={summaryDrafts}
          clientName={activeClientName}
          commission={excelCommission}
        />
      );
    }

    return null;
  };

  return (
    <>
      <Helmet>
        <title>{CONFIG.appName}</title>
      </Helmet>
      <DashboardContent>
        {/* ── Page header ── */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3">Nueva tarifa</Typography>
          <Typography variant="body2" color="text.secondary">
            Sigue los pasos para crear una o varias tarifas.
          </Typography>
        </Box>

        {/* ── Stepper ── */}
        <Stepper activeStep={stepIndex} sx={{ mb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* ── Step content ── */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            {clientsLoading && stepIndex === 1 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              renderStepContent()
            )}
          </CardContent>
        </Card>

        {/* ── Error ── */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {/* ── Navigation ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={stepIndex === 0 ? () => navigate(paths.rates.list) : handleBack}
          >
            {stepIndex === 0 ? 'Cancelar' : 'Atrás'}
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canContinue() || submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isLastStep ? 'Confirmar y crear' : 'Siguiente'}
          </Button>
        </Box>
      </DashboardContent>
    </>
  );
}
