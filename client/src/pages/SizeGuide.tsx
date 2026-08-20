import ShopLayout from "@/components/ShopLayout";
import { useSeoHead } from "@/lib/useSeoHead";
import { useEffect } from "react";

interface SizeRow {
  size: string;
  chest: string;
  length: string;
  sleeve: string;
  waist: string;
  hip: string;
}

const TSHIRT_SIZES: SizeRow[] = [
  { size: "XS", chest: '34–36" (86–91cm)', length: '27" (69cm)', sleeve: '8" (20cm)', waist: '—', hip: '—' },
  { size: "S", chest: '36–38" (91–97cm)', length: '28" (71cm)', sleeve: '8.5" (22cm)', waist: '—', hip: '—' },
  { size: "M", chest: '38–40" (97–102cm)', length: '29" (74cm)', sleeve: '9" (23cm)', waist: '—', hip: '—' },
  { size: "L", chest: '40–43" (102–109cm)', length: '30" (76cm)', sleeve: '9.5" (24cm)', waist: '—', hip: '—' },
  { size: "XL", chest: '43–46" (109–117cm)', length: '31" (79cm)', sleeve: '10" (25cm)', waist: '—', hip: '—' },
  { size: "XXL", chest: '46–49" (117–124cm)', length: '32" (81cm)', sleeve: '10.5" (27cm)', waist: '—', hip: '—' },
  { size: "3XL", chest: '49–52" (124–132cm)', length: '33" (84cm)', sleeve: '11" (28cm)', waist: '—', hip: '—' },
];

const DRESS_SIZES: SizeRow[] = [
  { size: "XS", chest: '32–34" (81–86cm)', length: '33" (84cm)', sleeve: '—', waist: '24–26" (61–66cm)', hip: '34–36" (86–91cm)' },
  { size: "S", chest: '34–36" (86–91cm)', length: '34" (86cm)', sleeve: '—', waist: '26–28" (66–71cm)', hip: '36–38" (91–97cm)' },
  { size: "M", chest: '36–38" (91–97cm)', length: '35" (89cm)', sleeve: '—', waist: '28–30" (71–76cm)', hip: '38–40" (97–102cm)' },
  { size: "L", chest: '38–40" (97–102cm)', length: '36" (91cm)', sleeve: '—', waist: '30–33" (76–84cm)', hip: '40–43" (102–109cm)' },
  { size: "XL", chest: '40–43" (102–109cm)', length: '37" (94cm)', sleeve: '—', waist: '33–36" (84–91cm)', hip: '43–46" (109–117cm)' },
  { size: "XXL", chest: '43–46" (109–117cm)', length: '38" (97cm)', sleeve: '—', waist: '36–39" (91–99cm)', hip: '46–49" (117–124cm)' },
  { size: "3XL", chest: '46–49" (117–124cm)', length: '39" (99cm)', sleeve: '—', waist: '39–42" (99–107cm)', hip: '49–52" (124–132cm)' },
];

const HOW_TO_MEASURE = [
  {
    part: "Chest / Bust",
    instruction: "Measure around the fullest part of your chest, keeping the tape measure horizontal and snug but not tight. Breathe normally — the measurement should allow for natural movement.",
  },
  {
    part: "Waist",
    instruction: "Measure around your natural waistline — the narrowest part of your waist, usually about 1 inch above your belly button. Keep the tape comfortably loose.",
  },
  {
    part: "Hips",
    instruction: "Stand with feet together. Measure around the fullest part of your hips and buttocks, approximately 7–9 inches below your natural waistline.",
  },
  {
    part: "Length (T-Shirt)",
    instruction: "Measured from the highest point of the shoulder (at the collar seam) straight down to the bottom hem. Lay the shirt flat for accuracy.",
  },
  {
    part: "Sleeve",
    instruction: "Measured from the shoulder seam to the end of the sleeve opening. Our t-shirts use a standard short-sleeve cut.",
  },
];

const FABRIC_FACTS = [
  { label: "Material", value: "60% Combed Cotton, 40% Polyester" },
  { label: "Fabric Weight", value: "5.3 oz/yd² (180 g/m²)" },
  { label: "Shrinkage Rate", value: "< 3% after first wash" },
  { label: "Print Method", value: "DTG (Direct-to-Garment)" },
  { label: "Print Durability", value: "50+ washes without visible fading" },
  { label: "Care", value: "Machine wash cold, tumble dry low" },
];

