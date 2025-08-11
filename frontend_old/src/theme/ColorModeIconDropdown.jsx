import * as React from 'react';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useColorScheme } from '@mui/material/styles';

export default function ColorModeIconDropdown(props) {
  const { mode, systemMode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleMode = (targetMode) => {
    return () => {
      setMode(targetMode);
      handleClose();
    };
  };

  if (!mode) {
    return (
      <Box
        data-screenshot="toggle-mode"
        sx={(theme) => ({
          verticalAlign: 'bottom',
          display: 'inline-flex',
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: (theme.vars || theme).shape.borderRadius,
          border: '1px solid',
          borderColor: (theme.vars || theme).palette.divider,
        })}
      />
    );
  }

  const resolvedMode = (systemMode || mode);
  const icon = {
    light: <LightModeIcon />,
    dark: <DarkModeIcon />,
  }[resolvedMode];

  return (
    <React.Fragment>
      <IconButton
        data-screenshot="toggle-mode"
        onClick={handleClick}
        disableRipple
        {...props}
        sx={{
          '&:hover': { bgcolor: 'transparent' },
          ...(open && { bgcolor: 'action.hover' }),
          ...props.sx,
        }}
      >
        {icon}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          root: {
            sx: { '& .MuiMenu-paper': { width: 200 } },
          },
        }}
      >
        <MenuItem
          selected={mode === 'light' && !systemMode}
          onClick={handleMode('light')}
        >
          <Box component="span" sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            <LightModeIcon fontSize="small" />
          </Box>
          Açık Tema
        </MenuItem>
        <MenuItem
          selected={mode === 'dark' && !systemMode}
          onClick={handleMode('dark')}
        >
          <Box component="span" sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            <DarkModeIcon fontSize="small" />
          </Box>
          Koyu Tema
        </MenuItem>
        <MenuItem
          selected={!!systemMode}
          onClick={handleMode('system')}
        >
          <Box component="span" sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: 'currentColor',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  borderRadius: '50%',
                  transform: 'translate(2px, 2px)',
                },
              }}
            />
          </Box>
          Sistem Ayarlarını Kullan
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
}
