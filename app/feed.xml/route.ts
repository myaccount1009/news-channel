import { SITE_NAME, SITE_TAGLINE, postUrl, siteUrl } from '@/lib/config';
import { listPosts } from '@/lib/queries';

export const revalidate = 300;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const posts = await listPosts({ limit: 30 });
  const items = posts
    .map(
      (p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(postUrl(p.slug))}</link>
      <guid isPermaLink="true">${esc(postUrl(p.slug))}</guid>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
      ${p.category ? `<category>${esc(p.category.name)}</category>` : ''}
      <description>${esc(p.excerpt ?? '')}</description>
      ${p.image_url ? `<enclosure url="${esc(p.image_url)}" type="image/jpeg" length="0" />` : ''}
    </item>`,
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${esc(siteUrl())}</link>
    <description>${esc(SITE_TAGLINE)}</description>
    <language>bn</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
  });
}
