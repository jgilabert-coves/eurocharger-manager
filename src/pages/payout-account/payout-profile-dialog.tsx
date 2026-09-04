import type { ConnectProfileForm, ConnectPrepareResult, ConnectProfilePayload } from 'src/types/connect';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { put, post, fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useNotification } from 'src/components/notification';

// ----------------------------------------------------------------------

/**
 * Formulario previo al alta de la cuenta de cobro.
 *
 * POR QUÉ EXISTE: los datos que se recogen aquí se le mandan a Stripe ANTES de
 * abrir su formulario, y eso hace que Stripe deje de preguntarlos. Con la
 * declaración de administrador único y socio único, una sociedad pasa de 26
 * datos pendientes a 4.
 *
 * POR QUÉ ES OBLIGATORIO Y NO SE PUEDE VOLVER ATRÁS: el prefill solo se puede
 * empujar antes de generar el enlace de alta. Una vez generado, los datos de
 * Stripe no se pueden tocar por API nunca más. De ahí el paso de revisión: es
 * la última oportunidad de corregir algo.
 */

type Props = {
  open: boolean;
  onClose: () => void;
  /** Se llama cuando todo está confirmado y toca salir a Stripe. */
  onReady: () => void;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

type FormState = {
  firstName: string;
  lastName: string;
  nationality: string;
  phone: string;
  email: string;
  title: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  addressLine1: string;
  addressCity: string;
  addressPostalCode: string;
};

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  nationality: 'ES',
  phone: '',
  email: '',
  title: '',
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  addressLine1: '',
  addressCity: '',
  addressPostalCode: '',
};

/** Etiquetas de los requisitos de Stripe que quedan pendientes. */
const PENDING_LABELS: Record<string, string> = {
  external_account: 'Tu cuenta bancaria (IBAN)',
  'tos_acceptance.date': 'Aceptar las condiciones de Stripe',
  'tos_acceptance.ip': 'Aceptar las condiciones de Stripe',
  'company.phone': 'Teléfono de la empresa',
  'individual.phone': 'Tu teléfono',
  'individual.dob.day': 'Tu fecha de nacimiento',
  'individual.dob.month': 'Tu fecha de nacimiento',
  'individual.dob.year': 'Tu fecha de nacimiento',
  'company.name': 'Razón social',
  'company.tax_id': 'CIF de la empresa',
};

/** Agrupa y traduce, para no enseñar "tos_acceptance.ip" a un operador. */
function describePending(fields: string[]): string[] {
  const labels = fields.map((field) => PENDING_LABELS[field] ?? field);
  return [...new Set(labels)];
}

const validate = (form: FormState, isCompany: boolean): FieldErrors => {
  const errors: FieldErrors = {};
  if (!form.firstName.trim()) errors.firstName = 'Obligatorio';
  if (!form.lastName.trim()) errors.lastName = 'Obligatorio';
  if (!form.addressLine1.trim()) errors.addressLine1 = 'Obligatorio';
  if (!form.addressCity.trim()) errors.addressCity = 'Obligatorio';
  if (!/^\d{5}$/.test(form.addressPostalCode.trim())) {
    errors.addressPostalCode = 'Cinco dígitos';
  }

  const day = Number(form.dobDay);
  const month = Number(form.dobMonth);
  const year = Number(form.dobYear);
  if (!(day >= 1 && day <= 31)) errors.dobDay = 'Día';
  if (!(month >= 1 && month <= 12)) errors.dobMonth = 'Mes';
  // Sin techo por edad: Stripe ya rechaza menores de 13, y duplicar esa regla
  // aquí solo la desincroniza.
  if (!(year >= 1900 && year <= new Date().getFullYear())) errors.dobYear = 'Año';

  if (form.nationality.trim().length !== 2) errors.nationality = 'Código de dos letras';
  if (isCompany && !form.title.trim()) errors.title = 'Obligatorio en una sociedad';
  return errors;
};

