/**
 * PIX EMV Payload Generator (client-side)
 * Generates the complete PIX payload string for QR code generation.
 */

interface PixPayloadOptions {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  description?: string;
  txId?: string;
}

/** CRC16-CCITT calculation */
function crc16ccitt(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** TLV (Tag-Length-Value) helper */
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Generate a complete PIX EMV payload string.
 */
export function generatePixPayload(opts: PixPayloadOptions): string {
  const { pixKey, merchantName, merchantCity, amount, description, txId } = opts;

  // Transaction ID (max 25 chars)
  const txIdStr = txId || `STUDYAI${Date.now().toString(36).toUpperCase().slice(-15)}`;

  // Merchant Account Information (tag 26)
  const gui = tlv('00', 'br.gov.bcb.pix');
  const key = tlv('01', pixKey);
  const mai = tlv('26', gui + key);

  // Build payload without CRC
  let payload = '';
  payload += tlv('00', '01');           // Payload Format Indicator
  payload += mai;                       // Merchant Account Info
  payload += tlv('52', '0000');         // Merchant Category Code
  payload += tlv('53', '986');          // Transaction Currency (BRL)
  payload += tlv('54', amount.toFixed(2)); // Transaction Amount

  if (description) {
    payload += tlv('05', description.slice(0, 25)); // Additional Data Field Template
  }

  payload += tlv('58', 'BR');           // Country Code
  payload += tlv('59', merchantName.slice(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '')); // Merchant Name
  payload += tlv('60', merchantCity.slice(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '')); // Merchant City
  payload += tlv('62', tlv('05', txIdStr.slice(0, 25))); // Additional Data Field Template
  payload += '6304';                    // CRC16 placeholder

  // Calculate CRC16 over the entire payload
  const crc = crc16ccitt(payload);
  return payload + crc;
}

/**
 * Generate PIX QR code as a data URL (client-side).
 * Uses the qrcode library to render the payload as a PNG.
 */
export async function generatePixQrCode(opts: PixPayloadOptions): Promise<string> {
  const payload = generatePixPayload(opts);

  // Dynamic import of qrcode (client-side only)
  const QRCode = (await import('qrcode')).default;

  return new Promise((resolve, reject) => {
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    }, (err, url) => {
      if (err) reject(err);
      else resolve(url);
    });
  });
}

/**
 * Get the PIX key from environment.
 */
export function getPixKey(): string {
  return process.env.NEXT_PUBLIC_PIX_KEY || 'raphaeljdk@gmail.com';
}
