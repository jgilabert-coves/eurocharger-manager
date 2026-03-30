import { useQuery } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';

import { IcCoin } from 'src/assets/icons';
import { endpoints, fetcher } from 'src/lib/axios';

import { type ActiveCharge } from 'src/types/dashboard';

import { tk } from './tokens';
import { CardHeader } from './primitives';

// ----------------------------------------------------------------------

export function TransTable() {
  const { data: res, isLoading } = useQuery({
    queryKey: ['dashboard', 'activeCharges'],
    queryFn: () => fetcher(endpoints.dashboard.activeCharges),
  });
  const charges = (res?.data as ActiveCharge[]) ?? [];

  const HEADERS = ['ID', 'Cargador', 'Ciudad', 'Usuario', 'Tarifa'];

  return (
    <Card sx={{ p: 3 }}>
      <CardHeader icon={IcCoin} label="Recargas en curso" />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {HEADERS.map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {HEADERS.map((h) => (
                      <TableCell key={h}>
                        <Skeleton variant="text" width={h === 'ID' ? 40 : 80} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : charges.map((charge) => (
                  <TableRow key={charge.transactionId}>
                    <TableCell sx={{ color: tk.inkLighter }}>{charge.transactionId}</TableCell>
                    <TableCell>{charge.chargepointName}</TableCell>
                    <TableCell>{charge.city}</TableCell>
                    <TableCell>{charge.userName}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={charge.rateName ?? 'Sin tarifa'}
                        sx={{
                          fontWeight: 700,
                          bgcolor: charge.rateName ? tk.greenLightest : tk.skyLighter,
                          color: charge.rateName ? tk.greenDarkest : tk.inkLighter,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
