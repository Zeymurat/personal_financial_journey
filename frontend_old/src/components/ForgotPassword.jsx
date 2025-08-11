import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';

export default function ForgotPassword({ open, handleClose }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Şifre sıfırlama işlemi burada yapılacak
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          sx: { backgroundImage: 'none' },
        },
      }}
    >
      <DialogTitle>Şifremi Unuttum</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          Hesabınıza bağlı e-posta adresinizi girin, size şifrenizi sıfırlamanız için
          bir bağlantı göndereceğiz.
        </DialogContentText>
        <OutlinedInput
          autoFocus
          required
          margin="dense"
          id="reset-email"
          name="email"
          label="E-posta Adresi"
          placeholder="ornek@email.com"
          type="email"
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose}>
          İptal
        </Button>
        <Button type="submit" variant="contained">
          Gönder
        </Button>
      </DialogActions>
    </Dialog>
  );
}
