import { useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

import { CreateRateWizard } from 'src/components/rate/create-rate-wizard';

// ----------------------------------------------------------------------

export default function CreateRateView() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{CONFIG.appName}</title>
      </Helmet>
      <DashboardContent>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3">Nueva tarifa</Typography>
          <Typography variant="body2" color="text.secondary">
            Sigue los pasos para crear una o varias tarifas.
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <CreateRateWizard
              onSuccess={() => navigate(paths.rates.list)}
              onCancel={() => navigate(paths.rates.list)}
            />
          </CardContent>
        </Card>
      </DashboardContent>
    </>
  );
}
