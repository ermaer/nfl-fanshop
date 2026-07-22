import { useAuth } from "@/_core/hooks/useAuth";
import ShopLayout from "@/components/ShopLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { startLogin } from "@/const";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Cart() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const { data: cart, isLoading } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  const updateQty = trpc.cart.updateQuantity.useMutation({
    onMutate: async input => {
      await utils.cart.get.cancel();
      const prev = utils.cart.get.getData();
      utils.cart.get.setData(undefined, old =>
        old
          ?.map(r => (r.item.id === input.itemId ? { ...r, item: { ...r.item, quantity: input.quantity } } : r))
          .filter(r => r.item.quantity > 0)
      );
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) utils.cart.get.setData(undefined, ctx.prev);
      toast.error("UPDATE FAILED");
    },
    onSettled: () => utils.cart.get.invalidate(),
  });

  const removeItem = trpc.cart.remove.useMutation({
    onMutate: async input => {
      await utils.cart.get.cancel();
      const prev = utils.cart.get.getData();
      utils.cart.get.setData(undefined, old => old?.filter(r => r.item.id !== input.itemId));
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) utils.cart.get.setData(undefined, ctx.prev);
      toast.error("REMOVE FAILED");
    },
    onSettled: () => utils.cart.get.invalidate(),
  });

  if (!loading && !isAuthenticated) {
    return (
      <ShopLayout>
        <div className="container py-24 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto mb-6 text-muted-foreground" />
          <p className="font-tech tracking-[0.3em] text-muted-foreground mb-6">[ LOGIN REQUIRED TO VIEW CART ]</p>
          <Button onClick={() => startLogin()} className="font-tech tracking-[0.2em] neon-glow-pink">
            LOGIN
          </Button>
        </div>
      </ShopLayout>
    );
  }

  const subtotal = cart?.reduce((sum, r) => sum + r.product.priceCents * r.item.quantity, 0) ?? 0;

  return (
    <ShopLayout>
      <div className="container py-12">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ CARGO MANIFEST ]</p>
        <h1 className="font-display font-black text-3xl md:text-4xl neon-text-cyan tracking-wide mb-10">YOUR CART</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : !cart || cart.length === 0 ? (
          <div className="border border-dashed border-border py-24 text-center">
            <p className="font-tech tracking-[0.3em] text-muted-foreground mb-6">[ CART IS EMPTY ]</p>
            <Link href="/shop">
              <Button variant="outline" className="font-tech tracking-wider neon-border-cyan text-cyan-200">
                BROWSE GEAR
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map(row => (
                <div
                  key={row.item.id}
                  className="hud-corners border border-border/70 bg-card p-4 flex gap-4 items-center">
                  <Link href={`/product/${row.product.id}`}>
                    <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 overflow-hidden border border-border/50 cursor-pointer">
                      {row.product.imageUrl ? (
                        <img src={row.product.imageUrl} alt={row.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-secondary/40" />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${row.product.id}`}>
                      <h3 className="font-display font-semibold text-sm md:text-base truncate cursor-pointer hover:neon-text-cyan transition-all">
                        {row.product.name}
                      </h3>
                    </Link>
                    <p className="font-tech text-xs text-muted-foreground tracking-wider mt-1">
                      {row.team.abbreviation} // SIZE {row.item.size}
                    </p>
                    <p className="font-tech neon-text-pink mt-1">{formatPrice(row.product.priceCents)}</p>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 border-border"
                        onClick={() => updateQty.mutate({ itemId: row.item.id, quantity: row.item.quantity - 1 })}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-tech w-8 text-center">{row.item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 border-border"
                        onClick={() => updateQty.mutate({ itemId: row.item.id, quantity: row.item.quantity + 1 })}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem.mutate({ itemId: row.item.id })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="hud-corners border border-border/70 bg-card p-6 sticky top-24">
                <h2 className="font-display font-bold tracking-[0.2em] text-sm neon-text-cyan mb-6">ORDER SUMMARY</h2>
                <div className="space-y-3 font-tech text-sm">
                  {cart.map(row => (
                    <div key={row.item.id} className="flex justify-between text-muted-foreground">
                      <span className="truncate mr-4">
                        {row.team.abbreviation} {row.product.productType === "tshirt" ? "TEE" : "DRESS"} x
                        {row.item.quantity}
                      </span>
                      <span>{formatPrice(row.product.priceCents * row.item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="hud-line w-full my-4" />
                <div className="flex justify-between font-tech text-lg mb-6">
                  <span>SUBTOTAL</span>
                  <span className="neon-text-pink">{formatPrice(subtotal)}</span>
                </div>
                <p className="font-tech text-[11px] text-muted-foreground tracking-wider mb-4">
                  ALL PRICES IN USD // SECURE STRIPE CHECKOUT
                </p>
                <Link href="/checkout">
                  <Button className="w-full font-tech tracking-[0.2em] neon-glow-pink gap-2 h-12">
                    CHECKOUT <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
