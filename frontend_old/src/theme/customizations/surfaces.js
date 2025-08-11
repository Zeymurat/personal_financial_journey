import { alpha } from '@mui/material/styles';
import { gray } from '../themePrimitives';

const surfacesCustomizations = {
  MuiAccordion: {
    defaultProps: {
      elevation: 0,
      disableGutters: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        padding: 4,
        overflow: 'clip',
        backgroundColor: (theme.vars || theme).palette.background.default,
        border: '1px solid',
        borderColor: (theme.vars || theme).palette.divider,
        ':before': {
          backgroundColor: 'transparent',
        },
        '&:not(:last-of-type)': {
          borderBottom: 'none',
        },
        '&:first-of-type': {
          borderTopLeftRadius: (theme.vars || theme).shape.borderRadius,
          borderTopRightRadius: (theme.vars || theme).shape.borderRadius,
        },
        '&:last-of-type': {
          borderBottomLeftRadius: (theme.vars || theme).shape.borderRadius,
          borderBottomRightRadius: (theme.vars || theme).shape.borderRadius,
        },
      }),
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: ({ theme }) => ({
        border: 'none',
        borderRadius: 8,
        '&:hover': { backgroundColor: gray[50] },
        '&:focus-visible': { backgroundColor: 'transparent' },
        ...theme.applyStyles('dark', {
          '&:hover': { backgroundColor: gray[800] },
        }),
      }),
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: { mb: 20, border: 'none' },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: (theme.vars || theme).shape.borderRadius,
        border: '1px solid',
        borderColor: (theme.vars || theme).palette.divider,
        backgroundImage: 'none',
        boxShadow: 'none',
        '&.MuiPaper-elevation': {
          boxShadow: (theme.vars || theme).shadows[1],
        },
        '&.MuiPaper-outlined': {
          borderColor: (theme.vars || theme).palette.divider,
        },
        '&.MuiPaper-elevation0': {
          boxShadow: 'none',
        },
        '&.MuiPaper-elevation1': {
          boxShadow: (theme.vars || theme).shadows[1],
        },
        '&.MuiPaper-elevation2': {
          boxShadow: (theme.vars || theme).shadows[2],
        },
        '&.MuiPaper-elevation3': {
          boxShadow: (theme.vars || theme).shadows[3],
        },
        '&.MuiPaper-elevation4': {
          boxShadow: (theme.vars || theme).shadows[4],
        },
        '&.MuiPaper-elevation5': {
          boxShadow: (theme.vars || theme).shadows[5],
        },
        '&.MuiPaper-elevation6': {
          boxShadow: (theme.vars || theme).shadows[6],
        },
        '&.MuiPaper-elevation7': {
          boxShadow: (theme.vars || theme).shadows[7],
        },
        '&.MuiPaper-elevation8': {
          boxShadow: (theme.vars || theme).shadows[8],
        },
        '&.MuiPaper-elevation9': {
          boxShadow: (theme.vars || theme).shadows[9],
        },
        '&.MuiPaper-elevation10': {
          boxShadow: (theme.vars || theme).shadows[10],
        },
        '&.MuiPaper-elevation11': {
          boxShadow: (theme.vars || theme).shadows[11],
        },
        '&.MuiPaper-elevation12': {
          boxShadow: (theme.vars || theme).shadows[12],
        },
        '&.MuiPaper-elevation13': {
          boxShadow: (theme.vars || theme).shadows[13],
        },
        '&.MuiPaper-elevation14': {
          boxShadow: (theme.vars || theme).shadows[14],
        },
        '&.MuiPaper-elevation15': {
          boxShadow: (theme.vars || theme).shadows[15],
        },
        '&.MuiPaper-elevation16': {
          boxShadow: (theme.vars || theme).shadows[16],
        },
        '&.MuiPaper-elevation17': {
          boxShadow: (theme.vars || theme).shadows[17],
        },
        '&.MuiPaper-elevation18': {
          boxShadow: (theme.vars || theme).shadows[18],
        },
        '&.MuiPaper-elevation19': {
          boxShadow: (theme.vars || theme).shadows[19],
        },
        '&.MuiPaper-elevation20': {
          boxShadow: (theme.vars || theme).shadows[20],
        },
        '&.MuiPaper-elevation21': {
          boxShadow: (theme.vars || theme).shadows[21],
        },
        '&.MuiPaper-elevation22': {
          boxShadow: (theme.vars || theme).shadows[22],
        },
        '&.MuiPaper-elevation23': {
          boxShadow: (theme.vars || theme).shadows[23],
        },
        '&.MuiPaper-elevation24': {
          boxShadow: (theme.vars || theme).shadows[24],
        },
      }),
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 24,
        '&:last-child': {
          paddingBottom: 24,
        },
      },
    },
  },
};

export { surfacesCustomizations };
