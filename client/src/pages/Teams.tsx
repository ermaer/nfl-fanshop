import Breadcrumb from "@/components/Breadcrumb";
import ShopLayout from "@/components/ShopLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useSeoHead } from "@/lib/useSeoHead";
import { Link } from "wouter";

const DIVISIONS = [
  "AFC East", "AFC North", "AFC South", "AFC West",
  "NFC East", "NFC North", "NFC South", "NFC West",
];

export default function Teams() {
  const { data: teams, isLoading } = trpc.teams.list.useQuery();

  useSeoHead({
    title: "All 32 NFL Teams – Browse Fan Gear by Franchise",
    description: "Browse NFL fan gear for all 32 teams organized by division. Find premium t-shirts ($34.99) and women's dresses ($59.99) for your favorite AFC and NFC franchises.",
    url: "/teams",
  });

  return (
    <ShopLayout>
      <Breadcrumb items={[{ label: "Teams" }]} />
      <div className="container py-8">
        <p className="font-tech text-xs tracking-[0.3em] text-muted-foreground mb-2">[ FRANCHISE DATABASE ]</p>
        <h1 className="font-display font-black text-3xl md:text-4xl neon-text-cyan tracking-wide mb-10">
          NFL TEAMS // 32 UNITS
        </h1>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {DIVISIONS.map(division => {
              const divisionTeams = teams?.filter(t => t.division === division) ?? [];
              return (
                <section key={division} className="hud-corners border border-border/70 bg-card p-6">
                  <h2 className="font-display font-bold tracking-[0.2em] text-sm mb-4 flex items-center gap-2">
                    <span className={division.startsWith("AFC") ? "neon-text-pink" : "neon-text-cyan"}>
                      {division.toUpperCase()}
                    </span>
                    <span className="hud-line flex-1" />
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {divisionTeams.map(team => (
                      <Link key={team.id} href={`/shop?team=${team.abbreviation}`}>
                        <div className="group flex items-center gap-3 border border-border/50 hover:neon-border-cyan bg-secondary/30 px-3 py-2.5 transition-all duration-200 cursor-pointer">
                          <div
                            className="w-9 h-9 rounded-full border-2 shrink-0 transition-transform group-hover:scale-110 flex items-center justify-center"
                            style={{
                              backgroundColor: team.primaryColor,
                              borderColor: team.secondaryColor,
                              boxShadow: `0 0 8px ${team.primaryColor}`,
                            }}>
                            <span className="font-tech text-[9px] font-bold" style={{ color: team.secondaryColor }}>
                              {team.abbreviation}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-display font-semibold text-sm truncate group-hover:neon-text-cyan transition-all">
                              {team.city} {team.name}
                            </p>
                            <p className="font-tech text-[10px] text-muted-foreground tracking-wider">
                              {team.conference} // {team.abbreviation}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
