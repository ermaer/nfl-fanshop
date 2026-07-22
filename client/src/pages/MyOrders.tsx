import { useAuth } from "@/_core/hooks/useAuth";
import ShopLayout from "@/components/ShopLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { startLogin } from "@/const";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const STATUS_STYLES: Record<string, string> = {
  paid: "border-green-400/50 text-green-300",
  pending: "border-yellow-400/50 text-yellow-300",
  failed: "border-destructive text-destructive",
  cancelled: "border-muted-foreground text-muted-foreground",
};

export default function MyOrders() {
  const { isAuthenticated, loading } = useAuth();
  const { data: orders, isLoading } = trpc.orders.mine.useQuery(undefined, { enabled: isAuthenticated });

  if (!loading && !isAuthenticated) {
    return (
      <ShopLayout>
        <div className="container py-24 text-center">
          <p className="font-tech tracking-[0.3em] text-muted-foreground mb-6">[ LOGIN REQUIRED ]</p>
          <Button onClick={() => startLogin()} className="font-tech tracking-[0.2em] neon-glow-pink">
            LOGIN
          </Button>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container py-12 max-w-4xl">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ TRANSACTION LOG ]</p>
        <h1 className="font-display font-black text-3xl md:text-4xl neon-text-cyan tracking-wide mb-10">MY ORDERS</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="border border-dashed border-border py-24 text-center">
            <p className="font-tech tracking-[0.3em] text-muted-foreground mb-6">[ NO ORDERS YET ]</p>
            <Link href="/shop">
              <Button variant="outline" className="font-tech tracking-wider neon-border-cyan text-cyan-200">
                START SHOPPING
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="hud-corners border border-border/70 bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold tracking-wider">ORDER #{order.id}</span>
                    <Badge variant="outline" className={`font-tech tracking-wider ${STATUS_STYLES[order.status] ?? ""}`}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="font-tech text-xs text-muted-foreground tracking-wider">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1.5 font-tech text-sm mb-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-muted-foreground">
                      <span className="truncate mr-4">
                        {item.productName} ({item.size}) x{item.quantity}
                      </span>
                      <span>{formatPrice(item.unitPriceCents * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="hud-line w-full mb-3" />
                <div className="flex justify-between font-tech">
                  <span className="text-muted-foreground text-sm">SHIP TO: {order.shippingName}</span>
                  <span className="neon-text-pink">{formatPrice(order.totalCents)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
