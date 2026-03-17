import { useState, useEffect } from "react";
import { FloatingSidebar } from "./FloatingSidebar";
import { CommandBar } from "./CommandBar";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { getApiData } from "@/lib/api";

const mobileNavItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Projects", path: "/projects" },
  { label: "Community", path: "/community" },
  { label: "Connections", path: "/connections" },
  { label: "Startups", path: "/startups" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Messages", path: "/messages" },
  { label: "Settings", path: "/settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });
  const [user, setUser] = useState<{ full_name: string; username: string; email: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleToggleCollapse = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem("sidebar_collapsed", String(newVal));
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const data = await getApiData("/api/v1/auth/me");
        setUser(data);
      } catch (err) {
        console.error("Error fetching user in layout:", err);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cool Background Orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>
      <CommandBar />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block transition-all duration-300">
        <FloatingSidebar collapsed={collapsed} onToggle={handleToggleCollapse} user={user} />
      </div>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-border/30 bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <span className="text-sm font-bold tracking-tight text-foreground">STUSIL</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-14 z-30 border-b border-border/30 bg-card/95 backdrop-blur-xl lg:hidden"
          >
            <nav className="space-y-1 p-3">
              {mobileNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {user?.email === 'stusil.org@gmail.com' && (
                <button
                  onClick={() => { navigate("/admin"); setMobileOpen(false); }}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                    location.pathname === "/admin"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  Admin
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`pt-14 lg:pt-0 transition-all duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <div className="mx-auto max-w-7xl p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
