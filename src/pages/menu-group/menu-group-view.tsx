import type { NavItemDataProps } from 'src/components/nav-section';

import { useParams, useNavigate } from 'react-router';
import { CaretRightIcon } from '@phosphor-icons/react';

import Box from '@mui/material/Box';
import { Stack } from '@mui/material';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { navData } from 'src/layouts/nav-config-dashboard';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const slugToPath: Record<string, string> = {
  sales: paths.menuGroups.ventas,
  analytics: paths.menuGroups.analiticas,
  management: paths.menuGroups.gestion,
  maintenance: paths.menuGroups.mantenimiento,
  eurocharger: paths.menuGroups.eurocharger,
};

// ----------------------------------------------------------------------

export function MenuGroupView() {
  const { group } = useParams<{ group: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const currentRole = user?.roles ?? [];

  const groupPath = group ? slugToPath[group] : undefined;
  const groupItem = groupPath
    ? (navData as NavItemDataProps[]).find((entry) => entry.path === groupPath)
    : undefined;

  if (!groupItem || !groupItem.children) {
    navigate(paths.dashboard.root, { replace: true });
    return null;
  }

  const visibleChildren = groupItem.children.filter(
    (child) => !child.roles || child.roles.some((r) => (currentRole as string[]).includes(r))
  );

  return (
    <DashboardContent>
      <Stack direction="column" alignItems="left" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {groupItem.title}
        </Typography>
        <Box sx={{ mt: 4 }}>
          <List
            disablePadding
            sx={{
              border: (t) => `1px solid ${t.vars.palette.divider}`,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            {visibleChildren.map((child, index) => (
              <ListItemButton
                key={child.title}
                onClick={() => navigate(child.path)}
                sx={{
                  py: 2,
                  px: 2.5,
                  borderBottom: (t) =>
                    index < visibleChildren.length - 1
                      ? `1px solid ${t.vars.palette.divider}`
                      : 'none',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemText
                  primary={child.title}
                  secondary={child.caption}
                  primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', mt: 0.25 }}
                  sx={{ mr: 4 }}
                />
                <CaretRightIcon
                  size={18}
                  style={{ color: 'inherit', opacity: 0.5, flexShrink: 0 }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Stack>
    </DashboardContent>
  );
}
