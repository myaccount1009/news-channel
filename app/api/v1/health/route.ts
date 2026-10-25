import type { NextRequest } from 'next/server';
import { handle, json } from '@/lib/api';
import { SITE_NAME, siteUrl } from '@/lib/config';
import { isConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** n8n এ key ঠিক আছে কিনা পরীক্ষা করতে: GET /api/v1/health */
export async function GET(req: NextRequest) {
  return handle(req, async () =>
    json({ ok: true, site: SITE_NAME, url: siteUrl(), supabase_configured: isConfigured(), time: new Date().toISOString() }),
  );
}
