import { mergeClasses } from 'minimal-shared/utils';

import { useTheme } from '@mui/material/styles';

import { NavList } from './nav-list';
import { isNavGroup } from '../types';
import { Nav, NavUl, NavLi } from '../components';
import { navSectionClasses, navSectionCssVars } from '../styles';

import type { NavGroupProps, NavSectionProps } from '../types';

// ----------------------------------------------------------------------

export function NavSectionMini({
  sx,
  data,
  render,
  className,
  slotProps,
  currentRole,
  enabledRootRedirect,
  cssVars: overridesVars,
  ...other
}: NavSectionProps) {
  const theme = useTheme();

  const cssVars = { ...navSectionCssVars.mini(theme), ...overridesVars };

  return (
    <Nav
      className={mergeClasses([navSectionClasses.mini, className])}
      sx={[{ ...cssVars }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <NavUl sx={{ flex: '1 1 auto', gap: 'var(--nav-item-gap)' }}>
        {data.map((entry) =>
          isNavGroup(entry) ? (
            <Group
              key={entry.subheader ?? entry.items[0].title}
              render={render}
              cssVars={cssVars}
              items={entry.items}
              slotProps={slotProps}
              currentRole={currentRole}
              enabledRootRedirect={enabledRootRedirect}
            />
          ) : (
            <NavList
              key={entry.title}
              depth={1}
              data={entry}
              render={render}
              cssVars={cssVars}
              slotProps={slotProps}
              currentRole={currentRole}
              enabledRootRedirect={enabledRootRedirect}
            />
          )
        )}
      </NavUl>
    </Nav>
  );
}

// ----------------------------------------------------------------------

function Group({
  items,
  render,
  cssVars,
  slotProps,
  currentRole,
  enabledRootRedirect,
}: NavGroupProps) {
  return (
    <NavLi>
      <NavUl sx={{ gap: 'var(--nav-item-gap)' }}>
        {items.map((list) => (
          <NavList
            key={list.title}
            depth={1}
            data={list}
            render={render}
            cssVars={cssVars}
            slotProps={slotProps}
            currentRole={currentRole}
            enabledRootRedirect={enabledRootRedirect}
          />
        ))}
      </NavUl>
    </NavLi>
  );
}
