import type { Dayjs } from 'dayjs';
import type { AppUser } from 'src/types/appuser';
import type { ChargeStatus } from 'src/types/charges';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import { useDebounce } from 'src/hooks/use-debounce';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { ChargesTable } from 'src/components/charges-table';
import { DateRangeFilter } from 'src/components/date-range-filter';

import { CONFIG } from '../../global-config';

dayjs.extend(utc);

// ----------------------------------------------------------------------

const metadata = { title: `Cargos | ${CONFIG.appName}` };

const STATUS_OPTIONS: { value: ChargeStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'authorized', label: 'Autorizado' },
  { value: 'captured', label: 'Cobrado' },
  { value: 'failed', label: 'Fallido' },
  { value: 'refunded', label: 'Reembolsado' },
];

// ----------------------------------------------------------------------

export default function AppUserChargesView() {
  const { id } = useParams();
  const router = useRouter();
  const appUserId = Number(id);

  const [user, setUser] = useState<AppUser | undefined>();
  const [statusFilter, setStatusFilter] = useState<ChargeStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedFrom, setAppliedFrom] = useState<Dayjs | null>(null);
  const [appliedTo, setAppliedTo] = useState<Dayjs | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetcher(endpoints.appUsers.single(appUserId));
        if (active) setUser(response.data ?? (response as unknown as AppUser));
      } catch (err) {
        console.error('Error fetching app user:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [appUserId]);

  const extraParams = useMemo(
    (): Record<string, string> => ({
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(appliedFrom ? { dateFrom: appliedFrom.utc().format('YYYY-MM-DD HH:mm:ss') } : {}),
      ...(appliedTo ? { dateTo: appliedTo.utc().format('YYYY-MM-DD HH:mm:ss') } : {}),
    }),
    [statusFilter, appliedFrom, appliedTo]
  );

  const debouncedSearch = useDebounce(searchQuery, 400);

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Button
            size="small"
            color="inherit"
            onClick={() => router.back()}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Volver
          </Button>
          <Stack>
            <Typography variant="h4">Cargos (Stripe)</Typography>
            {user && (
              <Typography variant="body2" color="text.secondary">
                {user.name} {user.surname ?? ''} · {user.email}
              </Typography>
            )}
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          useFlexGap
          alignItems={{ md: 'center' }}
          sx={{ mb: 3, flexWrap: 'wrap' }}
        >
          <TextField
            placeholder="Buscar por PaymentIntent, transacción, mensaje..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
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

          <TextField
            select
            size="small"
            label="Estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ChargeStatus | 'ALL')}
            sx={{ minWidth: 180 }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <DateRangeFilter
            from={appliedFrom}
            to={appliedTo}
            onChange={(f, t) => {
              setAppliedFrom(f);
              setAppliedTo(t);
            }}
          />
        </Stack>

        <ChargesTable
          key={`${statusFilter}-${appliedFrom?.valueOf() ?? ''}-${appliedTo?.valueOf() ?? ''}`}
          appUserId={appUserId}
          endpoint={endpoints.appUsers.charges(appUserId)}
          extraParams={extraParams}
          searchQuery={debouncedSearch}
          showActions
        />
      </DashboardContent>
    </>
  );
}
