import { useBoolean } from 'minimal-shared/hooks';
import { mergeClasses } from 'minimal-shared/utils';

import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';

import { NavList } from './nav-list';
import { isNavGroup } from '../types';
import { Nav, NavUl, NavLi, NavSubheader } from '../components';
import { navSectionClasses, navSectionCssVars } from '../styles';

import type { NavGroupProps, NavSectionProps } from '../types';

// ----------------------------------------------------------------------

export function NavSectionVertical({
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

  const cssVars = { ...navSectionCssVars.vertical(theme), ...overridesVars };

  return (
    <Nav
      className={mergeClasses([navSectionClasses.vertical, className])}
      sx={[{ ...cssVars }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <NavUl sx={{ flex: '1 1 auto', gap: 'var(--nav-item-gap)' }}>
        {data.map((entry) =>
          isNavGroup(entry) ? (
            // Grupo con subheader e items
            <Group
              key={entry.subheader ?? entry.items[0].title}
              subheader={entry.subheader}
              items={entry.items}
              render={render}
              slotProps={slotProps}
              currentRole={currentRole}
              enabledRootRedirect={enabledRootRedirect}
            />
          ) : (
            // Item directo (enlace suelto sin subheader ni grupo)
            <NavList
              key={entry.title}
              data={entry}
              depth={1}
              render={render}
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
  subheader,
  slotProps,
  currentRole,
  enabledRootRedirect,
}: NavGroupProps) {
  const groupOpen = useBoolean(true);

  const renderContent = () => (
    <NavUl sx={{ gap: 'var(--nav-item-gap)' }}>
      {items.map((list) => (
        <NavList
          key={list.title}
          data={list}
          render={render}
          depth={1}
          slotProps={slotProps}
          currentRole={currentRole}
          enabledRootRedirect={enabledRootRedirect}
        />
      ))}
    </NavUl>
  );

  return (
    <NavLi>
      {subheader ? (
        <>
          <NavSubheader
            data-title={subheader}
            open={groupOpen.value}
            onClick={groupOpen.onToggle}
            sx={slotProps?.subheader}
          >
            {subheader}
          </NavSubheader>

          <Collapse in={groupOpen.value}>{renderContent()}</Collapse>
        </>
      ) : (
        renderContent()
      )}
    </NavLi>
  );
}
