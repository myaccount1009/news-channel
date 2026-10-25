import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config';
import { db } from '@/lib/supabase';
import { getCategories } from '@/lib/queries';

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const items: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'hourly', priority: 1 },
    { url: `${base}/latest`, changeFrequency: 'hourly', priority: 0.8 },
  ];

  for (const c of await getCategories()) {
    items.push({ url: `${base}/category/${encodeURIComponent(c.slug)}`, changeFrequency: 'hourly', priority: 0.6 });
  }

  const supa = db();
  if (supa) {
    const { data } = await supa
      .from('posts')
      .select('slug,updated_at')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(5000);
    for (const p of (data ?? []) as { slug: string; updated_at: string }[]) {
      items.push({
        url: `${base}/news/${encodeURIComponent(p.slug)}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }
  }
  return items;
}
