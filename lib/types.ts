export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
};

export type CategoryRef = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

export type CategoryNode = Category & { children: Category[] };

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  image_alt: string | null;
  published_at: string;
  author: string | null;
  is_featured: boolean;
  status: 'draft' | 'published';
  source: 'admin' | 'api';
  category: CategoryRef | null;
};

export type Post = PostListItem & {
  content: string;
  tags: string[];
  source_url: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
};
