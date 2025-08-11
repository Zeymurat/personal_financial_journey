import { alpha } from '@mui/material/styles';
import { svgIconClasses } from '@mui/material/SvgIcon';
import { typographyClasses } from '@mui/material/Typography';
import { buttonBaseClasses } from '@mui/material/ButtonBase';
import { chipClasses } from '@mui/material/Chip';
import { iconButtonClasses } from '@mui/material/IconButton';
import { gray, red, green } from '../themePrimitives';

export const dataDisplayCustomizations = {
  MuiList: {
    styleOverrides: {
      root: {
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        [`& .${svgIconClasses.root}`]: {
          width: '1rem',
          height: '1rem',
          color: (theme.vars || theme).palette.text.secondary,
        },
        [`& .${typographyClasses.root}`]: {
          fontWeight: 500,
        },
        [`& .${buttonBaseClasses.root}`]: {
          display: 'flex',
          gap: 8,
          padding: '2px 8px',
          borderRadius: (theme.vars || theme).shape.borderRadius,
          opacity: 0.7,
          '&.Mui-selected': {
            opacity: 1,
            backgroundColor: alpha(theme.palette.action.selected, 0.3),
            [`& .${svgIconClasses.root}`]: {
              color: (theme.vars || theme).palette.text.primary,
            },
            '&:focus-visible': {
              backgroundColor: alpha(theme.palette.action.selected, 0.3),
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.selected, 0.5),
            },
          },
        },
      }),
    },
  },
  MuiListItemText: {
    styleOverrides: {
      primary: ({ theme }) => ({
        color: (theme.vars || theme).palette.text.primary,
        fontWeight: 500,
      }),
      secondary: ({ theme }) => ({
        color: (theme.vars || theme).palette.text.secondary,
        fontSize: '0.75rem',
      }),
    },
  },
  MuiListSubheader: {
    styleOverrides: {
      root: ({ theme }) => ({
        ...theme.typography.body2,
        color: (theme.vars || theme).palette.text.secondary,
        fontWeight: 600,
        padding: '12px 16px',
      }),
    },
  },
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: '32px',
        '& .MuiSvgIcon-root': {
          fontSize: '1.25rem',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        borderRadius: (theme.vars || theme).shape.borderRadius,
        ...(ownerState.color === 'default' && {
          backgroundColor: (theme.vars || theme).palette.action.selected,
          color: (theme.vars || theme).palette.text.primary,
          '&:hover': {
            backgroundColor: (theme.vars || theme).palette.action.hover,
          },
        }),
        ...(ownerState.color === 'primary' && {
          backgroundColor: (theme.vars || theme).palette.primary.light,
          color: (theme.vars || theme).palette.primary.contrastText,
          '&:hover': {
            backgroundColor: (theme.vars || theme).palette.primary.main,
          },
        }),
        ...(ownerState.color === 'secondary' && {
          backgroundColor: (theme.vars || theme).palette.secondary.light,
          color: (theme.vars || theme).palette.secondary.contrastText,
          '&:hover': {
            backgroundColor: (theme.vars || theme).palette.secondary.main,
          },
        }),
        ...(ownerState.color === 'error' && {
          backgroundColor: red[100],
          color: red[900],
          '&:hover': {
            backgroundColor: red[200],
          },
        }),
        ...(ownerState.color === 'warning' && {
          backgroundColor: (theme.vars || theme).palette.warning.light,
          color: (theme.vars || theme).palette.warning.contrastText,
          '&:hover': {
            backgroundColor: (theme.vars || theme).palette.warning.main,
          },
        }),
        ...(ownerState.color === 'info' && {
          backgroundColor: (theme.vars || theme).palette.info.light,
          color: (theme.vars || theme).palette.info.contrastText,
          '&:hover': {
            backgroundColor: (theme.vars || theme).palette.info.main,
          },
        }),
        ...(ownerState.color === 'success' && {
          backgroundColor: green[100],
          color: green[900],
          '&:hover': {
            backgroundColor: green[200],
          },
        }),
        ...(ownerState.size === 'small' && {
          height: '24px',
        }),
        ...(ownerState.size === 'medium' && {
          height: '32px',
        }),
        ...(ownerState.variant === 'outlined' && {
          backgroundColor: 'transparent',
          border: `1px solid`,
          ...(ownerState.color === 'default' && {
            borderColor: (theme.vars || theme).palette.divider,
            color: (theme.vars || theme).palette.text.primary,
            '&:hover': {
              backgroundColor: (theme.vars || theme).palette.action.hover,
            },
          }),
          ...(ownerState.color === 'primary' && {
            borderColor: (theme.vars || theme).palette.primary.main,
            color: (theme.vars || theme).palette.primary.main,
            '&:hover': {
              backgroundColor: alpha(
                (theme.vars || theme).palette.primary.main,
                0.04
              ),
            },
          }),
          ...(ownerState.color === 'secondary' && {
            borderColor: (theme.vars || theme).palette.secondary.main,
            color: (theme.vars || theme).palette.secondary.main,
            '&:hover': {
              backgroundColor: alpha(
                (theme.vars || theme).palette.secondary.main,
                0.04
              ),
            },
          }),
          ...(ownerState.color === 'error' && {
            borderColor: red[500],
            color: red[500],
            '&:hover': {
              backgroundColor: alpha(red[500], 0.04),
            },
          }),
          ...(ownerState.color === 'warning' && {
            borderColor: (theme.vars || theme).palette.warning.main,
            color: (theme.vars || theme).palette.warning.main,
            '&:hover': {
              backgroundColor: alpha(
                (theme.vars || theme).palette.warning.main,
                0.04
              ),
            },
          }),
          ...(ownerState.color === 'info' && {
            borderColor: (theme.vars || theme).palette.info.main,
            color: (theme.vars || theme).palette.info.main,
            '&:hover': {
              backgroundColor: alpha(
                (theme.vars || theme).palette.info.main,
                0.04
              ),
            },
          }),
          ...(ownerState.color === 'success' && {
            borderColor: green[500],
            color: green[500],
            '&:hover': {
              backgroundColor: alpha(green[500], 0.04),
            },
          }),
        }),
      }),
      label: {
        paddingLeft: '8px',
        paddingRight: '8px',
        fontSize: '0.75rem',
        fontWeight: 500,
      },
      icon: {
        marginLeft: '8px',
        marginRight: '-4px',
        '&.MuiChip-deleteIcon': {
          color: 'inherit',
          opacity: 0.75,
          '&:hover': {
            opacity: 1,
          },
        },
      },
      deleteIcon: {
        width: '18px',
        height: '18px',
        margin: '0 4px 0 -4px',
      },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      actions: {
        marginLeft: '16px',
        '& .MuiIconButton-root': {
          padding: '4px',
          '&:first-of-type': {
            marginRight: '8px',
          },
        },
      },
      select: {
        minWidth: '64px',
        padding: '4px 24px 4px 12px',
        textAlign: 'right',
        textAlignLast: 'right',
      },
      selectIcon: {
        right: '4px',
      },
      displayedRows: {
        margin: 0,
      },
    },
  },
};
