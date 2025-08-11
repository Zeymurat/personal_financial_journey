import * as React from 'react';
import { alpha } from '@mui/material/styles';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import { buttonBaseClasses } from '@mui/material/ButtonBase';
import { dividerClasses } from '@mui/material/Divider';
import { menuItemClasses } from '@mui/material/MenuItem';
import { selectClasses } from '@mui/material/Select';
import { tabClasses } from '@mui/material/Tab';
import { gray, brand } from '../themePrimitives';

const navigationCustomizations = {
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: (theme.vars || theme).shape.borderRadius,
        padding: '6px 8px',
        [`&.${menuItemClasses.focusVisible}`]: {
          backgroundColor: 'transparent',
        },
        [`&.${menuItemClasses.selected}`]: {
          [`&.${menuItemClasses.focusVisible}`]: {
            backgroundColor: alpha(theme.palette.action.selected, 0.3),
          },
        },
      }),
    },
  },
  MuiMenu: {
    styleOverrides: {
      list: {
        gap: '0px',
        [`&.${dividerClasses.root}`]: {
          margin: '0 -8px',
        },
      },
      paper: ({ theme }) => ({
        marginTop: '4px',
        borderRadius: (theme.vars || theme).shape.borderRadius,
        border: `1px solid ${(theme.vars || theme).palette.divider}`,
        backgroundImage: 'none',
        background: 'hsl(0, 0%, 100%)',
        boxShadow:
          'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px',
        [`& .${buttonBaseClasses.root}`]: {
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.action.selected, 0.3),
          },
        },
      }),
    },
  },
  MuiSelect: {
    defaultProps: {
      IconComponent: React.forwardRef((props, ref) => (
        <UnfoldMoreRoundedIcon {...props} ref={ref} />
      )),
    },
    styleOverrides: {
      root: ({ theme }) => ({
        '--_Icon-fill-color': (theme.vars || theme).palette.text.secondary,
        '--_Icon-hover-color': (theme.vars || theme).palette.text.primary,
        '&:hover': {
          '--_Icon-fill-color': (theme.vars || theme).palette.text.primary,
        },
        [`&.${selectClasses.disabled}`]: {
          '--_Icon-fill-color': (theme.vars || theme).palette.action.disabled,
        },
      }),
      select: ({ theme }) => ({
        '&:focus': {
          backgroundColor: 'transparent',
        },
        '&.MuiOutlinedInput-input': {
          backgroundColor: 'transparent',
        },
      }),
    },
  },
  MuiLink: {
    defaultProps: {
      underline: 'none',
    },
    styleOverrides: {
      root: ({ theme }) => ({
        color: (theme.vars || theme).palette.primary.main,
        fontWeight: 500,
        position: 'relative',
        '&:hover': {
          color: (theme.vars || theme).palette.primary.dark,
        },
        '&:focus-visible': {
          outline: 'none',
          borderRadius: (theme.vars || theme).shape.borderRadius,
          outlineOffset: '2px',
          boxShadow: `0 0 0 2px ${(theme.vars || theme).palette.primary.light}`,
        },
      }),
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        border: 'none',
      }),
    },
  },
  MuiPaginationItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: '50%',
        '&.Mui-selected': {
          color: (theme.vars || theme).palette.primary.contrastText,
          backgroundColor: (theme.vars || theme).palette.primary.main,
          '&:hover': {
            backgroundColor: (theme.vars || theme).palette.primary.dark,
          },
        },
      }),
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: { minHeight: 'fit-content' },
      indicator: ({ theme }) => ({
        height: '3px',
        borderRadius: '3px 3px 0 0',
        backgroundColor: (theme.vars || theme).palette.primary.main,
      }),
    },
  },
  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: '12px 16px',
        minHeight: '48px',
        color: (theme.vars || theme).palette.text.secondary,
        '&:hover': {
          color: (theme.vars || theme).palette.text.primary,
        },
        '&.Mui-selected': {
          color: (theme.vars || theme).palette.primary.main,
        },
        '&.Mui-focusVisible': {
          outline: 'none',
          boxShadow: `0 0 0 2px ${(theme.vars || theme).palette.primary.light}`,
          borderRadius: (theme.vars || theme).shape.borderRadius,
        },
        [`&.${tabClasses.selected}`]: {
          color: (theme.vars || theme).palette.primary.main,
        },
        '&.Mui-disabled': {
          color: (theme.vars || theme).palette.action.disabled,
        },
      }),
    },
  },
  MuiStepConnector: {
    styleOverrides: {
      line: ({ theme }) => ({
        borderColor: (theme.vars || theme).palette.divider,
      }),
    },
  },
  MuiStepIcon: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        '&.Mui-completed': {
          color: (theme.vars || theme).palette.primary.main,
        },
        '&.Mui-active': {
          color: (theme.vars || theme).palette.primary.main,
        },
        '&.Mui-error': {
          color: (theme.vars || theme).palette.error.main,
        },
        '& .MuiStepIcon-text': {
          fill: (theme.vars || theme).palette.primary.contrastText,
        },
        '&.Mui-completed .MuiStepIcon-text': {
          fill: (theme.vars || theme).palette.primary.contrastText,
        },
        '&.Mui-active .MuiStepIcon-text': {
          fill: (theme.vars || theme).palette.primary.contrastText,
        },
        '&.Mui-error .MuiStepIcon-text': {
          fill: (theme.vars || theme).palette.error.contrastText,
        },
      }),
    },
  },
  MuiStepLabel: {
    styleOverrides: {
      label: ({ theme }) => ({
        color: (theme.vars || theme).palette.text.primary,
        fontWeight: 500,
      }),
    },
  },
};

export { navigationCustomizations };
