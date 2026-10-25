import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleView from '@/components/site/ArticleView';
import { SITE_NAME, postUrl } from '@/lib/config';
import { getPostBySlug, listPosts } from '@/lib/queries';

export const revalidate = 60;

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPostBySlug(decode((await params).slug));
  if (!post) return { title: 'খবর পাওয়া যায়নি' };
  const description = post.excerpt || undefined;
  return {
    title: post.title,
    description,
    alternates: { canonical: postUrl(post.slug) },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: postUrl(post.slug),
      siteName: SITE_NAME,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      images: post.image_url ? [{ url: post.image_url }] : undefined,
    },
    twitter: {
      card: post.image_url ? 'summary_large_image' : 'summary',
      title: post.title,
      description,
      images: post.image_url ? [post.image_url] : undefined,
    },
  };
}

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPostBySlug(decode((await params).slug));
  if (!post) notFound();

  const related = post.category_id
    ? await listPosts({ categoryIds: [post.category_id], excludeIds: [post.id], limit: 3 })
    : [];

  return <ArticleView post={post} related={related} />;
}
