import Link from 'next/link';
import { bnRelative } from '@/lib/format';
import type { PostListItem } from '@/lib/types';

export function href(p: Pick<PostListItem, 'slug'>): string {
  return `/news/${encodeURIComponent(p.slug)}`;
}

export function Thumb({ post, eager = false }: { post: PostListItem; eager?: boolean }) {
  if (!post.image_url) {
    return <div className="thumb-ph">{post.category?.name ?? 'খবর'}</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="thumb"
      src={post.image_url}
      alt={post.image_alt || post.title}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}

export function CategoryChip({ post }: { post: PostListItem }) {
  if (!post.category) return null;
  return (
    <Link className="chip" href={`/category/${post.category.slug}`}>
      {post.category.name}
    </Link>
  );
}

/** ছবি + শিরোনাম + ২ লাইনের সারাংশ */
export function Card({ post }: { post: PostListItem }) {
  return (
    <article className="card">
      <Link href={href(post)}>
        <Thumb post={post} />
        <h3>{post.title}</h3>
      </Link>
      {post.excerpt && <p>{post.excerpt}</p>}
      <div className="meta">{bnRelative(post.published_at)}</div>
    </article>
  );
}

/** ছোট ছবি বাঁয়ে, শিরোনাম ডানে */
export function SideItem({ post }: { post: PostListItem }) {
  return (
    <Link href={href(post)} className="item">
      <Thumb post={post} />
      <div>
        <h3>{post.title}</h3>
        <div className="meta">{bnRelative(post.published_at)}</div>
      </div>
    </Link>
  );
}

/** তালিকা পেজের সারি */
export function Row({ post }: { post: PostListItem }) {
  return (
    <article className="list-row">
      <Link href={href(post)}>
        <Thumb post={post} />
      </Link>
      <div>
        <CategoryChip post={post} />
        <h2>
          <Link href={href(post)}>{post.title}</Link>
        </h2>
        {post.excerpt && <p>{post.excerpt}</p>}
        <div className="meta" style={{ marginTop: 4 }}>
          {bnRelative(post.published_at)}
          {post.author ? ` · ${post.author}` : ''}
        </div>
      </div>
    </article>
  );
}

export function Pager({ page, hasNext, base }: { page: number; hasNext: boolean; base: string }) {
  if (page <= 1 && !hasNext) return null;
  const sep = base.includes('?') ? '&' : '?';
  const to = (n: number) => (n <= 1 ? base : `${base}${sep}page=${n}`);
  return (
    <nav className="pager" aria-label="পাতা">
      {page > 1 && (
        <Link className="btn" href={to(page - 1)}>
          ← আগের পাতা
        </Link>
      )}
      {hasNext && (
        <Link className="btn primary" href={to(page + 1)}>
          পরের পাতা →
        </Link>
      )}
    </nav>
  );
}

export function SetupNotice() {
  return (
    <div className="empty">
      <h2 style={{ marginBottom: 8 }}>এখনো কোনো খবর নেই</h2>
      <p style={{ margin: 0 }}>
        Supabase যুক্ত না থাকলে বা ডাটাবেস ফাঁকা থাকলে এই বার্তা দেখায়। <code>/admin</code> এ গিয়ে খবর যোগ করুন, অথবা{' '}
        <code>npm run seed</code> চালিয়ে ডেমো খবর বসান।
      </p>
    </div>
  );
}
