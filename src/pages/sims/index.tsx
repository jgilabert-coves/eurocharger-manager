import type { SimOrderWithAccount } from 'src/types/sims';

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { CONFIG } from '../../global-config';
import { SimRequestsTab } from './sim-requests-tab';
import { SimsInventoryTab } from './sims-inventory-tab';
import { EditSimPricingDialog } from './components/edit-sim-pricing-dialog';

// ----------------------------------------------------------------------

const metadata = { title: `SIMs | ${CONFIG.appName}` };

type SimOrdersResponse = { data: SimOrderWithAccount[]; total: number };

// ----------------------------------------------------------------------

export default function SimsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [pricingOpen, setPricingOpen] = useState(false);

  const { data: requestsRes } = useQuery<SimOrdersResponse>({
    queryKey: ['sim-orders', 'requests'],
    queryFn: () => fetcher(endpoints.simOrders.requests),
  });

  const requestsCount = requestsRes?.data?.length ?? 0;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Typography variant="h4">SIMs</Typography>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:tag-price-bold" />}
            onClick={() => setPricingOpen(true)}
          >
            Precios
          </Button>
        </Stack>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab label="Inventario" />
            <Tab label={`Solicitudes pendientes (${requestsCount})`} />
          </Tabs>
        </Box>

        {activeTab === 0 && <SimsInventoryTab />}
        {activeTab === 1 && <SimRequestsTab />}
      </DashboardContent>

      <EditSimPricingDialog open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </>
  );
}
