import type { NextRequest } from 'next/server';
import { handle, json, readJson } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { deletePost, getPostByIdOrSlug, serializePost, updatePost } from '@/lib/posts';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

/** id (uuid) অথবা slug দুটোই চলবে */
export async function GET(req: NextRequest, ctx: Ctx) {
  return handle(req, async () => {
    const post = await getPostByIdOrSlug((await ctx.params).id);
    if (!post) throw new ApiError(404, 'Post not found');
    return json({ ok: true, post: serializePost(post, true) });
  });
}

/** শুধু যে field গুলো পাঠাবেন সেগুলোই বদলাবে */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return handle(req, async () => {
    const body = await readJson(req);
    const { post, warnings } = await updatePost((await ctx.params).id, body);
    return json({ ok: true, post: serializePost(post), ...(warnings.length ? { warnings } : {}) });
  });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return handle(req, async () => {
    const post = await deletePost((await ctx.params).id);
    return json({ ok: true, deleted: { id: post.id, title: post.title } });
  });
}
