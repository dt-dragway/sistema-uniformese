import { Modal, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  pdfDataUri: string;
  title: string;
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  height: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 2,
  display: 'flex',
  flexDirection: 'column',
};

const PdfPreviewModal = ({ open, onClose, pdfDataUri, title }: PdfPreviewModalProps) => {
  console.log("PdfPreviewModal rendered. Props:", { open, pdfDataUri: pdfDataUri.substring(0, 50) });

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="pdf-preview-title"
    >
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, pb: 1, mb: 2 }}>
          <Typography id="pdf-preview-title" variant="h6" component="h2">
            {title}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <iframe
          src={pdfDataUri}
          title={title}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </Box>
    </Modal>
  );
};

export default PdfPreviewModal;
