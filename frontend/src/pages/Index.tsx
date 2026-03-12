import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, Users, Zap, ArrowUpRight,
  Plus, Search, MessageCircle, FolderOpen, Rocket, Bell, Star,
  BarChart3, Target, BookOpen, Check, ExternalLink, Briefcase,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

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

  // Fetch dashboard data
  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = async () => {
      try {
        // User
        const userRes = await fetch("/api/v1/auth/me", { headers });
        if (userRes.ok) { const userData = await userRes.json(); setUser(userData); }

        // Projects
        const projRes = await fetch("/api/v1/projects", { headers });
        if (projRes.ok) { const pData = await projRes.json(); setProjectCount(Array.isArray(pData) ? pData.length : 0); }

        // Connections
        const connRes = await fetch("/api/v1/connections", { headers });
        if (connRes.ok) { const cData = await connRes.json(); setConnectionCount(cData.connectedUsers?.length || 0); }

        // Notifications
        const notifRes = await fetch("/api/v1/notifications", { headers });
        if (notifRes.ok) { const nData = await notifRes.json(); setNotifications(nData); setUnreadCount(nData.filter((n: NotificationType) => !n.is_read).length); }

        // Build activity from notifications (last 5)
        const notifs = await (await fetch("/api/v1/notifications", { headers })).json();
        if (Array.isArray(notifs)) {
          const actItems: ActivityItem[] = notifs.slice(0, 5).map((n: NotificationType) => ({
            id: n.id,
            icon: n.type === "application" ? Briefcase : n.type === "accepted" ? Check : n.type === "connection" ? Users : Bell,
            label: n.body,
            time: timeAgo(n.created_at),
            color: n.type === "accepted" ? "text-emerald-400 bg-emerald-500/10" : n.type === "application" ? "text-primary bg-primary/10" : "text-amber-400 bg-amber-500/10",
            link: n.link || undefined,
          }));
          setActivity(actItems);
        }

        // Build recommendations from projects with open roles
        const allProj = await (await fetch("/api/v1/projects", { headers })).json();
        if (Array.isArray(allProj)) {
          const recs: Recommendation[] = [];
          for (const p of allProj.slice(0, 10)) {
            const openRoles = (p.roles || []).filter((r: any) => !r.is_filled);
            if (openRoles.length > 0 && p.owner_id !== (await userRes.json?.call(userRes))?.id) {
              recs.push({
                id: p.id,
                title: p.title,
                type: `Needs: ${openRoles.map((r: any) => r.title).join(", ")}`,
                match: `${openRoles.length} roles`,
                link: "/projects",
              });
            }
            if (recs.length >= 3) break;
          }
          setRecommendations(recs);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      }
    };

    fetchAll();
  }, [token]);

  // Socket for real-time notifications
  useEffect(() => {
    if (!user) return;
    const socket = io({ transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => { socket.emit("join_personal", user.id); });

    socket.on("new_notification", (notif: NotificationType) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      // Add to activity
      setActivity((prev) => [{
        id: notif.id,
        icon: notif.type === "application" ? Briefcase : notif.type === "accepted" ? Check : Bell,
        label: notif.body,
        time: "just now",
        color: notif.type === "accepted" ? "text-emerald-400 bg-emerald-500/10" : "text-primary bg-primary/10",
        link: notif.link || undefined,
      }, ...prev.slice(0, 4)]);
    });

    return () => { socket.disconnect(); };
  }, [user]);

  const markAllRead = async () => {
    try {
      await fetch("/api/v1/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  return (
    <AppLayout>
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-20 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-20 left-10 h-[300px] w-[300px] rounded-full bg-glow-secondary/5 blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="heading-tight text-3xl font-bold text-foreground lg:text-4xl">
            Command Center
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome back, {user?.full_name || user?.username || "Innovator"}. Here's what's happening.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Stats cards */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="md:col-span-2">
            <GlassCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Skill Credits</p>
                  <p className="heading-tight mt-2 text-4xl font-bold text-foreground">0</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      <TrendingUp className="h-3 w-3" /> 0%
                    </span>
                    <span className="text-xs text-muted-foreground">from last month</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Active Projects</p>
              <p className="heading-tight mt-2 text-3xl font-bold text-foreground">{projectCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Across the platform</p>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <GlassCard>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Connections</p>
              <p className="heading-tight mt-2 text-3xl font-bold text-foreground">{connectionCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">{connectionCount > 0 ? "Growing your network!" : "Start networking today"}</p>
            </GlassCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2">
            <GlassCard>
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Quick Actions</p>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/30 p-3 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/5"
                  >
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                    {action.label}
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Recommendations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="md:col-span-2">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Recommended for You</p>
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-3">
                {recommendations.length > 0 ? recommendations.map((rec) => (
                  <div key={rec.id} onClick={() => navigate(rec.link)} className="flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-secondary/30 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                        <Star className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{rec.title}</p>
                        <p className="text-xs text-muted-foreground">{rec.type}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">{rec.match}</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No recommendations yet. Create a project or explore the community!</p>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Recent Activity - Real-time */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-2">
            <GlassCard>
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Recent Activity</p>
              <div className="space-y-3">
                <AnimatePresence>
                  {activity.length > 0 ? activity.map((act) => (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => act.link && navigate(act.link)}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/30 cursor-pointer"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${act.color}`}>
                        <act.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{act.label}</p>
                        <p className="text-xs text-muted-foreground">{act.time}</p>
                      </div>
                      {act.link && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                    </motion.div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No recent activity yet. Start collaborating!</p>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>

          {/* Notifications - Real-time */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-4">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">Mark all read</button>
                  )}
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <AnimatePresence>
                  {notifications.length > 0 ? notifications.slice(0, 6).map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => n.link && navigate(n.link)}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all hover:border-primary/30 ${
                        n.is_read ? "border-border/30 bg-secondary/10" : "border-primary/20 bg-primary/5"
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${n.is_read ? "bg-muted-foreground/30" : "bg-primary animate-pulse"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                      </div>
                    </motion.div>
                  )) : (
                    <p className="text-sm text-muted-foreground col-span-3">You have no notifications yet.</p>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Index;
