import Breadcrumb from "@/components/Breadcrumb";
import ShopLayout from "@/components/ShopLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useSeoHead } from "@/lib/useSeoHead";
import { Calendar, Share2, User } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "wouter";

const CATEGORIES: Record<string, string> = {
  news: "NFL News",
  guide: "Fan Guide",
  "team-spotlight": "Team Spotlight",
  draft: "NFL Draft",
  "free-agency": "Free Agency",
  "season-preview": "Season Preview",
};

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = trpc.news.bySlug.useQuery({ slug: slug ?? "" }, { enabled: !!slug });

  const { injectJsonLd } = useSeoHead({
    title: article ? `${article.title} | NFL Fan Shop News` : "News | NFL Fan Shop",
    description: article?.excerpt || "Read the latest NFL news and fan gear guides from NFL Fan Shop.",
    image: article?.imageUrl ?? undefined,
    url: `/news/${slug}`,
    type: "article",
  });

  useEffect(() => {
    if (article) {
      injectJsonLd({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "description": article.excerpt || "",
        "image": article.imageUrl ? `${import.meta.env.VITE_BASE_URL || ""}${article.imageUrl}` : undefined,
        "datePublished": article.publishedAt,
        "dateModified": article.updatedAt,
        "author": {
          "@type": "Person",
          "name": article.authorName,
        },
        "publisher": {
          "@type": "Organization",
          "name": "NFL Fan Shop",
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `${import.meta.env.VITE_BASE_URL || ""}/news/${article.slug}`,
        },
      });
    }
  }, [article, injectJsonLd]);

  if (isLoading) {
    return (
      <ShopLayout>
        <div className="container py-12 max-w-3xl">
          <Skeleton className="h-6 w-24 mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-40 mb-8" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </ShopLayout>
    );
  }

  if (error || !article) {
    return (
      <ShopLayout>
        <div className="container py-24 text-center max-w-3xl">
          <p className="font-tech tracking-[0.3em] text-muted-foreground mb-6">[ ARTICLE NOT FOUND ]</p>
          <Link href="/news">
            <Button variant="outline" className="font-tech tracking-wider neon-border-cyan text-cyan-200">
              BACK TO NEWS
            </Button>
          </Link>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <Breadcrumb items={[
        { label: "News", href: "/news" },
        { label: article.title },
      ]} />
      <div className="container py-8 max-w-3xl">
        <article>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="font-tech text-[10px] tracking-[0.2em] px-2 py-0.5 border border-cyan-400/30 text-cyan-300">
                {CATEGORIES[article.category] || article.category}
              </span>
              <span className="font-tech text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {article.publishedAt ? formatDate(article.publishedAt) : "Draft"}
              </span>
              <span className="font-tech text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                {article.authorName}
              </span>
            </div>
            <h1 className="font-display font-black text-2xl md:text-4xl tracking-wide neon-text-cyan mb-4">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="font-tech text-base text-muted-foreground tracking-wide leading-relaxed border-l-2 border-cyan-400/40 pl-4">
                {article.excerpt}
              </p>
            )}
          </div>

          {/* Featured image */}
          {article.imageUrl && (
            <div className="hud-corners border border-border/70 mb-8 overflow-hidden">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="font-tech text-sm text-muted-foreground tracking-wide leading-relaxed space-y-4">
            {article.content.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Team link if applicable */}
          {article.teamId && (
            <div className="mt-10 p-4 border border-border/40 bg-secondary/20 text-center">
              <p className="font-tech text-xs text-muted-foreground tracking-wide mb-2">
                Love this team? Check out their gear:
              </p>
              <Link href="/shop">
                <Button size="sm" className="font-tech tracking-wider neon-glow-pink">
                  SHOP TEAM GEAR
                </Button>
              </Link>
            </div>
          )}
        </article>

        {/* Share */}
        <div className="mt-12 pt-6 border-t border-border/40 flex items-center justify-between">
          <Link href="/news">
            <span className="font-tech text-xs tracking-wider text-muted-foreground hover:neon-text-cyan transition-colors cursor-pointer">
              ← MORE ARTICLES
            </span>
          </Link>
          <button
            onClick={() => {
              const url = `${import.meta.env.VITE_BASE_URL || ""}/news/${article.slug}`;
              if (navigator.share) {
                navigator.share({ title: article.title, url });
              } else {
                navigator.clipboard.writeText(url);
              }
            }}
            className="font-tech text-xs tracking-wider text-muted-foreground hover:neon-text-pink transition-colors flex items-center gap-1"
          >
            <Share2 className="w-3 h-3" /> SHARE
          </button>
        </div>
      </div>
    </ShopLayout>
  );
}
