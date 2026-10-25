import { redirect } from 'next/navigation';
import { authConfigured, isAdmin } from '@/lib/auth';
import { SITE_NAME } from '@/lib/config';
import { loginAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect('/admin');
  const sp = await searchParams;
  const configured = authConfigured();

  return (
    <div className="login-box">
      <h1>{SITE_NAME}</h1>
      <p className="meta" style={{ marginTop: 0 }}>
        অ্যাডমিন প্যানেলে লগইন
      </p>

      {!configured && (
        <div className="notice err">
          <b>লগইন চালু হয়নি।</b> Vercel এর Environment Variables এ <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> আর{' '}
          <code>SESSION_SECRET</code> (১৬+ অক্ষর) দিন, তারপর আবার Deploy করুন।
        </div>
      )}
      {sp.error && <div className="notice err">ইমেইল বা পাসওয়ার্ড ভুল।</div>}

      <form action={loginAction}>
        <div className="field">
          <label htmlFor="email">ইমেইল</label>
          <input id="email" name="email" type="email" required autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="password">পাসওয়ার্ড</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <button className="btn primary" type="submit" style={{ width: '100%' }}>
          লগইন
        </button>
      </form>
    </div>
  );
}
