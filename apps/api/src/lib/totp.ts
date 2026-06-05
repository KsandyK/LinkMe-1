import * as OTPAuth from "otpauth";
import crypto from "crypto";
import QRCode from "qrcode";

const ISSUER = "CRAVR";
const ALGORITHM = "SHA1";
const DIGITS = 6;
const PERIOD = 30;

const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY ?? "dev-totp-key-change-in-prod-must-be-32bytes!";

function deriveKey(): Buffer {
  return crypto.scryptSync(ENCRYPTION_KEY, "totp-salt", 32);
}

export function encryptSecret(plain: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), encrypted.toString("hex"), tag.toString("hex")].join(":");
}

export function decryptSecret(blob: string): string {
  const [ivHex, encHex, tagHex] = blob.split(":");
  const key = deriveKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(encHex, "hex"), undefined, "utf8") + decipher.final("utf8");
}

export function generateSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildOtpAuthUri(secret: string, username: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: username,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

export async function generateQRDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, { width: 256, margin: 2 });
}

export function verifyToken(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
