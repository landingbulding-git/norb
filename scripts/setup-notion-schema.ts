// One-time (idempotent) schema setup: adds the properties the blog
// translation pipeline needs to the Notion database, if missing.
// Run with: npm run setup:notion
import 'dotenv/config';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY || !DATABASE_ID) {
  console.error('Missing NOTION_API_KEY or NOTION_DATABASE_ID in the environment.');
  process.exit(1);
}

const NOTION_VERSION = '2022-06-28';

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

async function main() {
  const db = await notion(`/databases/${DATABASE_ID}`);
  const existing = db.properties || {};
  const toAdd: Record<string, any> = {};

  if (!existing.language) {
    toAdd.language = {
      select: { options: [{ name: 'en', color: 'blue' }, { name: 'hu', color: 'green' }] },
    };
  }
  if (!existing.autoTranslated) {
    toAdd.autoTranslated = { checkbox: {} };
  }
  if (!existing.sourceEditedTime) {
    toAdd.sourceEditedTime = { date: {} };
  }
  if (!existing.translationOf) {
    toAdd.translationOf = { relation: { database_id: DATABASE_ID, single_property: {} } };
  }
  if (!existing.category) {
    toAdd.category = {
      multi_select: {
        options: [
          { name: 'Ophelia', color: 'pink' },
          { name: 'Personal', color: 'yellow' },
          { name: 'Ideas', color: 'purple' },
        ],
      },
    };
  }

  if (Object.keys(toAdd).length === 0) {
    console.log('Notion database already has all required properties.');
    return;
  }

  await notion(`/databases/${DATABASE_ID}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties: toAdd }),
  });

  console.log('Added properties:', Object.keys(toAdd).join(', '));
  console.log('\nNext: in Notion, set "language" (en or hu) on every existing post - the');
  console.log('pipeline has no way to guess which language a post was written in.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
