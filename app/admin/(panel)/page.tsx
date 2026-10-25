import Link from 'next/link';
import { adminListPosts, adminStats } from '@/lib/admin-queries';
import { requireAdmin } from '@/lib/auth';
import { bnDateTime } from '@/lib/format';
import { isConfigured } from '@/lib/supabase';

export default async function Dashboard() {
  await requireAdmin();
  const supaOk = isConfigured();
  const apiOk = Boolean((process.env.API_KEY || '').trim());
  const stats = await adminStats();
  const { rows } = await adminListPosts({ page: 1 });

  const bn = (n: number) => n.toLocaleString('bn-BD');

  return (
    <>
      <h1>ড্যাশবোর্ড</h1>

      {!supaOk && (
        <div className="notice err">
          <b>Supabase যুক্ত নেই।</b> <code>SUPABASE_URL</code> ও <code>SUPABASE_SERVICE_ROLE_KEY</code> সেট করে আবার Deploy করুন।
        </div>
      )}
      {!apiOk && (
        <div className="notice warn">
          <b>API_KEY সেট নেই।</b> n8n থেকে খবর পাঠাতে হলে Environment Variables এ <code>API_KEY</code> দিন।{' '}
          <Link href="/admin/api-guide" style={{ textDecoration: 'underline' }}>
            গাইড দেখুন
          </Link>
        </div>
      )}

      {stats && (
        <div className="stats">
          <div className="stat"><b>{bn(stats.total)}</b><span>মোট খবর</span></div>
          <div className="stat"><b>{bn(stats.published)}</b><span>প্রকাশিত</span></div>
          <div className="stat"><b>{bn(stats.drafts)}</b><span>খসড়া</span></div>
          <div className="stat"><b>{bn(stats.viaApi)}</b><span>API/n8n থেকে</span></div>
          <div className="stat"><b>{bn(stats.today)}</b><span>আজ যোগ হয়েছে</span></div>
        </div>
      )}

      <div className="panel">
        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
          <b>সর্বশেষ খবর</b>
          <Link className="btn primary small" href="/admin/posts/new">+ নতুন খবর</Link>
        </div>
        {rows.length === 0 ? (
          <div className="empty">এখনো কোনো খবর নেই।</div>
        ) : (
          <table className="t">
            <thead>
              <tr><th>শিরোনাম</th><th>ক্যাটেগরি</th><th>অবস্থা</th><th>সময়</th></tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/admin/posts/${p.id}`}>{p.title}</Link></td>
                  <td>{p.category?.name ?? '—'}</td>
                  <td>
                    <span className={`badge ${p.status === 'published' ? 'pub' : 'dr'}`}>{p.status === 'published' ? 'প্রকাশিত' : 'খসড়া'}</span>{' '}
                    {p.source === 'api' && <span className="badge api">API</span>}
                  </td>
                  <td className="meta">{bnDateTime(p.published_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
