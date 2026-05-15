import type { Role } from 'src/auth/types';
import type { IconButtonProps } from '@mui/material/IconButton';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { AnimateBorder } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';
import { switchProfile } from 'src/auth/context/jwt/action';

import { UpgradeBlock } from './nav-upgrade';
import { AccountButton } from './account-button';
import { SignOutButton } from './sign-out-button';

// ----------------------------------------------------------------------

export type AccountDrawerProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
    roles?: Role[];
  }[];
};

const ROLE_LABEL: Record<string, string> = {
  saas_owner: 'Propietario',
  saas_admin: 'Admin',
  saas_guest: 'Invitado',
  eurocharger: 'Eurocharger',
};

const ROLE_COLOR: Record<string, 'success' | 'warning' | 'default' | 'primary'> = {
  saas_owner: 'success',
  saas_admin: 'warning',
  saas_guest: 'default',
  eurocharger: 'primary',
};

// ----------------------------------------------------------------------

export function AccountDrawer({ data = [], sx, ...other }: AccountDrawerProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const { user, checkUserSession } = useAuthContext();

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const [switchError, setSwitchError] = React.useState<string | null>(null);
  const [switchingId, setSwitchingId] = React.useState<string | null>(null);

  const visibleItems = data.filter(
    (item) => !item.roles || item.roles.some((r) => user?.roles?.includes(r))
  );

  const { data: profilesData } = useQuery<{ data: Profile[] }>({
    queryKey: ['auth-profiles'],
    queryFn: () => fetcher(endpoints.auth.profiles),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const profiles: Profile[] = profilesData?.data ?? [];
  const hasMultipleProfiles = profiles.length > 1;

  const handleSwitchProfile = async (profile: Profile) => {
    if (profile.is_current) return;
    setSwitchingId(profile.membership_id);
    setSwitchError(null);
    try {
      await switchProfile(profile.membership_id);
      await checkUserSession?.();
      queryClient.invalidateQueries();
      onClose();
    } catch (err: any) {
      setSwitchError(err?.error ?? err?.message ?? 'Error al cambiar de perfil.');
    } finally {
      setSwitchingId(null);
    }
  };

  const renderAvatar = () => (
    <AnimateBorder
      sx={{ mb: 2, p: '6px', width: 96, height: 96, borderRadius: '50%' }}
      slotProps={{
        primaryBorder: { size: 120, sx: { color: 'primary.main' } },
      }}
    >
      <Avatar src={user?.photoURL} alt={user?.displayName} sx={{ width: 1, height: 1 }}>
        {user?.displayName?.charAt(0).toUpperCase()}
      </Avatar>
    </AnimateBorder>
  );

  const renderProfileSwitcher = () => {
    if (!hasMultipleProfiles) return null;

    return (
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Perfiles
        </Typography>
        {switchError && (
          <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }} onClose={() => setSwitchError(null)}>
            {switchError}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {profiles.map((profile) => (
            <Box
              key={profile.membership_id}
              onClick={() => handleSwitchProfile(profile)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: profile.is_current ? 'primary.main' : 'divider',
                bgcolor: profile.is_current ? 'primary.lighter' : 'transparent',
                cursor: profile.is_current ? 'default' : 'pointer',
                transition: 'all 0.15s',
                '&:hover': profile.is_current
                  ? {}
                  : { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={profile.is_current ? 600 : 400} noWrap>
                  {profile.account_name}
                </Typography>
                <Chip
                  size="small"
                  label={ROLE_LABEL[profile.role] ?? profile.role}
                  color={ROLE_COLOR[profile.role] ?? 'default'}
                  sx={{ height: 18, fontSize: 10, mt: 0.25 }}
                />
              </Box>
              {switchingId === profile.membership_id ? (
                <CircularProgress size={16} />
              ) : profile.is_current ? (
                <Iconify icon="eva:checkmark-circle-2-fill" width={18} sx={{ color: 'primary.main', flexShrink: 0 }} />
              ) : (
                <Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ color: 'text.disabled', flexShrink: 0 }} />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderList = () => (
    <MenuList
      disablePadding
      sx={[
        (theme) => ({
          py: 3,
          px: 2.5,
          borderTop: `dashed 1px ${theme.vars.palette.divider}`,
          borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
          '& li': { p: 0 },
        }),
      ]}
    >
      {visibleItems.map((option) => {
        const rootLabel = pathname.includes('/dashboard') ? 'Home' : 'Dashboard';
        const rootHref = pathname.includes('/dashboard') ? '/' : paths.dashboard.root;

        return (
          <MenuItem key={option.label}>
            <Link
              component={RouterLink}
              href={option.label === 'Home' ? rootHref : option.href}
              color="inherit"
              underline="none"
              onClick={onClose}
              sx={{
                p: 1,
                width: 1,
                display: 'flex',
                typography: 'body2',
                alignItems: 'center',
                color: 'text.secondary',
                '& svg': { width: 24, height: 24 },
                '&:hover': { color: 'text.primary' },
              }}
            >
              {option.icon}

              <Box component="span" sx={{ ml: 2 }}>
                {option.label === 'Home' ? rootLabel : option.label}
              </Box>

              {option.info && (
                <Label color="error" sx={{ ml: 1 }}>
                  {option.info}
                </Label>
              )}
            </Link>
          </MenuItem>
        );
      })}
    </MenuList>
  );

  return (
    <>
      <AccountButton
        onClick={onOpen}
        photoURL={user?.photoURL}
        displayName={user?.displayName}
        sx={sx}
        {...other}
      />

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 320 } }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            top: 12,
            left: 12,
            zIndex: 9,
            position: 'absolute',
          }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Scrollbar>
          <Box
            sx={{
              pt: 8,
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              mb: 3,
            }}
          >
            {renderAvatar()}

            <Typography variant="subtitle1" noWrap sx={{ mt: 2 }}>
              {user?.email}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }} noWrap>
              {user?.account_name ?? 'Eurocharger'}
            </Typography>
          </Box>

          {hasMultipleProfiles && (
            <>
              {renderProfileSwitcher()}
              <Divider sx={{ mx: 2.5 }} />
            </>
          )}

          {visibleItems.length > 0 && renderList()}
        </Scrollbar>

        <Box sx={{ p: 2.5 }}>
          <SignOutButton onClose={onClose} />
        </Box>
      </Drawer>
    </>
  );
}

// React import needed for useState
import React from 'react';
