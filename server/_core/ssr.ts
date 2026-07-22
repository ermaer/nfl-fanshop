/**
 * SSR Middleware — serves fully-rendered HTML to search engine crawlers.
 *
 * Bot user-agents receive: complete meta tags, JSON-LD structured data,
 * textual content, and navigation links — everything needed for indexing.
 * Human users receive the SPA as normal (pass-through).
 *
 * This is a "hybrid SSR" approach: full content for bots, interactive SPA for humans.
 */

import type { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

// ── Crawler Detection ──────────────────────────────────────────────────────────

const CRAWLER_PATTERNS = [
  // Search engines
  "googlebot",          "google-structured-data-testing-tool",
  "bingbot",            "slurp",
  "duckduckbot",        "baiduspider",
  "yandexbot",          "petalbot",
  // Social
  "twitterbot",         "facebot",
  "facebookexternalhit","linkedinbot",
  // AI / LLM
  "gptbot",             "chatgpt-user",
  "perplexitybot",      "anthropic-ai",
  "ccbot",              "bytespider",
  "amazonbot",          "applebot",
  // SEO tools
  "ahrefsbot",          "semrushbot",
  "mj12bot",            "dotbot",
  "rogerbot",
  // Google tools
  "adsbot-google",      "apis-google",
  "mediapartners-google","google-read-aloud",
  // Archive / general
  "ia_archiver",        "archive.org_bot",
];

function isCrawler(req: Request): boolean {
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  return CRAWLER_PATTERNS.some(p => ua.includes(p));
}

// ── Template ───────────────────────────────────────────────────────────────────

let _templateCache: string | null = null;

function getTemplate(): string {
  if (_templateCache) return _templateCache;
  const distPath = path.resolve(import.meta.dirname, "..", "..", "dist", "public", "index.html");
  if (fs.existsSync(distPath)) {
    _templateCache = fs.readFileSync(distPath, "utf-8");
    return _templateCache;
  }
  // Fallback for dev mode
  const devPath = path.resolve(import.meta.dirname, "..", "..", "client", "index.html");
  if (fs.existsSync(devPath)) {
    _templateCache = fs.readFileSync(devPath, "utf-8");
    return _templateCache;
  }
  return "<!doctype html><html><head></head><body></body></html>";
}

// ── HTML Renderers per Route ────────────────────────────────────────────────────

const BASE_URL = process.env.VITE_BASE_URL || "https://nflfanshop.vip";

function headTags(page: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: string;
}): string {
  const img = page.image || `${BASE_URL}/og-image.png`;
  const type = page.type || "website";
  return [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${esc(page.url)}">`,
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:url" content="${esc(page.url)}">`,
    `<meta property="og:type" content="${esc(type)}">`,
    `<meta property="og:image" content="${esc(img)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(page.title)}">`,
    `<meta name="twitter:description" content="${esc(page.description)}">`,
    `<meta name="twitter:image" content="${esc(img)}">`,
  ].join("\n    ");
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Page Data ───────────────────────────────────────────────────────────────────

interface TeamData {
  id: number;
  name: string;
  city: string;
  abbreviation: string;
  conference: string;
  division: string;
  primaryColor: string;
  secondaryColor: string;
}

interface ProductWithTeam {
  product: {
    id: number;
    name: string;
    description: string | null;
    productType: "tshirt" | "dress";
    priceCents: number;
    imageUrl: string | null;
    inStock: boolean;
  };
  team: TeamData;
}

let _teamsCache: TeamData[] | null = null;
let _productsCache: ProductWithTeam[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

async function loadData() {
  const now = Date.now();
  if (_teamsCache && _productsCache && now - _cacheTime < CACHE_TTL) {
    return { teams: _teamsCache, products: _productsCache };
  }

  const { getDb } = await import("../db");
  const { teams: teamsTbl, products: productsTbl } = await import("../../drizzle/schema");
  const db = await getDb();

  if (db) {
    const [teams, rawProducts] = await Promise.all([
      db.select().from(teamsTbl).orderBy(teamsTbl.id),
      db.select().from(productsTbl).orderBy(productsTbl.id),
    ]);

    _teamsCache = teams;
    // Join products with teams
    _productsCache = rawProducts.map(p => ({
      product: {
        id: p.id,
        name: p.name,
        description: p.description,
        productType: p.productType,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        inStock: p.inStock,
      },
      team: teams.find(t => t.id === p.teamId) || teams[0],
    }));
  } else {
    _teamsCache = [];
    _productsCache = [];
  }

  _cacheTime = now;
  return { teams: _teamsCache!, products: _productsCache! };
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── Page Renderers ──────────────────────────────────────────────────────────────

function renderHomePage(products: ProductWithTeam[], teams: TeamData[]): string {
  const featured = products.slice(0, 8);
  const productCards = featured.map(p => `
    <li>
      <a href="${BASE_URL}/product/${p.product.id}" style="color:var(--color-text-primary)">
        <strong>${esc(p.product.name)}</strong> — ${esc(p.team.city)} ${esc(p.team.name)}<br>
        ${formatPrice(p.product.priceCents)} · ${p.product.productType === "tshirt" ? "T-Shirt" : "Dress"}
      </a>
    </li>`).join("\n");

  const teamLinks = teams.map(t =>
    `<a href="${BASE_URL}/shop?team=${t.abbreviation}" title="${esc(t.city)} ${esc(t.name)}" style="display:inline-block;margin:4px;padding:4px 8px;background:${t.primaryColor};color:${t.secondaryColor};font-size:12px;text-decoration:none">${t.abbreviation}</a>`
  ).join("\n");

  return `
    <div id="root">
      <h1>NFL Fan Shop — Premium Team T-Shirts &amp; Dresses for All 32 Teams</h1>
      <p>Shop premium NFL fan gear. Team t-shirts from $34.99. Women's game-day dresses from $59.99. Free US shipping on all orders.</p>
      <nav>
        <a href="${BASE_URL}/shop">Shop All Gear</a> |
        <a href="${BASE_URL}/teams">Browse Teams</a> |
        <a href="${BASE_URL}/buying-guide">Buying Guide</a> |
        <a href="${BASE_URL}/size-guide">Size Guide</a> |
        <a href="${BASE_URL}/faq">FAQ</a> |
        <a href="${BASE_URL}/about">About</a>
      </nav>

      <h2>All 32 NFL Teams</h2>
      <div>${teamLinks}</div>

      <h2>Featured Products</h2>
      <ul>${productCards}</ul>

      <p style="margin-top:40px;font-size:12px">
        <em>NFL Fan Shop · All 32 Teams · T-Shirts $34.99 · Dresses $59.99 · Free US Shipping · Est. 2026</em>
      </p>
    </div>`;
}

function renderShopPage(products: ProductWithTeam[]): string {
  const productList = products.map(p => `
    <li>
      <a href="${BASE_URL}/product/${p.product.id}">
        <strong>${esc(p.product.name)}</strong> — ${esc(p.team.city)} ${esc(p.team.name)}
      </a>
      · ${formatPrice(p.product.priceCents)}
      · ${p.product.productType === "tshirt" ? "T-Shirt" : "Dress"}
      · ${p.product.inStock ? "In Stock" : "Sold Out"}
    </li>`).join("\n");

  return `
    <div id="root">
      <h1>NFL Fan Shop — Browse All Team T-Shirts &amp; Dresses</h1>
      <p>Browse our full collection of NFL fan gear for all 32 teams. Premium team t-shirts from $34.99 and women's game-day dresses from $59.99.</p>
      <nav>
        <a href="${BASE_URL}/">Home</a> |
        <a href="${BASE_URL}/teams">Teams</a> |
        <a href="${BASE_URL}/buying-guide">Buying Guide</a> |
        <a href="${BASE_URL}/size-guide">Size Guide</a>
      </nav>
      <h2>All Products (${products.length})</h2>
      <ul>${productList}</ul>
    </div>`;
}

function renderProductPage(p: ProductWithTeam): string {
  const images = p.product.imageUrl
    ? `<img src="${BASE_URL}${p.product.imageUrl}" alt="${esc(p.product.name)}" style="max-width:400px;height:auto">`
    : "";

  return `
    <div id="root">
      <nav><a href="${BASE_URL}/shop">← Back to Shop</a></nav>
      <h1>${esc(p.product.name)}</h1>
      <p>${esc(p.team.city)} ${esc(p.team.name)} · ${p.product.productType === "tshirt" ? "T-Shirt" : "Women's Dress"}</p>
      <p style="font-size:24px;font-weight:bold">${formatPrice(p.product.priceCents)}</p>
      ${images}
      ${p.product.description ? `<p>${esc(p.product.description)}</p>` : ""}
      <p>Sizes: XS, S, M, L, XL, XXL, 3XL</p>
      <p>Status: ${p.product.inStock ? "In Stock" : "Sold Out"}</p>
    </div>`;
}

function renderTeamsPage(teams: TeamData[]): string {
  const divisions = ["AFC East","AFC North","AFC South","AFC West","NFC East","NFC North","NFC South","NFC West"];
  const sections = divisions.map(div => {
    const divTeams = teams.filter(t => t.division === div);
    const list = divTeams.map(t =>
      `<li><a href="${BASE_URL}/shop?team=${t.abbreviation}">${esc(t.city)} ${esc(t.name)} (${t.abbreviation})</a></li>`
    ).join("\n");
    return `<h2>${div}</h2><ul>${list}</ul>`;
  }).join("\n");

  return `
    <div id="root">
      <h1>All 32 NFL Teams — Browse Fan Gear by Franchise</h1>
      <p>Browse NFL fan gear for all 32 teams organized by conference and division. T-shirts from $34.99, dresses from $59.99.</p>
      <nav><a href="${BASE_URL}/">Home</a> | <a href="${BASE_URL}/shop">Shop</a></nav>
      ${sections}
    </div>`;
}

function renderStaticPage(title: string, description: string, content: string, links: string): string {
  return `
    <div id="root">
      <h1>${esc(title)}</h1>
      <p>${esc(description)}</p>
      <nav>${links}</nav>
      ${content}
    </div>`;
}

// ── JSON-LD Generators ──────────────────────────────────────────────────────────

function organizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NFL Fan Shop",
    "url": BASE_URL,
    "description": "Premium NFL fan gear for all 32 teams — team t-shirts and women's game-day dresses.",
    "foundingDate": "2026",
  });
}

function webSiteJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "NFL Fan Shop",
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": `${BASE_URL}/shop?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  });
}

function productJsonLd(p: ProductWithTeam): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.product.name,
    "description": p.product.description || `${p.team.city} ${p.team.name} fan gear.`,
    "sku": `NFL-${p.team.abbreviation}-${p.product.productType.toUpperCase()}-${p.product.id}`,
    "image": p.product.imageUrl ? `${BASE_URL}${p.product.imageUrl}` : undefined,
    "brand": { "@type": "Brand", "name": "NFL Fan Shop" },
    "offers": {
      "@type": "Offer",
      "url": `${BASE_URL}/product/${p.product.id}`,
      "priceCurrency": "USD",
      "price": (p.product.priceCents / 100).toFixed(2),
      "availability": p.product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
    },
  });
}

function itemListJsonLd(items: { url: string; name: string; price: string }[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": item.name,
        "url": item.url,
        "offers": { "@type": "Offer", "price": item.price, "priceCurrency": "USD" },
      },
    })),
  });
}

function breadcrumbJsonLd(items: { name: string; url: string }[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem", "position": i + 1, "name": item.name, "item": item.url,
    })),
  });
}

// ── Main Render Entry ───────────────────────────────────────────────────────────

async function renderForBot(url: string): Promise<string | null> {
  const template = getTemplate();
  if (!template) return null;

  const { teams, products } = await loadData();
  const parsed = new URL(url, BASE_URL);
  const pathname = parsed.pathname;

  let meta: { title: string; description: string; url: string; image?: string; type?: string } | null = null;
  let body = "";
  let extraJsonLd = "";

  // ── Route matching ─────────────────────────────────────────────────

  if (pathname === "/") {
    meta = {
      title: "NFL Fan Shop – Team T-Shirts & Dresses for All 32 Teams",
      description: "Shop premium NFL fan gear for all 32 teams. Browse our collection of team t-shirts ($34.99) and women's game-day dresses ($59.99). Rep your colors in style on game day.",
      url: `${BASE_URL}/`,
    };
    body = renderHomePage(products, teams);
    extraJsonLd += `<script type="application/ld+json">${itemListJsonLd(
      products.slice(0, 8).map(p => ({
        url: `${BASE_URL}/product/${p.product.id}`,
        name: p.product.name,
        price: (p.product.priceCents / 100).toFixed(2),
      }))
    )}</script>`;
  } else if (pathname === "/shop") {
    meta = {
      title: "NFL Fan Shop – Browse All Team T-Shirts & Dresses",
      description: "Browse our full collection of NFL fan gear for all 32 teams. Premium team t-shirts from $34.99 and women's game-day dresses from $59.99.",
      url: `${BASE_URL}/shop`,
    };
    body = renderShopPage(products);
    extraJsonLd += `<script type="application/ld+json">${itemListJsonLd(
      products.map(p => ({
        url: `${BASE_URL}/product/${p.product.id}`,
        name: p.product.name,
        price: (p.product.priceCents / 100).toFixed(2),
      }))
    )}</script>`;
  } else if (pathname === "/teams") {
    meta = {
      title: "All 32 NFL Teams – Browse Fan Gear by Franchise | NFL Fan Shop",
      description: "Browse NFL fan gear for all 32 teams organized by conference and division. Find premium t-shirts ($34.99) and women's dresses ($59.99) for your favorite AFC and NFC franchises.",
      url: `${BASE_URL}/teams`,
    };
    body = renderTeamsPage(teams);
  } else if (pathname.startsWith("/product/")) {
    const id = parseInt(pathname.split("/")[2]);
    const p = products.find(pp => pp.product.id === id);
    if (!p) return null;

    meta = {
      title: `${p.product.name} – ${p.team.city} ${p.team.name} | NFL Fan Shop`,
      description: `Buy ${p.product.name} for ${p.team.city} ${p.team.name}. Premium ${p.product.productType === "tshirt" ? "team t-shirt" : "women's game-day dress"} — ${formatPrice(p.product.priceCents)}. Free US shipping.`,
      url: `${BASE_URL}/product/${id}`,
      image: p.product.imageUrl ? `${BASE_URL}${p.product.imageUrl}` : undefined,
      type: "product",
    };
    body = renderProductPage(p);
    extraJsonLd += `<script type="application/ld+json">${productJsonLd(p)}</script>`;
    extraJsonLd += `<script type="application/ld+json">${breadcrumbJsonLd([
      { name: "Home", url: `${BASE_URL}/` },
      { name: "Shop", url: `${BASE_URL}/shop` },
      { name: p.product.name, url: `${BASE_URL}/product/${p.product.id}` },
    ])}</script>`;
  } else if (pathname === "/buying-guide") {
    meta = {
      title: "NFL Fan Gear Buying Guide 2026 – How to Choose the Right Team Apparel | NFL Fan Shop",
      description: "Complete guide to buying NFL fan gear in 2026. Compare t-shirts vs dresses, find your team's tier, check sizing, and learn where to get the best value for all 32 NFL teams.",
      url: `${BASE_URL}/buying-guide`,
      type: "article",
    };
    body = renderStaticPage(
      "NFL Fan Gear Buying Guide 2026",
      "Complete guide to buying NFL fan gear. Compare t-shirts ($34.99) vs dresses ($59.99), find your team's tier, check sizing, and get the best value across all 32 NFL franchises.",
      `<section><h2>Key Facts</h2><p>32 Teams Covered · T-Shirts $34.99 · Dresses $59.99 · Free US Shipping · 30-Day Returns · Est. 2026</p></section>
       <section><h2>How to Buy: 4-Step Process</h2><ol><li>Pick Your Team — Browse all 32 franchises</li><li>Choose Your Style — T-shirt or dress</li><li>Check the Size Guide — XS–3XL with inch/cm measurements</li><li>Secure Checkout — Powered by Stripe</li></ol></section>`,
      `<a href="${BASE_URL}/">Home</a> | <a href="${BASE_URL}/shop">Shop</a> | <a href="${BASE_URL}/size-guide">Size Guide</a>`,
    );
  } else if (pathname === "/size-guide") {
    meta = {
      title: "NFL Fan Shop Size Guide – T-Shirt & Dress Measurements (XS–3XL)",
      description: "Complete size chart with inch and centimeter measurements for NFL t-shirts and women's dresses. Chest, waist, hip, length, sleeve measurements for sizes XS through 3XL.",
      url: `${BASE_URL}/size-guide`,
      type: "article",
    };
    body = renderStaticPage(
      "Size Guide & Measurements",
      "Complete size chart with inch and centimeter measurements for all NFL t-shirts and women's dresses (XS–3XL). Fabric: 60% Cotton / 40% Polyester blend.",
      `<section><h2>T-Shirt Sizes</h2><p>XS: 34-36" chest · S: 36-38" · M: 38-40" · L: 40-43" · XL: 43-46" · XXL: 46-49" · 3XL: 49-52"</p></section>
       <section><h2>Dress Sizes</h2><p>XS: 32-34" chest / 24-26" waist · S: 34-36"/26-28" · M: 36-38"/28-30" · L: 38-40"/30-33" · XL: 40-43"/33-36" · XXL: 43-46"/36-39" · 3XL: 46-49"/39-42"</p></section>
       <section><h2>Fabric Specs</h2><p>60% Combed Cotton / 40% Polyester · 5.3 oz/yd² · &lt;3% shrinkage</p></section>`,
      `<a href="${BASE_URL}/">Home</a> | <a href="${BASE_URL}/buying-guide">Buying Guide</a>`,
    );
  } else if (pathname === "/faq") {
    meta = {
      title: "FAQ – Frequently Asked Questions | NFL Fan Shop",
      description: "Find answers about NFL Fan Shop — sizing, shipping, pricing ($34.99 tees, $59.99 dresses), returns, team availability, bulk orders, and payment methods for all 32 NFL teams.",
      url: `${BASE_URL}/faq`,
    };
    body = renderStaticPage(
      "Frequently Asked Questions",
      "Answers to common questions about pricing, sizing, shipping, returns, and team availability.",
      `<section><h3>What teams do you sell?</h3><p>All 32 NFL teams — every franchise from AFC East to NFC West.</p>
       <h3>How much do t-shirts and dresses cost?</h3><p>T-shirts $34.99, dresses $59.99. Free US shipping.</p>
       <h3>What sizes?</h3><p>XS, S, M, L, XL, XXL, 3XL. See our size guide for measurements.</p>
       <h3>Shipping time?</h3><p>5-7 business days within US. Express 2-3 days.</p>
       <h3>Return policy?</h3><p>30-day returns on unworn items with tags.</p>
       <h3>Payment methods?</h3><p>Visa, MC, Amex, Discover, Apple Pay, Google Pay via Stripe.</p></section>`,
      `<a href="${BASE_URL}/">Home</a> | <a href="${BASE_URL}/shop">Shop</a> | <a href="${BASE_URL}/size-guide">Size Guide</a>`,
    );
  } else if (pathname === "/news") {
    meta = {
      title: "NFL News & Fan Guides – Latest Updates | NFL Fan Shop",
      description: "Stay updated with the latest NFL news, team spotlights, draft analysis, free agency reports, and fan gear buying guides. New articles every week.",
      url: `${BASE_URL}/news`,
    };
    body = renderStaticPage(
      "NFL News & Fan Guides",
      "Latest team updates, draft analysis, free agency reports, and gear buying guides for all 32 NFL franchises.",
      `<p>Visit this page for the latest NFL news articles, team spotlights, and fan gear guides. Updated weekly throughout the season.</p>`,
      `<a href="${BASE_URL}/">Home</a> | <a href="${BASE_URL}/shop">Shop</a> | <a href="${BASE_URL}/buying-guide">Buying Guide</a>`,
    );
  } else if (pathname.startsWith("/news/")) {
    // For individual news articles, render a minimal page (SSR will try to load article by slug)
    const newsSlug = pathname.split("/news/")[1];
    // Render a placeholder since we can't easily join articles from cache here
    // Crawlers will get the meta + JSON-LD from the SPA hydration anyway
    meta = {
      title: "NFL Fan Shop News",
      description: "Read the latest NFL news and fan gear guides from NFL Fan Shop.",
      url: `${BASE_URL}/news/${newsSlug}`,
      type: "article",
    };
    body = renderStaticPage(
      "NFL Fan Shop News Article",
      "Read the latest NFL news and fan gear guides.",
      `<p>Loading article...</p>`,
      `<a href="${BASE_URL}/news">← All News</a> | <a href="${BASE_URL}/">Home</a>`,
    );
  } else if (pathname === "/about") {
    meta = {
      title: "About NFL Fan Shop – Premium Fan Apparel for All 32 Teams",
      description: "Learn about NFL Fan Shop — a fan-made apparel brand offering premium t-shirts ($34.99) and dresses ($59.99) for all 32 NFL teams. Designed by fans, for fans.",
      url: `${BASE_URL}/about`,
    };
    body = renderStaticPage(
      "About NFL Fan Shop",
      "Fan-made apparel for all 32 NFL teams. Premium t-shirts ($34.99) and dresses ($59.99). Designed by fans, for fans. Est. 2026.",
      `<p>NFL Fan Shop was born from a simple idea: every fan deserves to rep their team in style without breaking the bank. We cover all 32 NFL franchises — from the Dallas Cowboys and Kansas City Chiefs to the Green Bay Packers and San Francisco 49ers.</p>`,
      `<a href="${BASE_URL}/">Home</a> | <a href="${BASE_URL}/shop">Shop</a> | <a href="${BASE_URL}/teams">Teams</a>`,
    );
  }

  if (!meta || !body) return null;

  // ── Assemble final HTML ────────────────────────────────────────────────

  // Build JSON-LD block
  const jsonLd = [
    organizationJsonLd(),
    webSiteJsonLd(),
    extraJsonLd,
  ].filter(Boolean).map(json =>
    `<script type="application/ld+json">${json}</script>`
  ).join("\n    ");

  // Inject head tags and body content into template
  // Strategy: keep the original template's script tag for SPA hydration.
  // Crawlers see the pre-rendered body + full meta; humans get the interactive SPA.
  const html = template
    // Replace existing title
    .replace(/<title>.*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    // Add OG + Twitter + Canonical after charset meta
    .replace(
      /(<meta charset="UTF-8"[^>]*>)/,
      `$1\n    ${headTags(meta)}`
    )
    // Replace empty root div with pre-rendered content (keep original script tag for hydration)
    .replace(
      '<div id="root"></div>',
      `${body}`
    )
    // Add JSON-LD before closing head
    .replace(
      "</head>",
      `    ${jsonLd}\n  </head>`
    );

  return html;
}

// ── Express Middleware ──────────────────────────────────────────────────────────

export function ssrMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isCrawler(req)) {
      return next();
    }

    // Skip API routes and assets
    const url = req.originalUrl;
    if (url.startsWith("/api/") || url.startsWith("/assets/") || url.includes(".")) {
      return next();
    }

    try {
      const html = await renderForBot(url);
      if (html) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("X-Render-Mode", "ssr-bot");
        res.send(html);
        return;
      }
    } catch (err) {
      console.warn("[SSR] Render failed for", url, err);
    }

    // Fallback: serve SPA normally
    next();
  };
}
