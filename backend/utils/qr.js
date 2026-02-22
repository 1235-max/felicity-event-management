import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export const generateTicketId = () => {
  return `FEL-${uuidv4().substring(0, 8).toUpperCase()}`;
};

export const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('QR Code generation failed');
  }
};