export function PayoutProfileDialog({ open, onClose, onReady }: Props) {
  const { notifyError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [soleOwner, setSoleOwner] = useState(false);
  const [fiscalOk, setFiscalOk] = useState(false);
  const [meta, setMeta] = useState<ConnectProfileForm | null>(null);
  const [plan, setPlan] = useState<ConnectPrepareResult | null>(null);

  const isCompany = meta?.business_type === 'company';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response: { data: ConnectProfileForm } = await fetcher(endpoints.connect.profile);
      const data = response.data;
      setMeta(data);

      if (data.profile) {
        setForm({
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          nationality: data.profile.nationality ?? 'ES',
          phone: data.profile.phone ?? '',
          email: data.profile.email ?? '',
          title: data.profile.title ?? '',
          dobDay: String(data.profile.dob.day),
          dobMonth: String(data.profile.dob.month),
          dobYear: String(data.profile.dob.year),
          addressLine1: data.profile.address.line1,
          addressCity: data.profile.address.city,
          addressPostalCode: data.profile.address.postalCode,
        });
        setSoleOwner(data.profile.soleOwnerAndDirector);
      } else if (data.owner_suggestion) {
        // Solo una sugerencia: estos nombres salen de partir el nombre completo
        // del registro, así que el operador tiene que revisarlos.
        setForm({
          ...EMPTY,
          firstName: data.owner_suggestion.first_name,
          lastName: data.owner_suggestion.last_name ?? '',
        });
      }
    } catch {
      notifyError('No se pudieron cargar tus datos. Inténtalo de nuevo.');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [notifyError, onClose]);

  useEffect(() => {
    if (!open) {
      setPlan(null);
      setErrors({});
      return;
    }
    load();
  }, [open, load]);

  const set = (key: keyof FormState) => (event: { target: { value: string } }) => {
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  /** Guarda, confirma y prepara la cuenta. Todavía NO genera el enlace. */
  const handleContinue = async () => {
    const found = validate(form, isCompany);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    if (!fiscalOk) return;

    setSaving(true);
    try {
      const payload: ConnectProfilePayload = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        nationality: form.nationality.trim().toUpperCase(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        title: form.title.trim() || null,
        dob_day: Number(form.dobDay),
        dob_month: Number(form.dobMonth),
        dob_year: Number(form.dobYear),
        address_line1: form.addressLine1.trim(),
        address_city: form.addressCity.trim(),
        address_postal_code: form.addressPostalCode.trim(),
        sole_owner_and_director: soleOwner,
      };

      await put(endpoints.connect.profile, payload);
      await post(endpoints.connect.profileConfirm, {});
      const prepared: { data: ConnectPrepareResult } = await post(endpoints.connect.prepare, {});
      setPlan(prepared.data);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se pudieron guardar tus datos. Inténtalo de nuevo.';
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  const renderFiscal = () => {
    if (!meta) return null;
    const { fiscal } = meta;
    return (
      <Alert severity="info" icon={<Iconify icon="solar:document-text-bold" />}>
        <AlertTitle sx={{ mb: 0.5 }}>
          {fiscal.business_name}
          {fiscal.business_cif ? ` · ${fiscal.business_cif}` : ''}
        </AlertTitle>
        <Typography variant="body2">
          {[fiscal.address, fiscal.postal_code, fiscal.city].filter(Boolean).join(', ') ||
            'Sin dirección registrada'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {meta.business_type === 'company'
            ? 'Te daremos de alta como sociedad, según tu CIF.'
            : meta.business_type === 'individual'
              ? 'Te daremos de alta como autónomo, según tu NIF.'
              : 'No hemos podido deducir si eres empresa o autónomo: te lo preguntará Stripe.'}
        </Typography>
      </Alert>
    );
  };

  const renderForm = () => (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Con estos datos rellenamos por ti el formulario de Stripe. Cuantos más pongas aquí, menos
        te pedirá él.
      </Typography>

      {renderFiscal()}

      <FormControlLabel
        control={<Checkbox checked={fiscalOk} onChange={(e) => setFiscalOk(e.target.checked)} />}
        label="Confirmo que estos datos fiscales son correctos"
      />

      <Divider />

      <Typography variant="subtitle2">
        {isCompany ? 'Representante legal de la empresa' : 'Tus datos'}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth
          label="Nombre *"
          value={form.firstName}
          onChange={set('firstName')}
          error={!!errors.firstName}
          helperText={errors.firstName}
        />
        <TextField
          fullWidth
          label="Apellidos *"
          value={form.lastName}
          onChange={set('lastName')}
          error={!!errors.lastName}
          helperText={errors.lastName}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Día *"
          value={form.dobDay}
          onChange={set('dobDay')}
          error={!!errors.dobDay}
          helperText={errors.dobDay}
          sx={{ width: { sm: 100 } }}
        />
        <TextField
          label="Mes *"
          value={form.dobMonth}
          onChange={set('dobMonth')}
          error={!!errors.dobMonth}
          helperText={errors.dobMonth}
          sx={{ width: { sm: 100 } }}
        />
        <TextField
          label="Año *"
          value={form.dobYear}
          onChange={set('dobYear')}
          error={!!errors.dobYear}
          helperText={errors.dobYear ?? 'Fecha de nacimiento'}
          sx={{ width: { sm: 140 } }}
        />
        <TextField
          label="Nacionalidad *"
          value={form.nationality}
          onChange={set('nationality')}
          error={!!errors.nationality}
          helperText={errors.nationality ?? 'ES, PT, MA…'}
          sx={{ width: { sm: 160 } }}
        />
      </Stack>

      <TextField
        label="Dirección *"
        value={form.addressLine1}
        onChange={set('addressLine1')}
        error={!!errors.addressLine1}
        helperText={errors.addressLine1 ?? 'Tu dirección personal, no la de la empresa'}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth
          label="Ciudad *"
          value={form.addressCity}
          onChange={set('addressCity')}
          error={!!errors.addressCity}
          helperText={errors.addressCity}
        />
        <TextField
          label="Código postal *"
          value={form.addressPostalCode}
          onChange={set('addressPostalCode')}
          error={!!errors.addressPostalCode}
          helperText={errors.addressPostalCode}
          sx={{ width: { sm: 180 } }}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth
          label="Teléfono"
          value={form.phone}
          onChange={set('phone')}
          helperText="Stripe puede usarlo para verificarte"
        />
        <TextField
          fullWidth
          label="Email"
          value={form.email}
          onChange={set('email')}
          helperText="Si es distinto del de facturación"
        />
      </Stack>

      {isCompany && (
        <>
          <TextField
            label="Cargo en la empresa *"
            value={form.title}
            onChange={set('title')}
            error={!!errors.title}
            helperText={errors.title ?? 'Por ejemplo: Administrador único'}
          />

          <FormControlLabel
            control={
              <Checkbox checked={soleOwner} onChange={(e) => setSoleOwner(e.target.checked)} />
            }
            label={
              <Box>
                <Typography variant="body2">
                  Soy administrador único y socio único de la empresa
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Si lo marcas, no tendrás que aportar los datos de otros administradores ni
                  socios. Márcalo solo si es cierto.
                </Typography>
              </Box>
            }
          />
        </>
      )}
    </Stack>
  );

  const renderReview = () => {
    if (!plan) return null;
    const pending = describePending(plan.will_be_asked);
    return (
      <Stack spacing={2.5}>
        <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" />}>
          <AlertTitle>Ya hemos rellenado tus datos en Stripe</AlertTitle>
          Hemos enviado {plan.prefilled.length} datos por ti.
        </Alert>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Lo único que te va a pedir Stripe
          </Typography>
          {pending.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nada más: solo tendrás que revisar y confirmar.
            </Typography>
          ) : (
            <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
              {pending.map((label) => (
                <Typography component="li" key={label} variant="body2">
                  {label}
                </Typography>
              ))}
            </Stack>
          )}
        </Box>

        {plan.warnings.length > 0 && (
          <Alert severity="warning">
            <AlertTitle>Algunos datos no hemos podido rellenarlos</AlertTitle>
            <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
              {plan.warnings.map((warning) => (
                <Typography component="li" key={warning} variant="caption">
                  {warning}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}

        <Alert severity="info">
          Al continuar se abre Stripe y estos datos quedan fijados: después solo se pueden cambiar
          desde allí.
        </Alert>
      </Stack>
    );
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {plan ? 'Todo listo para el alta' : 'Datos para el alta de tu cuenta de cobro'}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : meta && !meta.editable ? (
          <Alert severity="info">
            Tu alta ya está en marcha en Stripe, así que estos datos ya no se pueden cambiar desde
            aquí. Continúa en Stripe para terminarla.
          </Alert>
        ) : plan ? (
          renderReview()
        ) : (
          renderForm()
        )}
      </DialogContent>

      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        {plan || (meta && !meta.editable) ? (
          <Button variant="contained" onClick={onReady} endIcon={<Iconify icon="solar:arrow-right-bold" />}>
            Continuar en Stripe
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleContinue}
            disabled={loading || saving || !fiscalOk}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? 'Guardando…' : 'Continuar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
