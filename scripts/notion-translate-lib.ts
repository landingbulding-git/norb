// Shared Notion API helpers for the two-step translation pipeline
// (notion-translate-prepare.ts / notion-translate-apply.ts).
import 'dotenv/config';

export const NOTION_API_KEY = process.env.NOTION_API_KEY;
export const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_VERSION = '2022-06-28';

export const LANG_NAMES: Record<string, string> = { en: 'English', hu: 'Hungarian' };
export const OTHER_LANG: Record<string, string> = { en: 'hu', hu: 'en' };
export const TRANSLATABLE_BLOCK_TYPES = [
  'paragraph', 'heading_1', 'heading_2', 'heading_3',
  'bulleted_list_item', 'numbered_list_item', 'quote',
];

// Notion normalizes a stored date property to "+00:00" even when the
// original timestamp used "Z" - compare instants, not raw strings.
export function sameInstant(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return new Date(a).getTime() === new Date(b).getTime();
}

export function requireEnv() {
  if (!NOTION_API_KEY || !DATABASE_ID) {
    console.error('Missing NOTION_API_KEY or NOTION_DATABASE_ID in the environment.');
    process.exit(1);
  }
}

export async function notion(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Notion API error (${path}): ${JSON.stringify(data)}`);
  return data;
}

export function titlePropertyName(page: any): string {
  return Object.entries(page.properties).find(([, v]: any) => v.type === 'title')?.[0] ?? 'title';
}
export function titleText(page: any): string {
  const prop = Object.values(page.properties).find((p: any) => p.type === 'title') as any;
  return prop?.title?.[0]?.plain_text ?? 'Untitled';
}

export async function fetchAllBlocks(pageId: string) {
  const blocks: any[] = [];
  let cursor: string | undefined;
  do {
    const qs = new URLSearchParams({ page_size: '100', ...(cursor ? { start_cursor: cursor } : {}) });
    const data = await notion(`/blocks/${pageId}/children?${qs}`);
    blocks.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

export function blockPlainText(block: any): string {
  const rt = block[block.type]?.rich_text;
  if (!rt) return '';
  return rt.map((r: any) => r.plain_text).join('');
}

export function stripBlockForCreate(block: any) {
  // Notion only accepts { type, [type]: payload } when creating blocks -
  // strip read-only fields like id/created_time/last_edited_time. It also
  // rejects a null "icon" on non-callout blocks, even though fetch returns one.
  const payload = { ...block[block.type] };
  if (payload.icon === null) delete payload.icon;
  if (payload.rich_text) payload.rich_text = splitLongRichText(payload.rich_text);
  return { type: block.type, [block.type]: payload };
}

const MAX_RICH_TEXT_LEN = 2000;

function chunkText(text: string, maxLen = MAX_RICH_TEXT_LEN): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) chunks.push(text.slice(i, i + maxLen));
  return chunks;
}

// Notion rejects any rich_text run whose content exceeds 2000 chars -
// split it into several runs with the same annotations/link instead.
export function splitLongRichText(richText: any[]): any[] {
  const result: any[] = [];
  for (const run of richText) {
    const content = run.text?.content ?? '';
    for (const chunk of chunkText(content)) {
      result.push({ ...run, text: { ...run.text, content: chunk }, plain_text: chunk });
    }
  }
  return result;
}

export function buildTranslatedRichText(originalRichText: any[], translatedText: string) {
  const run = originalRichText[0];
  return splitLongRichText([{
    type: 'text',
    text: { content: translatedText, link: run?.text?.link ?? null },
    annotations: run?.annotations,
  }]);
}

// A Notion image block whose original source is an internal upload (not an
// external URL) carries a short-lived signed URL we can't recreate from.
export function isUnsupportedBlock(block: any): boolean {
  return block.type === 'image' && block.image?.type === 'file';
}

export async function appendChildrenChunked(pageId: string, blocks: any[]) {
  const CHUNK = 90;
  for (let i = 0; i < blocks.length; i += CHUNK) {
    await notion(`/blocks/${pageId}/children`, {
      method: 'PATCH',
      body: JSON.stringify({ children: blocks.slice(i, i + CHUNK) }),
    });
  }
}

export async function archiveAllChildren(pageId: string) {
  const existing = await fetchAllBlocks(pageId);
  for (const block of existing) {
    await notion(`/blocks/${block.id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) });
  }
}

export async function findExistingTranslation(originalId: string, targetLang: string) {
  const data = await notion(`/databases/${DATABASE_ID}/query`, {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        and: [
          { property: 'autoTranslated', checkbox: { equals: true } },
          { property: 'language', select: { equals: targetLang } },
          { property: 'translationOf', relation: { contains: originalId } },
        ],
      },
    }),
  });
  return data.results?.[0] ?? null;
}
