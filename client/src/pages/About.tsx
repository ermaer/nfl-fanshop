import ShopLayout from "@/components/ShopLayout";
import { useSeoHead } from "@/lib/useSeoHead";
import { Zap, Shirt, Shield, Truck } from "lucide-react";

const FEATURES = [
  {
    icon: Shirt,
    title: "All 32 Teams",
    description: "Every NFL franchise represented — from AFC East to NFC West. Premium tees and dresses in official team colors.",
  },
  {
    icon: Shield,
    title: "Quality Materials",
    description: "High-grade cotton blends with vibrant, fade-resistant prints that stay sharp through every wash and every game day.",
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    description: "Free standard shipping on all US orders. Express delivery available for last-minute game day needs.",
  },
  {
    icon: Zap,
    title: "Fan-First Design",
    description: "Designed by fans, for fans. Our gear blends team identity with street-ready style you can wear beyond the stadium.",
  },
];

export default function About() {
  useSeoHead({
    title: "About Us",
    description: "Learn about NFL Fan Shop — a fan-made apparel brand offering premium t-shirts ($34.99) and dresses ($59.99) for all 32 NFL teams. Designed by fans, for fans.",
    url: "/about",
  });

  return (
    <ShopLayout>
      <div className="container py-12 max-w-4xl">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ OUR STORY ]</p>
        <h1 className="font-display font-black text-3xl md:text-4xl neon-text-cyan tracking-wide mb-10">
          ABOUT NFL FAN SHOP
        </h1>

        <div className="hud-corners border border-border/70 bg-card p-8 mb-10">
          <p className="font-tech text-base text-muted-foreground leading-relaxed tracking-wide mb-6">
            NFL Fan Shop was born from a simple idea: every fan deserves to rep their team in style without breaking the bank. We are a fan-made apparel brand dedicated to all 32 NFL franchises, offering premium-quality t-shirts at <span className="neon-text-pink">$34.99</span> and women's game-day dresses at <span className="neon-text-pink">$59.99</span>.
          </p>
          <p className="font-tech text-base text-muted-foreground leading-relaxed tracking-wide mb-6">
            Whether you're tailgating at Arrowhead, watching from the Dawg Pound, or hosting a watch party at home — our gear is built for the fan who shows up loud and proud. We design every piece to capture the energy, colors, and identity that make each NFL franchise unique.
          </p>
          <p className="font-tech text-base text-muted-foreground leading-relaxed tracking-wide">
            From the storied tradition of the Green Bay Packers to the new energy of the Las Vegas Raiders, we've got every fan covered. <span className="neon-text-cyan">Rep your colors. Own the gridiron.</span>
          </p>
        </div>

        <h2 className="font-display font-bold text-2xl neon-text-pink tracking-wide mb-6">
          WHY SHOP WITH US
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {FEATURES.map((f) => (
            <div key={f.title} className="hud-corners border border-border/70 bg-card p-5 flex gap-4">
              <f.icon className="w-8 h-8 shrink-0 neon-text-cyan" />
              <div>
                <h3 className="font-display font-semibold text-sm tracking-wide mb-1">{f.title}</h3>
                <p className="font-tech text-xs text-muted-foreground leading-relaxed tracking-wide">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-display font-bold text-2xl neon-text-cyan tracking-wide mb-6">
          MEET THE 32
        </h2>
        <p className="font-tech text-base text-muted-foreground leading-relaxed tracking-wide mb-4">
          We cover every NFL team across both conferences and all eight divisions:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-tech text-xs text-muted-foreground tracking-wider">
          {[
            "AFC East: Bills, Dolphins, Patriots, Jets",
            "AFC North: Ravens, Bengals, Browns, Steelers",
            "AFC South: Texans, Colts, Jaguars, Titans",
            "AFC West: Broncos, Chiefs, Raiders, Chargers",
            "NFC East: Cowboys, Giants, Eagles, Commanders",
            "NFC North: Bears, Lions, Packers, Vikings",
            "NFC South: Falcons, Panthers, Saints, Buccaneers",
            "NFC West: Cardinals, Rams, 49ers, Seahawks",
          ].map((line) => (
            <div key={line} className="border border-border/40 bg-secondary/30 p-2 text-center">
              {line}
            </div>
          ))}
        </div>
      </div>
    </ShopLayout>
  );
}
