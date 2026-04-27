import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { COUNTRIES } from 'src/assets/data/countries';
import { DashboardContent } from 'src/layouts/dashboard';
import { post, put, fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { TransactionsTable } from 'src/components/transactions-table';

import { useAbility } from 'src/auth/hooks/use-ability';

import { BillingDetails, type AppUser } from 'src/types/appuser';

// ----------------------------------------------------------------------

const metadata = { title: `Usuario | ${CONFIG.appName}` };

type AppUserDetailResponse = { status_code: number; data: AppUser; error: string | null };

function formatDateDisplay(value?: Date | string | null): string {
  if (!value) return '—';
  return new Date(value as string).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function toDateInputValue(value?: Date | string | null): string {
  if (!value) return '';
  try {
    return new Date(value as string).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// ----------------------------------------------------------------------

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

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
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function formatAddress(user: AppUser): string {
  const country = COUNTRIES.find((c) => c.id === user.countryId);
  const province = country?.state_provinces.find((p) => p.id === user.stateProvinceId);
  return (
    [user.address, user.city, user.postalCode, province?.name, country?.name]
      .filter(Boolean)
      .join(', ') || '—'
  );
}

function PersonalDataSection({ user, onSaved }: { user: AppUser; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cardId, setCardId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [stateProvinceId, setStateProvinceId] = useState<number | null | undefined>(null);
  const [countryId, setCountryId] = useState<number | null | undefined>(null);
  const [birthday, setBirthday] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const syncFromUser = (u: AppUser) => {
    setName(u.name ?? '');
    setSurname(u.surname ?? '');
    setEmail(u.email ?? '');
    setTelephone(u.telephone ?? '');
    setCardId(u.cardId ?? '');
    setAddress(u.address ?? '');
    setCity(u.city ?? '');
    setPostalCode(u.postalCode ?? '');
    setStateProvinceId(u.stateProvinceId);
    setCountryId(u.countryId);
    setBirthday(toDateInputValue(u.birthday));
    setIsActive(u.isActive ?? true);
  };

  useEffect(() => {
    syncFromUser(user);
  }, [user]);

  const handleCancel = () => {
    syncFromUser(user);
    setSaveError(null);
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      await put(endpoints.appUsers.update(user.id), {
        name: name || undefined,
        surname: surname || undefined,
        email: email || undefined,
        telephone: telephone || undefined,
        cardId: cardId || undefined,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        stateProvinceId: stateProvinceId || undefined,
        countryId: countryId || undefined,
        birthday: birthday || undefined,
        isActive,
      });
      setEditing(false);
      onSaved();
    } catch (err) {
      const apiError = err as { error?: string };
      setSaveError(apiError?.error ?? 'Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title="Datos personales"
      action={
        !editing ? (
          <Button
            size="small"
            startIcon={<Iconify icon="mdi:pencil-outline" width={14} />}
            onClick={() => setEditing(true)}
          >
            Editar
          </Button>
        ) : undefined
      }
    >
      {!editing ? (
        <Stack divider={<Divider />}>
          <InfoRow label="Nombre" value={user.name} />
          <InfoRow label="Apellidos" value={user.surname} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Teléfono" value={user.telephone} />
          <InfoRow label="DNI / CIF" value={user.cardId} mono />
          <InfoRow label="Dirección" value={formatAddress(user)} />
          <InfoRow label="Fecha de nacimiento" value={formatDateDisplay(user.birthday)} />
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ py: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              Estado
            </Typography>
            <Label color={user.isActive === false ? 'error' : 'success'} variant="soft">
              {user.isActive === false ? 'Inactivo' : 'Activo'}
            </Label>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Nombre"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Apellidos"
              size="small"
              fullWidth
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Email"
              size="small"
              fullWidth
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Teléfono"
              size="small"
              fullWidth
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </Stack>
          <TextField
            label="DNI / CIF"
            size="small"
            fullWidth
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
          />
          <TextField
            label="Dirección"
            size="small"
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Ciudad"
              size="small"
              fullWidth
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <TextField
              label="Código postal"
              size="small"
              fullWidth
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              select
              label="País"
              size="small"
              fullWidth
              value={countryId || null}
              onChange={(e) => {
                setCountryId(Number(e.target.value));
                setStateProvinceId(0);
              }}
            >
              <MenuItem value="">
                <em>—</em>
              </MenuItem>
              {COUNTRIES.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Provincia / Estado"
              size="small"
              fullWidth
              value={stateProvinceId || null}
              onChange={(e) => setStateProvinceId(Number(e.target.value))}
              disabled={!COUNTRIES.find((c) => c.id === countryId)?.state_provinces.length}
            >
              <MenuItem value="">
                <em>—</em>
              </MenuItem>
              {(COUNTRIES.find((c) => c.id === countryId)?.state_provinces ?? []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            label="Fecha de nacimiento"
            size="small"
            fullWidth
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="caption">Cuenta activa</Typography>}
          />
          {saveError && (
            <Typography variant="caption" color="error">
              {saveError}
            </Typography>
          )}
          <Divider />
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button size="small" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={12} color="inherit" /> : undefined}
            >
              Guardar
            </Button>
          </Stack>
        </Stack>
      )}
    </SectionCard>
  );
}

// ----------------------------------------------------------------------

function formatBillingAddress(b: BillingDetails): string {
  const country = COUNTRIES.find((c) => c.id === b.countryId);
  const province = country?.state_provinces.find((p) => p.id === b.stateProvinceId);
  return (
    [b.address, b.city, b.postalCode, province?.name, country?.name].filter(Boolean).join(', ') ||
    '—'
  );
}

function BillingSection({
  billing,
  appUserId,
  onSaved,
}: {
  billing: BillingDetails | undefined;
  appUserId: number;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [vatId, setVatId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [stateProvinceId, setStateProvinceId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const syncFromBilling = (b: BillingDetails) => {
    setName(b.name ?? '');
    setVatId(b.vatId ?? '');
    setAddress(b.address ?? '');
    setCity(b.city ?? '');
    setPostalCode(b.postalCode ?? '');
    setStateProvinceId(b.stateProvinceId ?? null);
    setCountryId(b.countryId ?? null);
  };

  useEffect(() => {
    if (billing) syncFromBilling(billing);
  }, [billing]);

  const resetFields = () => {
    setName('');
    setVatId('');
    setAddress('');
    setCity('');
    setPostalCode('');
    setStateProvinceId(null);
    setCountryId(null);
  };

  const handleCancel = () => {
    if (billing) syncFromBilling(billing);
    else resetFields();
    setSaveError(null);
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      await put(endpoints.appUsers.billing(appUserId), {
        name: name || undefined,
        vatId: vatId || undefined,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        stateProvinceId: stateProvinceId || undefined,
        countryId: countryId || undefined,
      });
      setEditing(false);
      onSaved();
    } catch (err) {
      const apiError = err as { error?: string };
      setSaveError(apiError?.error ?? 'Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title="Datos de facturación"
      action={
        !editing ? (
          <Button
            size="small"
            startIcon={
              <Iconify icon={billing ? 'mdi:pencil-outline' : 'mdi:plus'} width={14} />
            }
            onClick={() => setEditing(true)}
          >
            {billing ? 'Editar' : 'Añadir'}
          </Button>
        ) : undefined
      }
    >
      {!billing && !editing ? (
        <Typography variant="body2" color="text.disabled">
          Sin datos de facturación
        </Typography>
      ) : !editing && billing ? (
        <Stack divider={<Divider />}>
          <InfoRow label="Nombre / Razón social" value={billing.name} />
          <InfoRow label="NIF / CIF" value={billing.vatId} mono />
          <InfoRow label="Dirección" value={formatBillingAddress(billing)} />
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Nombre / Razón social"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="NIF / CIF"
              size="small"
              fullWidth
              value={vatId}
              onChange={(e) => setVatId(e.target.value)}
              slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
            />
          </Stack>
          <TextField
            label="Dirección"
            size="small"
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Ciudad"
              size="small"
              fullWidth
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <TextField
              label="Código postal"
              size="small"
              fullWidth
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              select
              label="País"
              size="small"
              fullWidth
              value={countryId || ''}
              onChange={(e) => {
                setCountryId(Number(e.target.value) || null);
                setStateProvinceId(null);
              }}
            >
              <MenuItem value="">
                <em>—</em>
              </MenuItem>
              {COUNTRIES.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Provincia / Estado"
              size="small"
              fullWidth
              value={stateProvinceId || ''}
              onChange={(e) => setStateProvinceId(Number(e.target.value) || null)}
              disabled={!COUNTRIES.find((c) => c.id === countryId)?.state_provinces.length}
            >
              <MenuItem value="">
                <em>—</em>
              </MenuItem>
              {(COUNTRIES.find((c) => c.id === countryId)?.state_provinces ?? []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          {saveError && (
            <Typography variant="caption" color="error">
              {saveError}
            </Typography>
          )}
          <Divider />
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button size="small" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={12} color="inherit" /> : undefined}
            >
              Guardar
            </Button>
          </Stack>
        </Stack>
      )}
    </SectionCard>
  );
}

// ----------------------------------------------------------------------

function WalletCard({ user, onSaved }: { user: AppUser; onSaved: () => void }) {
  const { hasRole } = useAbility();
  const isEurocharger = hasRole('Eurocharger');

  const [topupOpen, setTopupOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (saving) return;
    setTopupOpen(false);
    setAmount('');
    setError(null);
  };

  const handleTopup = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Introduce una cantidad válida mayor que 0.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await post(endpoints.appUsers.topup(user.id), { amount: parsed });
      handleClose();
      onSaved();
    } catch {
      setError('Error al añadir saldo. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              Wallet
            </Typography>
            {isEurocharger && (
              <Button
                size="small"
                startIcon={<Iconify icon="mdi:plus" width={14} />}
                onClick={() => setTopupOpen(true)}
              >
                Añadir saldo
              </Button>
            )}
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="mdi:wallet-outline" width={22} sx={{ color: 'primary.main' }} />
              <Typography variant="body2" color="text.secondary">
                Saldo disponible
              </Typography>
            </Stack>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {((user.walletBalance ?? 0) / 100).toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
              })}
            </Typography>
          </Stack>

          {isEurocharger && user.stripeId && (
            <>
              <Divider sx={{ my: 1 }} />
              <InfoRow label="Stripe ID" value={user.stripeId} mono />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={topupOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Añadir saldo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Cantidad (€)"
              type="number"
              size="small"
              fullWidth
              autoFocus
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
              placeholder="0.00"
            />
            {error && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleTopup}
            disabled={saving || !amount}
            startIcon={saving ? <CircularProgress size={12} color="inherit" /> : undefined}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ----------------------------------------------------------------------

export default function AppUserDetailView() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<AppUser | undefined>();  
  const [billing, setBilling] = useState<BillingDetails | undefined>();
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const response = await fetcher(endpoints.appUsers.single(Number(id)));
      console.log(response);
      setUser(response.data ?? (response as unknown as AppUser));
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const loadBilling = async () => {
    try {
      const response = await fetcher(endpoints.appUsers.billing(Number(id)));
      setBilling(response.data ?? (response as unknown as BillingDetails));
    } catch (err) {
      console.error('Error fetching billing:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadUser();
      await loadBilling();
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (!user) {
    return (
      <DashboardContent>
        <Alert severity="error">No se encontró el usuario.</Alert>
      </DashboardContent>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {user.name ?? 'Usuario'} | {metadata.title}
        </title>
      </Helmet>

      <DashboardContent>
        <Stack spacing={2.5}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton
              onClick={() => router.back()}
              size="small"
              sx={{ color: 'text.secondary', flexShrink: 0 }}
            >
              <Iconify icon="eva:arrow-ios-back-fill" width={22} />
            </IconButton>

            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                {(user.name?.[0] ?? '?').toUpperCase()}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Typography variant="h5" noWrap>
                  {user.name ?? '—'}
                </Typography>
                <Label color={user.isActive === false ? 'error' : 'success'} variant="soft">
                  {user.isActive === false ? 'Inactivo' : 'Activo'}
                </Label>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {user.email}
              </Typography>
            </Box>
          </Stack>

          {/* Data sections */}
          <Grid container spacing={2} alignItems="stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <PersonalDataSection user={user} onSaved={loadUser} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                <BillingSection billing={billing} appUserId={user.id} onSaved={loadBilling} />

                <WalletCard user={user} onSaved={loadUser} />
              </Stack>
            </Grid>
          </Grid>

          {/* Transactions */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Últimas recargas
            </Typography>
            <TransactionsTable
              endpoint={endpoints.appUsers.transactions(Number(id))}
              defaultPageSize={5}
              enableSearch={false}
            />
          </Box>
        </Stack>
      </DashboardContent>
    </>
  );
}
