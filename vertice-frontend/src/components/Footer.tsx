import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        px: 3,
        py: 0.5,
        textAlign: 'left',
        backgroundColor: 'transparent',
        position: 'fixed',
        bottom: 0,
        width: '100%',
      }}
    >
      <Typography variant="body2" color="black">
        {/* Footer vacío */}
      </Typography>
    </Box>
  );
};

export default Footer;
