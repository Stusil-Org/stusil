import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, Users, Zap, ArrowUpRight,
  Plus, Search, MessageCircle, FolderOpen, Rocket, Bell, Star,
  BarChart3, Target, BookOpen, Check, ExternalLink, Briefcase, Flame,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { getApiData, apiFetch } from "@/lib/api";

interface NotificationType {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface ActivityItem {
  id: string;
  icon: any;
  label: string;
  time: string;
  color: string;
  link?: string;
}

interface Recommendation {
  id: string;
  title: string;
  type: string;
  match: string;
  link: string;
}

const quickActions = [
  { label: "New Project", icon: Plus, color: "text-primary", path: "/projects" },
  { label: "Find Team", icon: Search, color: "text-glow-secondary", path: "/community" },
  { label: "Post Idea", icon: Rocket, color: "text-amber-400", path: "/startups" },
  { label: "Messages", icon: MessageCircle, color: "text-emerald-400", path: "/messages" },
];

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [projectCount, setProjectCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    const fetchAll = async () => {
      try {
        const userData = await getApiData("/api/v1/auth/me");
        setUser(userData);

        const pData = await getApiData("/api/v1/projects");
        setProjectCount(Array.isArray(pData) ? pData.length : 0);

        const cData = await getApiData("/api/v1/connections");
        setConnectionCount(cData.connectedUsers?.length || 0);

        const nData = await getApiData("/api/v1/notifications");
        setNotifications(nData); 
        setUnreadCount(nData.filter((n: NotificationType) => !n.is_read).length);
        
        if (Array.isArray(nData)) {
          const actItems: ActivityItem[] = nData.slice(0, 5).map((n: NotificationType) => ({
            id: n.id,
            icon: n.type === "application" ? Briefcase : n.type === "accepted" ? Check : n.type === "connection" ? Users : Bell,
            label: n.body,
            time: timeAgo(n.created_at),
            color: n.type === "accepted" ? "text-emerald-500 bg-emerald-500/10" : n.type === "application" ? "text-primary bg-primary/10" : "text-amber-500 bg-amber-500/10",
            link: n.link || undefined,
          }));
          setActivity(actItems);
        }

        const allProj = await getApiData("/api/v1/projects");
        const allStartups = await getApiData("/api/v1/startups");
        
        const recs: Recommendation[] = [];
        if (Array.isArray(allProj)) {
          for (const p of allProj.slice(0, 10)) {
            const openRoles = (p.roles || []).filter((r: any) => !r.is_filled);
            if (openRoles.length > 0 && p.owner_id !== user?.id) {
              recs.push({
                id: p.id,
                title: p.title,
                type: `Needs: ${openRoles[0].title}`,
                match: `${Math.floor(Math.random() * 20) + 75}% Match`,
                link: `/projects`,
              });
            }
            if (recs.length >= 2) break;
          }
        }
        
        if (Array.isArray(allStartups) && recs.length < 3) {
          for (const s of allStartups.slice(0, 5)) {
            if (s.creator_id !== user?.id) {
              recs.push({
                id: s.id,
                title: s.title,
                type: "Hot Startup Idea",
                match: "Trending",
                link: "/startups",
              });
            }
            if (recs.length >= 3) break;
          }
        }
        setRecommendations(recs);
      } catch (error) { console.error("Error", error); }
    };

    fetchAll();
  }, [token]);

  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL || '', { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => { socket.emit("join_personal", user.id); });
    socket.on("new_notification", (notif: NotificationType) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setActivity((prev) => [{
        id: notif.id,
        icon: notif.type === "application" ? Briefcase : notif.type === "accepted" ? Check : Bell,
        label: notif.body,
        time: "just now",
        color: notif.type === "accepted" ? "text-emerald-500 bg-emerald-500/10" : "text-primary bg-primary/10",
        link: notif.link || undefined,
      }, ...prev.slice(0, 4)]);
    });
    return () => { socket.disconnect(); };
  }, [user]);

  const markAllRead = async () => {
    try {
      await apiFetch("/api/v1/notifications/read-all", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  return (
    <AppLayout>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-20 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-20 left-10 h-[300px] w-[300px] rounded-full bg-glow-secondary/5 blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 p-1 md:p-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary uppercase shadow-2xl">
                {user?.profile_image ? (
                  <img src={user.profile_image} className="h-full w-full object-cover" />
                ) : (
                  user?.full_name?.substring(0, 1) || "U"
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background bg-emerald-500 shadow-xl" />
            </div>
            <div>
              <h1 className="heading-tight text-3xl font-black text-foreground tracking-tight lg:text-4xl">
                Control Center
              </h1>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Stay updated, {user?.full_name || user?.username || "Innovator"}
              </p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-3">
             <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Rank</p>
                <p className="text-sm font-black text-foreground">Top 5%</p>
             </div>
             <div className="h-10 w-[2px] bg-border/50 mx-2" />
             <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</p>
                <p className="text-sm font-black text-emerald-500">Elite Scout</p>
             </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="md:col-span-2">
            <GlassCard className="relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 h-32 w-32 bg-primary/20 blur-[60px] rounded-full group-hover:scale-125 transition-transform duration-700" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Skill Credits</p>
                  <div className="flex items-baseline gap-2">
                    <p className="heading-tight text-5xl font-black text-foreground">1,250</p>
                    <span className="text-xs font-bold text-primary">SC</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex h-5 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-500 border border-emerald-500/20">
                      <TrendingUp className="h-2.5 w-2.5" /> +12%
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Active Growth</span>
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-xl shadow-primary/10">
                  <Wallet className="h-7 w-7 text-primary" />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard className="relative overflow-hidden border-glow-secondary/20 h-full">
              <div className="absolute -right-6 -bottom-6 h-20 w-20 bg-glow-secondary/10 blur-[40px] rounded-full" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Active Ventures</p>
                <p className="heading-tight mt-2 text-4xl font-black text-foreground">{projectCount}</p>
                <div className="mt-4 flex items-center gap-1.5">
                   <FolderOpen className="h-3 w-3 text-glow-secondary" />
                   <span className="text-[10px] font-bold text-glow-secondary uppercase">Project Phase</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <GlassCard className="relative overflow-hidden border-orange-500/20 h-full">
              <div className="absolute -right-6 -bottom-6 h-20 w-20 bg-orange-500/10 blur-[40px] rounded-full" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Founding Network</p>
                <p className="heading-tight mt-2 text-4xl font-black text-foreground">{connectionCount}</p>
                <div className="mt-4 flex items-center gap-1.5">
                   <Users className="h-3 w-3 text-orange-500" />
                   <span className="text-[10px] font-bold text-orange-500 uppercase">Teammates</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-1">
            <GlassCard className="h-full">
              <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Hub Access</p>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="group flex items-center justify-between rounded-xl border border-border/30 bg-secondary/20 p-4 transition-all hover:border-primary/50 hover:bg-primary/5 hover:translate-x-1 duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 group-hover:bg-primary/10 transition-colors`}>
                        <action.icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <span className="text-sm font-bold text-foreground">{action.label}</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="md:col-span-3">
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Smart Recommendations</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Tailored for your stack and interests</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.length > 0 ? recommendations.map((rec) => (
                  <div key={rec.id} onClick={() => navigate(rec.link)} className="group relative rounded-2xl border border-border/50 bg-secondary/10 p-5 pr-12 transition-all hover:border-primary/30 hover:bg-primary/5 cursor-pointer">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-lg shadow-primary/5">
                      {rec.type.includes("Startup") ? <Rocket className="h-5 w-5" /> : <FolderOpen className="h-5 w-5" />}
                    </div>
                    <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{rec.title}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{rec.type}</p>
                    <div className="mt-4 inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-500 border border-emerald-500/10">
                       {rec.match}
                    </div>
                    <ArrowUpRight className="absolute top-5 right-5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                )) : (
                  <div className="col-span-full py-10 text-center border-2 border-dashed border-border/20 rounded-3xl text-muted-foreground flex flex-col items-center gap-3">
                    <Zap className="h-10 w-10 text-primary/30" />
                    <p className="text-sm font-medium">Build your profile to unlock smarter recommendations</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-2">
            <GlassCard className="h-full">
               <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-foreground">Activity Feed</h3>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {activity.length > 0 ? activity.map((act, i) => (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      onClick={() => act.link && navigate(act.link)}
                      className="group flex items-center gap-4 rounded-xl p-3 transition-all hover:bg-secondary/30 hover:translate-x-1 cursor-pointer"
                    >
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-lg shadow-black/5 ${act.color}`}>
                        <act.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{act.label}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{act.time}</p>
                      </div>
                      {act.link && <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                    </motion.div>
                  )) : (
                    <div className="py-10 text-center text-muted-foreground text-xs font-medium border border-dashed border-border/20 rounded-2xl">
                      Your feed is quiet. Start something big!
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-2">
            <GlassCard className="h-full overflow-hidden relative">
              <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 blur-[50px] rounded-full" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">Live Alerts</h3>
                  {unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-lg shadow-primary/20 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all">Flush All</button>
                  )}
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-3 relative z-10">
                <AnimatePresence>
                  {notifications.length > 0 ? notifications.slice(0, 4).map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => n.link && navigate(n.link)}
                      className={`group flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-all hover:border-primary/50 ${
                        n.is_read ? "border-border/30 bg-secondary/10 opacity-70" : "border-primary/20 bg-primary/5 shadow-inner"
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${n.is_read ? "bg-muted-foreground/30" : "bg-primary shadow-lg shadow-primary/20"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-black text-foreground uppercase tracking-tight">{n.title}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">{timeAgo(n.created_at)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors font-medium">{n.body}</p>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="py-10 text-center text-muted-foreground text-xs font-medium border border-dashed border-border/20 rounded-2xl">
                      Zero alerts. You're all caught up!
                    </div>
                  )}
                </AnimatePresence>
                 {notifications.length > 4 && (
                   <button onClick={() => navigate('/notifications')} className="w-full py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors mt-2">
                     View All Alerts
                   </button>
                 )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Index;
