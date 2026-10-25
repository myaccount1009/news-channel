import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'admin_session';
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // ৭ দিন

export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function secret(): string {
  const s = process.env.SESSION_SECRET || '';
  return s.length >= 16 ? s : '';
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function authConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && secret());
}

export function checkCredentials(email: string, password: string): boolean {
  if (!authConfigured()) return false;
  const emailOk = safeEqual(email.trim().toLowerCase(), process.env.ADMIN_EMAIL!.trim().toLowerCase());
  const passOk = safeEqual(password, process.env.ADMIN_PASSWORD!);
  return emailOk && passOk;
}

export async function createSession(): Promise<void> {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE_SEC * 1000 })).toString('base64url');
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SEC,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!secret()) return false;
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (!safeEqual(sig, sign(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp: number };
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

/** প্রতিটি admin পেজ ও server action এর শুরুতে ডাকতে হবে */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}
