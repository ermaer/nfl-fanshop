import "dotenv/config";
import { eq } from "drizzle-orm";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStripeWebhook } from "../stripeWebhook";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

const BASE_URL = process.env.VITE_BASE_URL || "https://nflfanshop.vip";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Stripe webhook needs raw body — register before express.json()
  registerStripeWebhook(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Sitemap endpoint — generates dynamic sitemap with all product URLs
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const { getDb } = await import("../db");
      const { teams, products } = await import("../../drizzle/schema");
      const db = await getDb();

      let teamRows: { abbreviation: string }[] = [];
      let productRows: { id: number; updatedAt: Date | null; imageUrl: string | null }[] = [];
      let newsRows: { slug: string; updatedAt: Date | null; imageUrl: string | null }[] = [];

      if (db) {
        const { newsArticles } = await import("../../drizzle/schema");
        teamRows = await db.select({ abbreviation: teams.abbreviation }).from(teams);
        productRows = await db.select({ id: products.id, updatedAt: products.updatedAt, imageUrl: products.imageUrl }).from(products);
        newsRows = await db.select({ slug: newsArticles.slug, updatedAt: newsArticles.updatedAt })
          .from(newsArticles).where(eq(newsArticles.isPublished, true));
      }

      const lastmod = new Date().toISOString().split("T")[0];

      const urls = [
        `  <url><loc>${BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${lastmod}</lastmod></url>`,
        `  <url><loc>${BASE_URL}/shop</loc><changefreq>daily</changefreq><priority>0.9</priority><lastmod>${lastmod}</lastmod></url>`,
        `  <url><loc>${BASE_URL}/teams</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${lastmod}</lastmod></url>`,
        `  <url><loc>${BASE_URL}/buying-guide</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${lastmod}</lastmod></url>`,
        `  <url><loc>${BASE_URL}/size-guide</loc><changefreq>monthly</changefreq><priority>0.7</priority><lastmod>${lastmod}</lastmod></url>`,
        `  <url><loc>${BASE_URL}/faq</loc><changefreq>monthly</changefreq><priority>0.6</priority><lastmod>${lastmod}</lastmod></url>`,
        `  <url><loc>${BASE_URL}/about</loc><changefreq>monthly</changefreq><priority>0.5</priority><lastmod>${lastmod}</lastmod></url>`,
        `  <url><loc>${BASE_URL}/news</loc><changefreq>daily</changefreq><priority>0.8</priority><lastmod>${lastmod}</lastmod></url>`,
        `  <url><loc>${BASE_URL}/shop?type=tshirt</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
        `  <url><loc>${BASE_URL}/shop?type=dress</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
      ];

      // Add team-specific shop pages
      for (const team of teamRows) {
        urls.push(`  <url><loc>${BASE_URL}/shop?team=${team.abbreviation}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
      }

      // Add all product detail pages with images
      for (const product of productRows) {
        const prodLastmod = product.updatedAt
          ? new Date(product.updatedAt).toISOString().split("T")[0]
          : lastmod;
        const imageTag = product.imageUrl
          ? `\n      <image:image><image:loc>${BASE_URL}${product.imageUrl}</image:loc></image:image>`
          : "";
        urls.push(`  <url><loc>${BASE_URL}/product/${product.id}</loc><changefreq>weekly</changefreq><priority>0.7</priority><lastmod>${prodLastmod}</lastmod>${imageTag}</url>`);
      }

      // Add all news article pages
      for (const article of newsRows) {
        const artLastmod = article.updatedAt
          ? new Date(article.updatedAt).toISOString().split("T")[0]
          : lastmod;
        urls.push(`  <url><loc>${BASE_URL}/news/${article.slug}</loc><changefreq>daily</changefreq><priority>0.7</priority><lastmod>${artLastmod}</lastmod></url>`);
      }

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
        ...urls,
        "</urlset>",
      ].join("\n");

      res.setHeader("Content-Type", "application/xml");
      res.send(xml);
    } catch {
      res.status(500).send("Error generating sitemap");
    }
  });

  // Direct news publish endpoint
  app.get("/publish-news", async (req, res) => {
    try {
      const { key, title, slug, excerpt, content, imageUrl, category, teamId } = req.query;
      if (key !== (process.env.CRON_API_KEY || "nfl-geo-cron-2026")) {
        return res.status(403).json({ error: "Invalid API key" });
      }
      if (!title || !slug || !content) {
        return res.status(400).json({ error: "Missing required fields: title, slug, content" });
      }
      const { createNewsArticle } = await import("../db");
      await createNewsArticle({
        title: String(title),
        slug: String(slug),
        excerpt: excerpt ? String(excerpt) : null,
        content: String(content),
        imageUrl: imageUrl ? String(imageUrl) : null,
        category: category ? String(category) as any : "news",
        teamId: teamId ? parseInt(String(teamId)) : null,
        authorName: "NFL Fan Shop Editorial",
        isPublished: true,
        publishedAt: new Date(),
      });
      res.json({ success: true, slug: String(slug) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
