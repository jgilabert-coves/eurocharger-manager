import { useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';

import { fetcher, endpoints } from 'src/lib/axios';

import { type ActiveCharge } from 'src/types/dashboard';

import { tk } from './tokens';
import { IcCoin } from './icons';
import { CardHeader } from './primitives';

// ----------------------------------------------------------------------

export function TransTable() {
  const [charges, setCharges] = useState<ActiveCharge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const response = await fetcher(endpoints.dashboard.activeCharges);
        if (!cancelled) setCharges(response.data as ActiveCharge[]);
      } catch (error) {
        console.error('Error fetching active charges:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

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
            {loading
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
