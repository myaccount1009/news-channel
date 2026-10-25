export const SITE_NAME = process.env.SITE_NAME || 'নিউজ পোর্টাল';
export const SITE_TAGLINE = process.env.SITE_TAGLINE || 'দেশ ও বিশ্বের সর্বশেষ সংবাদ';

export const DEFAULT_CATEGORY_SLUG = process.env.DEFAULT_CATEGORY_SLUG || 'news';
export const API_DEFAULT_STATUS: 'draft' | 'published' =
  process.env.API_DEFAULT_STATUS === 'draft' ? 'draft' : 'published';

export function siteUrl(): string {
  const fromEnv = process.env.SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '';
  return (fromEnv || vercel || 'http://localhost:3000').replace(/\/+$/, '');
}

export function postUrl(slug: string): string {
  return `${siteUrl()}/news/${encodeURIComponent(slug)}`;
}
