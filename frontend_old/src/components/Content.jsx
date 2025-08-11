import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded';
import { SitemarkIcon } from './CustomIcons';

const items = [
  {
    icon: <SettingsSuggestRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Uyarlanabilir Performans',
    description:
      'Ürünümüz ihtiyaçlarınıza kolayca uyum sağlar, verimliliği artırır ve görevlerinizi basitleştirir.',
  },
  {
    icon: <ConstructionRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Uzun Ömürlü',
    description:
      'Rakipsiz dayanıklılık ile uzun vadeli yatırımınızın karşılığını alın.',
  },
  {
    icon: <ThumbUpAltRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Mükemmel Kullanıcı Deneyimi',
    description:
      'Sezgisel ve kullanımı kolay arayüzümüzle ürünümüzü günlük rutininize entegre edin.',
  },
  {
    icon: <AutoFixHighRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Yenilikçi İşlevler',
    description:
      'Gelişen ihtiyaçlarınıza yönelik yeni standartlar belirleyen özelliklerle öne geçin.',
  },
];

export default function Content() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        maxWidth: { xs: '100%', sm: '450px' },
        width: '100%',
        px: { xs: 2, sm: 0 },
        py: { xs: 2, sm: 4 },
      }}
    >
      <Box 
        sx={{ 
          display: { xs: 'none', md: 'flex' },
          justifyContent: 'center',
          mb: 2
        }}
      >
        <SitemarkIcon />
      </Box>
      {items.map((item, index) => (
        <Box 
          key={index} 
          sx={{ 
            display: 'flex',
            gap: 2,
            '& .MuiSvgIcon-root': {
              mt: 0.5,
              flexShrink: 0
            }
          }}
        >
          {item.icon}
          <Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'medium',
                mb: 0.5
              }}
            >
              {item.title}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.875rem',
                lineHeight: 1.5
              }}
            >
              {item.description}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
