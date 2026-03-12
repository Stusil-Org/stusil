import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const commands = [
  { label: "Dashboard", path: "/dashboard", section: "Navigation", icon: "🏠" },
  { label: "Projects", path: "/projects", section: "Navigation", icon: "📋" },
  { label: "Community", path: "/community", section: "Navigation", icon: "👥" },
  { label: "Startups", path: "/startups", section: "Navigation", icon: "🚀" },
  { label: "Portfolio", path: "/portfolio", section: "Navigation", icon: "📁" },
  { label: "Messages", path: "/messages", section: "Navigation", icon: "💬" },
  { label: "Settings", path: "/settings", section: "Navigation", icon: "⚙️" },
  { label: "Admin Panel", path: "/admin", section: "Navigation", icon: "🛡️" },
  { label: "New Project", path: "/projects", section: "Actions", icon: "✨" },
  { label: "Post Startup Idea", path: "/startups", section: "Actions", icon: "💡" },
  { label: "Find Teammates", path: "/community", section: "Actions", icon: "🔍" },
  { label: "Public Page", path: "/explore", section: "Pages", icon: "🌐" },
];

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.section]) acc[cmd.section] = [];
    acc[cmd.section].push(cmd);
    return acc;
  }, {} as Record<string, typeof commands>);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <div className="glass-card overflow-hidden border border-border/50 shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">ESC</kbd>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {Object.entries(grouped).map(([section, items]) => (
                  <div key={section}>
                    <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{section}</p>
                    {items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleSelect(item.path)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-primary/10"
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">No results found.</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function CommandBarTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
      className="flex w-full items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search</span>
      <kbd className="ml-auto rounded border border-border bg-muted px-1 py-0.5 text-[10px]">⌘K</kbd>
    </button>
  );
}
