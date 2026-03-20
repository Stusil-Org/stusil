import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Zap, Award, User, Flame, ArrowUpRight, Globe, Code } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { getApiData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export default function Leaderboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await getApiData("/api/v1/community/leaderboard");
        setData(res);
      } catch (err) {
        console.error("Error fetching leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
     return (
        <AppLayout>
           <div className="max-w-6xl mx-auto space-y-12 py-12">
              <Skeleton className="h-40 rounded-[3rem] w-full" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Skeleton className="h-96 rounded-[2.5rem] w-full" />
                 <Skeleton className="h-96 rounded-[2.5rem] w-full" />
              </div>
           </div>
        </AppLayout>
     );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header Hero */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }} 
           animate={{ opacity: 1, y: 0 }}
           className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-primary/20 via-background to-purple-500/10 border border-primary/20 p-6 md:p-12 lg:p-16 text-center mb-10 md:mb-16 shadow-2xl"
        >
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-none" />
           <Trophy className="h-12 w-12 md:h-16 md:w-16 text-primary mx-auto mb-4 md:mb-6 animate-bounce-subtle" />
           <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tighter mb-4">The Hall of Fame</h1>
           <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-lg leading-relaxed font-medium">
             Honoring the most relentless builders, visionary founders, and impactful student innovators in the ecosystem.
           </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Top Students / Innovators */}
          <div className="lg:col-span-8 flex flex-col gap-8">
             <div className="flex items-center justify-between px-4">
                <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                   <Award className="h-6 w-6 text-primary" /> Top Innovators
                </h2>
                <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full border border-border/50">XP Based Ranking</div>
             </div>

             <div className="space-y-4">
                {data?.topStudents.map((u: any, i: number) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/u/${u.username}`)}
                    className="group cursor-pointer"
                  >
                    <GlassCard className="flex items-center gap-6 p-5 glass-card-hover border-border/50 transition-all hover:bg-primary/5">
                       <div className="flex-shrink-0 w-10 text-center font-black text-2xl italic text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                          #{i + 1}
                       </div>
                       <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 border-background shadow-lg">
                          {u.profile_image ? (
                             <img src={u.profile_image} className="h-full w-full object-cover" />
                          ) : (
                             <div className="h-full w-full bg-primary/10 flex items-center justify-center text-sm font-black text-primary uppercase">
                                {(u.full_name || u.username || "??").substring(0, 2)}
                             </div>
                          )}
                       </div>
                       <div className="flex-1">
                          <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">{u.full_name}</h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">@{u.username} • {u.country || "Earth"}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] bg-secondary/50 px-2 py-0.5 rounded-full font-bold text-muted-foreground">{u.field_of_study || "Independent"}</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 text-center">
                          <div className="hidden sm:block">
                             <p className="text-sm font-black text-foreground">{(u._count?.projects || 0) + (u._count?.startups || 0)}</p>
                             <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Ops</p>
                          </div>
                          <div className="w-px h-8 bg-border/50 hidden sm:block" />
                          <div>
                             <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                                <Zap className="h-3 w-3 text-primary fill-current" />
                                <span className="text-xs font-black text-primary">{((u._count?.projects || 0) + (u._count?.startups || 0)) * 10} XP</span>
                             </div>
                          </div>
                       </div>
                    </GlassCard>
                  </motion.div>
                ))}
             </div>
          </div>

          {/* Top Projects Sidebar */}
          <div className="lg:col-span-4 space-y-8">
             <div className="flex items-center gap-3 px-2 mb-8">
                <Flame className="h-6 w-6 text-amber-500 animate-pulse" />
                <h2 className="text-xl font-black text-foreground">Hot Projects</h2>
             </div>
             
             <div className="space-y-4">
                {data?.topProjects.map((p: any, i: number) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => navigate(`/projects?project=${p.id}`)}
                    className="group cursor-pointer"
                  >
                    <GlassCard className="p-6 border-amber-500/20 glass-card-hover relative overflow-hidden">
                       <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                       <span className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-500 mb-3 block">{p.field}</span>
                       <h4 className="text-base font-black text-foreground mb-4 group-hover:text-amber-500 transition-colors line-clamp-1">{p.title}</h4>
                       <div className="flex items-center justify-between pt-4 border-t border-border/30">
                          <div className="flex items-center gap-2">
                             <div className="h-5 w-5 rounded-lg bg-secondary flex items-center justify-center text-[8px] font-black text-muted-foreground uppercase">{p.owner?.full_name?.substring(0, 1) || "U"}</div>
                             <span className="text-[9px] font-bold text-muted-foreground uppercase">{p.owner?.full_name?.split(' ')[0] || "User"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-500">
                             <Star className="h-3 w-3 fill-current" /> {p.stars}
                          </div>
                       </div>
                    </GlassCard>
                  </motion.div>
                ))}
             </div>

             <GlassCard className="p-8 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 text-center">
                <Code className="h-8 w-8 text-purple-500 mx-auto mb-4" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-2">Build for Rankings</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                  Projects with detailed documentation and consistent updates gain XP faster. Top innovators get exclusive Beta feature access.
                </p>
                <div className="flex flex-col gap-2">
                   <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground">Collabs</span>
                      <span className="text-primary">+5 XP</span>
                   </div>
                   <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground">Community Score</span>
                      <span className="text-primary">+15 XP</span>
                   </div>
                </div>
             </GlassCard>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
