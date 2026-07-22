import ShopLayout from "@/components/ShopLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { injectFaqJsonLd } from "@/lib/structuredData";
import { useSeoHead } from "@/lib/useSeoHead";
import { useEffect } from "react";

const FAQS = [
  {
    question: "What teams do you sell merchandise for?",
    answer: "We carry premium fan gear for all 32 NFL teams — from the Dallas Cowboys and Kansas City Chiefs to the Green Bay Packers and San Francisco 49ers. Every team has its own collection of t-shirts and dresses.",
  },
  {
    question: "How much do NFL t-shirts and dresses cost?",
    answer: "Team t-shirts are priced at $34.99 each, and women's game-day dresses are $59.99 each. All prices include free standard shipping within the US.",
  },
  {
    question: "What sizes are available?",
    answer: "All our apparel comes in sizes XS through 3XL (XS, S, M, L, XL, XXL, 3XL). We recommend checking our size guide before ordering — most fans find their regular size fits well.",
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping takes 5–7 business days within the continental US. Express shipping (2–3 business days) is available at checkout for an additional fee. International shipping times vary by destination.",
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for unworn, unwashed items with tags still attached. Refunds are processed within 5 business days after we receive the return. Sale items are final sale.",
  },
  {
    question: "Are these officially licensed NFL products?",
    answer: "Our designs are fan-made and inspired by team colors and identity. We create high-quality apparel that lets fans rep their team in style without official licensing markups.",
  },
  {
    question: "How do I find gear for my favorite NFL team?",
    answer: "Visit our Teams page to browse all 32 franchises organized by division. Or use the search bar on the Shop page to filter by team name, city, or abbreviation.",
  },
  {
    question: "Do you offer discounts for bulk orders?",
    answer: "Yes! Orders of 10 or more items qualify for a 15% discount. Contact our support team for custom bulk pricing on larger orders or team events.",
  },
  {
    question: "Can I track my order?",
    answer: "Once your order ships, you'll receive a confirmation email with tracking information. You can also check your order status anytime in the My Orders section of your account.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe payment processing. Apple Pay and Google Pay are also supported.",
  },
];

export default function Faq() {
  const { injectJsonLd } = useSeoHead({
    title: "FAQ – Frequently Asked Questions",
    description: "Find answers to common questions about NFL Fan Shop — sizing, shipping, pricing, returns, team availability, bulk orders, and payment methods for all 32 NFL teams.",
    url: "/faq",
  });

  useEffect(() => {
    const cleanup = injectFaqJsonLd(FAQS, injectJsonLd);
    return cleanup;
  }, [injectJsonLd]);

  return (
    <ShopLayout>
      <div className="container py-12 max-w-3xl">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ HELP CENTER ]</p>
        <h1 className="font-display font-black text-3xl md:text-4xl neon-text-cyan tracking-wide mb-10">
          FREQUENTLY ASKED QUESTIONS
        </h1>

        <div className="hud-corners border border-border/70 bg-card p-6 mb-4">
          <Accordion type="single" collapsible className="space-y-1">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/40">
                <AccordionTrigger className="font-display text-base text-left hover:neon-text-cyan transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-tech text-sm text-muted-foreground leading-relaxed tracking-wide">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center pt-8">
          <p className="font-tech text-xs text-muted-foreground tracking-wider mb-2">[ STILL HAVE QUESTIONS? ]</p>
          <a
            href="mailto:support@nflfanshop.com"
            className="font-tech tracking-[0.2em] neon-text-pink hover:neon-glow-pink transition-all"
          >
            CONTACT SUPPORT
          </a>
        </div>
      </div>
    </ShopLayout>
  );
}
