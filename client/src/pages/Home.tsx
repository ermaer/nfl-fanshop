import ProductCard from "@/components/ProductCard";
import ShopLayout from "@/components/ShopLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { injectItemListJsonLd } from "@/lib/structuredData";
import { trpc } from "@/lib/trpc";
import { useSeoHead } from "@/lib/useSeoHead";
import { ArrowRight, Shirt, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

export default function Home() {
  const { data: teams } = trpc.teams.list.useQuery();
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery({});

  const featured = products?.slice(0, 8) ?? [];

  const { injectJsonLd } = useSeoHead({
    title: "Premium NFL Fan Gear – Team T-Shirts & Dresses for All 32 Teams",
    description: "Shop premium NFL fan gear for all 32 teams. Team t-shirts from $34.99 and women's game-day dresses from $59.99. Free shipping on all US orders.",
    url: "/",
  });

  useEffect(() => {
    if (featured.length > 0) {
      const cleanup = injectItemListJsonLd(
        featured.map(row => ({
          url: `/product/${row.product.id}`,
          name: row.product.name,
          image: row.product.imageUrl ?? undefined,
          price: (row.product.priceCents / 100).toFixed(2),
        })),
        injectJsonLd,
      );
      return cleanup;
    }
  }, [featured, injectJsonLd]);

  return (
    <ShopLayout>
      {/* Hero with video background */}
      <section className="relative overflow-hidden">
        {/* Background video: muted, autoplay, loop, object-fit:cover, no color overlay */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-100vw h-100vh object-cover"
          style={{ objectFit: "cover", width: "100vw", height: "100vh", position: "absolute", top: 0, left: 0, zIndex: 0 }}
        >
          <source src="/manus-storage/generated_video_hd_425ae3e9.mp4" type="video/mp4" />
        </video>
        <div className="container relative py-20 md:py-32" style={{ zIndex: 1 }}>
          <div className="max-w-3xl">
            <p className="font-tech text-sm tracking-[0.4em] neon-text-cyan mb-4">
              [ ALL 32 TEAMS // GAME DAY GEAR ]
            </p>
            <h1 className="font-display font-black text-4xl md:text-6xl leading-tight tracking-wide mb-6">
              <span className="neon-text-pink">SUIT UP</span>{" "}
              <span className="text-foreground">FOR THE</span>
              <br />
              <span className="neon-text-cyan">NEON GRIDIRON</span>
            </h1>
            <p className="font-tech text-black font-bold text-lg max-w-xl mb-8 tracking-wide" style={{ textShadow: "0 0 6px rgba(255,255,255,0.6), 0 1px 3px rgba(255,255,255,0.4)" }}>
              Premium fan tees & game-day dresses for every NFL franchise. Rep your colors under the stadium lights.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/shop?type=tshirt">
                <Button size="lg" className="font-tech tracking-[0.2em] neon-glow-pink gap-2">
                  <Shirt className="w-5 h-5" /> SHOP T-SHIRTS
                </Button>
              </Link>
              <Link href="/shop?type=dress">
                <Button
                  size="lg"
                  variant="outline"
                  className="font-tech tracking-[0.2em] neon-border-cyan gap-2 text-cyan-200">
                  <Sparkles className="w-5 h-5" /> SHOP DRESSES
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="hud-line w-full" />
      </section>

      {/* Teams grid */}
      <section className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ SELECT FRANCHISE ]</p>
            <h2 className="font-display font-bold text-2xl md:text-3xl neon-text-cyan tracking-wide">ALL 32 TEAMS</h2>
          </div>
          <Link href="/teams">
            <Button variant="ghost" className="font-tech tracking-widest gap-1 text-muted-foreground hover:text-foreground">
              VIEW ALL <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        {teams ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {teams.map(team => (
              <Link key={team.id} href={`/shop?team=${team.abbreviation}`}>
                <div
                  className="group aspect-square border border-border/60 bg-card hover:neon-border-pink transition-all duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                  title={`${team.city} ${team.name}`}>
                  <div
                    className="w-8 h-8 rounded-full border-2 transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: team.primaryColor,
                      borderColor: team.secondaryColor,
                      boxShadow: `0 0 10px ${team.primaryColor}`,
                    }}
                  />
                  <span className="font-tech text-[11px] tracking-wider text-muted-foreground group-hover:text-foreground">
                    {team.abbreviation}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {Array.from({ length: 32 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        )}
      </section>

      <div className="container">
        <div className="hud-line w-full" />
      </div>

      {/* Featured products */}
      <section className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ FEATURED DROPS ]</p>
            <h2 className="font-display font-bold text-2xl md:text-3xl neon-text-pink tracking-wide">HOT GEAR</h2>
          </div>
          <Link href="/shop">
            <Button variant="ghost" className="font-tech tracking-widest gap-1 text-muted-foreground hover:text-foreground">
              ALL PRODUCTS <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map(row => (
              <ProductCard key={row.product.id} product={row.product} team={row.team} />
            ))}
          </div>
        )}
      </section>

      <div className="container">
        <div className="hud-line w-full" />
      </div>

      {/* GEO Content Hub — internal linking for AI search visibility */}
      <section className="container py-16">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ FAN RESOURCES ]</p>
        <h2 className="font-display font-bold text-2xl md:text-3xl neon-text-cyan tracking-wide mb-8">GEAR GUIDES & NEWS</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/buying-guide">
            <div className="hud-corners border border-border/70 bg-card p-6 hover:neon-border-cyan transition-all duration-200 cursor-pointer group">
              <h3 className="font-display font-bold text-lg neon-text-pink group-hover:neon-text-cyan transition-colors mb-2">
                Buying Guide 2026 →
              </h3>
              <p className="font-tech text-sm text-muted-foreground tracking-wide leading-relaxed">
                How to pick the right team apparel. Compare t-shirts vs. dresses and get the best value across all 32 franchises.
              </p>
            </div>
          </Link>
          <Link href="/size-guide">
            <div className="hud-corners border border-border/70 bg-card p-6 hover:neon-border-cyan transition-all duration-200 cursor-pointer group">
              <h3 className="font-display font-bold text-lg neon-text-cyan group-hover:neon-text-pink transition-colors mb-2">
                Size Guide →
              </h3>
              <p className="font-tech text-sm text-muted-foreground tracking-wide leading-relaxed">
                Complete size charts with inch & cm measurements for t-shirts and dresses (XS–3XL).
              </p>
            </div>
          </Link>
          <Link href="/news">
            <div className="hud-corners border border-border/70 bg-card p-6 hover:neon-border-cyan transition-all duration-200 cursor-pointer group">
              <h3 className="font-display font-bold text-lg neon-text-pink group-hover:neon-text-cyan transition-colors mb-2">
                NFL News & Insights →
              </h3>
              <p className="font-tech text-sm text-muted-foreground tracking-wide leading-relaxed">
                Latest team updates, draft analysis, free agency reports, and fan gear guides. Updated weekly.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </ShopLayout>
  );
}
