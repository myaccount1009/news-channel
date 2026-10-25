'use server';

import { redirect } from 'next/navigation';
import { checkCredentials, createSession, destroySession, requireAdmin } from '@/lib/auth';
import { ApiError, errorMessage } from '@/lib/errors';
import { slugify, fromDhakaInput } from '@/lib/format';
import { MAX_IMAGE_BYTES, uploadImage } from '@/lib/images';
import { createPost, deletePost, revalidateSite, updatePost } from '@/lib/posts';
import { db } from '@/lib/supabase';

const txt = (fd: FormData, key: string): string => {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
};

const back = (path: string, params: Record<string, string>): never => {
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `${path}?${qs}` : path);
};

// ---------------- login / logout ----------------
export async function loginAction(fd: FormData): Promise<void> {
  const ok = checkCredentials(txt(fd, 'email'), String(fd.get('password') ?? ''));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800)); // brute-force ধীর করতে
    back('/admin/login', { error: '1' });
  }
  await createSession();
  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/admin/login');
}

// ---------------- posts ----------------
export async function savePostAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = txt(fd, 'id');
  const failPath = id ? `/admin/posts/${id}` : '/admin/posts/new';

  let error = '';
  let warning = '';
  try {
    // ছবি: ফাইল আপলোড হলে সেটাই, নইলে লিংক
    let imageUrl = txt(fd, 'image_url');
    const file = fd.get('image_file');
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_IMAGE_BYTES) throw new ApiError(400, 'ছবি ৪MB এর বেশি হতে পারবে না');
      imageUrl = await uploadImage(Buffer.from(await file.arrayBuffer()));
    }

    const publishedRaw = txt(fd, 'published_at');
    const input = {
      title: txt(fd, 'title'),
      content: String(fd.get('content') ?? ''),
      excerpt: txt(fd, 'excerpt'),
      category_id: txt(fd, 'category_id'),
      tags: txt(fd, 'tags'),
      author: txt(fd, 'author'),
      image_url: imageUrl,
      image_alt: txt(fd, 'image_alt'),
      source_url: txt(fd, 'source_url'),
      status: txt(fd, 'status') || 'published',
      is_featured: fd.get('is_featured') === 'on',
      published_at: publishedRaw ? fromDhakaInput(publishedRaw) : '',
    };

    if (id) {
      const r = await updatePost(id, input);
      warning = r.warnings.join(' | ');
    } else {
      const r = await createPost(input, 'admin');
      warning = r.warnings.join(' | ');
      if (r.duplicate) warning = 'এই source_url দিয়ে আগেই একটি খবর আছে, নতুন বানানো হয়নি।';
    }
  } catch (e) {
    error = e instanceof ApiError ? e.message : errorMessage(e);
  }

  if (error) back(failPath, { err: error });
  back('/admin/posts', warning ? { saved: '1', warn: warning } : { saved: '1' });
}

export async function deletePostAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = txt(fd, 'id');
  let error = '';
  try {
    await deletePost(id);
  } catch (e) {
    error = errorMessage(e);
  }
  back('/admin/posts', error ? { err: error } : { deleted: '1' });
}

export async function setStatusAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = txt(fd, 'id');
  const status = txt(fd, 'status');
  let error = '';
  try {
    await updatePost(id, { status });
  } catch (e) {
    error = errorMessage(e);
  }
  back('/admin/posts', error ? { err: error } : { saved: '1' });
}

// ---------------- categories ----------------
export async function createCategoryAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const name = txt(fd, 'name');
  const parent = txt(fd, 'parent_id') || null;
  const slug = slugify(txt(fd, 'slug') || name, 60);
  const supa = db();
  if (!supa) back('/admin/categories', { err: 'Supabase সংযুক্ত নেই' });
  if (name.length < 2) back('/admin/categories', { err: 'নাম লিখুন (কমপক্ষে ২ অক্ষর)' });

  const { count } = await supa!.from('categories').select('id', { count: 'exact', head: true });
  const { error } = await supa!
    .from('categories')
    .insert({ name, slug, parent_id: parent, sort_order: (count ?? 0) + 1 });
  if (error) {
    back('/admin/categories', { err: error.code === '23505' ? 'এই slug আগেই আছে' : error.message });
  }
  revalidateSite();
  back('/admin/categories', { saved: '1' });
}

export async function deleteCategoryAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const supa = db();
  if (!supa) back('/admin/categories', { err: 'Supabase সংযুক্ত নেই' });
  const { error } = await supa!.from('categories').delete().eq('id', txt(fd, 'id'));
  if (error) back('/admin/categories', { err: error.message });
  revalidateSite();
  back('/admin/categories', { deleted: '1' });
}
