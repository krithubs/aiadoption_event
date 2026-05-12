import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function sign(value: string): string {
  const secret = process.env.SESSION_SECRET || "dev-only-session-secret";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function makeSessionCookie(): string {
  const username = process.env.ADMIN_USERNAME || "admin";
  const issuedAt = Date.now().toString();
  const payload = Buffer.from(`${username}:${issuedAt}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionCookie(cookieValue?: string): boolean {
  if (!cookieValue) return false;
  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature || sign(payload) !== signature) return false;

  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const [username, issuedAt] = decoded.split(":");
  const maxAgeMs = 1000 * 60 * 60 * 8;
  return username === (process.env.ADMIN_USERNAME || "admin") && Date.now() - Number(issuedAt) < maxAgeMs;
}
