import { put } from "@vercel/blob";
import sharp from "sharp";

/**
 * Checks if a URL is a temporary Notion-hosted URL.
 */
export function isNotionUrl(url: string | null): boolean {
  if (!url) return false;
  return url.includes("amazonaws.com") || url.includes("notion-static");
}

/**
 * Uploads an image to Vercel Blob if it's a Notion URL.
 * Converts it to an optimized WebP format before uploading.
 * Returns the permanent URL.
 */
export async function getPermanentUrl(url: string | null, key: string): Promise<string | null> {
  if (!url || !isNotionUrl(url)) {
    return url;
  }

  try {
    // Fetch the image
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image from Notion: ${url}`);
      return url;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to optimized WebP using sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80, effort: 4 }) // 80% quality, slightly higher compression effort
      .toBuffer();

    // Upload to Vercel Blob
    // We use addRandomSuffix: false to avoid accumulating blobs if we re-upload the same key
    const { url: permanentUrl } = await put(`articles/${key}.webp`, webpBuffer, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
    });

    return permanentUrl;
  } catch (error) {
    console.error(`Error uploading to Vercel Blob:`, error);
    return url;
  }
}
