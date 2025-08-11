import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import AppTheme from '../theme/AppTheme';
import ColorModeSelect from '../theme/ColorModeSelect';
import SignInCard from '../components/SignInCard';
import Content from '../components/Content';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTheme } from '@mui/material/styles';

export default function SignInSide(props) {
  const theme = useTheme();
  
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box 
        component="header"
        sx={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: theme.zIndex.appBar,
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)',
          borderRadius: '12px',
          padding: '6px 12px',
          backdropFilter: 'blur(12px)',
          boxShadow: theme.shadows[2],
          border: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.9)' 
              : 'rgba(255, 255, 255, 0.95)',
            boxShadow: theme.shadows[4],
            borderColor: theme.palette.divider,
          },
        }}
      >
        <LanguageSwitcher />
        <Box 
          sx={{
            width: '1px',
            height: '24px',
            backgroundColor: theme.palette.divider,
            mx: 0.5,
          }}
        />
        <ColorModeSelect />
      </Box>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
            ...(props.theme?.palette?.mode === 'dark' && {
              backgroundImage: 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))'
            })
          }
        }}
      >
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: { xs: 2, sm: 4 },
            px: 2,
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
            overflow: 'hidden'
          }}
        >
          <Stack
            direction={{ xs: 'column-reverse', md: 'row' }}
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 4, sm: 8, md: 12 },
              maxWidth: '1400px',
              width: '100%',
              mx: 'auto',
              px: { xs: 1, sm: 2 },
              overflow: 'hidden'
            }}
        >
          <Content />
          <SignInCard />
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
