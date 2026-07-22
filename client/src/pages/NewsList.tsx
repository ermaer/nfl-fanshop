import ShopLayout from "@/components/ShopLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useSeoHead } from "@/lib/useSeoHead";
import { ArrowRight, Calendar, Tag } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const CATEGORIES = [
  { value: "news", label: "NFL News" },
  { value: "guide", label: "Fan Guides" },
  { value: "team-spotlight", label: "Team Spotlight" },
  { value: "draft", label: "Draft" },
  { value: "free-agency", label: "Free Agency" },
  { value: "season-preview", label: "Season Preview" },
];

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function NewsList() {
  const [category, setCategory] = useState<string>("");
  const { data: articles, isLoading } = trpc.news.list.useQuery(
    category ? { category } : undefined,
  );

  useSeoHead({
    title: category
      ? `NFL ${CATEGORIES.find(c => c.value === category)?.label || "News"} – Latest Updates | NFL Fan Shop`
      : "NFL News & Fan Guides – Latest Team Updates, Draft, Free Agency | NFL Fan Shop",
    description: "Stay updated with the latest NFL news, team spotlights, draft analysis, free agency reports, and fan gear buying guides. New articles every week.",
    url: `/news${category ? `?category=${category}` : ""}`,
  });

  return (
    <ShopLayout>
      <div className="container py-12 max-w-4xl">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ NEWS & INSIGHTS ]</p>
        <h1 className="font-display font-black text-3xl md:text-5xl neon-text-cyan tracking-wide mb-4">
          NFL NEWS & FAN GUIDES
        </h1>
        <p className="font-tech text-sm text-muted-foreground tracking-wide mb-8">
          Latest updates, team spotlights, and gear guides for all 32 NFL franchises.
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={category === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory("")}
            className={category === "" ? "font-tech tracking-wider neon-glow-pink" : "font-tech tracking-wider border-border text-muted-foreground"}
          >
            ALL
          </Button>
          {CATEGORIES.map(c => (
            <Button
              key={c.value}
              variant={category === c.value ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(c.value)}
              className={category === c.value ? "font-tech tracking-wider neon-glow-pink" : "font-tech tracking-wider border-border text-muted-foreground"}
            >
              {c.label.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Articles */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="space-y-6">
            {articles.map(article => (
              <Link key={article.id} href={`/news/${article.slug}`}>
                <div className="group hud-corners border border-border/70 bg-card p-6 hover:neon-border-cyan transition-all duration-200 cursor-pointer flex flex-col md:flex-row gap-6">
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full md:w-48 h-32 object-cover border border-border/40 shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-tech text-[10px] tracking-[0.2em] px-2 py-0.5 border border-cyan-400/30 text-cyan-300">
                        {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                      </span>
                      <span className="font-tech text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {article.publishedAt ? formatDate(article.publishedAt) : "Draft"}
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-lg tracking-wide group-hover:neon-text-cyan transition-colors mb-2">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="font-tech text-sm text-muted-foreground tracking-wide leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="mt-3 font-tech text-xs tracking-[0.2em] neon-text-pink group-hover:neon-glow-pink transition-all inline-flex items-center gap-1">
                      READ MORE <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border py-24 text-center">
            <p className="font-tech tracking-[0.3em] text-muted-foreground mb-4">[ NO ARTICLES FOUND ]</p>
            <p className="font-tech text-sm text-muted-foreground tracking-wide">
              Check back soon for the latest NFL news and fan gear guides.
            </p>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
