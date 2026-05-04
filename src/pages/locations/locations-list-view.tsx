import type { BasicChargingStationInfo } from 'src/types/charging_stations';

import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { ConnectorTypeIcon } from 'src/components/chargepoint/connector-type-icon';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Localizaciones | ${CONFIG.appName}` };

type LocationsResponse = { data: BasicChargingStationInfo[]; total?: number };

// ----------------------------------------------------------------------

export default function LocationsListView() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: res, isLoading } = useQuery<LocationsResponse>({
    queryKey: ['locations', 'list', { page, pageSize, search: debouncedSearch }],
    queryFn: () =>
      fetcher([
        endpoints.locations.list,
        { params: { page, pageSize, searchQuery: debouncedSearch } },
      ]),
  });

  const rows = res?.data ?? [];
  const total = res?.total ?? -1;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <DashboardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Typography variant="h4">Localizaciones</Typography>
        </Stack>

        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Stack sx={{ p: 2 }}>
            <TextField
              size="small"
              placeholder="Buscar por nombre, dirección…"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              sx={{ maxWidth: 360 }}
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
          </Stack>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Cargadores</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron localizaciones
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((location) => (
                    <TableRow key={location.id} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Link
                          to={paths.locations.detail(location.id)}
                          style={{ textDecoration: 'none' }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ '&:hover': { textDecoration: 'underline' } }}
                          >
                            {location.id}
                          </Typography>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <Link
                          to={paths.locations.detail(location.id)}
                          style={{ textDecoration: 'none' }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ '&:hover': { textDecoration: 'underline' } }}
                          >
                            {location.name}
                          </Typography>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {location.address ?? '—'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={location.chargepoints_number ?? 0}
                          variant="soft"
                          color="default"
                          icon={<Iconify icon="mdi:ev-station" width={14} />}
                        />
                      </TableCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 40]}
            labelRowsPerPage="Filas por página"
            slotProps={{
              actions: {
                nextButton: { disabled: total === -1 ? rows.length < pageSize : undefined },
              },
            }}
          />
        </Card>
      </DashboardContent>
    </>
  );
}
