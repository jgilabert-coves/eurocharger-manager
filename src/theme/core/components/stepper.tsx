import type { Theme, Components } from '@mui/material/styles';

// ----------------------------------------------------------------------

const MuiStepConnector: Components<Theme>['MuiStepConnector'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { line: ({ theme }) => ({ borderColor: theme.vars.palette.divider }) },
};

const MuiStepLabel: Components<Theme>['MuiStepLabel'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      color: theme.vars.palette.text.secondary,
      '&.Mui-active': {
        color: theme.vars.palette.text.primary,
      },
      '&.Mui-completed': {
        color: theme.vars.palette.text.primary,
      },
    }),
    label: {
      color: 'inherit',
    },
    iconContainer: {
      color: 'inherit',
    },
  },
};

const MuiStepIcon: Components<Theme>['MuiStepIcon'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      color: theme.vars.palette.grey[300],
      '&.Mui-active, &.Mui-completed': {
        color: theme.vars.palette.primary.main,
      },
    }),
  },
};

// ----------------------------------------------------------------------

export const stepper = { MuiStepConnector, MuiStepLabel, MuiStepIcon };
