import type { Metadata } from 'next';
import { listPosts } from '@/lib/queries';
import { Pager, Row, SetupNotice } from '@/components/site/PostParts';

export const revalidate = 60;
export const metadata: Metadata = { title: 'সর্বশেষ খবর' };

const PER_PAGE = 15;

export default async function LatestPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const posts = await listPosts({ limit: PER_PAGE + 1, offset: (page - 1) * PER_PAGE });
  const rows = posts.slice(0, PER_PAGE);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="section-head">
        <h2>সর্বশেষ খবর</h2>
      </div>
      {rows.length ? rows.map((p) => <Row key={p.id} post={p} />) : <SetupNotice />}
      <Pager page={page} hasNext={posts.length > PER_PAGE} base="/latest" />
    </div>
  );
}
