import type { AppUserDatatableItem } from 'src/types/appuser';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type AppUserSearchSelectProps = {
  value: AppUserDatatableItem | null;
  onChange: (user: AppUserDatatableItem | null) => void;
  label?: string;
};

export function AppUserSearchSelect({
  value,
  onChange,
  label = 'Usuario de la app (opcional)',
}: AppUserSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AppUserDatatableItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return () => {};

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetcher([
          endpoints.appUsers.list,
          { params: { page: 0, pageSize: 10, searchQuery: search } },
        ]);
        if (!cancelled) setUsers(res?.data ?? []);
      } catch {
        if (!cancelled) setUsers([]);
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
            icon="mdi:account-outline"
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
              placeholder="Buscar por nombre o email..."
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
              ) : users.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2, textAlign: 'center' }}
                >
                  No se encontraron usuarios
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {users.map((u) => {
                    const isSelected = value?.id === u.id;
                    const initials = u.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <Box
                        key={u.id}
                        onClick={() => {
                          onChange(isSelected ? null : u);
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
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar
                              sx={{
                                width: 26,
                                height: 26,
                                fontSize: '0.65rem',
                                bgcolor: 'primary.lighter',
                                color: 'primary.main',
                              }}
                            >
                              {initials}
                            </Avatar>
                            <Stack spacing={0}>
                              <Typography variant="subtitle2">{u.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {u.email}
                              </Typography>
                            </Stack>
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
