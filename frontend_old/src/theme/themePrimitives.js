import { createTheme, alpha } from '@mui/material/styles';

const defaultTheme = createTheme();

const customShadows = [...defaultTheme.shadows];

export const brand = {
  50: 'hsl(210, 100%, 95%)',
  100: 'hsl(210, 100%, 92%)',
  200: 'hsl(210, 100%, 80%)',
  300: 'hsl(210, 100%, 65%)',
  400: 'hsl(210, 98%, 48%)',
  500: 'hsl(210, 98%, 42%)',
  600: 'hsl(210, 98%, 55%)',
  700: 'hsl(210, 100%, 35%)',
  800: 'hsl(210, 100%, 16%)',
  900: 'hsl(210, 100%, 21%)',
};

export const gray = {
  50: 'hsl(220, 35%, 97%)',
  100: 'hsl(220, 30%, 94%)',
  200: 'hsl(220, 20%, 88%)',
  300: 'hsl(220, 20%, 80%)',
  400: 'hsl(220, 15%, 65%)',
  500: 'hsl(220, 15%, 50%)',
  600: 'hsl(220, 15%, 40%)',
  700: 'hsl(220, 15%, 30%)',
  800: 'hsl(220, 15%, 20%)',
  900: 'hsl(220, 15%, 10%)',
};

export const green = {
  50: 'hsl(120, 60%, 95%)',
  100: 'hsl(120, 60%, 90%)',
  200: 'hsl(120, 60%, 80%)',
  300: 'hsl(120, 60%, 70%)',
  400: 'hsl(120, 60%, 60%)',
  500: 'hsl(120, 60%, 50%)',
  600: 'hsl(120, 60%, 40%)',
  700: 'hsl(120, 60%, 30%)',
  800: 'hsl(120, 60%, 20%)',
  900: 'hsl(120, 60%, 10%)',
};

export const red = {
  50: 'hsl(0, 85%, 97%)',
  100: 'hsl(0, 85%, 90%)',
  200: 'hsl(0, 85%, 80%)',
  300: 'hsl(0, 85%, 70%)',
  400: 'hsl(0, 85%, 60%)',
  500: 'hsl(0, 85%, 50%)',
  600: 'hsl(0, 85%, 40%)',
  700: 'hsl(0, 85%, 30%)',
  800: 'hsl(0, 85%, 20%)',
  900: 'hsl(0, 85%, 10%)',
};

export const yellow = {
  50: 'hsl(50, 100%, 95%)',
  100: 'hsl(50, 100%, 90%)',
  200: 'hsl(50, 100%, 80%)',
  300: 'hsl(50, 100%, 70%)',
  400: 'hsl(50, 100%, 60%)',
  500: 'hsl(50, 100%, 50%)',
  600: 'hsl(50, 100%, 40%)',
  700: 'hsl(50, 100%, 30%)',
  800: 'hsl(50, 100%, 20%)',
  900: 'hsl(50, 100%, 10%)',
};

export const blue = {
  50: 'hsl(210, 100%, 95%)',
  100: 'hsl(210, 100%, 90%)',
  200: 'hsl(210, 100%, 80%)',
  300: 'hsl(210, 100%, 70%)',
  400: 'hsl(210, 100%, 60%)',
  500: 'hsl(210, 100%, 50%)',
  600: 'hsl(210, 100%, 40%)',
  700: 'hsl(210, 100%, 30%)',
  800: 'hsl(210, 100%, 20%)',
  900: 'hsl(210, 100%, 10%)',
};

