import { useAuth } from "@/_core/hooks/useAuth";
import ShopLayout from "@/components/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startLogin } from "@/const";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CreditCard, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useSearch } from "wouter";

export default function Checkout() {
  const { isAuthenticated, loading, user } = useAuth();
  const searchString = useSearch();
  const cancelled = new URLSearchParams(searchString).get("cancelled") === "1";

  const { data: cart, isLoading } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stripeStatus } = trpc.orders.stripeStatus.useQuery();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const checkout = trpc.orders.checkout.useMutation({
    onSuccess: result => {
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.error === "STRIPE_NOT_CONFIGURED") {
        toast.error("PAYMENT UNAVAILABLE", {
          description: "Stripe is not configured yet. Order saved as pending.",
        });
      }
    },
    onError: err => toast.error("CHECKOUT FAILED", { description: err.message }),
  });

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

  const subtotal = cart?.reduce((sum, r) => sum + r.product.priceCents * r.item.quantity, 0) ?? 0;
  const canSubmit = name.trim() && address.trim() && cart && cart.length > 0 && !checkout.isPending;

  return (
    <ShopLayout>
      <div className="container py-12 max-w-5xl">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ FINAL TRANSMISSION ]</p>
        <h1 className="font-display font-black text-3xl md:text-4xl neon-text-pink tracking-wide mb-10">CHECKOUT</h1>

        {cancelled && (
          <div className="border border-yellow-500/50 bg-yellow-500/10 p-4 mb-8 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="font-tech text-sm text-yellow-200 tracking-wide">
              PAYMENT CANCELLED — your cart is untouched. You can try again below.
            </p>
          </div>
        )}

        {stripeStatus && !stripeStatus.configured && (
          <div className="border border-yellow-500/50 bg-yellow-500/10 p-4 mb-8 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="font-tech text-sm text-yellow-200 tracking-wide">
              STRIPE NOT CONFIGURED — online payment is unavailable until the store owner adds Stripe API keys
              (Settings → Payment). Orders will be saved as pending.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="font-tech text-muted-foreground tracking-widest">[ LOADING... ]</div>
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
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="hud-corners border border-border/70 bg-card p-6">
                <h2 className="font-display font-bold tracking-[0.2em] text-sm neon-text-cyan mb-6">
                  SHIPPING COORDINATES
                </h2>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="name" className="font-tech tracking-wider text-xs text-muted-foreground">
                      FULL NAME *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={user?.name ?? "JOHN DOE"}
                      className="mt-2 font-tech bg-secondary/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="font-tech tracking-wider text-xs text-muted-foreground">
                      PHONE (OPTIONAL)
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      className="mt-2 font-tech bg-secondary/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="font-tech tracking-wider text-xs text-muted-foreground">
                      SHIPPING ADDRESS *
                    </Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="STREET, CITY, STATE, ZIP, COUNTRY"
                      rows={4}
                      className="mt-2 font-tech bg-secondary/40"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="hud-corners border border-border/70 bg-card p-6 sticky top-24">
                <h2 className="font-display font-bold tracking-[0.2em] text-sm neon-text-cyan mb-6">ORDER SUMMARY</h2>
                <div className="space-y-3 font-tech text-sm mb-4">
                  {cart.map(row => (
                    <div key={row.item.id} className="flex justify-between text-muted-foreground">
                      <span className="truncate mr-4">
                        {row.team.abbreviation} {row.product.productType === "tshirt" ? "TEE" : "DRESS"} ({row.item.size}) x
                        {row.item.quantity}
                      </span>
                      <span>{formatPrice(row.product.priceCents * row.item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="hud-line w-full my-4" />
                <div className="flex justify-between font-tech text-lg mb-6">
                  <span>TOTAL</span>
                  <span className="neon-text-pink">{formatPrice(subtotal)}</span>
                </div>
                <Button
                  disabled={!canSubmit}
                  onClick={() =>
                    checkout.mutate({
                      shippingName: name.trim(),
                      shippingPhone: phone.trim() || undefined,
                      shippingAddress: address.trim(),
                      origin: window.location.origin,
                    })
                  }
                  className="w-full font-tech tracking-[0.2em] neon-glow-pink gap-2 h-12">
                  {checkout.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" /> PAY WITH STRIPE
                    </>
                  )}
                </Button>
                <p className="font-tech text-[11px] text-muted-foreground tracking-wider mt-4 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> SECURE PAYMENT VIA STRIPE CHECKOUT
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
