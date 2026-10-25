import type { NextRequest } from 'next/server';
import { handle, json } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { MAX_IMAGE_BYTES, uploadImage } from '@/lib/images';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/v1/upload — ছবি আপলোড করে public URL ফেরত দেয়।
 * দুইভাবে পাঠানো যায়:
 *   ১) multipart/form-data, field নাম "file"   (n8n: Body Content Type = Form-Data, Binary File)
 *   ২) সরাসরি binary body                      (n8n: Body Content Type = n8n Binary File)
 * পাওয়া URL টা পরে POST /api/v1/posts এ image_url হিসেবে দিন।
 */
export async function POST(req: NextRequest) {
  return handle(req, async () => {
    const type = req.headers.get('content-type') || '';
    let buf: Buffer;

    if (type.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (!(file instanceof File)) throw new ApiError(400, 'Send the image in a form field named "file"');
      buf = Buffer.from(await file.arrayBuffer());
    } else {
      buf = Buffer.from(await req.arrayBuffer());
    }

    if (!buf.length) throw new ApiError(400, 'Empty body: no image received');
    if (buf.length > MAX_IMAGE_BYTES) throw new ApiError(413, 'Image is larger than 4MB');

    try {
      return json({ ok: true, url: await uploadImage(buf) }, 201);
    } catch (e) {
      throw new ApiError(422, e instanceof Error ? e.message : 'Upload failed');
    }
  });
}
