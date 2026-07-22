import type { Product, Team } from "../../../drizzle/schema";
import { formatPrice } from "./money";

/**
 * Injects Product structured data (JSON-LD) for search engine rich results.
 * Uses Schema.org Product with Offer, aggregateRating.
 */
export function injectProductJsonLd(product: Product, team: Team, inject: (json: Record<string, unknown>) => () => void) {
  const baseUrl = import.meta.env.VITE_BASE_URL || "";
  const productUrl = `${baseUrl}/product/${product.id}`;

  inject({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${team.city} ${team.name} official fan gear — premium ${product.productType === "tshirt" ? "team t-shirt" : "women's game-day dress"} for true fans.`,
    "image": product.imageUrl ? `${baseUrl}${product.imageUrl}` : undefined,
    "sku": `NFL-${team.abbreviation}-${product.productType.toUpperCase()}-${product.id}`,
    "brand": {
      "@type": "Brand",
      "name": "NFL Fan Shop",
    },
    "category": product.productType === "tshirt" ? "T-Shirt" : "Dress",
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "USD",
      "price": formatPrice(product.priceCents).replace("$", ""),
      "availability": product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "NFL Fan Shop",
    },
  });
}

/**
 * Injects BreadcrumbList JSON-LD for navigation breadcrumbs.
 */
export function injectBreadcrumbJsonLd(
  items: { name: string; url: string }[],
  inject: (json: Record<string, unknown>) => () => void,
) {
  const baseUrl = import.meta.env.VITE_BASE_URL || "";

  inject({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": `${baseUrl}${item.url}`,
    })),
  });
}

/**
 * Injects FAQPage JSON-LD for FAQ content.
 */
export function injectFaqJsonLd(
  faqs: { question: string; answer: string }[],
  inject: (json: Record<string, unknown>) => () => void,
) {
  inject({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  });
}

/**
 * Injects ItemList JSON-LD for product list pages (shop, team pages).
 */
export function injectItemListJsonLd(
  items: { url: string; name: string; image?: string; price?: string }[],
  inject: (json: Record<string, unknown>) => () => void,
) {
  const baseUrl = import.meta.env.VITE_BASE_URL || "";

  inject({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": item.name,
        "url": `${baseUrl}${item.url}`,
        ...(item.image ? { "image": `${baseUrl}${item.image}` } : {}),
        ...(item.price
          ? {
            "offers": {
              "@type": "Offer",
              "price": item.price,
              "priceCurrency": "USD",
            },
          }
          : {}),
      },
    })),
  });
}
