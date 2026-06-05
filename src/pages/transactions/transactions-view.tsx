import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useDebounce } from 'src/hooks/use-debounce';

import { endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { TransactionsTable } from 'src/components/transactions-table';

import { useAbility } from 'src/auth/hooks/use-ability';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Recargas | ${CONFIG.appName}` };

type StatusFilter = 'CARGANDO' | 'FINALIZADO';
type SourceFilter = 'ALL' | 'APP' | 'HUBJECT' | 'OCPI';

// ----------------------------------------------------------------------

export default function TransactionsView() {
  const { hasRole } = useAbility();
  const isEurocharger = hasRole('eurocharger');

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('CARGANDO');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const extraParams = useMemo((): Record<string, string> => ({
    ...(statusFilter === 'CARGANDO' ? {} : { status: statusFilter }),
    ...(isEurocharger && sourceFilter !== 'ALL' ? { source: sourceFilter.toLowerCase() } : {}),
  }), [statusFilter, sourceFilter, isEurocharger]);

  const showEndDate = statusFilter !== 'CARGANDO';
  const debouncedSearch = useDebounce(searchQuery, 400);

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Recargas
        </Typography>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          sx={{ mb: 3 }}
        >
          <TextField
            placeholder="Buscar por usuario, estación, cargador..."
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

          <ToggleButtonGroup
            exclusive
            size="small"
            value={statusFilter}
            onChange={(_, val) => {
              if (val) setStatusFilter(val);
            }}
            sx={{ flexWrap: 'wrap' }}
          >
            <ToggleButton value="CARGANDO">En curso</ToggleButton>
            <ToggleButton value="FINALIZADO">Finalizadas</ToggleButton>
          </ToggleButtonGroup>

          {isEurocharger && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={sourceFilter}
              onChange={(_, val) => {
                if (val) setSourceFilter(val);
              }}
              sx={{ flexWrap: 'wrap' }}
            >
              <ToggleButton value="ALL">Todos</ToggleButton>
              <ToggleButton value="APP">EuroCharger</ToggleButton>
              <ToggleButton value="HUBJECT">Roaming</ToggleButton>
              <ToggleButton value="OCPI">OCPI</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>

        <TransactionsTable
          key={`${statusFilter}-${sourceFilter}`}
          endpoint={endpoints.transactions.current}
          extraParams={extraParams}
          searchQuery={debouncedSearch}
          showEndDate={showEndDate}
          showStatus={false}
        />
      </DashboardContent>
    </>
  );
}
