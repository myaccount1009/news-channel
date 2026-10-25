import type { Metadata } from 'next';
import { listPosts } from '@/lib/queries';
import { Pager, Row } from '@/components/site/PostParts';

export const revalidate = 60;

const PER_PAGE = 15;

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  return { title: `#${decode((await params).tag)}` };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const tag = decode((await params).tag);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const posts = await listPosts({ tag, limit: PER_PAGE + 1, offset: (page - 1) * PER_PAGE });
  const rows = posts.slice(0, PER_PAGE);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="section-head">
        <h2>#{tag}</h2>
      </div>
      {rows.length ? rows.map((p) => <Row key={p.id} post={p} />) : <div className="empty">এই ট্যাগে কোনো খবর নেই।</div>}
      <Pager page={page} hasNext={posts.length > PER_PAGE} base={`/tag/${encodeURIComponent(tag)}`} />
    </div>
  );
}
