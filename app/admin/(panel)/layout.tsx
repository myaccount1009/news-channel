import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { SITE_NAME } from '@/lib/config';
import { logoutAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="logo">{SITE_NAME}</div>
        <Link href="/admin">ড্যাশবোর্ড</Link>
        <Link href="/admin/posts">সব খবর</Link>
        <Link href="/admin/posts/new">+ নতুন খবর</Link>
        <Link href="/admin/categories">ক্যাটেগরি</Link>
        <Link href="/admin/api-guide">API ও n8n গাইড</Link>
        <div className="grow" />
        <Link href="/" target="_blank">
          সাইট দেখুন ↗
        </Link>
        <form action={logoutAction}>
          <button className="btn small" type="submit" style={{ width: '100%', marginTop: 6 }}>
            লগআউট
          </button>
        </form>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
