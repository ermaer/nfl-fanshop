import Breadcrumb from "@/components/Breadcrumb";
import ProductCard from "@/components/ProductCard";
import ShopLayout from "@/components/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { injectItemListJsonLd } from "@/lib/structuredData";
import { trpc } from "@/lib/trpc";
import { useSeoHead } from "@/lib/useSeoHead";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";

export default function Shop() {
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);

  const teamAbbr = params.get("team") ?? "all";
  const type = params.get("type") ?? "all";
  const urlSearch = params.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: teams } = trpc.teams.list.useQuery();
  const selectedTeam = teams?.find(t => t.abbreviation === teamAbbr);

  const queryInput = useMemo(
    () => ({
      teamId: selectedTeam?.id,
      productType: type === "tshirt" || type === "dress" ? (type as "tshirt" | "dress") : undefined,
      search: debouncedSearch || undefined,
    }),
    [selectedTeam?.id, type, debouncedSearch]
  );
  const { data: products, isLoading } = trpc.products.list.useQuery(queryInput);

  const { injectJsonLd } = useSeoHead({
    title: selectedTeam
      ? `${selectedTeam.city} ${selectedTeam.name} Fan Gear – T-Shirts & Dresses`
      : type === "tshirt"
        ? "NFL T-Shirts – Team Tees for All 32 Teams | From $34.99"
        : type === "dress"
          ? "NFL Women's Dresses – Game-Day Outfits for All 32 Teams | From $59.99"
          : "NFL Fan Shop – Browse All Team T-Shirts & Dresses",
    description: selectedTeam
      ? `Shop ${selectedTeam.city} ${selectedTeam.name} fan gear. Premium t-shirts from $34.99 and women's game-day dresses from $59.99. Free US shipping.`
      : "Browse our full collection of NFL fan gear for all 32 teams. Premium team t-shirts from $34.99 and women's game-day dresses from $59.99.",
    url: `/shop${searchString ? `?${searchString}` : ""}`,
  });

  useEffect(() => {
    if (products && products.length > 0) {
      const cleanup = injectItemListJsonLd(
        products.map(row => ({
          url: `/product/${row.product.id}`,
          name: row.product.name,
          image: row.product.imageUrl ?? undefined,
          price: (row.product.priceCents / 100).toFixed(2),
        })),
        injectJsonLd,
      );
      return cleanup;
    }
  }, [products, injectJsonLd]);

  function updateParams(next: { team?: string; type?: string }) {
    const p = new URLSearchParams(searchString);
    if (next.team !== undefined) {
      if (next.team === "all") p.delete("team");
      else p.set("team", next.team);
    }
    if (next.type !== undefined) {
      if (next.type === "all") p.delete("type");
      else p.set("type", next.type);
    }
    navigate(`/shop${p.toString() ? `?${p.toString()}` : ""}`);
  }

  const hasFilters = teamAbbr !== "all" || type !== "all" || searchInput !== "";

  return (
    <ShopLayout>
      <Breadcrumb items={[
        ...(selectedTeam ? [{ label: "Teams", href: "/teams" }] : []),
        { label: selectedTeam ? `${selectedTeam.city} ${selectedTeam.name}` : "Shop" },
      ]} />
      <div className="container py-8">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ GEAR CATALOG ]</p>
        <h1 className="font-display font-black text-3xl md:text-4xl neon-text-pink tracking-wide mb-8">
          SHOP {selectedTeam ? `// ${selectedTeam.city.toUpperCase()} ${selectedTeam.name.toUpperCase()}` : "ALL GEAR"}
        </h1>

        <div className="hud-corners border border-border/70 bg-card p-4 mb-8 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="SEARCH PRODUCTS..."
              className="pl-9 font-tech tracking-wider bg-secondary/40"
            />
          </div>
          <Select value={teamAbbr} onValueChange={v => updateParams({ team: v })}>
            <SelectTrigger className="md:w-56 font-tech tracking-wider bg-secondary/40">
              <SelectValue placeholder="ALL TEAMS" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all" className="font-tech">ALL TEAMS</SelectItem>
              {teams?.map(team => (
                <SelectItem key={team.id} value={team.abbreviation} className="font-tech">
                  {team.city} {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={v => updateParams({ type: v })}>
            <SelectTrigger className="md:w-44 font-tech tracking-wider bg-secondary/40">
              <SelectValue placeholder="ALL TYPES" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-tech">ALL TYPES</SelectItem>
              <SelectItem value="tshirt" className="font-tech">T-SHIRTS</SelectItem>
              <SelectItem value="dress" className="font-tech">DRESSES</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchInput("");
                navigate("/shop");
              }}
              className="font-tech tracking-wider gap-1 text-muted-foreground">
              <X className="w-4 h-4" /> CLEAR
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4]" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
            <p className="font-tech text-xs text-muted-foreground tracking-[0.2em] mb-4">
              [ {products.length} ITEMS FOUND ]
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(row => (
                <ProductCard key={row.product.id} product={row.product} team={row.team} />
              ))}
            </div>
          </>
        ) : (
          <div className="border border-dashed border-border py-24 text-center">
            <p className="font-tech tracking-[0.3em] text-muted-foreground mb-4">[ NO RESULTS FOUND ]</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput("");
                navigate("/shop");
              }}
              className="font-tech tracking-wider neon-border-cyan text-cyan-200">
              RESET FILTERS
            </Button>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
