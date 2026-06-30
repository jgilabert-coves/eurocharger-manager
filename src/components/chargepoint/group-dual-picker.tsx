import { useState } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type SelectedGroup = {
  groupId: string;
  permissionLevel: 'view' | 'operate';
};

type GroupDualPickerProps = {
  available: ChargerGroup[];
  selected: SelectedGroup[];
  onChange: (groups: SelectedGroup[]) => void;
  emptyText?: string;
};

export function GroupDualPicker({
  available,
  selected,
  onChange,
  emptyText,
}: GroupDualPickerProps) {
  const [search, setSearch] = useState('');

  const selectedIds = selected.map((s) => s.groupId);
  const unselected = available.filter((g) => !selectedIds.includes(g.id));
  const filtered = unselected.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  const selectedGroups = available.filter((g) => selectedIds.includes(g.id));

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((g) => selectedIds.includes(g.id));
  const someFilteredSelected = filtered.some((g) => selectedIds.includes(g.id));

  const handleToggleAll = () => {
    if (allFilteredSelected) {
      onChange(selected.filter((s) => !filtered.some((g) => g.id === s.groupId)));
    } else {
      const toAdd = filtered
        .filter((g) => !selectedIds.includes(g.id))
        .map((g) => ({ groupId: g.id, permissionLevel: 'view' as const }));
      onChange([...selected, ...toAdd]);
    }
  };

  const handleAdd = (id: string) =>
    onChange([...selected, { groupId: id, permissionLevel: 'view' }]);

  const handleRemove = (id: string) => onChange(selected.filter((s) => s.groupId !== id));

  const handlePermission = (id: string, level: 'view' | 'operate') =>
    onChange(selected.map((s) => (s.groupId === id ? { ...s, permissionLevel: level } : s)));

  const PANEL_HEIGHT = 260;

  return (
    <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
      {/* ── Panel izquierdo: disponibles ── */}
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
              Todos
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
            placeholder="Buscar propietario..."
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
              {emptyText ?? 'No hay propietarios disponibles.'}
            </Typography>
          ) : filtered.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              No se encontraron propietarios.
            </Typography>
          ) : (
            filtered.map((g) => (
              <Box
                key={g.id}
                onClick={() => handleAdd(g.id)}
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
                <Iconify
                  icon="mdi:account-group"
                  width={14}
                  sx={{ color: 'text.disabled', flexShrink: 0 }}
                />
                <Typography variant="body2" noWrap>
                  {g.name}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Paper>

      {/* ── Panel derecho: seleccionados ── */}
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
            Seleccionados ({selectedGroups.length})
          </Typography>
          {selectedGroups.length > 0 && (
            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={() => onChange([])}
              sx={{
                p: 0,
                minWidth: 0,
                fontSize: '0.65rem',
                color: 'text.secondary',
                '&:hover': { color: 'error.main' },
              }}
            >
              Deseleccionar todos
            </Button>
          )}
        </Stack>

        <Box sx={{ flex: 1, overflowY: 'auto', height: PANEL_HEIGHT, p: 0.5 }}>
          {selectedGroups.length === 0 ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.disabled" textAlign="center">
                Ningún propietario seleccionado
              </Typography>
            </Box>
          ) : (
            selectedGroups.map((g) => {
              const perm = selected.find((s) => s.groupId === g.id)?.permissionLevel ?? 'view';
              return (
                <Box
                  key={g.id}
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
                      icon="mdi:account-group"
                      width={14}
                      sx={{ color: 'text.disabled', flexShrink: 0 }}
                    />
                    <Typography variant="body2" noWrap>
                      {g.name}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={0.25}>
                    <Button
                      size="small"
                      variant={perm === 'view' ? 'contained' : 'text'}
                      color="primary"
                      onClick={() => handlePermission(g.id, 'view')}
                      sx={{ minWidth: 0, px: 0.75, py: 0.25, fontSize: '0.65rem', lineHeight: 1.5 }}
                    >
                      Ver
                    </Button>
                    <Button
                      size="small"
                      variant={perm === 'operate' ? 'contained' : 'text'}
                      color="warning"
                      onClick={() => handlePermission(g.id, 'operate')}
                      sx={{ minWidth: 0, px: 0.75, py: 0.25, fontSize: '0.65rem', lineHeight: 1.5 }}
                    >
                      Operar
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleRemove(g.id)}
                      sx={{ color: 'text.secondary', ml: 0.25 }}
                    >
                      <Iconify icon="mingcute:close-line" width={14} />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
