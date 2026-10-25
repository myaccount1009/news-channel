import { requireAdmin } from '@/lib/auth';
import { getCategories } from '@/lib/queries';
import PostForm from '@/components/admin/PostForm';

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  return (
    <>
      <h1>নতুন খবর</h1>
      {sp.err && <div className="notice err">{sp.err}</div>}
      <PostForm categories={await getCategories()} />
    </>
  );
}
