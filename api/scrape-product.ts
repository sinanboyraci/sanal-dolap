import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const targetUrl = request.query.url as string;
    if (!targetUrl) return response.status(400).json({ error: "URL is required" });

    const fetchWithHeaders = async (url: string) => {
      return fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        }
      });
    };

    let imageUrls: string[] = [];
    let fetchResponse = await fetchWithHeaders(targetUrl);

    if (!fetchResponse.ok || fetchResponse.status === 403 || fetchResponse.status === 404) {
      const mlRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false`);
      const mlJson = await mlRes.json();
      if (mlJson.status === 'success' && mlJson.data?.screenshot?.url) {
        imageUrls.push(mlJson.data.screenshot.url);
      }
    } else {
      const html = await fetchResponse.text();

      const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
      if (ogImageMatch) imageUrls.push(ogImageMatch[1]);

      const twitterImageMatch = html.match(/name="twitter:image"\s+content="([^"]+)"/);
      if (twitterImageMatch) imageUrls.push(twitterImageMatch[1]);

      const imgMatches = html.matchAll(/<img[^>]+src="([^">]+(jpg|jpeg|png|webp)[^">]*)"/gi);
      for (const match of Array.from(imgMatches).slice(0, 10)) {
        const src = match[1];
        if (!src.includes('logo') && !src.includes('icon') && !src.includes('avatar')) {
          imageUrls.push(src);
        }
      }
    }

    const finalUrls = [...new Set(imageUrls)].map(u => {
      if (u.startsWith('//')) return `https:${u}`;
      if (u.startsWith('/')) {
        try {
          const base = new URL(targetUrl);
          return `${base.origin}${u}`;
        } catch { return u; }
      }
      return u;
    });

    response.status(200).json({ imageUrls: finalUrls });
  } catch (error) {
    console.error("Scrape error:", error);
    response.status(500).json({ error: "Failed to scrape product" });
  }
}
