# নিউজ পোর্টাল (ডেমো)

Next.js 15 + Supabase + Vercel। এতে আছে:

- **পাবলিক নিউজ সাইট**: হোম, ক্যাটেগরি (উপ-ক্যাটেগরিসহ), খবরের পাতা, সর্বশেষ, সার্চ, ট্যাগ, RSS (`/feed.xml`), sitemap, মোবাইল মেনু
- **অ্যাডমিন প্যানেল** (`/admin`): লগইন, ড্যাশবোর্ড, খবর যোগ/সম্পাদনা/মোছা/খসড়া-প্রকাশ, ছবি আপলোড, প্রিভিউ, ক্যাটেগরি ম্যানেজ, API গাইড
- **REST API** (`/api/v1/...`): n8n এর HTTP Request node দিয়ে খবর পাঠানোর জন্য
- **n8n workflow** (`n8n/news-autopost.workflow.json`): RSS → API, import করলেই চলে

---

## ১. Supabase সেটআপ (একবার)

1. [supabase.com](https://supabase.com) → **New project** (পাসওয়ার্ড লিখে রাখুন)।
2. বাঁ মেনু **SQL Editor → New query** → `supabase/schema.sql` ফাইলের পুরো লেখা paste করে **Run**।
   এতে টেবিল, ক্যাটেগরি (বিএনউজ ধাঁচের ১২টি + উপ-ক্যাটেগরি) আর `news-images` ছবির bucket তৈরি হবে।
3. **Project Settings → API** থেকে দুটো জিনিস কপি করুন:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ `service_role` key কাউকে দেবেন না, GitHub এ তুলবেন না। শুধু Vercel এর Environment Variables এ বসবে।

## ২. নিজের কম্পিউটারে চালানো (ঐচ্ছিক)

```bash
npm install
cp .env.example .env.local      # তারপর ফাইলটা খুলে মান বসান
npm run dev                     # http://localhost:3000
npm run seed                    # ২৫টি ডেমো খবর বসায় (ডেমো দেখানোর জন্য ভালো)
```

গোপন মান বানানোর কমান্ড (`SESSION_SECRET` ও `API_KEY` এর জন্য, আলাদা আলাদা বার চালান):

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

## ৩. GitHub এ তোলা

```bash
git init
git add .
git commit -m "News portal demo"
git branch -M main
git remote add origin https://github.com/আপনার-নাম/news-portal.git
git push -u origin main
```

`.env.local` নিজে থেকেই `.gitignore` এ আছে, তাই গোপন মান উঠবে না।

## ৪. Vercel এ Deploy

1. [vercel.com](https://vercel.com) → **Add New → Project** → GitHub repo বেছে **Import**।
2. Deploy এর আগে **Environment Variables** এ এগুলো দিন:

| নাম | মান |
|---|---|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `ADMIN_EMAIL` | আপনার অ্যাডমিন ইমেইল |
| `ADMIN_PASSWORD` | শক্ত পাসওয়ার্ড |
| `SESSION_SECRET` | ১৬+ অক্ষরের random লেখা |
| `API_KEY` | n8n যে key পাঠাবে (random লেখা) |
| `SITE_NAME` | সাইটের নাম, যেমন `নিউজ পোর্টাল` |
| `SITE_URL` | Deploy হওয়ার পর পাওয়া আসল URL, যেমন `https://xxx.vercel.app` (শেষে `/` নয়) |
| `API_DEFAULT_STATUS` | `published` (সরাসরি প্রকাশ) অথবা `draft` (আগে আপনি দেখে প্রকাশ করবেন) |

3. **Deploy** চাপুন। প্রথমবার `SITE_URL` জানা না থাকলে ফাঁকা রেখে Deploy করুন, URL পেয়ে Settings → Environment Variables এ বসিয়ে **Redeploy** দিন।
4. `https://আপনার-সাইট/admin` এ গিয়ে লগইন করুন।

## ৫. n8n থেকে খবর পাঠানো

**আগে curl দিয়ে পরীক্ষা করুন:**

```bash
curl https://আপনার-সাইট/api/v1/health -H "x-api-key: আপনার_API_KEY"

curl -X POST https://আপনার-সাইট/api/v1/posts \
  -H "x-api-key: আপনার_API_KEY" \
  -H "Content-Type: application/json" \
  -d @n8n/sample-post.json
```

**n8n এ HTTP Request node:**

| ঘর | মান |
|---|---|
| Method | `POST` |
| URL | `https://আপনার-সাইট/api/v1/posts` |
| Authentication | Generic Credential Type → **Header Auth** → Name: `x-api-key`, Value: আপনার `API_KEY` |
| Send Body | চালু, Body Content Type: `JSON`, Specify Body: `Using JSON` |
| JSON | `={{ JSON.stringify({ title: $json.title, content: $json.content, category: $json.category, image_url: $json.image, source_url: $json.link, tags: $json.tags }) }}` |

`JSON.stringify(...)` ব্যবহার করলে লেখার ভেতরের নতুন লাইন বা `"` চিহ্নে JSON ভাঙে না।

**তৈরি workflow:** n8n → **Import from file** → `n8n/news-autopost.workflow.json`। তারপর RSS লিংক, সাইটের URL আর Credential বসান।

### API সংক্ষেপে

| Method | পথ | কাজ |
|---|---|---|
| GET | `/api/v1/health` | key পরীক্ষা |
| POST | `/api/v1/posts` | **নতুন খবর** |
| GET | `/api/v1/posts` | তালিকা (`?status=&category=&q=&limit=&page=`) |
| GET / PATCH / DELETE | `/api/v1/posts/{id বা slug}` | পড়া / আংশিক বদল / মোছা |
| GET | `/api/v1/categories` | ক্যাটেগরির slug তালিকা |
| POST | `/api/v1/upload` | ছবি আপলোড (form-data, field `file`) |

খবরের field: `title`*, `content`*, `category` (slug বা নাম), `excerpt`, `image_url`, `image_alt`, `tags`, `author`, `source_url`, `status`, `is_featured`, `published_at`।
সব ব্যাখ্যা অ্যাডমিন প্যানেলের **API ও n8n গাইড** পাতায় আছে।

**গুরুত্বপূর্ণ আচরণ**

- `source_url` একই থাকলে নতুন খবর হয় না, উত্তরে `duplicate: true` আসে। তাই n8n বারবার চললেও একই খবর দুইবার ওঠে না।
- `image_url` দিলে সার্ভার ছবিটা ডাউনলোড করে নিজের Supabase Storage এ রাখে (৪MB পর্যন্ত, ভেতরের/প্রাইভেট ঠিকানা ব্লক করা)। ব্যর্থ হলে আসল লিংকই থাকে এবং `warnings` এ জানায়।
- ভুল `category` দিলে `422` এর সাথে সঠিক slug এর তালিকা ফেরত আসে।
- `content` এ HTML দিলেও `<script>`, `onclick` ইত্যাদি নিজে থেকে মুছে যায়।

## ফোল্ডার

```
app/(site)/        পাবলিক পাতা (হোম, ক্যাটেগরি, খবর, সার্চ, ট্যাগ)
app/admin/         লগইন + প্যানেল + server actions
app/api/v1/        REST API
components/        Header, Footer, কার্ড, PostForm
lib/               Supabase, auth, API সহায়ক, লেখা পরিষ্কার, ছবি আপলোড
supabase/schema.sql
n8n/               workflow + নমুনা JSON
scripts/seed-demo.mjs
```

## সীমাবদ্ধতা ও পরামর্শ

- ছবি আপলোডে Vercel এর নিজস্ব সীমা ~৪.৫MB, তাই ছবি ৪MB এর মধ্যে রাখা হয়েছে।
- সাইটের পাতা ৬০ সেকেন্ডের ক্যাশে থাকে; খবর যোগ/বদল করলেই ক্যাশ নিজে থেকে নতুন হয়ে যায়।
- Supabase বিনামূল্যের প্রজেক্ট অনেকদিন অব্যবহৃত থাকলে pause হয়ে যেতে পারে। মালিককে দেখানোর আগে dashboard এ দেখে নিন।
- অ্যাডমিনে একজনই ব্যবহারকারী (ইমেইল/পাসওয়ার্ড env থেকে)। একাধিক সম্পাদক লাগলে পরে Supabase Auth যোগ করা যাবে।
- বিজ্ঞাপনের জায়গা (`adslot`) এখন শুধু placeholder।
- অন্য সাইটের খবর অনুমতি ছাড়া হুবহু কপি করবেন না। নিজের/অনুমোদিত সূত্র বা সারাংশ ব্যবহার করুন।
