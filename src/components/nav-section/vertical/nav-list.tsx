import { useBoolean } from 'minimal-shared/hooks';
import { useRef, useState, useEffect, useCallback } from 'react';
import { isActiveLink, isExternalLink } from 'minimal-shared/utils';

import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { NavItem } from './nav-item';
import { navSectionClasses } from '../styles';
import { NavUl, NavLi, NavCollapse } from '../components';

import type { NavListProps, NavSubListProps } from '../types';

// ----------------------------------------------------------------------

export function NavList({
  data,
  depth,
  render,
  slotProps,
  currentRole,
  enabledRootRedirect,
}: NavListProps) {
  const pathname = usePathname();
  const navItemRef = useRef<HTMLButtonElement | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const isChildActive =
    data.children?.some((child) => isActiveLink(pathname, child.path, false)) ?? false;
  const isActive = isActiveLink(pathname, data.path, !!data.children) || isChildActive;

  const { value: open, onTrue: onOpen, onFalse: onClose, onToggle } = useBoolean(isActive);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      onOpen();
    } else {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleToggleMenu = useCallback(() => {
    if (data.children && enabledRootRedirect) {
      return;
    }
    if (data.children) {
      onToggle();
    }
  }, [data.children, enabledRootRedirect, onToggle]);

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (data.children) {
        clearTimeout(hoverTimeoutRef.current);
        setAnchorEl(event.currentTarget);
      }
    },
    [data.children]
  );

  const handleMouseLeave = useCallback(() => {
    if (data.children) {
      hoverTimeoutRef.current = setTimeout(() => setAnchorEl(null), 150);
    }
  }, [data.children]);

  const handlePopoverMouseEnter = useCallback(() => {
    clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handlePopoverMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => setAnchorEl(null), 150);
  }, []);

  const renderNavItem = () => (
    <NavItem
      ref={navItemRef}
      // slots
      path={data.path}
      icon={data.icon}
      info={data.info}
      title={data.title}
      caption={depth === 1 ? data.caption : undefined}
      // state
      open={open}
      active={isActive}
      disabled={data.disabled}
      // options
      depth={depth}
      render={render}
      hasChild={!!data.children && !enabledRootRedirect}
      externalLink={isExternalLink(data.path)}
      enabledRootRedirect={enabledRootRedirect}
      // styles
      slotProps={depth === 1 ? slotProps?.rootItem : slotProps?.subItem}
      // actions
      onClick={handleToggleMenu}
    />
  );

  // Show children inline only when this item is active (we're on its group page or a child page)
  const renderCollapse = () =>
    !!data.children &&
    depth === 1 &&
    open && (
      <NavCollapse mountOnEnter unmountOnExit depth={depth} in={open} data-group={data.title}>
        <NavSubList
          data={data.children}
          depth={depth}
          render={render}
          slotProps={slotProps}
          currentRole={currentRole}
          enabledRootRedirect={enabledRootRedirect}
        />
      </NavCollapse>
    );

  const renderHoverPopover = () => {
    if (!data.children || depth !== 1 || open) return null;

    const visibleChildren = data.children.filter(
      (child) =>
        !child.roles || !currentRole || child.roles.some((r) => currentRole.includes(r))
    );

    if (!visibleChildren.length) return null;

    return (
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={() => setAnchorEl(null)}
        disableRestoreFocus
        sx={{ pointerEvents: 'none' }}
        PaperProps={{
          onMouseEnter: handlePopoverMouseEnter,
          onMouseLeave: handlePopoverMouseLeave,
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
            onClick={() => setAnchorEl(null)}
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
    <NavLi
      disabled={data.disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        ...(!!data.children && {
          [`& .${navSectionClasses.li}`]: { '&:first-of-type': { mt: 'var(--nav-item-gap)' } },
        }),
      }}
    >
      {renderNavItem()}
      {renderCollapse()}
      {renderHoverPopover()}
    </NavLi>
  );
}

// ----------------------------------------------------------------------

function NavSubList({
  data,
  render,
  depth = 0,
  slotProps,
  currentRole,
  enabledRootRedirect,
}: NavSubListProps) {
  return (
    <NavUl sx={{ gap: 'var(--nav-item-gap)' }}>
      {data.map((list) => (
        <NavList
          key={list.title}
          data={list}
          render={render}
          depth={depth + 1}
          slotProps={slotProps}
          currentRole={currentRole}
          enabledRootRedirect={enabledRootRedirect}
        />
      ))}
    </NavUl>
  );
}
