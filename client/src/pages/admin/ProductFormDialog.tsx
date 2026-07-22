import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ImagePlus, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Product, Team } from "../../../../drizzle/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null; // null = create mode
  teams: Team[];
}

export default function ProductFormDialog({ open, onOpenChange, product, teams }: Props) {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [teamId, setTeamId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState<"tshirt" | "dress">("tshirt");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [inStock, setInStock] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setTeamId(product ? String(product.teamId) : "");
      setName(product?.name ?? "");
      setDescription(product?.description ?? "");
      setProductType(product?.productType ?? "tshirt");
      setPrice(product ? (product.priceCents / 100).toFixed(2) : "");
      setImageUrl(product?.imageUrl ?? "");
      setInStock(product?.inStock ?? true);
    }
  }, [open, product]);

  const uploadImage = trpc.admin.uploadImage.useMutation();

  const createProduct = trpc.admin.createProduct.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("PRODUCT CREATED");
      onOpenChange(false);
    },
    onError: err => toast.error("CREATE FAILED", { description: err.message }),
  });

  const updateProduct = trpc.admin.updateProduct.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.products.byId.invalidate();
      toast.success("PRODUCT UPDATED");
      onOpenChange(false);
    },
    onError: err => toast.error("UPDATE FAILED", { description: err.message }),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("IMAGE TOO LARGE", { description: "Max 8MB" });
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { url } = await uploadImage.mutateAsync({ base64, fileName: file.name });
      setImageUrl(url);
      toast.success("IMAGE UPLOADED");
    } catch (err) {
      toast.error("UPLOAD FAILED", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit() {
    const priceCents = Math.round(parseFloat(price) * 100);
    if (!teamId || !name.trim() || !Number.isFinite(priceCents) || priceCents <= 0) {
      toast.error("INVALID INPUT", { description: "Team, name and a positive price are required." });
      return;
    }
    const payload = {
      teamId: Number(teamId),
      name: name.trim(),
      description: description.trim() || undefined,
      productType,
      priceCents,
      imageUrl: imageUrl || undefined,
      inStock,
    };
    if (product) {
      updateProduct.mutate({ id: product.id, ...payload });
    } else {
      createProduct.mutate(payload);
    }
  }

  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-[0.15em] neon-text-cyan">
            {product ? "EDIT PRODUCT" : "NEW PRODUCT"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label className="font-tech tracking-wider text-xs text-muted-foreground">PRODUCT IMAGE</Label>
            <div className="mt-2 flex items-start gap-4">
              <div className="w-28 h-28 border border-border/70 bg-secondary/30 overflow-hidden shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-tech text-[10px] text-muted-foreground">
                    NO IMAGE
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full font-tech tracking-wider gap-2 neon-border-cyan text-cyan-200">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {uploading ? "UPLOADING..." : "UPLOAD IMAGE"}
                </Button>
                <Input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="OR PASTE IMAGE URL"
                  className="font-tech text-xs bg-secondary/40"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-tech tracking-wider text-xs text-muted-foreground">TEAM *</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger className="mt-2 font-tech bg-secondary/40">
                  <SelectValue placeholder="SELECT TEAM" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {teams.map(team => (
                    <SelectItem key={team.id} value={String(team.id)} className="font-tech">
                      {team.city} {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-tech tracking-wider text-xs text-muted-foreground">TYPE *</Label>
              <Select value={productType} onValueChange={v => setProductType(v as "tshirt" | "dress")}>
                <SelectTrigger className="mt-2 font-tech bg-secondary/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tshirt" className="font-tech">T-SHIRT</SelectItem>
                  <SelectItem value="dress" className="font-tech">WOMEN'S DRESS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="font-tech tracking-wider text-xs text-muted-foreground">NAME *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="PRODUCT NAME"
              className="mt-2 font-tech bg-secondary/40"
            />
          </div>

          <div>
            <Label className="font-tech tracking-wider text-xs text-muted-foreground">DESCRIPTION</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="PRODUCT DESCRIPTION"
              className="mt-2 font-tech bg-secondary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <Label className="font-tech tracking-wider text-xs text-muted-foreground">PRICE (USD) *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="39.99"
                className="mt-2 font-tech bg-secondary/40"
              />
            </div>
            <div className="flex items-center gap-3 pb-2">
              <Switch checked={inStock} onCheckedChange={setInStock} id="inStock" />
              <Label htmlFor="inStock" className="font-tech tracking-wider text-sm">
                {inStock ? "IN STOCK" : "OUT OF STOCK"}
              </Label>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSaving || uploading}
            className="w-full font-tech tracking-[0.2em] neon-glow-pink h-11">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {product ? "SAVE CHANGES" : "CREATE PRODUCT"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
