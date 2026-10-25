import { cache } from 'react';
import { db } from './supabase';
import type { Category, CategoryNode, Post, PostListItem } from './types';

export const LIST_COLS =
  'id,title,slug,excerpt,image_url,image_alt,published_at,author,is_featured,status,source,' +
  'category:categories(id,name,slug,parent_id)';

export const POST_SELECT = '*, category:categories(id,name,slug,parent_id)';

export const getCategories = cache(async (): Promise<Category[]> => {
  const supa = db();
  if (!supa) return [];
  const { data, error } = await supa
    .from('categories')
    .select('id,name,slug,parent_id,sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) {
    console.error('[getCategories]', error.message);
    return [];
  }
  return (data ?? []) as Category[];
});

export function buildTree(cats: Category[]): CategoryNode[] {
  const tops = cats.filter((c) => !c.parent_id);
  return tops.map((t) => ({ ...t, children: cats.filter((c) => c.parent_id === t.id) }));
}

/** একটি ক্যাটেগরি + তার সব উপ-ক্যাটেগরির id */
export function idsWithChildren(cats: Category[], id: string): string[] {
  return [id, ...cats.filter((c) => c.parent_id === id).map((c) => c.id)];
}

export function cleanSearch(s: string): string {
  return s.replace(/[,()"\\%*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export type ListOpts = {
  categoryIds?: string[];
  excludeIds?: string[];
  q?: string;
  tag?: string;
  limit?: number;
  offset?: number;
};

/** শুধু প্রকাশিত ও সময় হয়ে যাওয়া খবর (content ছাড়া, হালকা) */
export async function listPosts(opts: ListOpts = {}): Promise<PostListItem[]> {
  const supa = db();
  if (!supa) return [];
  const { categoryIds, excludeIds, q, tag, limit = 12, offset = 0 } = opts;
  if (categoryIds && categoryIds.length === 0) return [];

  let query = supa
    .from('posts')
    .select(LIST_COLS)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoryIds) query = query.in('category_id', categoryIds);
  if (excludeIds && excludeIds.length) query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  if (tag) query = query.contains('tags', [tag]);
  if (q) {
    const s = cleanSearch(q);
    if (s) query = query.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[listPosts]', error.message);
    return [];
  }
  return (data ?? []) as unknown as PostListItem[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supa = db();
  if (!supa) return null;
  const { data, error } = await supa
    .from('posts')
    .select(POST_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle();
  if (error) {
    console.error('[getPostBySlug]', error.message);
    return null;
  }
  return (data as unknown as Post) ?? null;
}
