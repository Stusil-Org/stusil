import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  MessageCircle,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Briefcase,
  Shield,
  Sun,
  Moon,
  UserPlus
} from "lucide-react";
import { useState, useEffect } from "react";
import { CommandBarTrigger } from "./CommandBar";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Briefcase, label: "Projects", path: "/projects" },
  { icon: Users, label: "Community", path: "/community" },
  { icon: Rocket, label: "Startups", path: "/startups" },
  { icon: FolderOpen, label: "Portfolio", path: "/portfolio" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: UserPlus, label: "Connections", path: "/connections" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const adminItems = [
  { icon: Shield, label: "Admin", path: "/admin" },
];

export function FloatingSidebar({ 
  collapsed, 
  onToggle, 
  user 
}: { 
  collapsed: boolean; 
  onToggle: () => void;
  user: { full_name: string; username: string; email: string } | null;
}) {
  const [isDark, setIsDark] = useState(() => !document.documentElement.classList.contains("light"));
  const location = useLocation();
  const navigate = useNavigate();

  // Theme toggle
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") {
      document.documentElement.classList.add("light");
      setIsDark(false);
    } else {
      document.documentElement.classList.remove("light");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={`fixed left-4 top-4 bottom-4 z-40 flex flex-col rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 ${collapsed ? "w-16" : "w-56"
        }`}
    >
      <div className="flex items-center gap-3 border-b border-border/30 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold tracking-tight text-foreground">
            STUSIL
          </motion.span>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 py-3">
          <CommandBarTrigger />
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Admin - only for admin email */}
        {user?.email === 'stusil.org@gmail.com' && (
          <>
            <div className="my-3 h-px bg-border/30" />
            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 py-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
        >
          {isDark ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
          {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
        </button>
      </div>

      {/* User */}
      {!collapsed && (
        <div className="border-t border-border/30 px-3 py-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary uppercase">
              {user?.full_name ? user.full_name.substring(0, 2) : user?.username ? user.username.substring(0, 2) : "AJ"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{user?.full_name || user?.username || "Loading..."}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.email || "..."}</p>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border/30 px-3 py-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-xl py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
