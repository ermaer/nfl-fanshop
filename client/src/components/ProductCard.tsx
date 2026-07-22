import { formatPrice } from "@/lib/money";
import type { Product, Team } from "../../../drizzle/schema";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function ProductCard({ product, team }: { product: Product; team: Team }) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group hud-corners border border-border/70 bg-card hover:neon-border-cyan transition-all duration-200 overflow-hidden cursor-pointer h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-secondary/40">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-tech text-muted-foreground text-xs">
              [ NO IMAGE ]
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
              <span className="font-tech tracking-[0.3em] text-destructive text-sm border border-destructive px-3 py-1">
                SOLD OUT
              </span>
            </div>
          )}
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: team.primaryColor }} />
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-tech text-[10px] tracking-wider border-border text-muted-foreground">
              {team.abbreviation}
            </Badge>
            <Badge
              variant="outline"
              className={`font-tech text-[10px] tracking-wider ${
                product.productType === "tshirt" ? "border-cyan-400/40 text-cyan-300" : "border-pink-400/40 text-pink-300"
              }`}>
              {product.productType === "tshirt" ? "T-SHIRT" : "DRESS"}
            </Badge>
          </div>
          <h3 className="font-display font-semibold text-sm leading-snug group-hover:neon-text-cyan transition-all line-clamp-2 flex-1">
            {product.name}
          </h3>
          <p className="font-tech text-lg neon-text-pink">{formatPrice(product.priceCents)}</p>
        </div>
      </div>
    </Link>
  );
}
