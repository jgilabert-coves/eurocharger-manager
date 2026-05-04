import type { ChargingStation } from 'src/types/charging_stations';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type StationSearchSelectProps = {
  value: ChargingStation | null;
  onChange: (station: ChargingStation | null) => void;
  label?: string;
};

export function StationSearchSelect({
  value,
  onChange,
  label = 'Estación de carga (opcional)',
}: StationSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return () => {};

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetcher([
          endpoints.locations.list,
          { params: { page: 0, pageSize: 10, searchQuery: search } },
        ]);
        if (!cancelled) setStations(res?.data ?? []);
      } catch {
        if (!cancelled) setStations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, open]);

  return (
    <Box
      sx={(t) => ({
        border: `1px solid ${open ? t.vars.palette.primary.main : t.vars.palette.divider}`,
        borderRadius: 1.5,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      })}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onClick={() => setOpen((o) => !o)}
        sx={{
          px: 1.5,
          py: 1,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify
            icon="mdi:ev-station"
            width={16}
            sx={{ color: open ? 'primary.main' : 'text.disabled', flexShrink: 0 }}
          />
          <Typography variant="body2" color={open ? 'text.primary' : 'text.secondary'}>
            {label}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          {value && (
            <Chip
              label={value.name}
              size="small"
              color="primary"
              variant="soft"
              onDelete={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              onClick={(e) => e.stopPropagation()}
              sx={{ maxWidth: 160 }}
            />
          )}
          <IconButton size="small" sx={{ color: 'text.secondary', p: 0.25 }}>
            <Iconify
              icon={open ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
              width={18}
            />
          </IconButton>
        </Stack>
      </Stack>

      {/* Collapsible content */}
      <Collapse in={open}>
        <Box sx={{ px: 1.5, pb: 1.5, pt: 0.5 }}>
          <Stack spacing={1.5}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por nombre, dirección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={16} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={22} />
                </Box>
              ) : stations.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2, textAlign: 'center' }}
                >
                  No se encontraron estaciones
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {stations.map((s) => {
                    const isSelected = value?.id === s.id;
                    return (
                      <Box
                        key={s.id}
                        onClick={() => {
                          onChange(isSelected ? null : s);
                          if (!isSelected) setOpen(false);
                        }}
                        sx={(t) => ({
                          p: 1.25,
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          border: `1px solid ${isSelected ? t.vars.palette.primary.main : t.vars.palette.divider}`,
                          bgcolor: isSelected ? 'primary.lighter' : 'transparent',
                          '&:hover': {
                            bgcolor: isSelected ? 'primary.lighter' : 'action.hover',
                          },
                        })}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack spacing={0.15}>
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Iconify
                                icon="mdi:ev-station"
                                width={13}
                                sx={{ color: 'primary.main', flexShrink: 0 }}
                              />
                              <Typography variant="subtitle2">{s.name}</Typography>
                            </Stack>
                            {s.address && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ pl: 2.5 }}
                              >
                                {s.address}
                              </Typography>
                            )}
                          </Stack>
                          {isSelected && (
                            <Iconify
                              icon="eva:checkmark-circle-2-fill"
                              width={16}
                              sx={{ color: 'primary.main', flexShrink: 0 }}
                            />
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
