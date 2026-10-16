import type { Article } from '@/src/types';

const NOTION_API_KEY = import.meta.env.NOTION_API_KEY || process.env.NOTION_API_KEY;
const DATABASE_ID = import.meta.env.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

export async function fetchLiveArticles(lang: string): Promise<Article[]> {
  if (!NOTION_API_KEY || !DATABASE_ID) return [];

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: 'stage', select: { equals: 'live' } },
            { property: 'language', select: { equals: lang } }
          ]
        }
      })
    });

    const data = await response.json();
    if (!data.results) return [];

    const articles: Article[] = await Promise.all(data.results.map(async (page: any) => {
      const titleProp = Object.values(page.properties).find((p: any) => p.type === 'title') as any;
      let created = page.properties.created?.created_time || page.created_time;

      // Notion's "created" field is auto-set and can't be overwritten, so a
      // translation always gets its own (later) created time. Use the
      // original post's created time instead, so translations sort/display
      // alongside their original rather than at the top as "new".
      const originalId = page.properties.translationOf?.relation?.[0]?.id;
      if (originalId) {
        try {
          const originalRes = await fetch(`https://api.notion.com/v1/pages/${originalId}`, {
            headers: { 'Authorization': `Bearer ${NOTION_API_KEY}`, 'Notion-Version': '2022-06-28' }
          });
          const originalPage = await originalRes.json();
          created = originalPage.properties?.created?.created_time || originalPage.created_time || created;
        } catch {
          // fall back to the translation's own created time
        }
      }

      return {
        id: page.id,
        title: titleProp?.title?.[0]?.plain_text || 'Untitled',
        status: page.properties.status?.select?.name || 'in hold',
        cover: page.properties.cover?.url || null,
        created,
        categories: (page.properties.category?.multi_select || []).map((c: any) => c.name),
      };
    }));

    return articles.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  } catch (error) {
    console.error('Failed to fetch from Notion:', error);
    return [];
  }
}

export async function fetchArticleBlocks(id: string): Promise<any[]> {
  if (!NOTION_API_KEY) return [];

  try {
    const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${id}/children?page_size=100`, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28'
      }
    });
    const blocksData = await blocksRes.json();
    return blocksData.results || [];
  } catch (error) {
    console.error('Error fetching Notion blocks:', error);
    return [];
  }
}
