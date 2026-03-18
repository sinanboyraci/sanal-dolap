import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function setupServer(app: express.Express) {
  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/config", (req, res) => {
    res.json({ geminiApiKey: process.env.GEMINI_API_KEY || '' });
  });

  app.get("/api/scrape-product", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) return res.status(400).json({ error: "URL is required" });

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
      let response = await fetchWithHeaders(targetUrl);

      // If blocked or 404, try Microlink immediately as fallback
      if (!response.ok || response.status === 403 || response.status === 404) {
        const mlRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false`);
        const mlJson = await mlRes.json();
        if (mlJson.status === 'success' && mlJson.data?.screenshot?.url) {
          imageUrls.push(mlJson.data.screenshot.url);
        }
      } else {
        const html = await response.text();

        // Use regex for simple server-side extraction without heavy DOM libraries
        const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
        if (ogImageMatch) imageUrls.push(ogImageMatch[1]);

        const twitterImageMatch = html.match(/name="twitter:image"\s+content="([^"]+)"/);
        if (twitterImageMatch) imageUrls.push(twitterImageMatch[1]);

        // Look for large images or product images in common patterns
        const imgMatches = html.matchAll(/<img[^>]+src="([^">]+(jpg|jpeg|png|webp)[^">]*)"/gi);
        for (const match of Array.from(imgMatches).slice(0, 10)) {
          const src = match[1];
          if (!src.includes('logo') && !src.includes('icon') && !src.includes('avatar')) {
            imageUrls.push(src);
          }
        }
      }

      // De-duplicate and normalize URLs
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

      res.json({ imageUrls: finalUrls });
    } catch (error) {
      console.error("Scrape error:", error);
      res.status(500).json({ error: "Failed to scrape product" });
    }
  });

  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ error: "URL is required" });
      }

      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Accept": req.headers.accept || "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Referer": new URL(imageUrl).origin
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch image" });
      }

      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      // Cache for 1 day
      res.setHeader("Cache-Control", "public, max-age=86400");

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

// Vercel middleware or static files are handled by vercel.json 
// so we don't need to run Vite middleware here when deploying.

async function startServerLocal(app: express.Express, PORT: number) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Ensure the Express app is created and exported for Serverless
const app = express();
setupServer(app);

if (process.env.NODE_ENV !== "production") {
  // Only for local development
  const PORT = 3000;
  startServerLocal(app, PORT);
}

export default app;
