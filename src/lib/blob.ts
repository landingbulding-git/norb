import { put } from "@vercel/blob";
import sharp from "sharp";

// In-memory cache to prevent concurrent processing of the same image during Astro builds
const buildCache = new Map<string, Promise<string | null>>();

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
  if (!url) return null;
  
  if (!isNotionUrl(url)) {
    return url;
  }

  // If this key is already being processed in this build, wait for its result
  if (buildCache.has(key)) {
    console.log(`[Blob] Using cached build promise for: ${key}`);
    return buildCache.get(key)!;
  }

  console.log(`[Blob] Processing Notion image: ${key}`);

  const processPromise = (async () => {
    try {
      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[Blob] Failed to fetch image from Notion: ${url} (Status: ${response.status})`);
        return url;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Convert to optimized WebP using sharp
      let webpBuffer;
      try {
        webpBuffer = await sharp(buffer)
          .webp({ quality: 80, effort: 4 })
          .toBuffer();
      } catch (sharpError) {
        console.error(`[Blob] Sharp conversion failed for ${key}:`, sharpError);
        // Fallback to original buffer if sharp fails
        const { url: fallbackUrl } = await put(`articles/${key}.original`, buffer, {
          access: 'public',
          addRandomSuffix: false,
        });
        return fallbackUrl;
      }

      // Upload to Vercel Blob
      const { url: permanentUrl } = await put(`articles/${key}.webp`, webpBuffer, {
        access: 'public',
        contentType: 'image/webp',
        addRandomSuffix: false,
      });

      console.log(`[Blob] Successfully uploaded: ${permanentUrl}`);
      return permanentUrl;
    } catch (error) {
      console.error(`[Blob] Error processing ${key}:`, error);
      return url;
    }
  })();

  buildCache.set(key, processPromise);
  return processPromise;
}
