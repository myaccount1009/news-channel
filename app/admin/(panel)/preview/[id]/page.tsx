import { notFound } from 'next/navigation';
import ArticleView from '@/components/site/ArticleView';
import { adminGetPost } from '@/lib/admin-queries';
import { requireAdmin } from '@/lib/auth';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const post = await adminGetPost((await params).id);
  if (!post) notFound();
  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 10 }}>
      <ArticleView post={post} draft={post.status !== 'published'} />
    </div>
  );
}
