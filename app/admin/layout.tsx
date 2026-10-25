import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'অ্যাডমিন', template: '%s | অ্যাডমিন' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-body">{children}</div>;
}
