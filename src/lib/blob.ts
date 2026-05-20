import { put } from "@vercel/blob";

/**
 * Checks if a URL is a temporary Notion-hosted URL.
 */
export function isNotionUrl(url: string | null): boolean {
  if (!url) return false;
  return url.includes("amazonaws.com") || url.includes("notion-static");
}

/**
 * Uploads an image to Vercel Blob if it's a Notion URL.
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

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.split("/")[1] || "jpg";
    const blob = await response.blob();

    // Upload to Vercel Blob
    // We use addRandomSuffix: false to avoid accumulating blobs if we re-upload the same key
    const { url: permanentUrl } = await put(`articles/${key}.${extension}`, blob, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });

    return permanentUrl;
  } catch (error) {
    console.error(`Error uploading to Vercel Blob:`, error);
    return url;
  }
}
