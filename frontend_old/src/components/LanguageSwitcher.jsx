import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, styled } from '@mui/material/styles';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';

// Styled component for the menu paper
const StyledMenuPaper = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  minWidth: 120,
  color: '#ffffff',
  background: '#1E1E1E',
  borderRadius: '8px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  padding: '8px 0',
  '& .MuiMenuItem-root': {
    padding: '8px 16px',
    fontSize: '14px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  '& .Mui-selected': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
  },
}));

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const [language, setLanguage] = React.useState(i18n.language);
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);

  const handleChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleMenuItemClick = (language) => {
    setLanguage(language);
    i18n.changeLanguage(language);
    setOpen(false);
  };

  // Kullanıcı dostu dil isimleri
  const languageNames = {
    tr: 'Türkçe',
    en: 'English',
    ru: 'Русский'
  };

  // Mevcut dilin kodu (tr, en, ru)
  const currentLanguage = language in languageNames ? language : 'en';

  return (
    <Box sx={{ 
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
    }}>
      <Tooltip title={languageNames[currentLanguage]}>
        <IconButton
          ref={anchorRef}
          onClick={handleToggle}
          size="small"
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          aria-label="Dil seçiniz"
          sx={{
            color: '#ffffff',
            backgroundColor: '#1E1E1E',
            border: 'none',
            borderRadius: '8px',
            p: 1,
            minWidth: '40px',
            height: '40px',
            '&:hover': {
              backgroundColor: '#2A2A2A',
            },
            '&:focus-visible': {
              outline: '2px solid #4A90E2',
              outlineOffset: 2,
            },
          }}
        >
          <LanguageIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Box
        component={StyledMenuPaper}
        sx={{
          display: open ? 'block' : 'none',
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          zIndex: theme.zIndex.modal,
          minWidth: '160px',
          '&:focus': {
            outline: 'none',
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {Object.entries(languageNames).map(([code, name]) => (
          <MenuItem 
            key={code}
            selected={code === currentLanguage}
            onClick={() => handleMenuItemClick(code)}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                },
              },
            }}
          >
            <Typography variant="body2">
              {name}
            </Typography>
            {code === currentLanguage && (
              <Box 
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  ml: 1,
                }}
              />
            )}
          </MenuItem>
        ))}
      </Box>
      
      {/* Click away listener for closing the menu */}
      {open && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.modal - 1,
          }}
          onClick={handleClose}
        />
      )}
    </Box>
  );
};

export default LanguageSwitcher;
