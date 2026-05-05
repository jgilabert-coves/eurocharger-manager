import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { TransactionsTable } from 'src/components/transactions-table';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Recargas | ${CONFIG.appName}` };

type StatusFilter = 'ALL' | 'CARGANDO' | 'FINALIZADO';

// ----------------------------------------------------------------------

export default function TransactionsView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const extraParams = useMemo(
    (): Record<string, string> => (statusFilter === 'ALL' ? {} : { status: statusFilter }),
    [statusFilter]
  );

  const showEndDate = statusFilter !== 'CARGANDO';

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
            <ToggleButton value="ALL">Todas</ToggleButton>
            <ToggleButton value="CARGANDO">En curso</ToggleButton>
            <ToggleButton value="FINALIZADO">Finalizadas</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <TransactionsTable
          key={statusFilter}
          endpoint={endpoints.transactions.current}
          extraParams={extraParams}
          searchQuery={searchQuery}
          showEndDate={showEndDate}
          showStatus={statusFilter === 'ALL'}
        />
      </DashboardContent>
    </>
  );
}
