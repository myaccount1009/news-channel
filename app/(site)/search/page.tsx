import type { Metadata } from 'next';
import { cleanSearch, listPosts } from '@/lib/queries';
import { Pager, Row } from '@/components/site/PostParts';

export const metadata: Metadata = { title: 'সার্চ', robots: { index: false } };

const PER_PAGE = 15;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = cleanSearch(sp.q || '');
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const posts = q ? await listPosts({ q, limit: PER_PAGE + 1, offset: (page - 1) * PER_PAGE }) : [];
  const rows = posts.slice(0, PER_PAGE);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="section-head">
        <h2>সার্চ</h2>
      </div>
      <form action="/search" className="searchform" style={{ display: 'flex', maxWidth: 520, marginBottom: 18 }}>
        <input type="search" name="q" defaultValue={q} placeholder="শিরোনাম বা শব্দ লিখুন…" style={{ flex: 1 }} autoFocus />
        <button type="submit">খুঁজুন</button>
      </form>
      {!q ? (
        <div className="empty">উপরের ঘরে কিছু লিখে খুঁজুন।</div>
      ) : rows.length ? (
        <>
          <p className="meta">“{q}” এর ফলাফল</p>
          {rows.map((p) => (
            <Row key={p.id} post={p} />
          ))}
          <Pager page={page} hasNext={posts.length > PER_PAGE} base={`/search?q=${encodeURIComponent(q)}`} />
        </>
      ) : (
        <div className="empty">“{q}” নিয়ে কোনো খবর পাওয়া যায়নি।</div>
      )}
    </div>
  );
}
