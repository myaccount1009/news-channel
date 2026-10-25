import Link from 'next/link';
import { SITE_NAME, postUrl } from '@/lib/config';
import { normalizeContent } from '@/lib/content';
import { bnDateTime } from '@/lib/format';
import type { Post, PostListItem } from '@/lib/types';
import { Card } from './PostParts';

export default function ArticleView({
  post,
  related = [],
  draft = false,
}: {
  post: Post;
  related?: PostListItem[];
  draft?: boolean;
}) {
  // ডাটাবেসে সরাসরি বসানো লেখা হলেও নিরাপদ রাখতে আবার পরিষ্কার করা হয়
  const html = normalizeContent(post.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.image_url ? [post.image_url] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    inLanguage: 'bn-BD',
    mainEntityOfPage: postUrl(post.slug),
    author: { '@type': 'Person', name: post.author || SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    keywords: post.tags.length ? post.tags.join(', ') : undefined,
  };

  return (
    <div className="grid-main">
      <article className="article">
        {draft && <div className="draft-banner">এটি খসড়া। সাধারণ পাঠক এই খবর দেখতে পাবেন না।</div>}

        <div className="crumbs">
          <Link href="/">হোম</Link>
          {post.category && (
            <>
              {' / '}
              <Link href={`/category/${post.category.slug}`}>{post.category.name}</Link>
            </>
          )}
        </div>
        <h1>{post.title}</h1>
        <div className="byline">
          <span>{post.author || SITE_NAME}</span>
          <span>প্রকাশ: {bnDateTime(post.published_at)}</span>
          {post.updated_at && new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > 3600_000 && (
            <span>আপডেট: {bnDateTime(post.updated_at)}</span>
          )}
        </div>

        {post.image_url && (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image_url} alt={post.image_alt || post.title} />
            {post.image_alt && post.image_alt !== post.title && <figcaption>{post.image_alt}</figcaption>}
          </figure>
        )}

        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

        {post.tags.length > 0 && (
          <div className="tags">
            {post.tags.map((t) => (
              <Link key={t} href={`/tag/${encodeURIComponent(t)}`}>
                #{t}
              </Link>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2>আরও পড়ুন</h2>
            </div>
            <div className="cards three">
              {related.map((p) => (
                <Card key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        <script
          type="application/ld+json"
          // JSON এর ভেতরে "<" এড়াতে escape করা হলো
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      </article>

      <aside className="sidebar">
        <div className="adslot">বিজ্ঞাপন</div>
      </aside>
    </div>
  );
}
