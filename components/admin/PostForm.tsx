import Link from 'next/link';
import { toDhakaInput } from '@/lib/format';
import type { Category, Post } from '@/lib/types';
import { savePostAction } from '@/app/admin/actions';

export default function PostForm({ post, categories }: { post?: Post; categories: Category[] }) {
  const tops = categories.filter((c) => !c.parent_id);
  const status = post?.status ?? 'published';
  const publishedAt = toDhakaInput(post?.published_at ?? new Date());

  return (
    <form action={savePostAction} encType="multipart/form-data">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="form-grid">
        {/* ---- বাম: লেখা ---- */}
        <div className="panel">
          <div className="field">
            <label htmlFor="title">শিরোনাম *</label>
            <input id="title" name="title" type="text" required minLength={3} maxLength={300} defaultValue={post?.title ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="excerpt">সারাংশ</label>
            <textarea id="excerpt" name="excerpt" rows={3} defaultValue={post?.excerpt ?? ''} />
            <small>খালি রাখলে লেখার শুরু থেকে নিজে নিজে তৈরি হবে।</small>
          </div>
          <div className="field">
            <label htmlFor="content">বিস্তারিত *</label>
            <textarea id="content" name="content" className="big" required defaultValue={post?.content ?? ''} />
            <small>
              ফাঁকা লাইন দিয়ে অনুচ্ছেদ আলাদা করুন। চাইলে <code>&lt;p&gt;</code>, <code>&lt;h2&gt;</code>, <code>&lt;strong&gt;</code>, <code>&lt;a&gt;</code>,{' '}
              <code>&lt;img&gt;</code> HTML ও দিতে পারেন। script বা অন্য বিপজ্জনক কোড নিজে থেকে মুছে যায়।
            </small>
          </div>
        </div>

        {/* ---- ডান: সেটিংস ---- */}
        <div>
          <div className="panel">
            <div className="field">
              <label htmlFor="status">অবস্থা</label>
              <select id="status" name="status" defaultValue={status}>
                <option value="published">প্রকাশিত</option>
                <option value="draft">খসড়া</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="published_at">প্রকাশের সময় (ঢাকা)</label>
              <input id="published_at" name="published_at" type="datetime-local" defaultValue={publishedAt} />
              <small>ভবিষ্যতের সময় দিলে ওই সময়ের আগে খবরটি দেখা যাবে না।</small>
            </div>
            <label className="check">
              <input type="checkbox" name="is_featured" defaultChecked={post?.is_featured ?? false} /> হোমপেজের প্রধান খবর
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button className="btn primary" type="submit">সংরক্ষণ করুন</button>
              <Link className="btn" href="/admin/posts">বাতিল</Link>
            </div>
          </div>

          <div className="panel">
            <div className="field">
              <label htmlFor="category_id">ক্যাটেগরি</label>
              <select id="category_id" name="category_id" defaultValue={post?.category_id ?? ''}>
                <option value="">— ডিফল্ট —</option>
                {tops.map((t) => {
                  const subs = categories.filter((c) => c.parent_id === t.id);
                  return subs.length ? (
                    <optgroup key={t.id} label={t.name}>
                      <option value={t.id}>{t.name} (সাধারণ)</option>
                      {subs.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </optgroup>
                  ) : (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  );
                })}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tags">ট্যাগ</label>
              <input id="tags" name="tags" type="text" defaultValue={post?.tags.join(', ') ?? ''} placeholder="কমা দিয়ে লিখুন" />
            </div>
            <div className="field">
              <label htmlFor="author">লেখক / প্রতিবেদক</label>
              <input id="author" name="author" type="text" defaultValue={post?.author ?? ''} />
            </div>
          </div>

          <div className="panel">
            <div className="field">
              <label>প্রধান ছবি</label>
              {post?.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="preview-img" src={post.image_url} alt="" />
              )}
              <input name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" />
              <small>সর্বোচ্চ ৪MB। ফাইল বেছে নিলে নিচের লিংকের বদলে এটাই ব্যবহার হবে।</small>
            </div>
            <div className="field">
              <label htmlFor="image_url">অথবা ছবির লিংক</label>
              <input id="image_url" name="image_url" type="url" defaultValue={post?.image_url ?? ''} placeholder="https://…" />
              <small>নতুন লিংক দিলে ছবিটি নিজের Storage এ কপি হয়ে যায়। খালি করলে ছবি মুছে যায়।</small>
            </div>
            <div className="field">
              <label htmlFor="image_alt">ছবির ক্যাপশন / alt</label>
              <input id="image_alt" name="image_alt" type="text" defaultValue={post?.image_alt ?? ''} />
            </div>
          </div>

          <div className="panel">
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="source_url">মূল সূত্রের লিংক</label>
              <input id="source_url" name="source_url" type="url" defaultValue={post?.source_url ?? ''} placeholder="https://…" />
              <small>একই লিংক দিয়ে দুইবার খবর বসানো ঠেকাতে ব্যবহার হয়।</small>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
