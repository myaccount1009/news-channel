// তারিখ/সময় সবসময় ঢাকার সময়ে, বাংলা অঙ্কে দেখানো হয়।
const TZ = 'Asia/Dhaka';

const fLong = new Intl.DateTimeFormat('bn-BD', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const fShort = new Intl.DateTimeFormat('bn-BD', {
  timeZone: TZ,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const fTime = new Intl.DateTimeFormat('bn-BD', {
  timeZone: TZ,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const rtf = new Intl.RelativeTimeFormat('bn', { numeric: 'auto' });

export function bnDateLong(d: Date | string = new Date()): string {
  return fLong.format(new Date(d));
}

export function bnDate(d: Date | string): string {
  return fShort.format(new Date(d));
}

export function bnTime(d: Date | string): string {
  return fTime.format(new Date(d));
}

export function bnDateTime(d: Date | string): string {
  return `${fShort.format(new Date(d))}, ${fTime.format(new Date(d))}`;
}

export function bnRelative(d: Date | string): string {
  const diff = (new Date(d).getTime() - Date.now()) / 1000; // নেগেটিভ = অতীত
  const abs = Math.abs(diff);
  if (abs < 60) return 'এইমাত্র';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), 'day');
  return bnDate(d);
}

/** ঢাকায় কোনো ডেট-টাইম ফর্মের (datetime-local) value বানায়: "2026-10-25T19:05" */
export function toDhakaInput(d: Date | string): string {
  const t = new Date(new Date(d).getTime() + 6 * 3600 * 1000);
  return t.toISOString().slice(0, 16);
}

/** datetime-local এর value (ঢাকার সময় ধরে) থেকে ISO string */
export function fromDhakaInput(v: string): string {
  return new Date(`${v.length === 16 ? v + ':00' : v}+06:00`).toISOString();
}

/** Unicode (বাংলাসহ) বজায় রেখে URL-friendly slug */
export function slugify(input: string, max = 80): string {
  const s = input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  const cut = s.length > max ? s.slice(0, max).replace(/-[^-]*$/, '') : s;
  return cut.replace(/-+$/g, '') || 'news';
}
