import Link from 'next/link';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/config';
import { bnDateLong } from '@/lib/format';
import { buildTree, getCategories } from '@/lib/queries';

export default async function Header() {
  const tree = buildTree(await getCategories());

  return (
    <header>
      <div className="topbar">
        <div className="wrap">
          <span>{bnDateLong()}</span>
          <span>
            <Link href="/feed.xml">RSS</Link>
          </span>
        </div>
      </div>

      <div className="wrap brandrow">
        <Link href="/" className="brand" aria-label={SITE_NAME}>
          <span className="brand-name">{SITE_NAME}</span>
          <span className="brand-tag">{SITE_TAGLINE}</span>
        </Link>
        <form action="/search" className="searchform" role="search">
          <input type="search" name="q" placeholder="খুঁজুন…" aria-label="সার্চ" />
          <button type="submit">খুঁজুন</button>
        </form>
      </div>

      {/* ডেস্কটপ মেনু */}
      <nav className="nav" aria-label="প্রধান মেনু">
        <div className="wrap">
          <ul>
            <li>
              <Link className="top" href="/latest">
                সর্বশেষ
              </Link>
            </li>
            {tree.map((c) => (
              <li key={c.id}>
                <Link className="top" href={`/category/${c.slug}`}>
                  {c.name}
                </Link>
                {c.children.length > 0 && (
                  <div className="drop">
                    {c.children.map((s) => (
                      <Link key={s.id} href={`/category/${s.slug}`}>
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* মোবাইল মেনু (JavaScript ছাড়াই চলে) */}
      <details className="mobile-menu">
        <summary className="wrap">☰ মেনু</summary>
        <div className="wrap mm-body">
          <form action="/search" className="searchform" style={{ display: 'flex', marginBottom: 10 }}>
            <input type="search" name="q" placeholder="খুঁজুন…" aria-label="সার্চ" style={{ flex: 1 }} />
            <button type="submit">খুঁজুন</button>
          </form>
          <div className="mm-group">
            <Link href="/latest">সর্বশেষ</Link>
          </div>
          {tree.map((c) => (
            <div className="mm-group" key={c.id}>
              <Link href={`/category/${c.slug}`}>{c.name}</Link>
              {c.children.length > 0 && (
                <div className="mm-sub">
                  {c.children.map((s) => (
                    <Link key={s.id} href={`/category/${s.slug}`}>
                      {s.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </details>
    </header>
  );
}
