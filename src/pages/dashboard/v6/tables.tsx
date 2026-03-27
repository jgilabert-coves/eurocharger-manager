import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { tk } from './tokens';
import { IcBolt, IcCoin } from './icons';
import { CardHeader } from './primitives';
import { IN_USE, TRANSACTIONS } from './data';

export function InUseTable() {
  return (
    <Card sx={{ p: 3 }}>
      <CardHeader icon={IcBolt} label="Cargadores en uso" />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['ID', 'Cargador', 'Ciudad', 'Conectores'].map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {IN_USE.map(({ id, name, city, conn, full }) => (
              <TableRow key={id}>
                <TableCell sx={{ color: tk.inkLighter }}>{id}</TableCell>
                <TableCell>{name}</TableCell>
                <TableCell>{city}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={conn}
                    sx={{
                      fontWeight: 700,
                      bgcolor: full ? tk.blueDarkest : tk.greenLightest,
                      color: full ? tk.white : tk.greenDarkest,
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

export function TransTable() {
  return (
    <Card sx={{ p: 3 }}>
      <CardHeader icon={IcCoin} label="Transacciones en curso" />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['ID', 'Usuario', 'Ciudad', 'Estado'].map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {TRANSACTIONS.map(({ id, user, city }) => (
              <TableRow key={id}>
                <TableCell sx={{ color: tk.inkLighter }}>{id}</TableCell>
                <TableCell>{user}</TableCell>
                <TableCell>{city}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label="Cargando"
                    sx={{
                      fontWeight: 700,
                      bgcolor: tk.greenLightest,
                      color: tk.greenDarkest,
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
