import { useEffect, useCallback } from 'react';
import { usePopoverHover } from 'minimal-shared/hooks';
import { isActiveLink, isExternalLink } from 'minimal-shared/utils';

import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { NavItem } from './nav-item';
import { NavUl, NavLi } from '../components';

import type { NavListProps, NavSubListProps } from '../types';

// ----------------------------------------------------------------------

export function NavList({
  data,
  depth,
  render,
  cssVars,
  slotProps,
  currentRole,
  enabledRootRedirect,
}: NavListProps) {
  const theme = useTheme();
  const pathname = usePathname();

  const isActive = isActiveLink(pathname, data.path, !!data.children);

  const {
    open,
    onOpen,
    onClose,
    anchorEl,
    elementRef: navItemRef,
  } = usePopoverHover<HTMLButtonElement>();

  const isRtl = theme.direction === 'rtl';

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleOpenMenu = useCallback(() => {
    if (data.children) {
      onOpen();
    }
  }, [data.children, onOpen]);

  const renderNavItem = () => (
    <NavItem
      ref={navItemRef}
      // slots
      path={data.path}
      icon={data.icon}
      info={data.info}
      title={data.title}
      caption={data.caption}
      // state
      active={isActive}
      open={open}
      disabled={data.disabled}
      // options
      depth={depth}
      render={render}
      hasChild={!!data.children}
      externalLink={isExternalLink(data.path)}
      enabledRootRedirect={enabledRootRedirect}
      // styles
      slotProps={depth === 1 ? slotProps?.rootItem : slotProps?.subItem}
      // actions
      onMouseEnter={handleOpenMenu}
      onMouseLeave={onClose}
    />
  );

  const renderDropdown = () => {
    if (!data.children) return null;

    const visibleChildren = data.children.filter(
      (child) => !child.roles || !currentRole || child.roles.some((r) => currentRole.includes(r))
    );

    if (!visibleChildren.length) return null;

    return (
      <Popover
        disableScrollLock
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'center', horizontal: isRtl ? 'left' : 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: isRtl ? 'right' : 'left' }}
        disableRestoreFocus
        sx={{ pointerEvents: 'none' }}
        PaperProps={{
          onMouseEnter: handleOpenMenu,
          onMouseLeave: onClose,
          sx: {
            pointerEvents: 'auto',
            bgcolor: '#303437',
            color: 'common.white',
            borderRadius: 1,
            p: 0.5,
            minWidth: 200,
            ml: 0.75,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          },
        }}
      >
        {visibleChildren.map((child) => (
          <MenuItem
            key={child.title}
            component={RouterLink}
            href={child.path}
            onClick={onClose}
            sx={{
              color: 'common.white',
              borderRadius: 0.75,
              typography: 'body2',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            {child.title}
          </MenuItem>
        ))}
      </Popover>
    );
  };

  // Hidden item by role
  if (data.roles && currentRole && !data.roles.some((r) => currentRole.includes(r))) {
    return null;
  }

  // Hide parent if none of its children are visible for the current role
  if (data.children?.length) {
    const hasVisibleChildren = data.children.some(
      (child) => !child.roles || !currentRole || child.roles.some((r) => currentRole.includes(r))
    );
    if (!hasVisibleChildren) return null;
  }

  return (
    <NavLi disabled={data.disabled}>
      {renderNavItem()}
      {open && renderDropdown()}
    </NavLi>
  );
}

// ----------------------------------------------------------------------

function NavSubList({
  data,
  render,
  cssVars,
  depth = 0,
  slotProps,
  currentRole,
  enabledRootRedirect,
}: NavSubListProps) {
  return (
    <NavUl sx={{ gap: 0.5 }}>
      {data.map((list) => (
        <NavList
          key={list.title}
          data={list}
          render={render}
          depth={depth + 1}
          cssVars={cssVars}
          slotProps={slotProps}
          currentRole={currentRole}
          enabledRootRedirect={enabledRootRedirect}
        />
      ))}
    </NavUl>
  );
}
