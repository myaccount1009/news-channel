import { headers } from 'next/headers';
import { requireAdmin } from '@/lib/auth';
import { API_DEFAULT_STATUS, DEFAULT_CATEGORY_SLUG } from '@/lib/config';

export default async function ApiGuidePage() {
  await requireAdmin();
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const base = `${proto}://${host}`;
  const keyOk = Boolean((process.env.API_KEY || '').trim());

  const create = `curl -X POST ${base}/api/v1/posts \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "ঢাকায় আজ বৃষ্টির সম্ভাবনা",
    "content": "প্রথম অনুচ্ছেদ।\\n\\nদ্বিতীয় অনুচ্ছেদ।",
    "category": "national",
    "image_url": "https://example.com/photo.jpg",
    "tags": ["আবহাওয়া", "ঢাকা"],
    "author": "ডেস্ক রিপোর্ট",
    "source_url": "https://example.com/original-news-1"
  }'`;

  const created = `{
  "ok": true,
  "duplicate": false,
  "message": "created",
  "post": {
    "id": "6f1c…",
    "title": "ঢাকায় আজ বৃষ্টির সম্ভাবনা",
    "slug": "ঢাকায়-আজ-বৃষ্টির-সম্ভাবনা",
    "url": "${base}/news/…",
    "status": "${API_DEFAULT_STATUS}",
    "category": { "name": "জাতীয়", "slug": "national" }
  }
}`;

  return (
    <div className="guide">
      <h1>API ও n8n গাইড</h1>

      {keyOk ? (
        <div className="notice">সার্ভারে <code>API_KEY</code> সেট করা আছে।</div>
      ) : (
        <div className="notice err">
          <b>API_KEY সেট নেই।</b> Vercel → Settings → Environment Variables এ <code>API_KEY</code> দিন (যেকোনো লম্বা random লেখা), তারপর Redeploy করুন।
        </div>
      )}

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>মূল তথ্য</h2>
        <table>
          <tbody>
            <tr><th>Base URL</th><td><code>{base}</code></td></tr>
            <tr><th>Header (বাধ্যতামূলক)</th><td><code>x-api-key: আপনার API_KEY</code> (অথবা <code>Authorization: Bearer …</code>)</td></tr>
            <tr><th>Content-Type</th><td><code>application/json</code></td></tr>
            <tr><th>ডিফল্ট status</th><td><code>{API_DEFAULT_STATUS}</code> (<code>API_DEFAULT_STATUS</code> দিয়ে বদলানো যায়: draft হলে আগে আপনি দেখে প্রকাশ করবেন)</td></tr>
            <tr><th>ডিফল্ট ক্যাটেগরি</th><td><code>{DEFAULT_CATEGORY_SLUG}</code> (category না দিলে)</td></tr>
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Endpoints</h2>
        <table>
          <thead><tr><th>Method</th><th>পথ</th><th>কাজ</th></tr></thead>
          <tbody>
            <tr><td>GET</td><td><code>/api/v1/health</code></td><td>key ঠিক আছে কিনা পরীক্ষা</td></tr>
            <tr><td>POST</td><td><code>/api/v1/posts</code></td><td><b>নতুন খবর প্রকাশ (n8n এটাই ব্যবহার করবে)</b></td></tr>
            <tr><td>GET</td><td><code>/api/v1/posts</code></td><td>খবরের তালিকা (<code>?status=&amp;category=&amp;q=&amp;limit=&amp;page=</code>)</td></tr>
            <tr><td>GET</td><td><code>/api/v1/posts/&#123;id বা slug&#125;</code></td><td>একটি খবর (পূর্ণ লেখাসহ)</td></tr>
            <tr><td>PATCH</td><td><code>/api/v1/posts/&#123;id বা slug&#125;</code></td><td>আংশিক সম্পাদনা (শুধু পাঠানো field বদলায়)</td></tr>
            <tr><td>DELETE</td><td><code>/api/v1/posts/&#123;id বা slug&#125;</code></td><td>মুছে ফেলা</td></tr>
            <tr><td>GET</td><td><code>/api/v1/categories</code></td><td>ক্যাটেগরির তালিকা ও slug</td></tr>
            <tr><td>POST</td><td><code>/api/v1/upload</code></td><td>ছবি আপলোড (form-data, field নাম <code>file</code>) → <code>url</code></td></tr>
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>খবর পাঠানোর field</h2>
        <table>
          <thead><tr><th>Field</th><th>দরকার?</th><th>বিবরণ</th></tr></thead>
          <tbody>
            <tr><td><code>title</code></td><td>হ্যাঁ</td><td>শিরোনাম (৩–৩০০ অক্ষর)</td></tr>
            <tr><td><code>content</code></td><td>হ্যাঁ</td><td>সাধারণ লেখা (ফাঁকা লাইনে অনুচ্ছেদ) অথবা HTML। script ইত্যাদি নিজে মুছে যায়</td></tr>
            <tr><td><code>category</code></td><td>না</td><td>ক্যাটেগরির slug বা নাম, যেমন <code>sports</code>। ভুল দিলে 422 এর সাথে সঠিক তালিকা ফেরত আসে</td></tr>
            <tr><td><code>excerpt</code></td><td>না</td><td>সারাংশ। না দিলে লেখা থেকে নিজে তৈরি হয়</td></tr>
            <tr><td><code>image_url</code></td><td>না</td><td>ছবির লিংক। সার্ভার ছবিটা ডাউনলোড করে নিজের Storage এ রাখে (সর্বোচ্চ ৪MB)</td></tr>
            <tr><td><code>image_alt</code></td><td>না</td><td>ছবির ক্যাপশন (না দিলে শিরোনাম)</td></tr>
            <tr><td><code>tags</code></td><td>না</td><td>array অথবা কমা দিয়ে লেখা</td></tr>
            <tr><td><code>author</code></td><td>না</td><td>প্রতিবেদকের নাম</td></tr>
            <tr><td><code>source_url</code></td><td>প্রস্তাবিত</td><td>মূল খবরের লিংক। একই লিংক দ্বিতীয়বার পাঠালে নতুন খবর হয় না (<code>duplicate: true</code> আসে)। n8n বারবার চললেও ডুপ্লিকেট ঠেকায়</td></tr>
            <tr><td><code>status</code></td><td>না</td><td><code>published</code> বা <code>draft</code></td></tr>
            <tr><td><code>is_featured</code></td><td>না</td><td><code>true</code> হলে হোমপেজের প্রধান খবর হতে পারে</td></tr>
            <tr><td><code>published_at</code></td><td>না</td><td>ISO সময়, যেমন <code>2026-10-25T19:05:00+06:00</code></td></tr>
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>উদাহরণ (curl)</h2>
        <pre>{create}</pre>
        <p className="meta">সফল হলে (HTTP 201):</p>
        <pre>{created}</pre>
        <p className="meta">
          ভুলের কোড: <code>400</code> তথ্য ঠিক নেই · <code>401</code> key ভুল · <code>422</code> ক্যাটেগরি ভুল · <code>503</code> Supabase যুক্ত নেই · <code>200 + duplicate:true</code> আগেই আছে।
        </p>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>n8n এ সেটআপ (HTTP Request node)</h2>
        <table>
          <tbody>
            <tr><th>Method</th><td><code>POST</code></td></tr>
            <tr><th>URL</th><td><code>{base}/api/v1/posts</code></td></tr>
            <tr><th>Authentication</th><td>Generic Credential Type → Header Auth → Name: <code>x-api-key</code>, Value: আপনার API_KEY</td></tr>
            <tr><th>Send Body</th><td>চালু · Body Content Type: <code>JSON</code></td></tr>
            <tr><th>Specify Body</th><td><code>Using JSON</code> আর নিচের expression (লেখায় নতুন লাইন বা " থাকলেও ভাঙে না)</td></tr>
          </tbody>
        </table>
        <pre>{`={{ JSON.stringify({
  title: $json.title,
  content: $json.content,
  category: $json.category,
  image_url: $json.image,
  source_url: $json.link,
  tags: $json.tags,
  author: "অটো রিপোর্টার"
}) }}`}</pre>
        <p>
          তৈরি workflow ফাইল প্রজেক্টের <code>n8n/news-autopost.workflow.json</code> এ আছে। n8n এ <b>Import from file</b> দিয়ে নিন, তারপর শুধু
          URL আর API key বসান।
        </p>
      </div>
    </div>
  );
}
