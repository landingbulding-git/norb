import type { Article } from '@/src/types';

const NOTION_API_KEY = import.meta.env.NOTION_API_KEY || process.env.NOTION_API_KEY;
const DATABASE_ID = import.meta.env.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

const statusOrder: Record<string, number> = {
  pinned: 1,
  ongoing: 2,
  ended: 3,
  'in hold': 4,
};

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

    const articles: Article[] = data.results.map((page: any) => {
      const titleProp = Object.values(page.properties).find((p: any) => p.type === 'title') as any;
      return {
        id: page.id,
        title: titleProp?.title?.[0]?.plain_text || 'Untitled',
        status: page.properties.status?.select?.name || 'in hold',
        cover: page.properties.cover?.url || null,
        created: page.properties.created?.created_time || page.created_time,
        categories: (page.properties.category?.multi_select || []).map((c: any) => c.name),
      };
    });

    return articles.sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;
      if (orderA === orderB) {
        return new Date(b.created).getTime() - new Date(a.created).getTime();
      }
      return orderA - orderB;
    });
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
