import ShopLayout from "@/components/ShopLayout";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, Package } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link, useSearch } from "wouter";

export default function OrderSuccess() {
  const searchString = useSearch();
  const orderId = useMemo(() => Number(new URLSearchParams(searchString).get("orderId")), [searchString]);
  const utils = trpc.useUtils();
  const syncedRef = useRef(false);

  const syncStatus = trpc.orders.syncStatus.useMutation({
    onSuccess: () => {
      utils.orders.byId.invalidate({ orderId });
      utils.cart.get.invalidate();
    },
  });

  useEffect(() => {
    if (Number.isFinite(orderId) && orderId > 0 && !syncedRef.current) {
      syncedRef.current = true;
      syncStatus.mutate({ orderId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const { data: order, isLoading } = trpc.orders.byId.useQuery(
    { orderId },
    { enabled: Number.isFinite(orderId) && orderId > 0 && !syncStatus.isPending }
  );

  return (
    <ShopLayout>
      <div className="container py-16 max-w-2xl">
        {isLoading || syncStatus.isPending ? (
          <div className="text-center py-24">
            <Loader2 className="w-10 h-10 mx-auto mb-6 animate-spin text-primary" />
            <p className="font-tech tracking-[0.3em] text-muted-foreground">[ VERIFYING PAYMENT... ]</p>
          </div>
        ) : !order ? (
          <div className="text-center py-24">
            <p className="font-tech tracking-[0.3em] text-muted-foreground mb-6">[ ORDER NOT FOUND ]</p>
            <Link href="/shop">
              <Button variant="outline" className="font-tech tracking-wider neon-border-cyan text-cyan-200">
                BACK TO SHOP
              </Button>
            </Link>
          </div>
        ) : (
          <div className="hud-corners border border-border/70 bg-card p-8 md:p-12 text-center">
            <CheckCircle2
              className={`w-16 h-16 mx-auto mb-6 ${order.status === "paid" ? "text-green-400" : "text-yellow-400"}`}
            />
            <h1 className="font-display font-black text-2xl md:text-3xl tracking-wide mb-3 neon-text-cyan">
              {order.status === "paid" ? "PAYMENT CONFIRMED" : "ORDER RECEIVED"}
            </h1>
            <p className="font-tech text-muted-foreground tracking-wider mb-8">
              ORDER #{order.id} // STATUS: {order.status.toUpperCase()}
            </p>

            <div className="text-left border border-border/50 bg-secondary/20 p-5 mb-8">
              <div className="space-y-2 font-tech text-sm">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate mr-4">
                      {item.productName} ({item.size}) x{item.quantity}
                    </span>
                    <span>{formatPrice(item.unitPriceCents * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="hud-line w-full my-3" />
              <div className="flex justify-between font-tech">
                <span>TOTAL</span>
                <span className="neon-text-pink">{formatPrice(order.totalCents)}</span>
              </div>
              <p className="font-tech text-xs text-muted-foreground mt-4 tracking-wider">
                SHIP TO: {order.shippingName} // {order.shippingAddress}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/orders">
                <Button variant="outline" className="font-tech tracking-wider neon-border-cyan text-cyan-200 gap-2">
                  <Package className="w-4 h-4" /> MY ORDERS
                </Button>
              </Link>
              <Link href="/shop">
                <Button className="font-tech tracking-[0.2em] neon-glow-pink">CONTINUE SHOPPING</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
