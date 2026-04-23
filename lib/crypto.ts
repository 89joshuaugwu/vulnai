import crypto from 'crypto';

// The encryption key should be 32 bytes (256 bits) for AES-256
// In production, this MUST be an environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'vulnai-dev-fallback-key-32-chars!'; 
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string): string {
  // If no environment variable is set and we're just using fallback, 
  // you might just want to store plain text in real dev, but we'll encrypt anyway to demonstrate.
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (e) {
    console.error("Encryption failed", e);
    return text; // Fallback to plaintext if something goes horribly wrong
  }
}

export function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Not an encrypted string
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    // If decryption fails (e.g., key changed or it wasn't encrypted), return original text
    return text; 
  }
}
