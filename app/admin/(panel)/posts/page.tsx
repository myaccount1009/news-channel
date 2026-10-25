import Link from 'next/link';
import { ADMIN_PAGE_SIZE, adminListPosts } from '@/lib/admin-queries';
import { requireAdmin } from '@/lib/auth';
import { bnDateTime } from '@/lib/format';
import { getCategories, idsWithChildren } from '@/lib/queries';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { deletePostAction, setStatusAction } from '../../actions';

type SP = { q?: string; status?: string; cat?: string; page?: string; saved?: string; deleted?: string; err?: string; warn?: string };

export default async function PostsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const cats = await getCategories();
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const cat = cats.find((c) => c.slug === sp.cat);

  const { rows, total } = await adminListPosts({
    q: sp.q,
    status: sp.status,
    categoryIds: cat ? idsWithChildren(cats, cat.id) : undefined,
    page,
  });
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    if (sp.q) p.set('q', sp.q);
    if (sp.status) p.set('status', sp.status);
    if (sp.cat) p.set('cat', sp.cat);
    Object.entries(over).forEach(([k, v]) => p.set(k, v));
    return `/admin/posts?${p.toString()}`;
  };

  return (
    <>
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>সব খবর <span className="meta">({total.toLocaleString('bn-BD')})</span></h1>
        <Link className="btn primary" href="/admin/posts/new">+ নতুন খবর</Link>
      </div>

      {sp.saved && <div className="notice">সংরক্ষণ হয়েছে।</div>}
      {sp.deleted && <div className="notice">খবর মুছে ফেলা হয়েছে।</div>}
      {sp.warn && <div className="notice warn">{sp.warn}</div>}
      {sp.err && <div className="notice err">{sp.err}</div>}

      <form className="toolbar" action="/admin/posts">
        <input name="q" defaultValue={sp.q ?? ''} placeholder="শিরোনামে খুঁজুন…" />
        <select name="status" defaultValue={sp.status ?? ''}>
          <option value="">সব অবস্থা</option>
          <option value="published">প্রকাশিত</option>
          <option value="draft">খসড়া</option>
        </select>
        <select name="cat" defaultValue={sp.cat ?? ''}>
          <option value="">সব ক্যাটেগরি</option>
          {cats.filter((c) => !c.parent_id).map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <button className="btn" type="submit">ফিল্টার</button>
      </form>

      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        {rows.length === 0 ? (
          <div className="empty" style={{ border: 0 }}>কোনো খবর পাওয়া যায়নি।</div>
        ) : (
          <table className="t">
            <thead>
              <tr><th>শিরোনাম</th><th>ক্যাটেগরি</th><th>অবস্থা</th><th>সময়</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td style={{ maxWidth: 420 }}>
                    <Link href={`/admin/posts/${p.id}`} style={{ fontWeight: 600 }}>{p.title}</Link>
                    {p.is_featured && <span className="badge dr" style={{ marginLeft: 6 }}>★ প্রধান</span>}
                  </td>
                  <td>{p.category?.name ?? '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={`badge ${p.status === 'published' ? 'pub' : 'dr'}`}>{p.status === 'published' ? 'প্রকাশিত' : 'খসড়া'}</span>{' '}
                    {p.source === 'api' && <span className="badge api">API</span>}
                  </td>
                  <td className="meta" style={{ whiteSpace: 'nowrap' }}>{bnDateTime(p.published_at)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link className="btn small" href={`/admin/posts/${p.id}`}>সম্পাদনা</Link>
                      {p.status === 'published' && (
                        <Link className="btn small" href={`/news/${encodeURIComponent(p.slug)}`} target="_blank">দেখুন</Link>
                      )}
                      <form action={setStatusAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value={p.status === 'published' ? 'draft' : 'published'} />
                        <button className="btn small" type="submit">{p.status === 'published' ? 'খসড়া করুন' : 'প্রকাশ করুন'}</button>
                      </form>
                      <form action={deletePostAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmButton className="btn small danger" message="এই খবর মুছে ফেলবেন? আর ফেরানো যাবে না।">মুছুন</ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="pager">
          {page > 1 && <Link className="btn" href={qs({ page: String(page - 1) })}>← আগের</Link>}
          <span className="meta" style={{ alignSelf: 'center' }}>{page.toLocaleString('bn-BD')} / {pages.toLocaleString('bn-BD')}</span>
          {page < pages && <Link className="btn" href={qs({ page: String(page + 1) })}>পরের →</Link>}
        </div>
      )}
    </>
  );
}
