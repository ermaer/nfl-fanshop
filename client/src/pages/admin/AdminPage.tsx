import { useAuth } from "@/_core/hooks/useAuth";
import ShopLayout from "@/components/ShopLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startLogin } from "@/const";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { Package, Pencil, Plus, Search, ShieldAlert, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../../../../drizzle/schema";
import ProductFormDialog from "./ProductFormDialog";

const STATUS_STYLES: Record<string, string> = {
  paid: "border-green-400/50 text-green-300",
  pending: "border-yellow-400/50 text-yellow-300",
  failed: "border-destructive text-destructive",
  cancelled: "border-muted-foreground text-muted-foreground",
};

export default function AdminPage() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <ShopLayout>
        <div className="container py-12">
          <Skeleton className="h-96" />
        </div>
      </ShopLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <ShopLayout>
        <div className="container py-24 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-6 text-muted-foreground" />
          <p className="font-tech tracking-[0.3em] text-muted-foreground mb-6">[ ADMIN LOGIN REQUIRED ]</p>
          <Button onClick={() => startLogin()} className="font-tech tracking-[0.2em] neon-glow-pink">
            LOGIN
          </Button>
        </div>
      </ShopLayout>
    );
  }

  if (user?.role !== "admin") {
    return (
      <ShopLayout>
        <div className="container py-24 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-6 text-destructive" />
          <p className="font-tech tracking-[0.3em] text-destructive mb-2">[ ACCESS DENIED ]</p>
          <p className="font-tech text-sm text-muted-foreground">ADMIN CLEARANCE REQUIRED</p>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container py-12">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ COMMAND CENTER ]</p>
        <h1 className="font-display font-black text-3xl md:text-4xl neon-text-pink tracking-wide mb-10">
          ADMIN CONSOLE
        </h1>

        <Tabs defaultValue="products">
          <TabsList className="font-tech tracking-wider mb-6">
            <TabsTrigger value="products" className="gap-2">
              <ShoppingBag className="w-4 h-4" /> PRODUCTS
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" /> ORDERS
            </TabsTrigger>
          </TabsList>
          <TabsContent value="products">
            <AdminProducts />
          </TabsContent>
          <TabsContent value="orders">
            <AdminOrders />
          </TabsContent>
        </Tabs>
      </div>
    </ShopLayout>
  );
}

