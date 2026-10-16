// Step 1 of 3: finds blog posts whose translation is missing or stale and
// queues their text for translation as JSON files in .notion-translations/.
// Run with: npm run translate:prepare
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  requireEnv, notion, DATABASE_ID, titlePropertyName, titleText,
  fetchAllBlocks, blockPlainText, stripBlockForCreate, sameInstant,
  TRANSLATABLE_BLOCK_TYPES, LANG_NAMES, OTHER_LANG, findExistingTranslation,
  isUnsupportedBlock, reuploadImage,
} from './notion-translate-lib.ts';

requireEnv();

const QUEUE_DIR = '.notion-translations';

async function main() {
  mkdirSync(QUEUE_DIR, { recursive: true });

  const data = await notion(`/databases/${DATABASE_ID}/query`, {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        and: [
          { property: 'autoTranslated', checkbox: { equals: false } },
          { property: 'stage', select: { equals: 'live' } },
        ],
      },
    }),
  });
  const originals = data.results || [];
  console.log(`Found ${originals.length} live, human-written post(s) to check.`);

  let queued = 0;
  for (const original of originals) {
    const sourceLang = original.properties.language?.select?.name;
    if (!sourceLang || !LANG_NAMES[sourceLang]) {
      console.warn(`Skipping "${titleText(original)}" (${original.id}): no valid "language" property set.`);
      continue;
    }

    const targetLang = OTHER_LANG[sourceLang];
    const existing = await findExistingTranslation(original.id, targetLang);
    const isStale = !existing || !sameInstant(existing.properties.sourceEditedTime?.date?.start, original.last_edited_time);

    if (!isStale) {
      console.log(`Up to date: "${titleText(original)}" -> ${targetLang}`);
      continue;
    }

    const originalBlocks = await fetchAllBlocks(original.id);
    const blockTexts: string[] = [];
    const blocks = await Promise.all(originalBlocks.map(async (block: any) => {
      if (isUnsupportedBlock(block)) {
        // Internal (signed, short-lived) upload URL - re-upload the bytes now,
        // while the source URL is still fresh, so the image survives into the
        // translated page instead of being silently dropped.
        const uploadId = await reuploadImage(block.image.file.url, `${block.id}.png`);
        if (uploadId) {
          return {
            block: { type: 'image', image: { type: 'file_upload', file_upload: { id: uploadId }, caption: block.image.caption || [] } },
            translatableIndex: null,
          };
        }
      }
      const stripped = stripBlockForCreate(block);
      if (TRANSLATABLE_BLOCK_TYPES.includes(block.type)) {
        const text = blockPlainText(block);
        if (text.trim()) {
          blockTexts.push(text);
          return { block: stripped, translatableIndex: blockTexts.length - 1 };
        }
      }
      return { block: stripped, translatableIndex: null };
    }));

    const queueItem = {
      pageId: original.id,
      existingTranslationPageId: existing?.id ?? null,
      sourceLang,
      targetLang,
      sourceEditedTime: original.last_edited_time,
      titleKey: titlePropertyName(original),
      title: titleText(original),
      translatedTitle: null,
      stage: original.properties.stage?.select?.name ?? null,
      status: original.properties.status?.select?.name ?? null,
      cover: original.properties.cover?.url ?? null,
      category: (original.properties.category?.multi_select || []).map((c: any) => c.name),
      blocks,
      blockTexts,
      blockTranslations: null,
    };

    const file = `${QUEUE_DIR}/${original.id}.json`;
    writeFileSync(file, JSON.stringify(queueItem, null, 2));
    console.log(`Queued "${titleText(original)}" (${sourceLang} -> ${targetLang}) -> ${file}`);
    queued++;
  }

  if (queued > 0) {
    console.log(`\n${queued} post(s) queued in ${QUEUE_DIR}/.`);
    console.log('Next: ask Claude Code to fill in "translatedTitle" and "blockTranslations" in each');
    console.log('queued file (same length/order as "blockTexts"), then run: npm run translate:apply');
  } else {
    console.log('\nNothing to translate.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
