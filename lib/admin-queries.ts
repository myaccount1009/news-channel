import { db } from './supabase';
import { LIST_COLS, POST_SELECT } from './queries';
import type { Post, PostListItem } from './types';

export const ADMIN_PAGE_SIZE = 20;

export async function adminListPosts(opts: {
  q?: string;
  status?: string;
  categoryIds?: string[];
  page: number;
}): Promise<{ rows: PostListItem[]; total: number }> {
  const supa = db();
  if (!supa) return { rows: [], total: 0 };
  const from = (opts.page - 1) * ADMIN_PAGE_SIZE;
  let query = supa
    .from('posts')
    .select(LIST_COLS, { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);

  if (opts.status === 'draft' || opts.status === 'published') query = query.eq('status', opts.status);
  if (opts.categoryIds?.length) query = query.in('category_id', opts.categoryIds);
  if (opts.q) {
    const s = opts.q.replace(/[,()"\\%*]/g, ' ').trim();
    if (s) query = query.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%`);
  }
  const { data, error, count } = await query;
  if (error) {
    console.error('[adminListPosts]', error.message);
    return { rows: [], total: 0 };
  }
  return { rows: (data ?? []) as unknown as PostListItem[], total: count ?? 0 };
}

export async function adminGetPost(id: string): Promise<Post | null> {
  const supa = db();
  if (!supa) return null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supa.from('posts').select(POST_SELECT).eq('id', id).maybeSingle();
  if (error) {
    console.error('[adminGetPost]', error.message);
    return null;
  }
  return (data as unknown as Post) ?? null;
}

export async function adminStats() {
  const supa = db();
  if (!supa) return null;
  const count = async (build: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => {
    const { count: c } = await build(base());
    return c ?? 0;
  };
  const base = () => supa.from('posts').select('id', { count: 'exact', head: true });

  const startOfDay = new Date();
  startOfDay.setUTCHours(-6, 0, 0, 0); // ঢাকার আজকের শুরু ≈ UTC-6h
  if (startOfDay.getTime() > Date.now()) startOfDay.setUTCDate(startOfDay.getUTCDate() - 1);

  const [total, published, drafts, viaApi, today] = await Promise.all([
    count((q) => q),
    count((q) => q.eq('status', 'published')),
    count((q) => q.eq('status', 'draft')),
    count((q) => q.eq('source', 'api')),
    count((q) => q.gte('created_at', startOfDay.toISOString())),
  ]);
  return { total, published, drafts, viaApi, today };
}
