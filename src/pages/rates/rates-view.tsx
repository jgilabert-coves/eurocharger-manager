import type { AxiosRequestConfig } from 'axios';
import type { GridColDef, GridSortModel } from '@mui/x-data-grid';
import type { RateItem, RatesDataTableResponse } from 'src/types/rates';

import { useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';

import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/lib/axios';

import { CONFIG } from '../../global-config';
import { DataTable } from '../../components/data-table';
import { DashboardContent } from '../../layouts/dashboard';

const metadata = { title: `${CONFIG.appName}` };

const columns: GridColDef<RateItem>[] = [
  {
    field: 'name',
    headerName: 'Nombre de la tarifa',
    flex: 2,
    editable: false,
  },
  {
    field: 'type_name',
    headerName: 'Tipo',
    flex: 1,
    editable: false,
  },
  {
    field: 'connectors_count',
    headerName: 'Conectores que aplica',
    flex: 1,
    editable: false,
  },
];

export default function RatesView() {
  const navigate = useNavigate();

  const fetchRates = async (
    page: number,
    pageSize: number,
    searchQuery: string,
    sortQuery: GridSortModel
  ) => {
    try {
      const queryArgs: AxiosRequestConfig = {
        params: {
          page,
          pageSize,
          sortQuery: sortQuery.map(({ field, sort }) => `${field}=${sort}`).join('&'),
          searchQuery,
        },
      };
      const result: RatesDataTableResponse = await fetcher([endpoints.rates.list, queryArgs]);
      return { data: result.data, total: result.total };
    } catch (err) {
      console.error('Error fetching rates:', err);
      return { data: [], total: 0 };
    }
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Typography variant="h2" sx={{ mb: 5 }}>
          Tarifas
        </Typography>
        <DataTable
          columns={columns}
          fetchData={(
            page: number,
            pageSize: number,
            searchQuery: string,
            sortQuery?: GridSortModel
          ) => fetchRates(page, pageSize, searchQuery, sortQuery || [])}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 40]}
          onRowClick={(params) => navigate(paths.rates.detail(String(params.row.id)))}
        />
      </DashboardContent>
    </>
  );
}
