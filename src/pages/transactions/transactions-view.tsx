import type { AxiosRequestConfig } from 'axios';
import type { GridColDef, GridSortModel } from '@mui/x-data-grid';

import { round } from 'es-toolkit';
import { Helmet } from 'react-helmet-async';

import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';

import { TransactionsDataTableItem, TransactionsDataTableResponse } from 'src/types/transactions';

import { CONFIG } from '../../global-config';
import { DataTable } from '../../components/data-table';
import { DashboardContent } from '../../layouts/dashboard';

const metadata = { title: `${CONFIG.appName}` };

const columns: GridColDef<TransactionsDataTableItem>[] = [
  { field: 'id', headerName: 'ID', flex: 0, editable: false },
  //{ field: 'client', headerName: 'Client', flex: 1, editable: false },
  { field: 'chargepointName', headerName: 'Chargepoint Name', flex: 1, editable: false },
  { field: 'connector', headerName: 'Connector', flex: 0, editable: false },
  //{ field: 'code', headerName: 'Code', flex: 0, editable: false },
  //{ field: 'city', headerName: 'City', flex: 1, editable: false },
  {
    field: 'date',
    headerName: 'Date',
    flex: 1,
    editable: false,
    renderCell: (params) => <span style={{ color: 'blue' }}>{fDateTime(params.value)}</span>,
  },
  {
    field: 'power',
    headerName: 'Power',
    flex: 0,
    editable: false,
    renderCell: (params) => <span>{params.value ? round(params.value, 2) : 0.0} kWh</span>,
  },
  { field: 'total', headerName: 'Total', flex: 0, editable: false },
  { field: 'appUser', headerName: 'App User', flex: 1, editable: false },
];

export default function TransactionsView() {
  const fetchTransactions = async (
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
          status: 'CARGANDO',
          sortQuery: sortQuery.map(({ field, sort }) => `${field}=${sort}`).join('&'),
          searchQuery,
        },
      };
      //console.log("Fetching transactions with args:", queryArgs);
      const result: TransactionsDataTableResponse = await fetcher([
        endpoints.transactions.current,
        queryArgs,
      ]);
      //console.log("Fetched transactions:", result);
      return { data: result.data, total: result.total };
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return { data: [], total: 0 };
    }
  };

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Typography variant="h2" sx={{ mb: 5 }}>
          Recargas
        </Typography>
        <DataTable
          columns={columns}
          fetchData={(
            page: number,
            pageSize: number,
            searchQuery: string,
            sortQuery?: GridSortModel
          ) => fetchTransactions(page, pageSize, searchQuery, sortQuery || [])}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 40]}
        />
      </DashboardContent>
    </>
  );
}