function AdminProducts() {
  const utils = trpc.useUtils();
  const { data: teams } = trpc.teams.list.useQuery();
  const { data: products, isLoading } = trpc.products.list.useQuery({});

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const deleteProduct = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("PRODUCT DELETED");
      setDeleting(null);
    },
    onError: err => toast.error("DELETE FAILED", { description: err.message }),
  });

  const toggleStock = trpc.admin.updateProduct.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("STOCK STATUS UPDATED");
    },
    onError: err => toast.error("UPDATE FAILED", { description: err.message }),
  });

  const filtered = useMemo(() => {
    return (products ?? []).filter(row => {
      if (teamFilter !== "all" && String(row.team.id) !== teamFilter) return false;
      if (typeFilter !== "all" && row.product.productType !== typeFilter) return false;
      if (search && !row.product.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, search, teamFilter, typeFilter]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH..."
            className="pl-9 font-tech bg-secondary/40"
          />
        </div>
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="md:w-52 font-tech bg-secondary/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all" className="font-tech">ALL TEAMS</SelectItem>
            {teams?.map(t => (
              <SelectItem key={t.id} value={String(t.id)} className="font-tech">
                {t.city} {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="md:w-40 font-tech bg-secondary/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-tech">ALL TYPES</SelectItem>
            <SelectItem value="tshirt" className="font-tech">T-SHIRTS</SelectItem>
            <SelectItem value="dress" className="font-tech">DRESSES</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="font-tech tracking-wider neon-glow-pink gap-2">
          <Plus className="w-4 h-4" /> NEW PRODUCT
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <>
          <p className="font-tech text-xs text-muted-foreground tracking-[0.2em] mb-3">
            [ {filtered.length} / {products?.length ?? 0} PRODUCTS ]
          </p>
          <div className="space-y-3">
            {filtered.map(row => (
              <div
                key={row.product.id}
                className="border border-border/70 bg-card p-3 flex items-center gap-4 hover:neon-border-cyan transition-all">
                <div className="w-16 h-16 shrink-0 overflow-hidden border border-border/50 bg-secondary/30">
                  {row.product.imageUrl ? (
                    <img src={row.product.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-tech text-[9px] text-muted-foreground">
                      N/A
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm truncate">{row.product.name}</p>
                  <p className="font-tech text-xs text-muted-foreground tracking-wider mt-0.5">
                    {row.team.abbreviation} // {row.product.productType === "tshirt" ? "T-SHIRT" : "DRESS"} // #
                    {row.product.id}
                  </p>
                </div>
                <span className="font-tech neon-text-pink whitespace-nowrap">{formatPrice(row.product.priceCents)}</span>
                <button
                  onClick={() => toggleStock.mutate({ id: row.product.id, inStock: !row.product.inStock })}
                  title="Toggle stock status"
                  className="shrink-0">
                  <Badge
                    variant="outline"
                    className={`font-tech tracking-wider cursor-pointer ${
                      row.product.inStock ? "border-green-400/50 text-green-300" : "border-destructive text-destructive"
                    }`}>
                    {row.product.inStock ? "IN STOCK" : "OUT OF STOCK"}
                  </Badge>
                </button>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(row.product);
                      setDialogOpen(true);
                    }}
                    title="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleting(row.product)}
                    title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ProductFormDialog open={dialogOpen} onOpenChange={setDialogOpen} product={editing} teams={teams ?? []} />

      <AlertDialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-wider">DELETE PRODUCT?</AlertDialogTitle>
            <AlertDialogDescription className="font-tech">
              "{deleting?.name}" will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-tech">CANCEL</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteProduct.mutate({ id: deleting.id })}
              className="font-tech bg-destructive text-destructive-foreground hover:bg-destructive/90">
              DELETE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdminOrders() {
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.admin.listOrders.useQuery();

  const updateStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => {
      utils.admin.listOrders.invalidate();
      toast.success("ORDER STATUS UPDATED");
    },
    onError: err => toast.error("UPDATE FAILED", { description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="border border-dashed border-border py-24 text-center">
        <p className="font-tech tracking-[0.3em] text-muted-foreground">[ NO ORDERS YET ]</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="border border-border/70 bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold tracking-wider">ORDER #{order.id}</span>
              <Badge variant="outline" className={`font-tech tracking-wider ${STATUS_STYLES[order.status] ?? ""}`}>
                {order.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-tech text-xs text-muted-foreground tracking-wider">
                {new Date(order.createdAt).toLocaleString()}
              </span>
              <Select
                value={order.status}
                onValueChange={v =>
                  updateStatus.mutate({ orderId: order.id, status: v as "pending" | "paid" | "failed" | "cancelled" })
                }>
                <SelectTrigger className="w-36 h-8 font-tech text-xs bg-secondary/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="font-tech">PENDING</SelectItem>
                  <SelectItem value="paid" className="font-tech">PAID</SelectItem>
                  <SelectItem value="failed" className="font-tech">FAILED</SelectItem>
                  <SelectItem value="cancelled" className="font-tech">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5 font-tech text-sm mb-3">
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
          <div className="flex flex-wrap justify-between gap-2 font-tech text-sm">
            <span className="text-muted-foreground">
              SHIP TO: {order.shippingName}
              {order.shippingPhone ? ` // ${order.shippingPhone}` : ""} // {order.shippingAddress}
            </span>
            <span className="neon-text-pink text-base">{formatPrice(order.totalCents)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
