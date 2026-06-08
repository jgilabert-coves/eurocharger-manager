import type { BasicChargingStationInfo } from 'src/types/charging_stations';

import { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';

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
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useDebounce } from 'src/hooks/use-debounce';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { CONFIG } from '../../global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Localizaciones | ${CONFIG.appName}` };

type LocationsResponse = { data: BasicChargingStationInfo[]; total?: number };

// ----------------------------------------------------------------------

export default function LocationsListView() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') ?? '0');
  const pageSize = Number(searchParams.get('pageSize') ?? '10');
  const searchQuery = searchParams.get('search') ?? '';
  const debouncedSearch = useDebounce(searchQuery);

  const updateParam = useCallback(
    (updates: Record<string, string>, replace = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([k, v]) => {
            if (v) next.set(k, v);
            else next.delete(k);
          });
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

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
              onChange={(e) => updateParam({ search: e.target.value, page: '0' }, true)}
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
                  <TableCell sx={{ width: 48 }} />
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
                    <TableRow
                      key={location.id}
                      sx={{
                        cursor: 'pointer',
                        '&:last-child td': { border: 0 },
                      }}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey)
                          window.open(paths.locations.detail(location.id), '_blank');
                        else router.push(paths.locations.detail(location.id));
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {location.id}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {location.name}
                        </Typography>
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
                          icon={
                            <Iconify
                              icon="mdi:ev-station"
                              width={14}
                              sx={{ color: 'common.black' }}
                            />
                          }
                        />
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          component={Link}
                          to={paths.locations.detail(location.id)}
                          size="small"
                          sx={{ color: 'text.secondary' }}
                        >
                          <Iconify icon="eva:arrow-ios-forward-fill" width={20} />
                        </IconButton>
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
            onPageChange={(_, newPage) => updateParam({ page: String(newPage) })}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => updateParam({ pageSize: e.target.value, page: '0' })}
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
