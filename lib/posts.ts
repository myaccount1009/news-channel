import { revalidatePath } from 'next/cache';
import { db } from './supabase';
import { ApiError, errorMessage } from './errors';
import { API_DEFAULT_STATUS, DEFAULT_CATEGORY_SLUG, postUrl } from './config';
import { excerptFrom, normalizeContent } from './content';
import { slugify } from './format';
import { mirrorImage } from './images';
import { POST_SELECT } from './queries';
import type { Category, Post } from './types';

export type PostInput = Record<string, unknown>;
export type Source = 'admin' | 'api';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------- ছোট helper ----------
function str(v: unknown): string | undefined {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function bool(v: unknown): boolean {
  return v === true || v === 1 || v === 'true' || v === '1' || v === 'on';
}

function client() {
  const c = db();
  if (!c) throw new ApiError(503, 'Supabase is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
  return c;
}

function rand(): string {
  return Math.random().toString(36).slice(2, 6);
}

function cleanUrl(v: unknown, field: string): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('protocol');
    return u.toString();
  } catch {
    throw new ApiError(400, `${field} must be a valid http(s) URL`);
  }
}

function parseDate(v: unknown): Date | undefined {
  const s = str(v);
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, 'published_at must be an ISO 8601 date, e.g. 2026-10-25T19:05:00+06:00');
  return d;
}

