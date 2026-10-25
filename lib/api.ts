import { NextResponse, type NextRequest } from 'next/server';
import { ApiError } from './errors';
import { safeEqual } from './auth';

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function authError(req: NextRequest): NextResponse | null {
  const keys = (process.env.API_KEY || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!keys.length) {
    return json({ ok: false, error: 'API_KEY is not configured on the server' }, 500);
  }
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const given = req.headers.get('x-api-key') || bearer;
  if (!given || !keys.some((k) => safeEqual(k, given))) {
    return json({ ok: false, error: 'Unauthorized. Send your key in the x-api-key header.' }, 401);
  }
  return null;
}

/** auth + error handling এক জায়গায়। সব /api/v1 route এটা ব্যবহার করে */
export async function handle(req: NextRequest, fn: () => Promise<Response>): Promise<Response> {
  const denied = authError(req);
  if (denied) return denied;
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return json({ ok: false, error: e.message, ...(e.extra ?? {}) }, e.status);
    console.error('[api]', e);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    /* নিচে error */
  }
  throw new ApiError(400, 'Body must be a JSON object. Set header Content-Type: application/json');
}
