import { injectBreadcrumbJsonLd } from "@/lib/structuredData";
import { useSeoHead } from "@/lib/useSeoHead";
import { ChevronRight, Home } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const { injectJsonLd } = useSeoHead({ title: "" });

  useEffect(() => {
    const crumbs = [{ name: "Home", url: "/" }];
    let path = "";
    for (const item of items) {
      path = item.href || `${path}/${item.label.toLowerCase().replace(/\s+/g, "-")}`;
      crumbs.push({ name: item.label, url: path });
    }
    const cleanup = injectBreadcrumbJsonLd(crumbs, injectJsonLd);
    return cleanup;
  }, [items, injectJsonLd]);

  // Hide when only home (not meaningful)
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="container py-3">
      <ol className="flex items-center gap-1.5 font-tech text-xs tracking-wider flex-wrap">
        <li>
          <Link href="/">
            <span className="text-muted-foreground hover:neon-text-cyan transition-colors flex items-center gap-1 cursor-pointer">
              <Home className="w-3 h-3" /> HOME
            </span>
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-border" />
            {item.href && i < items.length - 1 ? (
              <Link href={item.href}>
                <span className="text-muted-foreground hover:neon-text-cyan transition-colors cursor-pointer">
                  {item.label.toUpperCase()}
                </span>
              </Link>
            ) : (
              <span className={i === items.length - 1 ? "neon-text-pink" : "text-muted-foreground"}>
                {item.label.toUpperCase()}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
