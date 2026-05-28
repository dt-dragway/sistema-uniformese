import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const BarcodeIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M2 6h2v12H2zm3 0h1v12H5zm2 0h2v12H7zm3 0h1v12h-1zm2 0h3v12h-3zm4 0h2v12h-2zm3 0h1v12h-1z" />
  </SvgIcon>
);

export default BarcodeIcon;
