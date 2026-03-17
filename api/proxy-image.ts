import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const imageUrl = request.query.url as string;
    if (!imageUrl) {
      return response.status(400).json({ error: "URL is required" });
    }

    const fetchResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": request.headers.accept || "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": new URL(imageUrl).origin
      }
    });

    if (!fetchResponse.ok) {
      return response.status(fetchResponse.status).json({ error: "Failed to fetch image" });
    }

    const contentType = fetchResponse.headers.get("content-type");
    if (contentType) {
      response.setHeader("Content-Type", contentType);
    }

    response.setHeader("Cache-Control", "public, max-age=86400");

    const arrayBuffer = await fetchResponse.arrayBuffer();
    response.send(Buffer.from(arrayBuffer));
  } catch (error) {
    response.status(500).json({ error: "Internal server error" });
  }
}
