import * as React from 'react';
import { useColorScheme } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

/**
 * @param {import('@mui/material').SelectProps} props - MUI Select props
 */
export default function ColorModeSelect(props) {
  const { mode, setMode } = useColorScheme();
  
  if (!mode) {
    return null;
  }
  
  const StyledSelect = styled(Select)(({ theme }) => ({
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 32px 8px 16px',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: 'transparent',
      '&:focus': {
        backgroundColor: 'transparent',
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      border: 'none',
      boxShadow: `0 0 0 2px ${theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light}`,
    },
  }));

  const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
    '&.Mui-selected': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.04)',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.12)' 
          : 'rgba(0, 0, 0, 0.06)',
      },
    },
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.04)',
    },
  }));

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        borderRadius: 1,
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <StyledSelect
        value={mode}
        onChange={(event) => setMode(event.target.value)}
        SelectDisplayProps={{
          'data-screenshot': 'toggle-mode',
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 1,
              minWidth: 120,
              bgcolor: 'background.paper',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 4px 20px 0 rgba(0, 0, 0, 0.5)'
                  : '0 4px 20px 0 rgba(0, 0, 0, 0.12)',
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
                typography: 'body2',
                '&:first-of-type': {
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                },
                '&:last-of-type': {
                  borderBottomLeftRadius: 4,
                  borderBottomRightRadius: 4,
                },
              },
            },
          },
        }}
        {...props}
      >
        <StyledMenuItem value="light">
          <Box component="span" sx={{ ml: 1 }}>Açık</Box>
        </StyledMenuItem>
        <StyledMenuItem value="dark">
          <Box component="span" sx={{ ml: 1 }}>Koyu</Box>
        </StyledMenuItem>
      </StyledSelect>
    </Box>
  );
}
