import sanitizeHtml from 'sanitize-html';

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
    'blockquote', 'a', 'img', 'figure', 'figcaption', 'hr',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  transformTags: {
    h1: 'h2',
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
  },
};

const BLOCK_TAG = /<(p|h[1-6]|ul|ol|li|blockquote|figure|div|table|hr)[\s>/]/i;

/**
 * যেকোনো লেখা (সাধারণ টেক্সট / আংশিক HTML / পূর্ণ HTML) থেকে নিরাপদ HTML বানায়।
 * - ব্লক ট্যাগ না থাকলে ফাঁকা লাইন দিয়ে অনুচ্ছেদ (<p>) ভাগ করে
 * - script, style, onclick ইত্যাদি সব মুছে ফেলে
 */
export function normalizeContent(raw: string): string {
  const text = (raw || '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';
  let html = text;
  if (!BLOCK_TAG.test(text)) {
    html = text
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => `<p>${chunk.replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  }
  return sanitizeHtml(html, SANITIZE).trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

export function stripHtml(html: string): string {
  const text = sanitizeHtml(html || '', { allowedTags: [], allowedAttributes: {} });
  return decodeEntities(text).replace(/\s+/g, ' ').trim();
}

export function excerptFrom(html: string, max = 180): string {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
