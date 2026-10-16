// Step 3 of 3: pushes filled-in translations (from .notion-translations/)
// back to Notion as a linked row, then removes the queue file.
// Run with: npm run translate:apply
import { readdirSync, readFileSync, unlinkSync } from 'node:fs';
import {
  requireEnv, notion, DATABASE_ID, buildTranslatedRichText,
  appendChildrenChunked, archiveAllChildren,
} from './notion-translate-lib.ts';

requireEnv();

const QUEUE_DIR = '.notion-translations';

async function applyOne(file: string) {
  const item = JSON.parse(readFileSync(`${QUEUE_DIR}/${file}`, 'utf-8'));

  if (item.translatedTitle == null || item.blockTranslations == null) {
    console.log(`Skipping ${file}: not translated yet.`);
    return;
  }
  if (item.blockTranslations.length !== item.blockTexts.length) {
    console.error(`Skipping ${file}: blockTranslations length does not match blockTexts.`);
    return;
  }

  const translatedBlocks = item.blocks.map((entry: any) => {
    if (entry.translatableIndex === null) return entry.block;
    const block = entry.block;
    const translated = item.blockTranslations[entry.translatableIndex];
    block[block.type].rich_text = buildTranslatedRichText(block[block.type].rich_text, translated);
    return block;
  });

  const properties: Record<string, any> = {
    [item.titleKey]: { title: [{ text: { content: item.translatedTitle } }] },
    language: { select: { name: item.targetLang } },
    autoTranslated: { checkbox: true },
    translationOf: { relation: [{ id: item.pageId }] },
    sourceEditedTime: { date: { start: item.sourceEditedTime } },
  };
  if (item.stage) properties.stage = { select: { name: item.stage } };
  if (item.status) properties.status = { select: { name: item.status } };
  if (item.cover) properties.cover = { url: item.cover };

  if (item.existingTranslationPageId) {
    await notion(`/pages/${item.existingTranslationPageId}`, { method: 'PATCH', body: JSON.stringify({ properties }) });
    await archiveAllChildren(item.existingTranslationPageId);
    await appendChildrenChunked(item.existingTranslationPageId, translatedBlocks);
    console.log(`Updated translation: "${item.translatedTitle}"`);
  } else {
    const created = await notion(`/pages`, {
      method: 'POST',
      body: JSON.stringify({ parent: { database_id: DATABASE_ID }, properties }),
    });
    await appendChildrenChunked(created.id, translatedBlocks);
    console.log(`Created translation: "${item.translatedTitle}" (${created.id})`);
  }

  unlinkSync(`${QUEUE_DIR}/${file}`);
}

async function main() {
  let files: string[] = [];
  try {
    files = readdirSync(QUEUE_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    console.log(`No ${QUEUE_DIR}/ directory - nothing to apply. Run "npm run translate:prepare" first.`);
    return;
  }

  if (files.length === 0) {
    console.log('Nothing queued.');
    return;
  }

  for (const file of files) {
    try {
      await applyOne(file);
    } catch (err) {
      console.error(`Failed on ${file}:`, err);
    }
  }
}

main();
