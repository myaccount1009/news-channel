import Link from 'next/link';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/config';
import { buildTree, getCategories } from '@/lib/queries';

export default async function Footer() {
  const tree = buildTree(await getCategories());
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="cols">
          <div>
            <h4>{SITE_NAME}</h4>
            <p style={{ margin: 0 }}>{SITE_TAGLINE}</p>
            <p style={{ margin: '10px 0 0', fontSize: 14, color: '#9aa3ad' }}>
              এটি একটি ডেমো সাইট। এখানকার খবরগুলো নমুনা বা স্বয়ংক্রিয়ভাবে প্রকাশিত।
            </p>
          </div>
          <div>
            <h4>বিভাগ</h4>
            <ul>
              {tree.slice(0, 7).map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>আরও</h4>
            <ul>
              {tree.slice(7).map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
              <li>
                <Link href="/feed.xml">RSS ফিড</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="copy">
          © {year} {SITE_NAME}। সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
