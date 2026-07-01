import type { Sim } from 'src/types/sims';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  available: Sim[];
  selected: number[];
  onChange: (ids: number[]) => void;
  emptyText?: string;
};

const simLabel = (sim: Sim) => (sim.name ? `${sim.iccid} — ${sim.name}` : sim.iccid);

/**
 * Selector de doble panel (izquierda = disponibles / derecha = seleccionadas)
 * para asignar tarjetas SIM. Mismo patrón visual que `ChargerDualPicker`.
 */
export function SimDualPicker({ available, selected, onChange, emptyText }: Props) {
  const [search, setSearch] = useState('');

  const unselected = available.filter((s) => !selected.includes(s.id));
  const filtered = unselected.filter((s) =>
    simLabel(s).toLowerCase().includes(search.toLowerCase())
  );
  const selectedSims = available.filter((s) => selected.includes(s.id));

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selected.includes(s.id));
  const someFilteredSelected = filtered.some((s) => selected.includes(s.id));

  const handleToggleAll = () => {
    if (allFilteredSelected) {
      onChange(selected.filter((id) => !filtered.some((s) => s.id === id)));
    } else {
      const toAdd = filtered.map((s) => s.id).filter((id) => !selected.includes(id));
      onChange([...selected, ...toAdd]);
    }
  };

  const handleAdd = (id: number) => onChange([...selected, id]);
  const handleRemove = (id: number) => onChange(selected.filter((x) => x !== id));

  const PANEL_HEIGHT = 220;

  return (
    <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
      {/* ── Columna izquierda: disponibles ── */}
      <Paper
        variant="outlined"
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1.5, pt: 1, pb: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            Disponibles ({unselected.length})
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Todas
            </Typography>
            <Checkbox
              size="small"
              checked={allFilteredSelected}
              indeterminate={!allFilteredSelected && someFilteredSelected}
              onChange={handleToggleAll}
              disabled={filtered.length === 0}
              sx={{ p: 0.25 }}
            />
          </Stack>
        </Stack>

        <Box sx={{ px: 1, pt: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar SIM (ICCID o nombre)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={14} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', height: PANEL_HEIGHT, p: 0.5 }}>
          {available.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              {emptyText ?? 'No hay tarjetas disponibles.'}
            </Typography>
          ) : filtered.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              No se encontraron tarjetas.
            </Typography>
          ) : (
            filtered.map((s) => (
              <Box
                key={s.id}
                onClick={() => handleAdd(s.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Iconify icon="mdi:sim" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
                <Typography variant="body2" noWrap>
                  {simLabel(s)}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Paper>

      {/* ── Columna derecha: seleccionadas ── */}
      <Paper
        variant="outlined"
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 1.5, pt: 1, pb: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            Seleccionadas ({selectedSims.length})
          </Typography>
        </Stack>

        <Box sx={{ flex: 1, overflowY: 'auto', height: PANEL_HEIGHT, p: 0.5 }}>
          {selectedSims.length === 0 ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.disabled" textAlign="center">
                Ninguna tarjeta seleccionada
              </Typography>
            </Box>
          ) : (
            selectedSims.map((s) => (
              <Box
                key={s.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={0.75}
                  sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}
                >
                  <Iconify
                    icon="mdi:sim"
                    width={14}
                    sx={{ color: 'text.disabled', flexShrink: 0 }}
                  />
                  <Typography variant="body2" noWrap>
                    {simLabel(s)}
                  </Typography>
                </Stack>
                <IconButton
                  size="small"
                  onClick={() => handleRemove(s.id)}
                  sx={{ flexShrink: 0, ml: 0.5, color: 'text.secondary' }}
                >
                  <Iconify icon="mingcute:close-line" width={14} />
                </IconButton>
              </Box>
            ))
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
