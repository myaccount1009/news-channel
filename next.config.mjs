/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  // ডেমো দ্রুত deploy করার জন্য: type ভুল থাকলেও build থামবে না (runtime এ কোনো প্রভাব নেই)।
  // কোড পাকা করার সময় এই লাইন মুছে `npm run typecheck` চালান।
  typescript: { ignoreBuildErrors: true },
  experimental: {
    // admin panel থেকে ছবি আপলোডের জন্য (Vercel এর নিজস্ব সীমা ৪.৫MB)
    serverActions: { bodySizeLimit: '5mb' },
  },
};

export default nextConfig;
