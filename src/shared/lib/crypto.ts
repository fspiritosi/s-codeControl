import 'server-only';

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // bytes (recomendado para GCM)

/**
 * Deriva una clave de 32 bytes a partir de ENCRYPTION_KEY usando SHA-256.
 * Lanza un Error claro si la variable de entorno no está definida.
 */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'ENCRYPTION_KEY no está definida en el entorno. Es requerida para cifrar/descifrar secretos.',
    );
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Cifra un texto plano con AES-256-GCM.
 * Devuelve el string `${ivBase64}:${authTagBase64}:${ciphertextBase64}`.
 */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

/**
 * Descifra un payload con formato `${ivBase64}:${authTagBase64}:${ciphertextBase64}`
 * producido por encryptSecret. Devuelve el texto plano original.
 */
export function decryptSecret(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Formato de secreto cifrado inválido. Se esperaba iv:tag:cipher en base64.');
  }
  const [ivBase64, authTagBase64, ciphertextBase64] = parts;
  const key = getKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
