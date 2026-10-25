import { requireAdmin } from '@/lib/auth';
import { buildTree, getCategories } from '@/lib/queries';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { createCategoryAction, deleteCategoryAction } from '../../actions';

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; err?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const cats = await getCategories();
  const tree = buildTree(cats);

  return (
    <>
      <h1>ক্যাটেগরি</h1>
      {sp.saved && <div className="notice">যোগ হয়েছে।</div>}
      {sp.deleted && <div className="notice">মুছে ফেলা হয়েছে। (এর খবরগুলো ক্যাটেগরিবিহীন থাকবে)</div>}
      {sp.err && <div className="notice err">{sp.err}</div>}

      <div className="form-grid">
        <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="t">
            <thead>
              <tr><th>নাম</th><th>slug (API তে এটা দিন)</th><th></th></tr>
            </thead>
            <tbody>
              {tree.flatMap((t) => [
                <Row key={t.id} id={t.id} name={t.name} slug={t.slug} top />,
                ...t.children.map((c) => <Row key={c.id} id={c.id} name={c.name} slug={c.slug} />),
              ])}
            </tbody>
          </table>
        </div>

        <div className="panel" style={{ alignSelf: 'start' }}>
          <b>নতুন ক্যাটেগরি</b>
          <form action={createCategoryAction} style={{ marginTop: 12 }}>
            <div className="field">
              <label htmlFor="name">নাম</label>
              <input id="name" name="name" type="text" required />
            </div>
            <div className="field">
              <label htmlFor="slug">slug (ইংরেজি, ঐচ্ছিক)</label>
              <input id="slug" name="slug" type="text" placeholder="যেমন: science" />
            </div>
            <div className="field">
              <label htmlFor="parent_id">মূল ক্যাটেগরি</label>
              <select id="parent_id" name="parent_id" defaultValue="">
                <option value="">— নেই (প্রধান মেনু) —</option>
                {tree.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <button className="btn primary" type="submit">যোগ করুন</button>
          </form>
        </div>
      </div>
    </>
  );
}

function Row({ id, name, slug, top = false }: { id: string; name: string; slug: string; top?: boolean }) {
  return (
    <tr>
      <td style={{ paddingLeft: top ? 10 : 34, fontWeight: top ? 700 : 400 }}>{top ? name : `└ ${name}`}</td>
      <td><code>{slug}</code></td>
      <td style={{ textAlign: 'right' }}>
        <form action={deleteCategoryAction}>
          <input type="hidden" name="id" value={id} />
          <ConfirmButton className="btn small danger" message={`“${name}” মুছে ফেলবেন?`}>মুছুন</ConfirmButton>
        </form>
      </td>
    </tr>
  );
}
