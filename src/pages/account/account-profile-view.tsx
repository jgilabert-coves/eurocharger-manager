import { Helmet } from 'react-helmet-async';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { CONFIG } from '../../global-config';
import { FiscalDataCard } from './sections/fiscal-data-card';
import { ChangePasswordCard } from './sections/change-password-card';

// ----------------------------------------------------------------------

const metadata = { title: `Mi cuenta | ${CONFIG.appName}` };

export default function AccountProfileView() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent maxWidth="md">
        <Stack spacing={3}>
          <Typography variant="h4">Mi cuenta</Typography>

          <FiscalDataCard />
          <ChangePasswordCard />
        </Stack>
      </DashboardContent>
    </>
  );
}