function parseTags(v: unknown): string[] {
  const raw = Array.isArray(v) ? v.map((x) => String(x)) : typeof v === 'string' ? v.split(/[,،;|\n]/) : [];
  const out: string[] = [];
  for (const t of raw) {
    const tag = t.trim().replace(/^#/, '').slice(0, 40);
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out.slice(0, 15);
}

function pickStatus(v: unknown, source: Source): 'draft' | 'published' {
  const s = str(v)?.toLowerCase();
  if (!s) return source === 'api' ? API_DEFAULT_STATUS : 'published';
  if (s === 'draft' || s === 'published') return s;
  throw new ApiError(400, 'status must be "draft" or "published"');
}

export function revalidateSite(): void {
  try {
    revalidatePath('/', 'layout');
  } catch {
    /* build/test পরিবেশে না থাকলেও সমস্যা নেই */
  }
}

// ---------- category ----------
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await client()
    .from('categories')
    .select('id,name,slug,parent_id,sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw new ApiError(500, `DB error: ${error.message}`);
  return (data ?? []) as Category[];
}

function findCategory(cats: Category[], input: PostInput): Category {
  if (!cats.length) {
    throw new ApiError(500, 'No categories exist. Run supabase/schema.sql or add a category in the admin panel.');
  }
  const id = str(input.category_id);
  const name = str(input.category);
  if (id) {
    const c = cats.find((x) => x.id === id);
    if (c) return c;
    throw new ApiError(422, 'Unknown category_id', { valid_categories: cats.map((x) => ({ id: x.id, name: x.name, slug: x.slug })) });
  }
  if (name) {
    const n = name.toLowerCase();
    const c = cats.find((x) => x.slug.toLowerCase() === n || x.name.toLowerCase() === n);
    if (c) return c;
    throw new ApiError(422, `Unknown category "${name}". Use a category slug or name from valid_categories.`, {
      valid_categories: cats.map((x) => ({ name: x.name, slug: x.slug })),
    });
  }
  return cats.find((x) => x.slug === DEFAULT_CATEGORY_SLUG) ?? cats[0];
}

// ---------- read ----------
export async function getPostByIdOrSlug(key: string): Promise<Post | null> {
  let k = key;
  try {
    k = decodeURIComponent(key);
  } catch {
    /* যেমন আছে তেমনই */
  }
  const base = client().from('posts').select(POST_SELECT);
  const { data, error } = await (UUID.test(k) ? base.eq('id', k) : base.eq('slug', k)).maybeSingle();
  if (error) throw new ApiError(500, `DB error: ${error.message}`);
  return (data as unknown as Post) ?? null;
}

// ---------- create ----------
export type CreateResult = { duplicate: boolean; post: Post; warnings: string[] };

export async function createPost(input: PostInput, source: Source, opts: { mirror?: boolean } = {}): Promise<CreateResult> {
  const supa = client();

  const title = str(input.title) ?? '';
  if (title.length < 3) throw new ApiError(400, 'title is required (at least 3 characters)');
  if (title.length > 300) throw new ApiError(400, 'title is too long (max 300 characters)');

  const content = normalizeContent(str(input.content) ?? '');
  if (!content) throw new ApiError(400, 'content is required');

  const status = pickStatus(input.status, source);
  const category = findCategory(await fetchCategories(), input);
  const sourceUrl = cleanUrl(input.source_url, 'source_url');

  // একই খবর দুইবার নয়: source_url মিললে নতুন করে বানানো হয় না
  if (sourceUrl) {
    const { data } = await supa.from('posts').select('id').eq('source_url', sourceUrl).maybeSingle();
    if (data) {
      const existing = await getPostByIdOrSlug((data as { id: string }).id);
      if (existing) return { duplicate: true, post: existing, warnings: [] };
    }
  }

  const warnings: string[] = [];
  let imageUrl = cleanUrl(input.image_url, 'image_url');
  if (imageUrl && (opts.mirror ?? true)) {
    try {
      imageUrl = await mirrorImage(imageUrl);
    } catch (e) {
      warnings.push(`image could not be copied to storage, original URL is used: ${errorMessage(e)}`);
    }
  }

  const record = {
    title,
    content,
    excerpt: str(input.excerpt) || excerptFrom(content),
    image_url: imageUrl ?? null,
    image_alt: str(input.image_alt) || title,
    category_id: category.id,
    tags: parseTags(input.tags),
    author: str(input.author) || null,
    source_url: sourceUrl ?? null,
    source,
    status,
    is_featured: bool(input.is_featured),
    published_at: (parseDate(input.published_at) ?? new Date()).toISOString(),
  };

  const base = slugify(title);
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${rand()}`;
    const { data, error } = await supa.from('posts').insert({ ...record, slug }).select(POST_SELECT).single();
    if (!error) {
      revalidateSite();
      return { duplicate: false, post: data as unknown as Post, warnings };
    }
    if (error.code === '23505') {
      if (error.message.includes('source_url') && sourceUrl) {
        const { data: d2 } = await supa.from('posts').select('id').eq('source_url', sourceUrl).maybeSingle();
        const existing = d2 ? await getPostByIdOrSlug((d2 as { id: string }).id) : null;
        if (existing) return { duplicate: true, post: existing, warnings };
      }
      continue; // slug মিলে গেছে, suffix দিয়ে আবার
    }
    throw new ApiError(500, `DB error: ${error.message}`);
  }
  throw new ApiError(500, 'Could not generate a unique slug, please try again');
}

// ---------- update ----------
export async function updatePost(key: string, input: PostInput, opts: { mirror?: boolean } = {}): Promise<{ post: Post; warnings: string[] }> {
  const supa = client();
  const existing = await getPostByIdOrSlug(key);
  if (!existing) throw new ApiError(404, 'Post not found');

  const warnings: string[] = [];
  const patch: Record<string, unknown> = {};
  const has = (k: string) => input[k] !== undefined;

  if (has('title')) {
    const t = str(input.title) ?? '';
    if (t.length < 3 || t.length > 300) throw new ApiError(400, 'title must be 3 to 300 characters');
    patch.title = t;
  }
  if (has('content')) {
    const c = normalizeContent(str(input.content) ?? '');
    if (!c) throw new ApiError(400, 'content cannot be empty');
    patch.content = c;
  }
  if (has('excerpt')) {
    patch.excerpt = str(input.excerpt) || excerptFrom((patch.content as string | undefined) ?? existing.content);
  }
  if (has('category') || has('category_id')) {
    patch.category_id = findCategory(await fetchCategories(), input).id;
  }
  if (has('tags')) patch.tags = parseTags(input.tags);
  if (has('author')) patch.author = str(input.author) || null;
  if (has('is_featured')) patch.is_featured = bool(input.is_featured);
  if (has('image_alt')) patch.image_alt = str(input.image_alt) || null;
  if (has('source_url')) patch.source_url = cleanUrl(input.source_url, 'source_url') ?? null;

  if (has('image_url')) {
    let img = cleanUrl(input.image_url, 'image_url');
    if (img && img !== existing.image_url && (opts.mirror ?? true)) {
      try {
        img = await mirrorImage(img);
      } catch (e) {
        warnings.push(`image could not be copied to storage, original URL is used: ${errorMessage(e)}`);
      }
    }
    patch.image_url = img ?? null;
  }

  const newDate = parseDate(input.published_at);
  if (newDate) patch.published_at = newDate.toISOString();
  if (has('status')) {
    const s = pickStatus(input.status, 'api');
    patch.status = s;
    // খসড়া থেকে প্রকাশ করলে, আলাদা সময় না দিলে এখনকার সময় ধরা হয়
    if (s === 'published' && existing.status === 'draft' && !newDate) patch.published_at = new Date().toISOString();
  }

  if (!Object.keys(patch).length) return { post: existing, warnings };

  const { data, error } = await supa.from('posts').update(patch).eq('id', existing.id).select(POST_SELECT).single();
  if (error) {
    if (error.code === '23505') throw new ApiError(409, 'Another post already uses this source_url');
    throw new ApiError(500, `DB error: ${error.message}`);
  }
  revalidateSite();
  return { post: data as unknown as Post, warnings };
}

// ---------- delete ----------
export async function deletePost(key: string): Promise<Post> {
  const existing = await getPostByIdOrSlug(key);
  if (!existing) throw new ApiError(404, 'Post not found');
  const { error } = await client().from('posts').delete().eq('id', existing.id);
  if (error) throw new ApiError(500, `DB error: ${error.message}`);
  revalidateSite();
  return existing;
}

// ---------- API list ----------
export async function listForApi(params: { status?: string; category?: string; q?: string; limit: number; page: number }) {
  const supa = client();
  const from = (params.page - 1) * params.limit;
  let query = supa
    .from('posts')
    .select(POST_SELECT, { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, from + params.limit - 1);

  if (params.status === 'draft' || params.status === 'published') query = query.eq('status', params.status);
  if (params.category) {
    const cats = await fetchCategories();
    const c = cats.find((x) => x.slug === params.category || x.name === params.category);
    if (!c) throw new ApiError(422, `Unknown category "${params.category}"`, { valid_categories: cats.map((x) => x.slug) });
    query = query.in('category_id', [c.id, ...cats.filter((x) => x.parent_id === c.id).map((x) => x.id)]);
  }
  if (params.q) {
    const s = params.q.replace(/[,()"\\%*]/g, ' ').trim();
    if (s) query = query.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%`);
  }
  const { data, error, count } = await query;
  if (error) throw new ApiError(500, `DB error: ${error.message}`);
  return { rows: (data ?? []) as unknown as Post[], total: count ?? 0 };
}

// ---------- API output ----------
export function serializePost(p: Post, withContent = false) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    url: postUrl(p.slug),
    status: p.status,
    excerpt: p.excerpt,
    ...(withContent ? { content: p.content } : {}),
    image_url: p.image_url,
    image_alt: p.image_alt,
    category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
    tags: p.tags,
    author: p.author,
    source_url: p.source_url,
    source: p.source,
    is_featured: p.is_featured,
    published_at: p.published_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}
