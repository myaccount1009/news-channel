import type { NextRequest } from 'next/server';
import { handle, json, readJson } from '@/lib/api';
import { createPost, listForApi, serializePost } from '@/lib/posts';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // ছবি কপি করতে সময় লাগতে পারে

/**
 * POST /api/v1/posts  — নতুন খবর (n8n এই endpoint টাই ব্যবহার করবে)
 * Header: x-api-key: <API_KEY>
 */
export async function POST(req: NextRequest) {
  return handle(req, async () => {
    const body = await readJson(req);
    const { duplicate, post, warnings } = await createPost(body, 'api');
    return json(
      {
        ok: true,
        duplicate,
        message: duplicate ? 'এই source_url দিয়ে খবর আগেই আছে, নতুন বানানো হয়নি' : 'created',
        post: serializePost(post),
        ...(warnings.length ? { warnings } : {}),
      },
      duplicate ? 200 : 201,
    );
  });
}

/** GET /api/v1/posts?status=draft&category=sports&q=...&limit=20&page=1 */
export async function GET(req: NextRequest) {
  return handle(req, async () => {
    const p = req.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(1, parseInt(p.get('limit') || '20', 10) || 20));
    const page = Math.max(1, parseInt(p.get('page') || '1', 10) || 1);
    const { rows, total } = await listForApi({
      status: p.get('status') || undefined,
      category: p.get('category') || undefined,
      q: p.get('q') || undefined,
      limit,
      page,
    });
    return json({ ok: true, total, page, limit, posts: rows.map((r) => serializePost(r)) });
  });
}
