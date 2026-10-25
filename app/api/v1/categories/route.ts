import type { NextRequest } from 'next/server';
import { handle, json } from '@/lib/api';
import { fetchCategories } from '@/lib/posts';

export const dynamic = 'force-dynamic';

/** n8n এ কোন category slug দেওয়া যাবে তা দেখতে */
export async function GET(req: NextRequest) {
  return handle(req, async () => {
    const cats = await fetchCategories();
    const slugOf = new Map(cats.map((c) => [c.id, c.slug]));
    return json({
      ok: true,
      categories: cats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parent: c.parent_id ? (slugOf.get(c.parent_id) ?? null) : null,
      })),
    });
  });
}