export default function SizeGuide() {
  const { injectJsonLd } = useSeoHead({
    title: "NFL Fan Shop Size Guide – T-Shirt & Dress Measurements (XS–3XL)",
    description: "Complete size chart with inch and centimeter measurements for NFL t-shirts and women's dresses. Chest, waist, hip, length, sleeve measurements for sizes XS through 3XL.",
    url: "/size-guide",
    type: "article",
  });

  useEffect(() => {
    injectJsonLd({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "NFL Fan Shop Size Guide – T-Shirt & Dress Measurements (XS–3XL)",
      "description": "Complete size chart with inch and centimeter measurements for NFL t-shirts and women's dresses. Chest, waist, hip, length, sleeve measurements for sizes XS through 3XL.",
      "author": { "@type": "Organization", "name": "NFL Fan Shop" },
      "publisher": { "@type": "Organization", "name": "NFL Fan Shop" },
      "datePublished": "2026-08-21",
      "dateModified": "2026-08-21",
    });
  }, [injectJsonLd]);

  return (
    <ShopLayout>
      <div className="container py-12 max-w-5xl">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ SIZING REFERENCE ]</p>
        <h1 className="font-display font-black text-3xl md:text-5xl neon-text-cyan tracking-wide mb-4">
          SIZE GUIDE & MEASUREMENTS
        </h1>
        <p className="font-tech text-sm text-muted-foreground tracking-wide mb-2">
          All measurements in inches (in) and centimeters (cm) · Updated Aug 21, 2026
        </p>

        {/* Fabric Facts */}
        <div className="hud-corners border border-border/70 bg-card p-6 my-10">
          <p className="font-tech text-xs tracking-[0.3em] neon-text-pink mb-4">[ FABRIC SPECIFICATIONS ]</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FABRIC_FACTS.map(f => (
              <div key={f.label} className="border border-border/40 bg-secondary/30 p-4">
                <p className="font-tech text-[10px] tracking-[0.2em] text-muted-foreground mb-1">{f.label}</p>
                <p className="font-display text-sm font-bold neon-text-cyan">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* T-Shirt Size Table */}
        <section className="mb-14">
          <h2 className="font-display font-bold text-2xl neon-text-pink tracking-wide mb-6">NFL TEAM T-SHIRT SIZE CHART</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-tech text-sm">
              <thead>
                <tr className="border-b-2 border-cyan-400/40">
                  <th className="text-left py-3 px-4 tracking-[0.2em] neon-text-cyan">SIZE</th>
                  <th className="text-left py-3 px-4 tracking-[0.2em] text-muted-foreground">CHEST</th>
                  <th className="text-left py-3 px-4 tracking-[0.2em] text-muted-foreground">LENGTH</th>
                  <th className="text-left py-3 px-4 tracking-[0.2em] text-muted-foreground">SLEEVE</th>
                </tr>
              </thead>
              <tbody>
                {TSHIRT_SIZES.map((row, i) => (
                  <tr key={row.size} className={i % 2 === 0 ? "bg-secondary/20" : ""}>
                    <td className="py-3 px-4 font-bold neon-text-pink">{row.size}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.chest}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.length}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dress Size Table */}
        <section className="mb-14">
          <h2 className="font-display font-bold text-2xl neon-text-pink tracking-wide mb-6">GAME-DAY DRESS SIZE CHART</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-tech text-sm">
              <thead>
                <tr className="border-b-2 border-pink-400/40">
                  <th className="text-left py-3 px-4 tracking-[0.2em] neon-text-pink">SIZE</th>
                  <th className="text-left py-3 px-4 tracking-[0.2em] text-muted-foreground">CHEST</th>
                  <th className="text-left py-3 px-4 tracking-[0.2em] text-muted-foreground">WAIST</th>
                  <th className="text-left py-3 px-4 tracking-[0.2em] text-muted-foreground">HIP</th>
                  <th className="text-left py-3 px-4 tracking-[0.2em] text-muted-foreground">LENGTH</th>
                </tr>
              </thead>
              <tbody>
                {DRESS_SIZES.map((row, i) => (
                  <tr key={row.size} className={i % 2 === 0 ? "bg-secondary/20" : ""}>
                    <td className="py-3 px-4 font-bold neon-text-cyan">{row.size}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.chest}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.waist}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.hip}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How to Measure */}
        <section className="mb-12">
          <h2 className="font-display font-bold text-2xl neon-text-cyan tracking-wide mb-6">HOW TO MEASURE YOURSELF</h2>
          <p className="font-tech text-sm text-muted-foreground tracking-wide mb-6">
            For the most accurate fit, use a flexible cloth measuring tape and wear light clothing. Measure in front of a mirror to ensure the tape is level.
          </p>
          <div className="space-y-4">
            {HOW_TO_MEASURE.map((h) => (
              <div key={h.part} className="hud-corners border border-border/40 bg-card p-5">
                <h3 className="font-display font-semibold text-sm neon-text-pink tracking-wide mb-2">{h.part}</h3>
                <p className="font-tech text-sm text-muted-foreground tracking-wide leading-relaxed">{h.instruction}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sizing Tips */}
        <div className="hud-corners border border-border/70 bg-card p-6">
          <h2 className="font-display font-bold text-xl neon-text-cyan tracking-wide mb-4">SIZING TIPS & NOTES</h2>
          <ul className="space-y-2 font-tech text-sm text-muted-foreground tracking-wide">
            <li>• <strong>Between sizes?</strong> Size up for a relaxed fit, size down for a fitted look. Our cotton blend has minimal shrinkage (&lt;3%).</li>
            <li>• <strong>T-shirts</strong> use a unisex regular fit — not slim, not oversized. If you prefer an oversized look, go up one size.</li>
            <li>• <strong>Dresses</strong> use a women's A-line cut. The fit is true to standard US women's sizing.</li>
            <li>• <strong>Wash care:</strong> Machine wash cold, inside out. Tumble dry low or hang dry to maximize print life and minimize shrinkage.</li>
            <li>• Free exchanges within 30 days if the size isn't right. See our <a href="/faq" className="neon-text-cyan hover:underline">FAQ</a> for return details.</li>
          </ul>
        </div>
      </div>
    </ShopLayout>
  );
}
