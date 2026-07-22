import { useEffect, useRef } from "react";

interface SeoHeadOptions {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
}

/**
 * Dynamically updates document head meta tags for SPA pages.
 * Sets title, og:title, og:description, og:url, og:image, twitter:* tags.
 */
export function useSeoHead({ title, description, image, url, type = "website" }: SeoHeadOptions) {
  const baseUrl = import.meta.env.VITE_BASE_URL || "";
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const mounted = useRef(false);

  useEffect(() => {
    // Set document title
    const fullTitle = `${title} | NFL Fan Shop`;
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMeta = (nameOrProp: string, value: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    // Update Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:type", type, true);
    setMeta("og:url", fullUrl, true);
    if (description) setMeta("og:description", description, true);
    if (image) setMeta("og:image", `${baseUrl}${image}`, true);

    // Update Twitter Card
    setMeta("twitter:title", fullTitle);
    if (description) setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", `${baseUrl}${image}`);

    // Update standard meta description
    if (description) setMeta("description", description);

    // Update canonical URL
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);

    mounted.current = true;
  }, [title, description, image, url, type, baseUrl]);

  // Inject JSON-LD structured data
  const injectJsonLd = (json: Record<string, unknown>) => {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(json);
    el.setAttribute("data-seo-dynamic", "true");
    document.head.appendChild(el);
    return () => el.remove();
  };

  return { injectJsonLd, baseUrl };
}
