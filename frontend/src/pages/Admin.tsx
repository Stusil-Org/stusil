import { motion } from "framer-motion";
import {
  Users, FolderOpen, Rocket, Shield,
  Eye, Ban, Search, Trash2, ChartBar, X
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [tab, setTab] = useState<"overview" | "users" | "projects" | "startups">("overview");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [startups, setStartups] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      try {
        const res = await fetch("/api/v1/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const me = await res.json();
          if (me.email === 'nitnaware.prathmesh@gmail.com') {
            setIsAdmin(true);
          } else {
            navigate("/dashboard");
          }
        } else {
          navigate("/login");
        }
      } catch { navigate("/login"); }
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [uRes, pRes, sRes, rRes] = await Promise.all([
        fetch("/api/v1/admin/users", { headers }),
        fetch("/api/v1/admin/projects", { headers }),
        fetch("/api/v1/admin/startups", { headers }),
        fetch("/api/v1/admin/reports", { headers })
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (pRes.ok) setProjects(await pRes.json());
      if (sRes.ok) setStartups(await sRes.json());
      if (rRes.ok) setReports(await rRes.json());
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/v1/admin/${type}s/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert(`Failed to delete ${type}`);
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
    }
  };

  const handleResolveReport = async (id: string, action: 'dismiss' | 'remove_target') => {
    if (action === 'remove_target' && !window.confirm("Are you sure you want to delete the reported content across the platform?")) return;
    try {
      const res = await fetch(`/api/v1/admin/reports/${id}/resolve`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Error resolving report", err);
    }
  };

  const handleRemoveMember = async (type: "project" | "startup", parentId: string, memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member from the group?")) return;
    try {
      const res = await fetch(`/api/v1/admin/${type}s/${parentId}/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove member");
      }
    } catch (err) {
      console.error("Error removing member", err);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.owner?.full_name || p.owner?.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredStartups = startups.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.creator?.full_name || s.creator?.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingReports = reports.filter(r => r.status === 'pending');

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "All Projects", value: projects.length, icon: FolderOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Startup Ideas", value: startups.length, icon: Rocket, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Pending Reports", value: pendingReports.length, icon: Ban, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  if (!isAdmin) return <AppLayout><div className="flex h-screen items-center justify-center p-8 text-muted-foreground animate-pulse">Verifying access...</div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="heading-tight text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage users, flag content, and moderate projects.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 auto-cols-auto rounded-xl bg-secondary/30 p-1 w-fit flex-wrap">
          {(["overview", "users", "projects", "startups", "reports"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t as any); setSearch(""); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                tab === t ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="glass-card-hover border-border/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                        <p className="heading-tight mt-2 text-4xl font-black text-foreground">{stat.value}</p>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
            
            <GlassCard>
              <div className="flex flex-col items-center justify-center p-8 text-center opacity-50">
                <ChartBar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold text-foreground">System Health</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">All moderation systems running smoothly. Switch to the other tabs to monitor active content.</p>
              </div>
            </GlassCard>
          </div>
        )}

        {tab === "users" && (
          <div>
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 w-full max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-secondary/20">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">Projects</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">Joined</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border/20 transition-colors hover:bg-secondary/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                              {u.name?.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            u.role === "Admin" ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-muted-foreground"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.projectsCount || 0}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.joined}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete('user', u.id)} disabled={u.role === "Admin"} className="rounded-lg p-2 text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
                            <Ban className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "projects" && (
          <div>
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 w-full max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects by title or owner..." className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>

            <div className="space-y-4">
              {filteredProjects.map((p) => (
                <GlassCard key={p.id} className="p-5 glass-card-hover group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                        <FolderOpen className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">By {p.owner?.full_name || p.owner?.username} · {new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete('project', p.id)} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors w-fit">
                      <Trash2 className="h-4 w-4" /> Delete Project
                    </button>
                  </div>
                  
                  {/* Members Section */}
                  {p.members && p.members.length > 0 && (
                    <div className="mt-5 border-t border-border/30 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Project Members ({p.members.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {p.members.map((m: any) => (
                          <div key={m.id} className="flex items-center gap-2 bg-secondary/30 rounded-xl px-2.5 py-1.5 border border-border/20 group/member">
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                              {m.user?.full_name?.substring(0,2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground leading-none">{m.user?.full_name}</span>
                              <span className="text-[8px] text-muted-foreground mt-0.5">{m.role}</span>
                            </div>
                            {m.user_id !== p.owner_id && (
                              <button 
                                onClick={() => handleRemoveMember('project', p.id, m.id)}
                                className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                title="Remove member"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              ))}
              {filteredProjects.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm glass-card border-dashed">No projects found.</div>
              )}
            </div>
          </div>
        )}

        {tab === "startups" && (
          <div>
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 w-full max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ideas by title or owner..." className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>

            <div className="space-y-4">
              {filteredStartups.map((s) => (
                <GlassCard key={s.id} className="p-5 glass-card-hover group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10">
                        <Rocket className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">By {s.creator?.full_name || s.creator?.username} · {new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete('startup', s.id)} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors w-fit">
                      <Trash2 className="h-4 w-4" /> Delete Idea
                    </button>
                  </div>

                  {/* Startup Members Section */}
                  {s.members && s.members.length > 0 && (
                    <div className="mt-5 border-t border-border/30 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Startup Team ({s.members.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {s.members.map((m: any) => (
                          <div key={m.id} className="flex items-center gap-2 bg-secondary/30 rounded-xl px-2.5 py-1.5 border border-border/20 group/member">
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                              {m.user?.full_name?.substring(0,2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground leading-none">{m.user?.full_name}</span>
                              <span className="text-[8px] text-muted-foreground mt-0.5">{m.role}</span>
                            </div>
                            <button 
                              onClick={() => handleRemoveMember('startup', s.id, m.id)}
                              className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              title="Remove member"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              ))}
              {filteredStartups.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm glass-card border-dashed">No startup ideas found.</div>
              )}
            </div>
          </div>
        )}
        {tab === "reports" as any && (
          <div>
            <div className="space-y-3">
              <h2 className="heading-tight text-xl font-bold mb-4">Pending Reports ({pendingReports.length})</h2>
              {pendingReports.map((r) => (
                <GlassCard key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 glass-card-hover group gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 flex-shrink-0">
                      <Ban className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground uppercase tracking-widest text-xs mb-1 text-amber-500">Reported {r.type}</h3>
                      <p className="text-sm font-medium">Target: {r.target_name}</p>
                      <p className="text-sm text-foreground my-1 bg-secondary/30 p-2 rounded-lg italic border border-border/50">"{r.reason}"</p>
                      <p className="text-xs text-muted-foreground">Reported by {r.reporter?.full_name || r.reporter?.username} · {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col lg:flex-row shrink-0">
                    <button onClick={() => handleResolveReport(r.id, 'dismiss')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground bg-secondary/80 hover:bg-secondary transition-colors">
                      Dismiss Report
                    </button>
                    <button onClick={() => handleResolveReport(r.id, 'remove_target')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-4 w-4" /> Remove Content
                    </button>
                  </div>
                </GlassCard>
              ))}
              {pendingReports.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm glass-card border-dashed">No completely pending reports found. The platform is secure.</div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
