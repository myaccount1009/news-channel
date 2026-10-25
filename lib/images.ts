import { lookup } from 'node:dns/promises';
import net from 'node:net';
import { randomUUID } from 'node:crypto';
import { db } from './supabase';

const BUCKET = 'news-images';
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

/** ফাইলের শুরুর bytes দেখে আসল ছবির ধরন বের করে (Content-Type বিশ্বাস করা হয় না) */
export function sniffType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 3).toString('ascii') === 'GIF') return 'image/gif';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.subarray(4, 8).toString('ascii') === 'ftyp' && /avif|avis/.test(buf.subarray(8, 16).toString('ascii'))) return 'image/avif';
  return null;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:');
  }
  return true;
}

// SSRF ঠেকাতে: ভেতরের/প্রাইভেট ঠিকানায় যাওয়া ব্লক
async function assertPublicUrl(u: URL): Promise<void> {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('only http/https URLs are allowed');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('private host blocked');
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error('private address blocked');
}

async function downloadImage(url: string): Promise<Buffer> {
  let current = new URL(url);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublicUrl(current);
    const res = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(12_000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; NewsPortalBot/1.0)', accept: 'image/*' },
    });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      if (!loc) throw new Error('redirect without location');
      current = new URL(loc, current);
      continue;
    }
    if (!res.ok) throw new Error(`image download failed (HTTP ${res.status})`);
    const len = Number(res.headers.get('content-length') || 0);
    if (len > MAX_IMAGE_BYTES) throw new Error('image is larger than 4MB');
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) throw new Error('image is larger than 4MB');
    return buf;
  }
  throw new Error('too many redirects');
}

/** Supabase Storage এ আপলোড করে public URL ফেরত দেয় */
export async function uploadImage(buf: Buffer): Promise<string> {
  const supa = db();
  if (!supa) throw new Error('Supabase is not configured');
  const type = sniffType(buf);
  if (!type) throw new Error('Unsupported image (use jpg, png, webp, gif or avif)');
  const d = new Date();
  const path = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${EXT[type]}`;
  const { error } = await supa.storage.from(BUCKET).upload(path, buf, {
    contentType: type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
  return supa.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** বাইরের ছবির URL থেকে ডাউনলোড করে নিজের Storage এ রাখে */
export async function mirrorImage(url: string): Promise<string> {
  const buf = await downloadImage(url);
  return uploadImage(buf);
}
