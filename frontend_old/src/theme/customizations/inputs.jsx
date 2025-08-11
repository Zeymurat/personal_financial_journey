import * as React from 'react';
import { alpha } from '@mui/material/styles';
import { outlinedInputClasses } from '@mui/material/OutlinedInput';
import { svgIconClasses } from '@mui/material/SvgIcon';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import { toggleButtonClasses } from '@mui/material/ToggleButton';
import CheckBoxOutlineBlankRoundedIcon from '@mui/icons-material/CheckBoxOutlineBlankRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { gray, brand } from '../themePrimitives';

/* eslint-disable import/prefer-default-export */
export const inputsCustomizations = {
  MuiButtonBase: {
    defaultProps: {
      disableTouchRipple: true,
      disableRipple: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        boxSizing: 'border-box',
        transition: 'all 100ms ease-in',
        '&:focus-visible': {
          outline: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          outlineOffset: '2px',
        },
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        boxShadow: 'none',
        borderRadius: (theme.vars || theme).shape.borderRadius,
        textTransform: 'none',
        ...(ownerState?.size === 'small' && {
          height: '2.25rem',
          padding: '8px 12px',
        }),
        ...(ownerState?.size === 'medium' && {
          height: '2.5rem',
          padding: '10px 16px',
        }),
        ...(ownerState?.size === 'large' && {
          height: '3rem',
          padding: '12px 24px',
        }),
        ...(ownerState?.variant === 'contained' && {
          color: theme.palette.common.white,
          backgroundColor: brand[500],
          '&:hover': {
            backgroundColor: brand[600],
            boxShadow: 'none',
          },
          '&:active': {
            backgroundColor: brand[700],
          },
          '&.Mui-disabled': {
            backgroundColor: gray[200],
            color: gray[500],
          },
        }),
        ...(ownerState?.variant === 'outlined' && {
          borderColor: (theme.vars || theme).palette.divider,
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.hover, 0.04),
            borderColor: (theme.vars || theme).palette.text.primary,
          },
          '&.Mui-disabled': {
            borderColor: (theme.vars || theme).palette.action.disabled,
            color: (theme.vars || theme).palette.action.disabled,
          },
        }),
        ...(ownerState?.variant === 'text' && {
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.hover, 0.04),
          },
          '&.Mui-disabled': {
            color: (theme.vars || theme).palette.action.disabled,
          },
        }),
      }),
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: (theme.vars || theme).shape.borderRadius,
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.04),
        },
        '&.Mui-disabled': {
          color: (theme.vars || theme).palette.action.disabled,
        },
      }),
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: 'transparent',
        borderRadius: (theme.vars || theme).shape.borderRadius,
        '& .MuiToggleButtonGroup-grouped': {
          margin: 0,
          border: 0,
          '&:not(:first-of-type)': {
            marginLeft: 1,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          },
          '&:not(:last-of-type)': {
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          },
        },
      }),
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        border: 'none',
        borderRadius: (theme.vars || theme).shape.borderRadius,
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.04),
        },
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
          },
        },
      }),
    },
  },
  MuiCheckbox: {
    defaultProps: {
      disableRipple: true,
      icon: <CheckBoxOutlineBlankRoundedIcon />,
      checkedIcon: <CheckRoundedIcon />,
      indeterminateIcon: <RemoveRoundedIcon />,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        padding: 8,
        '&:hover': {
          backgroundColor: 'transparent',
        },
        '&.Mui-checked, &.MuiCheckbox-indeterminate': {
          color: theme.palette.primary.main,
        },
        '&.Mui-disabled': {
          color: (theme.vars || theme).palette.action.disabled,
        },
      }),
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        'label + &': {
          marginTop: 8,
        },
      },
      input: {
        borderRadius: 8,
        position: 'relative',
        backgroundColor: (theme) => (theme.vars || theme).palette.background.paper,
        border: '1px solid',
        borderColor: (theme) => (theme.vars || theme).palette.divider,
        fontSize: 16,
        padding: '10px 12px',
        transition: (theme) =>
          theme.transitions.create(['border-color', 'background-color', 'box-shadow']),
        '&:focus': {
          borderColor: (theme) => theme.palette.primary.main,
          boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          border: 'none',
          boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
        },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.error.main,
        },
        [`&.Mui-disabled .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: (theme.vars || theme).palette.action.disabled,
        },
      }),
      notchedOutline: {
        border: 'none',
      },
    },
  },
  MuiFormLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: (theme.vars || theme).palette.text.primary,
        fontWeight: 500,
      }),
    },
  },
};
