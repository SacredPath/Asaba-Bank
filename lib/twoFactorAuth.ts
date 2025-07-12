import { createHmac, randomBytes } from 'crypto';

// Base32 encoder for TOTP compatibility
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  
  // Add padding
  while (output.length % 8 !== 0) {
    output += '=';
  }
  
  return output;
}

// Simple base32 decoder for TOTP compatibility
function base32Decode(str: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const padding = '=';
  
  let bits = 0;
  let value = 0;
  let output = '';
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === padding) break;
    
    const index = alphabet.indexOf(char.toUpperCase());
    if (index === -1) continue;
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      output += String.fromCharCode((value >>> (bits - 8)) & 0xFF);
      bits -= 8;
    }
  }
  
  return Buffer.from(output, 'binary');
}

// TOTP (Time-based One-Time Password) implementation
export class TwoFactorAuth {
  private static readonly DIGITS = 6;
  private static readonly PERIOD = 30; // 30 seconds
  private static readonly ALGORITHM = 'sha1';

  // Generate a secret key for TOTP (proper base32 format)
  static generateSecret(): string {
    // Generate 20 bytes (160 bits) for the secret
    const secretBytes = randomBytes(20);
    return base32Encode(secretBytes);
  }

  // Generate TOTP code
  static generateTOTP(secret: string, time?: number): string {
    const counter = Math.floor((time || Date.now()) / 1000 / this.PERIOD);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter), 0);

    // Convert base32 secret to buffer
    const secretBuffer = base32Decode(secret);
    const hmac = createHmac(this.ALGORITHM, secretBuffer);
    hmac.update(counterBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);

    return (code % Math.pow(10, this.DIGITS)).toString().padStart(this.DIGITS, '0');
  }

  // Validate TOTP code
  static validateTOTP(secret: string, code: string, window: number = 1): boolean {
    const now = Date.now();
    const timeWindow = this.PERIOD * 1000;

    for (let i = -window; i <= window; i++) {
      const time = now + (i * timeWindow);
      const expectedCode = this.generateTOTP(secret, time);
      if (code === expectedCode) {
        return true;
      }
    }
    return false;
  }

  // Generate QR code URL for authenticator apps
  static generateQRCodeURL(email: string, secret: string, issuer: string = 'Asaba Bank'): string {
    const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${this.DIGITS}&period=${this.PERIOD}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
  }

  // Generate backup codes
  static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Validate backup code
  static validateBackupCode(backupCodes: string[], code: string): boolean {
    const index = backupCodes.indexOf(code.toUpperCase());
    if (index !== -1) {
      backupCodes.splice(index, 1); // Remove used code
      return true;
    }
    return false;
  }
}

// SMS-based 2FA (for future implementation)
export class SMS2FA {
  static generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static validateSMSCode(expectedCode: string, providedCode: string): boolean {
    return expectedCode === providedCode;
  }
} 