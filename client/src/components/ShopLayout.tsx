import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { LogOut, Menu, Package, ShieldCheck, ShoppingCart, X, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const NAV_LINKS = [
  { href: "/", label: "HOME" },
  { href: "/teams", label: "TEAMS" },
  { href: "/shop", label: "SHOP" },
];

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: cart } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  const cartCount = cart?.reduce((sum, r) => sum + r.item.quantity, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="hud-line w-full" />
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <Zap className="w-6 h-6 text-primary" />
            <span className="font-display font-black text-lg tracking-widest neon-text-pink">
              NFL<span className="neon-text-cyan">FANSHOP</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`font-tech text-sm tracking-[0.2em] px-4 py-2 transition-all duration-200 border border-transparent ${
                    location === link.href
                      ? "neon-text-cyan neon-border-cyan border"
                      : "text-muted-foreground hover:text-foreground hover:border-border"
                  }`}>
                  {link.label}
                </span>
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link href="/admin">
                <span
                  className={`font-tech text-sm tracking-[0.2em] px-4 py-2 transition-all duration-200 border border-transparent flex items-center gap-1.5 ${
                    location.startsWith("/admin")
                      ? "neon-text-pink neon-border-pink border"
                      : "text-muted-foreground hover:text-foreground hover:border-border"
                  }`}>
                  <ShieldCheck className="w-4 h-4" />
                  ADMIN
                </span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link href="/orders">
                <Button variant="ghost" size="icon" title="My Orders">
                  <Package className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative" title="Cart">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center neon-glow-pink">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="font-tech text-xs text-muted-foreground max-w-28 truncate">{user?.name}</span>
                <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => startLogin()}
                className="hidden md:inline-flex font-tech tracking-widest neon-glow-pink"
                size="sm">
                LOGIN
              </Button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-md">
            <nav className="container py-3 flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                  <span className="block font-tech tracking-[0.2em] px-3 py-2.5 text-sm text-foreground hover:bg-accent">
                    {link.label}
                  </span>
                </Link>
              ))}
              {user?.role === "admin" && (
                <Link href="/admin" onClick={() => setMobileOpen(false)}>
                  <span className="block font-tech tracking-[0.2em] px-3 py-2.5 text-sm neon-text-pink">ADMIN</span>
                </Link>
              )}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="text-left font-tech tracking-[0.2em] px-3 py-2.5 text-sm text-muted-foreground">
                  LOGOUT
                </button>
              ) : (
                <button
                  onClick={() => startLogin()}
                  className="text-left font-tech tracking-[0.2em] px-3 py-2.5 text-sm neon-text-cyan">
                  LOGIN
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60 mt-16">
        <div className="hud-line w-full" />
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="font-display font-bold tracking-widest text-sm neon-text-pink">
              NFL<span className="neon-text-cyan">FANSHOP</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-4 font-tech text-xs tracking-wider">
              <Link href="/">
                <span className="text-muted-foreground hover:neon-text-cyan transition-colors cursor-pointer">HOME</span>
              </Link>
              <Link href="/shop">
                <span className="text-muted-foreground hover:neon-text-cyan transition-colors cursor-pointer">SHOP</span>
              </Link>
              <Link href="/teams">
                <span className="text-muted-foreground hover:neon-text-cyan transition-colors cursor-pointer">TEAMS</span>
              </Link>
              <Link href="/buying-guide">
                <span className="text-muted-foreground hover:neon-text-cyan transition-colors cursor-pointer">GUIDE</span>
              </Link>
              <Link href="/news">
                <span className="text-muted-foreground hover:neon-text-pink transition-colors cursor-pointer">NEWS</span>
              </Link>
              <Link href="/size-guide">
                <span className="text-muted-foreground hover:neon-text-cyan transition-colors cursor-pointer">SIZING</span>
              </Link>
              <Link href="/faq">
                <span className="text-muted-foreground hover:neon-text-cyan transition-colors cursor-pointer">FAQ</span>
              </Link>
              <Link href="/about">
                <span className="text-muted-foreground hover:neon-text-cyan transition-colors cursor-pointer">ABOUT</span>
              </Link>
            </nav>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 border-t border-border/40 pt-4">
            <p className="font-tech text-xs text-muted-foreground tracking-wider">
              [ FAN APPAREL // ALL 32 TEAMS // EST. 2026 ]
            </p>
            <p className="font-tech text-xs text-muted-foreground tracking-wider">POWERED BY NEON GRID</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
