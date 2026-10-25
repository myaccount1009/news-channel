import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: '14vh 16px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 64, color: 'var(--red)' }}>৪০৪</h1>
      <p style={{ fontSize: 20 }}>দুঃখিত, পাতাটি খুঁজে পাওয়া যায়নি।</p>
      <p>
        <Link className="btn primary" href="/">
          হোমপেজে ফিরে যান
        </Link>
      </p>
    </div>
  );
}
