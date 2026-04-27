import { Helmet } from 'react-helmet-async';

import Typography from '@mui/material/Typography';

import { endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { TransactionsTable } from 'src/components/transactions-table';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Recargas | ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function TransactionsView() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Typography variant="h2" sx={{ mb: 5 }}>
          Recargas activas
        </Typography>
        <TransactionsTable
          endpoint={endpoints.transactions.current}
          extraParams={{ status: 'CARGANDO' }}
        />
      </DashboardContent>
    </>
  );
}
