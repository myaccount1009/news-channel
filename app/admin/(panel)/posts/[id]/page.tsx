import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminGetPost } from '@/lib/admin-queries';
import { requireAdmin } from '@/lib/auth';
import { getCategories } from '@/lib/queries';
import PostForm from '@/components/admin/PostForm';

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const post = await adminGetPost(id);
  if (!post) notFound();

  return (
    <>
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>খবর সম্পাদনা</h1>
        <span style={{ display: 'flex', gap: 8 }}>
          <Link className="btn small" href={`/admin/preview/${post.id}`} target="_blank">প্রিভিউ</Link>
          {post.status === 'published' && (
            <Link className="btn small" href={`/news/${encodeURIComponent(post.slug)}`} target="_blank">সাইটে দেখুন ↗</Link>
          )}
        </span>
      </div>
      {sp.err && <div className="notice err">{sp.err}</div>}
      <PostForm post={post} categories={await getCategories()} />
    </>
  );
}
