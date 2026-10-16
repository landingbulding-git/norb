// Translates every human-written blog post (language set, autoTranslated
// unset) into the other supported language, writing the result back to
// Notion as a linked row (translationOf relation), and keeps it in sync
// when the original changes (tracked via sourceEditedTime).
// Run with: npm run translate:blog
import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!NOTION_API_KEY || !DATABASE_ID || !GEMINI_API_KEY) {
  console.error('Missing NOTION_API_KEY, NOTION_DATABASE_ID, or GEMINI_API_KEY in the environment.');
  process.exit(1);
}

const NOTION_VERSION = '2022-06-28';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const LANG_NAMES: Record<string, string> = { en: 'English', hu: 'Hungarian' };
const OTHER_LANG: Record<string, string> = { en: 'hu', hu: 'en' };
const TRANSLATABLE_BLOCK_TYPES = [
  'paragraph', 'heading_1', 'heading_2', 'heading_3',
  'bulleted_list_item', 'numbered_list_item', 'quote',
];

async function notion(path: string, init: RequestInit = {}) {
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

function titlePropertyName(page: any): string {
  return Object.entries(page.properties).find(([, v]: any) => v.type === 'title')?.[0] ?? 'title';
}
function titleText(page: any): string {
  const prop = Object.values(page.properties).find((p: any) => p.type === 'title') as any;
  return prop?.title?.[0]?.plain_text ?? 'Untitled';
}

async function fetchAllBlocks(pageId: string) {
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

function blockPlainText(block: any): string {
  const rt = block[block.type]?.rich_text;
  if (!rt) return '';
  return rt.map((r: any) => r.plain_text).join('');
}

function stripBlockForCreate(block: any) {
  // Notion only accepts { type, [type]: payload } when creating blocks -
  // strip read-only fields like id/created_time/last_edited_time.
  return { type: block.type, [block.type]: block[block.type] };
}

function buildTranslatedRichText(originalRichText: any[], translatedText: string) {
  const run = originalRichText[0];
  return [{
    type: 'text',
    text: { content: translatedText, link: run?.text?.link ?? null },
    annotations: run?.annotations,
  }];
}

async function translateTexts(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
  if (texts.length === 0) return [];
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      `You are translating a personal blog post from ${LANG_NAMES[sourceLang]} to ${LANG_NAMES[targetLang]}.`,
      `Keep the author's voice, tone, and style - write it as a native ${LANG_NAMES[targetLang]} speaker would, not a literal word-for-word translation.`,
      `Keep names, product names, and URLs unchanged.`,
      `Translate this JSON array of strings and return ONLY a JSON array of the same length and order with the translations:`,
      JSON.stringify(texts),
    ].join('\n'),
    config: {
      responseMimeType: 'application/json',
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
  });

  const translated = JSON.parse(response.text ?? '[]');
  if (!Array.isArray(translated) || translated.length !== texts.length) {
    throw new Error('Translation response did not match the expected shape.');
  }
  return translated;
}

async function translateBlocks(blocks: any[], sourceLang: string, targetLang: string) {
  const translatableIndexes: number[] = [];
  const texts: string[] = [];
  blocks.forEach((block, i) => {
    if (TRANSLATABLE_BLOCK_TYPES.includes(block.type)) {
      const text = blockPlainText(block);
      if (text.trim()) {
        translatableIndexes.push(i);
        texts.push(text);
      }
    }
  });

  const translations = await translateTexts(texts, sourceLang, targetLang);

  return blocks.map((block, i) => {
    const idx = translatableIndexes.indexOf(i);
    const stripped = stripBlockForCreate(block);
    if (idx === -1) return stripped; // code/image/etc. - copied as-is, not translated
    stripped[block.type].rich_text = buildTranslatedRichText(block[block.type].rich_text, translations[idx]);
    return stripped;
  });
}

async function appendChildrenChunked(pageId: string, blocks: any[]) {
  const CHUNK = 90;
  for (let i = 0; i < blocks.length; i += CHUNK) {
    await notion(`/blocks/${pageId}/children`, {
      method: 'PATCH',
      body: JSON.stringify({ children: blocks.slice(i, i + CHUNK) }),
    });
  }
}

async function archiveAllChildren(pageId: string) {
  const existing = await fetchAllBlocks(pageId);
  for (const block of existing) {
    await notion(`/blocks/${block.id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) });
  }
}

async function findExistingTranslation(originalId: string, targetLang: string) {
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

async function processOriginal(original: any) {
  const sourceLang = original.properties.language?.select?.name;
  if (!sourceLang || !LANG_NAMES[sourceLang]) {
    console.warn(`Skipping "${titleText(original)}" (${original.id}): no valid "language" property set.`);
    return;
  }
  const targetLang = OTHER_LANG[sourceLang];
  const titleKey = titlePropertyName(original);
  const stage = original.properties.stage?.select?.name ?? null;
  const status = original.properties.status?.select?.name ?? null;
  const cover = original.properties.cover?.url ?? null;

  const existing = await findExistingTranslation(original.id, targetLang);

  const syncedProperties: Record<string, any> = {};
  if (stage) syncedProperties.stage = { select: { name: stage } };
  if (status) syncedProperties.status = { select: { name: status } };
  if (cover) syncedProperties.cover = { url: cover };

  const isStale = !existing || existing.properties.sourceEditedTime?.date?.start !== original.last_edited_time;

  if (!isStale) {
    // Content is up to date - still mirror lightweight fields in case they changed.
    await notion(`/pages/${existing.id}`, { method: 'PATCH', body: JSON.stringify({ properties: syncedProperties }) });
    console.log(`Up to date: "${titleText(original)}" -> ${targetLang}`);
    return;
  }

  console.log(`Translating "${titleText(original)}" (${sourceLang} -> ${targetLang})...`);

  const originalBlocks = await fetchAllBlocks(original.id);
  const [translatedTitle] = await translateTexts([titleText(original)], sourceLang, targetLang);
  const translatedBlocks = await translateBlocks(originalBlocks, sourceLang, targetLang);

  const properties = {
    [titleKey]: { title: [{ text: { content: translatedTitle } }] },
    language: { select: { name: targetLang } },
    autoTranslated: { checkbox: true },
    translationOf: { relation: [{ id: original.id }] },
    sourceEditedTime: { date: { start: original.last_edited_time } },
    ...syncedProperties,
  };

  if (existing) {
    await notion(`/pages/${existing.id}`, { method: 'PATCH', body: JSON.stringify({ properties }) });
    await archiveAllChildren(existing.id);
    await appendChildrenChunked(existing.id, translatedBlocks);
    console.log(`Updated translation: "${translatedTitle}"`);
  } else {
    const created = await notion(`/pages`, {
      method: 'POST',
      body: JSON.stringify({ parent: { database_id: DATABASE_ID }, properties }),
    });
    await appendChildrenChunked(created.id, translatedBlocks);
    console.log(`Created translation: "${translatedTitle}" (${created.id})`);
  }
}

async function main() {
  const data = await notion(`/databases/${DATABASE_ID}/query`, {
    method: 'POST',
    body: JSON.stringify({ filter: { property: 'autoTranslated', checkbox: { equals: false } } }),
  });
  const originals = data.results || [];
  console.log(`Found ${originals.length} human-written post(s) to check.`);

  for (const page of originals) {
    try {
      await processOriginal(page);
    } catch (err) {
      console.error(`Failed on "${titleText(page)}" (${page.id}):`, err);
    }
  }
}

main();
