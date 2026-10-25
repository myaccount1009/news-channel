import Link from 'next/link';
import { bnRelative } from '@/lib/format';
import { buildTree, getCategories, idsWithChildren, listPosts } from '@/lib/queries';
import { Card, CategoryChip, SetupNotice, SideItem, Thumb, href } from '@/components/site/PostParts';

export const revalidate = 60;

export default async function HomePage() {
  const cats = await getCategories();
  const latest = await listPosts({ limit: 40 });
  if (!latest.length) return <SetupNotice />;

  const lead = latest.find((p) => p.is_featured) ?? latest[0];
  const rest = latest.filter((p) => p.id !== lead.id);
  const side = rest.slice(0, 4);
  const grid = rest.slice(4, 12);
  const ticker = rest.slice(12, 22);

  const blockCats = buildTree(cats)
    .filter((c) => !['video', 'photo'].includes(c.slug))
    .slice(0, 8);
  const blocks = (
    await Promise.all(
      blockCats.map(async (c) => ({
        cat: c,
        posts: await listPosts({ categoryIds: idsWithChildren(cats, c.id), limit: 5 }),
      })),
    )
  ).filter((b) => b.posts.length > 0);

  return (
    <div className="grid-main">
      <div>
        <section className="hero">
          <article className="lead">
            <Link href={href(lead)}>
              <Thumb post={lead} eager />
              <h1>{lead.title}</h1>
            </Link>
            {lead.excerpt && <p>{lead.excerpt}</p>}
            <div className="meta" style={{ marginTop: 6 }}>
              <CategoryChip post={lead} /> {bnRelative(lead.published_at)}
            </div>
          </article>
          <div className="stack">
            {side.map((p) => (
              <SideItem key={p.id} post={p} />
            ))}
          </div>
        </section>

        {grid.length > 0 && (
          <section className="section">
            <div className="cards">
              {grid.map((p) => (
                <Card key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        {blocks.map(({ cat, posts }) => {
          const [big, ...others] = posts;
          return (
            <section className="section" key={cat.id}>
              <div className="section-head">
                <h2>{cat.name}</h2>
                <Link className="more" href={`/category/${cat.slug}`}>
                  আরও খবর →
                </Link>
              </div>
              <div className="block">
                <article className="big">
                  <Link href={href(big)}>
                    <Thumb post={big} />
                    <h3>{big.title}</h3>
                  </Link>
                  {big.excerpt && <p>{big.excerpt}</p>}
                </article>
                <ul>
                  {others.map((p) => (
                    <li key={p.id}>
                      <Link href={href(p)}>{p.title}</Link>
                      <time dateTime={p.published_at}>{bnRelative(p.published_at)}</time>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>

      <aside className="sidebar">
        <div className="adslot">বিজ্ঞাপন</div>
        <div className="box" style={{ marginTop: 22 }}>
          <h3>সর্বশেষ</h3>
          <ol>
            {(ticker.length ? ticker : rest.slice(0, 8)).map((p) => (
              <li key={p.id}>
                <Link href={href(p)}>{p.title}</Link>
              </li>
            ))}
          </ol>
          <div style={{ paddingTop: 10 }}>
            <Link className="meta" href="/latest">
              সব সর্বশেষ খবর →
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
