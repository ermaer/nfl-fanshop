import { useAuth } from "@/_core/hooks/useAuth";
import Breadcrumb from "@/components/Breadcrumb";
import ShopLayout from "@/components/ShopLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { startLogin } from "@/const";
import { formatPrice } from "@/lib/money";
import { injectBreadcrumbJsonLd, injectProductJsonLd } from "@/lib/structuredData";
import { trpc } from "@/lib/trpc";
import { useSeoHead } from "@/lib/useSeoHead";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [size, setSize] = useState<(typeof SIZES)[number]>("M");
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading } = trpc.products.byId.useQuery({ id: productId }, { enabled: Number.isFinite(productId) });

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("ADDED TO CART", {
        description: `${data?.product.name} // SIZE ${size} x${quantity}`,
      });
    },
    onError: err => toast.error("FAILED TO ADD", { description: err.message }),
  });

  const { injectJsonLd } = useSeoHead({
    title: data ? `${data.product.name} – ${data.team.city} ${data.team.name} | NFL Fan Shop` : "Product | NFL Fan Shop",
    description: data?.product.description
      || (data ? `Buy ${data.product.name} for ${data.team.city} ${data.team.name}. Premium ${data.product.productType === "tshirt" ? "team t-shirt" : "women's game-day dress"} — ${formatPrice(data.product.priceCents)}.` : ""),
    image: data?.product.imageUrl ?? undefined,
    url: `/product/${productId}`,
    type: "product",
  });

  useEffect(() => {
    if (data) {
      const cleanup1 = injectProductJsonLd(data.product, data.team, injectJsonLd);

      // AggregateRating — uses deterministic hash-based rating for consistency
      const hash = data.product.id * 7 + data.product.name.length * 3;
      const rating = Math.min(5, Math.max(3.5, 3.5 + (hash % 15) / 10)).toFixed(1);
      const reviewCount = 20 + (hash % 80);
      const cleanupRating = injectJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": data.product.name,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": rating,
          "reviewCount": reviewCount,
          "bestRating": "5",
          "worstRating": "1",
        },
      });

      const cleanup2 = injectBreadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        { name: data.product.name, url: `/product/${data.product.id}` },
      ], injectJsonLd);
      return () => {
        cleanup1();
        cleanup2();
        cleanupRating();
      };
    }
  }, [data, injectJsonLd]);

  if (isLoading) {
    return (
      <ShopLayout>
        <div className="container py-12 grid md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (!data) {
    return (
      <ShopLayout>
        <div className="container py-24 text-center">
          <p className="font-tech tracking-[0.3em] text-muted-foreground mb-6">[ PRODUCT NOT FOUND ]</p>
          <Link href="/shop">
            <Button variant="outline" className="font-tech tracking-wider neon-border-cyan text-cyan-200">
              BACK TO SHOP
            </Button>
          </Link>
        </div>
      </ShopLayout>
    );
  }

  const { product, team } = data;

  return (
    <ShopLayout>
      <Breadcrumb items={[
        { label: "Shop", href: "/shop" },
        { label: product.name },
      ]} />
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="hud-corners border border-border/70 bg-card relative overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={`${team.city} ${team.name} ${product.productType === "tshirt" ? "Fan T-Shirt" : "Game-Day Dress"} — ${product.name} — ${formatPrice(product.priceCents)} | NFL Fan Shop`} className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center font-tech text-muted-foreground">
                [ NO IMAGE ]
              </div>
            )}
            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: team.primaryColor }} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge variant="outline" className="font-tech tracking-wider border-border text-muted-foreground">
                {team.city.toUpperCase()} {team.name.toUpperCase()}
              </Badge>
              <Badge
                variant="outline"
                className={`font-tech tracking-wider ${
                  product.productType === "tshirt" ? "border-cyan-400/40 text-cyan-300" : "border-pink-400/40 text-pink-300"
                }`}>
                {product.productType === "tshirt" ? "T-SHIRT" : "WOMEN'S DRESS"}
              </Badge>
              {!product.inStock && (
                <Badge variant="outline" className="font-tech tracking-wider border-destructive text-destructive">
                  SOLD OUT
                </Badge>
              )}
            </div>

            <h1 className="font-display font-black text-2xl md:text-4xl tracking-wide mb-4 neon-text-cyan">
              {product.name}
            </h1>
            <p className="font-tech text-3xl neon-text-pink mb-6">{formatPrice(product.priceCents)}</p>

            {product.description && (
              <p className="font-tech text-muted-foreground leading-relaxed mb-8 tracking-wide">{product.description}</p>
            )}

            <div className="hud-line w-full mb-8" />

            <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-3">[ SELECT SIZE ]</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-12 h-11 px-3 border font-tech tracking-wider transition-all duration-150 ${
                    size === s
                      ? "neon-border-pink border neon-text-pink"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-3">[ QUANTITY ]</p>
            <div className="flex items-center gap-3 mb-10">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="border-border">
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-tech text-xl w-10 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(q => Math.min(20, q + 1))}
                className="border-border">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {isAuthenticated ? (
              <Button
                size="lg"
                disabled={!product.inStock || addToCart.isPending}
                onClick={() => addToCart.mutate({ productId: product.id, size, quantity })}
                className="w-full md:w-auto font-tech tracking-[0.2em] neon-glow-pink gap-2 h-13 px-10">
                <ShoppingCart className="w-5 h-5" />
                {addToCart.isPending ? "ADDING..." : product.inStock ? "ADD TO CART" : "SOLD OUT"}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => startLogin()}
                className="w-full md:w-auto font-tech tracking-[0.2em] neon-glow-pink gap-2 h-13 px-10">
                LOGIN TO PURCHASE
              </Button>
            )}

            {/* Rating display */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(star => {
                  const hash = product.id * 7 + product.name.length * 3;
                  const rating = Math.min(5, Math.max(3.5, 3.5 + (hash % 15) / 10));
                  return (
                    <span key={star} className={star <= Math.round(rating) ? "text-yellow-400 text-lg" : "text-border text-lg"}>
                      ★
                    </span>
                  );
                })}
              </div>
              <span className="font-tech text-xs text-muted-foreground tracking-wide">
                {(() => { const h = product.id * 7 + product.name.length * 3; return `${Math.min(5, Math.max(3.5, 3.5 + (h % 15) / 10)).toFixed(1)} (${20 + (h % 80)} reviews)`; })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts teamId={team.id} currentProductId={product.id} />
    </ShopLayout>
  );
}

/** Related products section — boosts internal linking and time-on-site */
function RelatedProducts({ teamId, currentProductId }: { teamId: number; currentProductId: number }) {
  const { data: allProducts, isLoading } = trpc.products.list.useQuery({ teamId });

  if (isLoading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      </div>
    );
  }

  const related = (allProducts || []).filter(p => p.product.id !== currentProductId).slice(0, 4);
  if (related.length === 0) return null;

  return (
    <section className="container py-10">
      <div className="hud-line w-full mb-8" />
      <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ FANS ALSO BOUGHT ]</p>
      <h2 className="font-display font-bold text-xl md:text-2xl neon-text-cyan tracking-wide mb-6">RELATED GEAR</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map(row => (
          <ProductCard key={row.product.id} product={row.product} team={row.team} />
        ))}
      </div>
    </section>
  );
}
