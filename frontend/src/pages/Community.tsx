import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Star, Rocket, Eye, Flame, Trophy, Plus } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { useNavigate } from "react-router-dom";
import { getApiData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function Community() {
  const [trending, setTrending] = useState<{ trendingProjects: any[], hotIdeas: any[] }>({ trendingProjects: [], hotIdeas: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const data = await getApiData("/api/v1/community/trending");
        setTrending(data);
      } catch (err) {
        console.error("Error fetching trending:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-12 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h1 className="heading-tight text-4xl font-black text-foreground lg:text-5xl tracking-tight">The Hype</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Real-time pulse of the most ambitious student projects and startup ideas. Join the movement.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-80 rounded-[2.5rem] w-full" />
                <Skeleton className="h-80 rounded-[2.5rem] w-full" />
                <Skeleton className="h-80 rounded-[2.5rem] w-full" />
                <Skeleton className="h-80 rounded-[2.5rem] w-full" />
             </div>
             <div className="lg:col-span-4 space-y-6">
                <Skeleton className="h-24 rounded-2xl w-full" />
                <Skeleton className="h-24 rounded-2xl w-full" />
                <Skeleton className="h-24 rounded-2xl w-full" />
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Trending Projects Area */}
            <div className="lg:col-span-8 space-y-8">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Trending Projects</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {trending.trendingProjects.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate('/projects')}
                      className="group relative cursor-pointer"
                    >
                      <GlassCard className="h-full overflow-hidden p-0 border-amber-500/20 glass-card-hover">
                        <div className="relative h-48 w-full overflow-hidden">
                          {p.banner_image ? (
                            <img src={p.banner_image} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-3xl font-black text-amber-500/30">
                              PRJ
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex gap-2">
                             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
                               <Eye className="h-3 w-3" /> {p.views}
                             </div>
                             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-[10px] font-bold text-black">
                               <Star className="h-3 w-3 fill-current" /> {p.stars}
                             </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2 block">{p.field}</span>
                          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-amber-400 transition-colors line-clamp-1">{p.title}</h3>
                          <div 
                            className="flex items-center gap-2 mt-4 hover:opacity-80 transition-opacity cursor-pointer inline-flex"
                            onClick={(e) => { e.stopPropagation(); navigate(`/u/${p.owner.username}`); }}
                          >
                             <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                               {p.owner.full_name?.substring(0, 1) || "?"}
                             </div>
                             <span className="text-xs text-muted-foreground font-medium">by {p.owner.full_name}</span>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                  {trending.trendingProjects.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-border/20 rounded-3xl text-muted-foreground">
                      No trending projects yet. Be the first to star one!
                    </div>
                  )}
                </div>
              </section>

              {/* Bonus Graphic/Call to Action Area */}
              <GlassCard className="p-8 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 border-primary/20 text-center overflow-hidden relative">
                 <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/20 blur-[60px] rounded-full" />
                 <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-purple-500/20 blur-[60px] rounded-full" />
                 <Flame className="h-10 w-10 text-primary mx-auto mb-4 animate-pulse" />
                 <h3 className="text-xl font-bold text-foreground mb-2">Build Your Legacy</h3>
                 <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                   Every project starts with a single star. Get your teammates together and start building something that people talk about.
                 </p>
                 <button onClick={() => navigate('/projects')} className="glow-button flex items-center gap-2 mx-auto">
                   <Plus className="h-4 w-4" /> Create Project
                 </button>
              </GlassCard>
            </div>

            {/* Sidebar: Hot Ideas & Community Pulse */}
            <div className="lg:col-span-4 space-y-8">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Rocket className="h-4 w-4 text-purple-500" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Hot Ideas</h2>
                </div>

                <div className="space-y-4">
                  {trending.hotIdeas.map((idea, i) => (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate('/startups')}
                      className="group cursor-pointer"
                    >
                      <GlassCard className="p-5 border-purple-500/20 glass-card-hover relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                        <h4 className="text-sm font-bold text-foreground mb-2 group-hover:text-purple-400 transition-colors">{idea.title}</h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">by {idea.creator.full_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400">
                             <Flame className="h-3 w-3" /> {idea.joinRequests} applicants
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                  {trending.hotIdeas.length === 0 && (
                    <div className="py-10 text-center border border-dashed border-border/20 rounded-2xl text-muted-foreground text-xs">
                      No hot ideas yet. Post one now!
                    </div>
                  )}
                </div>
              </section>

              <GlassCard className="p-6 border-primary/20 bg-secondary/10">
                <div className="flex items-center gap-2 mb-4">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Community Pulse</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                  Our ranking algorithm weighs <strong>recent engagement</strong>, <strong>star velocity</strong>, and <strong>view counts</strong> to surface the most promising student ventures.
                </p>
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-tighter">
                      <span className="text-muted-foreground">Star Weight</span>
                      <span className="text-primary">x5 Points</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-tighter">
                      <span className="text-muted-foreground">View Weight</span>
                      <span className="text-primary">x1 Point</span>
                   </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
