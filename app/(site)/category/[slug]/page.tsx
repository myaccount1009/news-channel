import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategories, idsWithChildren, listPosts } from '@/lib/queries';
import { Pager, Row } from '@/components/site/PostParts';

export const revalidate = 60;

const PER_PAGE = 15;

async function resolve(rawSlug: string) {
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    /* যেমন আছে */
  }
  const cats = await getCategories();
  const cat = cats.find((c) => c.slug === slug);
  return { cats, cat };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { cat } = await resolve((await params).slug);
  return { title: cat ? cat.name : 'ক্যাটেগরি' };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { cats, cat } = await resolve(slug);
  if (!cat) notFound();

  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const posts = await listPosts({
    categoryIds: idsWithChildren(cats, cat.id),
    limit: PER_PAGE + 1,
    offset: (page - 1) * PER_PAGE,
  });
  const rows = posts.slice(0, PER_PAGE);
  const parent = cat.parent_id ? cats.find((c) => c.id === cat.parent_id) : null;
  const subs = cats.filter((c) => c.parent_id === cat.id);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="crumbs">
        <Link href="/">হোম</Link> / {parent && (<><Link href={`/category/${parent.slug}`}>{parent.name}</Link> / </>)}
        {cat.name}
      </div>
      <div className="section-head" style={{ marginTop: 8 }}>
        <h2>{cat.name}</h2>
      </div>
      {subs.length > 0 && (
        <div className="tags" style={{ marginTop: 0, marginBottom: 8 }}>
          {subs.map((s) => (
            <Link key={s.id} href={`/category/${s.slug}`}>
              {s.name}
            </Link>
          ))}
        </div>
      )}
      {rows.length ? (
        rows.map((p) => <Row key={p.id} post={p} />)
      ) : (
        <div className="empty">এই বিভাগে এখনো কোনো খবর নেই।</div>
      )}
      <Pager page={page} hasNext={posts.length > PER_PAGE} base={`/category/${encodeURIComponent(cat.slug)}`} />
    </div>
  );
}