export const orange = {
  50: 'hsl(45, 100%, 97%)',
  100: 'hsl(45, 92%, 90%)',
  200: 'hsl(45, 94%, 80%)',
  300: 'hsl(45, 90%, 65%)',
  400: 'hsl(45, 90%, 40%)',
  500: 'hsl(45, 90%, 35%)',
  600: 'hsl(45, 91%, 25%)',
  700: 'hsl(45, 94%, 20%)',
  800: 'hsl(45, 95%, 16%)',
  900: 'hsl(45, 93%, 12%)',
};

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette
          primary: {
            light: brand[200],
            main: brand[500],
            dark: brand[800],
            contrastText: '#fff',
          },
          secondary: {
            light: gray[200],
            main: gray[500],
            dark: gray[800],
            contrastText: '#fff',
          },
          error: {
            light: red[200],
            main: red[500],
            dark: red[800],
            contrastText: '#fff',
          },
          warning: {
            light: yellow[200],
            main: yellow[500],
            dark: yellow[800],
            contrastText: '#fff',
          },
          info: {
            light: blue[200],
            main: blue[500],
            dark: blue[800],
            contrastText: '#fff',
          },
          success: {
            light: green[200],
            main: green[500],
            dark: green[800],
            contrastText: '#fff',
          },
          text: {
            primary: gray[900],
            secondary: gray[600],
            disabled: gray[400],
          },
          divider: alpha(gray[900], 0.1),
          background: {
            default: '#fff',
            paper: '#fff',
          },
          action: {
            active: gray[900],
            hover: alpha(gray[900], 0.04),
            selected: alpha(gray[900], 0.08),
            disabled: alpha(gray[900], 0.26),
            disabledBackground: alpha(gray[900], 0.12),
            focus: alpha(gray[900], 0.12),
            hoverOpacity: 0.04,
            disabledOpacity: 0.38,
          },
        }
      : {
          // Dark mode palette
          primary: {
            light: brand[200],
            main: brand[400],
            dark: brand[600],
            contrastText: '#fff',
          },
          secondary: {
            light: gray[200],
            main: gray[400],
            dark: gray[600],
            contrastText: '#fff',
          },
          error: {
            light: red[200],
            main: red[500],
            dark: red[800],
            contrastText: '#fff',
          },
          warning: {
            light: yellow[200],
            main: yellow[500],
            dark: yellow[800],
            contrastText: '#fff',
          },
          info: {
            light: blue[200],
            main: blue[500],
            dark: blue[800],
            contrastText: '#fff',
          },
          success: {
            light: green[200],
            main: green[500],
            dark: green[800],
            contrastText: '#fff',
          },
          text: {
            primary: '#fff',
            secondary: alpha('#fff', 0.7),
            disabled: alpha('#fff', 0.5),
          },
          divider: alpha('#fff', 0.12),
          background: {
            default: gray[900],
            paper: gray[800],
          },
          action: {
            active: '#fff',
            hover: alpha('#fff', 0.08),
            selected: alpha('#fff', 0.16),
            disabled: alpha('#fff', 0.3),
            disabledBackground: alpha('#fff', 0.12),
            focus: alpha('#fff', 0.12),
            hoverOpacity: 0.08,
            disabledOpacity: 0.38,
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: customShadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? '#fff' : theme.palette.background.default,
          color: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#fff',
        },
        '#root': {
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
      },
    },
  },
});

export const colorSchemes = {
  light: {
    palette: {
      primary: {
        main: brand[500],
        light: brand[300],
        dark: brand[700],
        contrastText: '#fff',
      },
      secondary: {
        main: gray[500],
        light: gray[300],
        dark: gray[700],
        contrastText: '#fff',
      },
      error: {
        main: red[500],
        light: red[300],
        dark: red[700],
        contrastText: '#fff',
      },
      warning: {
        main: yellow[500],
        light: yellow[300],
        dark: yellow[700],
        contrastText: '#fff',
      },
      info: {
        main: blue[500],
        light: blue[300],
        dark: blue[700],
        contrastText: '#fff',
      },
      success: {
        main: green[500],
        light: green[300],
        dark: green[700],
        contrastText: '#fff',
      },
      text: {
        primary: gray[900],
        secondary: gray[600],
        disabled: gray[400],
      },
      divider: alpha(gray[900], 0.1),
      background: {
        default: '#fff',
        paper: '#fff',
      },
    },
  },
  dark: {
    palette: {
      primary: {
        main: brand[400],
        light: brand[300],
        dark: brand[600],
        contrastText: '#fff',
      },
      secondary: {
        main: gray[400],
        light: gray[300],
        dark: gray[600],
        contrastText: '#fff',
      },
      error: {
        main: red[400],
        light: red[300],
        dark: red[600],
        contrastText: '#fff',
      },
      warning: {
        main: yellow[400],
        light: yellow[300],
        dark: yellow[600],
        contrastText: '#fff',
      },
      info: {
        main: blue[400],
        light: blue[300],
        dark: blue[600],
        contrastText: '#fff',
      },
      success: {
        main: green[400],
        light: green[300],
        dark: green[600],
        contrastText: '#fff',
      },
      text: {
        primary: '#fff',
        secondary: alpha('#fff', 0.7),
        disabled: alpha('#fff', 0.5),
      },
      divider: alpha('#fff', 0.12),
      background: {
        default: gray[900],
        paper: gray[800],
      },
    },
  },
};

export const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  button: {
    textTransform: 'none',
    fontWeight: 500,
  },
};

export const shape = {
  borderRadius: 8,
};

export const shadows = customShadows;
