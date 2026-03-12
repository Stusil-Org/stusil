import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Users, Clock, X, Sparkles, Briefcase, ChevronDown,
  Check, UserPlus, Trash2, Eye, MessageCircle, Code, Palette, Server,
  Layers, Send, FileText, Share2, Link, Image as ImageIcon, Globe,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

interface RoleType {
  id: string;
  title: string;
  description: string | null;
  questions: string | null;
  is_filled: boolean;
  applications: ApplicationType[];
}

interface ApplicationType {
  id: string;
  user_id: string;
  answers: string | null;
  status: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    field_of_study?: string;
    profile_image?: string;
    bio?: string;
    university?: string;
    links?: string;
  };
}

interface ProjectType {
  id: string;
  title: string;
  description: string;
  field: string;
  owner_id: string;
  team_size: number;
  banner_image?: string;
  created_at: string;
  owner: { id: string; username: string; full_name: string };
  members: { id: string; role: string; user: { id: string; username: string; full_name: string } }[];
  roles: RoleType[];
}

const roleIcons: Record<string, any> = {
  frontend: Code,
  backend: Server,
  designer: Palette,
  default: Layers,
};

function getRoleIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("frontend") || lower.includes("react") || lower.includes("ui")) return Code;
  if (lower.includes("backend") || lower.includes("api") || lower.includes("server")) return Server;
  if (lower.includes("design") || lower.includes("ux") || lower.includes("ui")) return Palette;
  return Layers;
}

const roleColors = [
  "from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400",
  "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400",
  "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
  "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400",
  "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400",
];

export default function Projects() {
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [selected, setSelected] = useState<ProjectType | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [applyingRole, setApplyingRole] = useState<RoleType | null>(null);
  const [applyAnswers, setApplyAnswers] = useState<string[]>([]);
  const [viewAppRole, setViewAppRole] = useState<RoleType | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const navigate = useNavigate();

  // Create form
  const [newProject, setNewProject] = useState({ title: "", description: "", field: "", banner_image: "" });
  const [newRoles, setNewRoles] = useState<{ title: string; description: string; questions: string[] }[]>([]);
  const [roleTitle, setRoleTitle] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [roleQuestions, setRoleQuestions] = useState<string[]>([""]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Deep linking logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    if (projectId && projects.length > 0) {
      const proj = projects.find(p => p.id === projectId);
      if (proj) {
        setSelected(proj);
      } else {
        // Fetch it if not in list
        fetch(`/api/v1/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }).then(res => res.ok && res.json()).then(data => data && setSelected(data));
      }
    }
  }, [projects]);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?project=${id}`;
    navigator.clipboard.writeText(url);
    alert("Project link copied to clipboard!");
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = () => {
      setNewProject({ ...newProject, banner_image: reader.result as string });
      setUploadingBanner(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/v1/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setUser(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchUser();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/v1/projects", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProjects(data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.field.toLowerCase().includes(search.toLowerCase())
  );

  const addRoleToForm = () => {
    if (!roleTitle.trim()) return;
    setNewRoles([...newRoles, {
      title: roleTitle.trim(),
      description: roleDesc.trim(),
      questions: roleQuestions.filter(q => q.trim())
    }]);
    setRoleTitle(""); setRoleDesc(""); setRoleQuestions([""]);
  };

  const handleCreateProject = async () => {
    if (!newProject.title) return;
    try {
      const res = await fetch("/api/v1/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          ...newProject,
          team_size: newRoles.length + 1,
          visibility: "public",
          roles: newRoles,
        }),
      });
      if (res.ok) {
        await fetchProjects();
        setShowCreate(false);
        setNewProject({ title: "", description: "", field: "", banner_image: "" });
        setNewRoles([]);
      }
    } catch (err) { console.error(err); }
  };

  const handleApply = async () => {
    if (!selected || !applyingRole) return;
    try {
      const res = await fetch(`/api/v1/projects/${selected.id}/roles/${applyingRole.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ answers: applyAnswers }),
      });
      if (res.ok) {
        await fetchProjects();
        setApplyingRole(null);
        setApplyAnswers([]);
        // Refresh selected
        const pRes = await fetch(`/api/v1/projects/${selected.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (pRes.ok) setSelected(await pRes.json());
      } else {
        const err = await res.json();
        alert(err.error || "Failed to apply.");
      }
    } catch (err) { console.error(err); alert("Error applying."); }
  };

  const handleAppAction = async (applicationId: string, action: "accept" | "reject") => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/v1/projects/${selected.id}/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchProjects();
        const pRes = await fetch(`/api/v1/projects/${selected.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (pRes.ok) setSelected(await pRes.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleRemoveMember = async (projectId: string, memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        await fetchProjects();
        const pRes = await fetch(`/api/v1/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (pRes.ok) setSelected(await pRes.json());
      } else {
        const err = await res.json();
        alert(err.error || "Failed to remove member.");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing member.");
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await fetch(`/api/v1/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      await fetchProjects();
      setSelected(null);
    } catch (err) { console.error(err); }
  };

  const isOwner = selected && user && selected.owner_id === user.id;

  return (
    <AppLayout>
      {/* Background graphics */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-20 -left-40 h-[400px] w-[400px] rounded-full bg-glow-secondary/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-500/3 blur-[150px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/20"
            style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
          />
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="heading-tight text-3xl font-bold text-foreground lg:text-4xl">Projects</h1>
            <p className="mt-2 text-sm text-muted-foreground">Create projects, define roles, and find your dream team.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 backdrop-blur-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-32 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
            <button onClick={() => setShowCreate(true)} className="glow-button flex items-center gap-2 !py-2 text-sm">
              <Plus className="h-4 w-4" /> New Project
            </button>
          </div>
        </div>

        {/* Project Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, i) => {
            const openRoles = project.roles?.filter(r => !r.is_filled) || [];
            const cardGradients = [
              "from-primary via-indigo-600 to-glow-secondary",
              "from-emerald-600 via-teal-500 to-cyan-500",
              "from-amber-600 via-orange-500 to-rose-500",
              "from-violet-600 via-purple-500 to-pink-500",
              "from-cyan-600 via-blue-500 to-indigo-500",
              "from-rose-600 via-pink-500 to-fuchsia-500",
            ];
            const gradient = cardGradients[i % cardGradients.length];

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={async () => {
                  const res = await fetch(`/api/v1/projects/${project.id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                  });
                  if (res.ok) setSelected(await res.json());
                }}
                className="glass-card-hover cursor-pointer relative overflow-hidden group"
              >
                {/* Gradient Cover Header */}
                <div className={`relative h-28 bg-gradient-to-br ${gradient} overflow-hidden`}>
                  {project.banner_image ? (
                    <img src={project.banner_image} alt={project.title} className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    /* Decorative SVG pattern */
                    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 100">
                      <circle cx="150" cy="20" r="40" fill="white" />
                      <circle cx="30" cy="70" r="25" fill="white" />
                      <rect x="100" y="50" width="60" height="60" rx="10" fill="white" opacity="0.5" />
                      {[...Array(5)].map((_, li) => (
                        <line key={li} x1={li * 50} y1="0" x2={li * 50 + 30} y2="100" stroke="white" strokeWidth="0.5" opacity="0.3" />
                      ))}
                    </svg>
                  )}

                  {/* Share button overlay */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopyLink(project.id); }}
                    className="absolute top-3 right-12 flex h-6 w-6 items-center justify-center rounded-lg bg-black/25 backdrop-blur-sm text-white/80 hover:bg-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Share2 className="h-3 w-3" />
                  </button>

                  {/* Field badge */}
                  {project.field && (
                    <span className="absolute top-3 left-3 rounded-lg bg-black/25 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-white">
                      {project.field}
                    </span>
                  )}

                  {/* Status */}
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                  </span>

                  {/* Owner avatar */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/25 backdrop-blur-sm px-2 py-1">
                    <div className="h-5 w-5 rounded-full bg-white/30 flex items-center justify-center text-[8px] font-bold text-white uppercase">
                      {project.owner?.full_name?.substring(0, 2) || "?"}
                    </div>
                    <span className="text-[10px] text-white/90 font-medium">{project.owner?.full_name}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <h3 className="heading-tight text-base font-semibold text-foreground line-clamp-1">{project.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{project.description}</p>

                  {/* Open roles */}
                  {openRoles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {openRoles.map((r, ri) => {
                        const Icon = getRoleIcon(r.title);
                        return (
                          <span key={r.id} className={`flex items-center gap-1 rounded-lg bg-gradient-to-r ${roleColors[ri % roleColors.length]} border px-2 py-0.5 text-[10px] font-medium`}>
                            <Icon className="h-3 w-3" /> {r.title}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/30">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {project.members?.length || 1} members</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ==================== PROJECT DETAIL MODAL ==================== */}
      <AnimatePresence>
        {selected && !applyingRole && !viewAppRole && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[60] flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="glass-card border border-border/50 p-6 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto pointer-events-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="heading-tight text-2xl font-bold text-foreground">{selected.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">by {selected.owner?.full_name} · {selected.field}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{selected.description}</p>

                {/* Team */}
                <div className="mb-6">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Team ({selected.members?.length || 0})</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selected.members || []).map((m) => (
                      <span key={m.id} className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-1.5 text-xs font-medium text-white/90 relative group/member overflow-hidden">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold uppercase shrink-0">
                          {m.user.full_name.substring(0, 2)}
                        </div>
                        <span className="truncate max-w-[120px]">{m.user.full_name}</span>
                        <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md shrink-0">{m.role}</span>
                        
                        {(selected.owner_id === user?.id && m.user.id !== user?.id) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(selected.id, m.id);
                            }}
                            className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                            title="Remove member"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Open Positions */}
                <div className="mb-6">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Open Positions</h3>
                  {(!selected.roles || selected.roles.length === 0) ? (
                    <p className="text-sm text-muted-foreground">No specific roles defined.</p>
                  ) : (
                    <div className="space-y-3">
                      {selected.roles.map((role, ri) => {
                        const Icon = getRoleIcon(role.title);
                        const userApplied = role.applications?.some(a => a.user_id === user?.id);
                        const appCount = role.applications?.filter(a => a.status === 'pending').length || 0;
                        return (
                          <div key={role.id} className={`rounded-xl border p-4 bg-gradient-to-r ${roleColors[ri % roleColors.length].split(' ').slice(0, 2).join(' ')} border-border/50`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-semibold text-foreground">{role.title}</span>
                                {role.is_filled && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md">Filled</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                {isOwner && appCount > 0 && (
                                  <button onClick={() => setViewAppRole(role)} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> {appCount} apps
                                  </button>
                                )}
                                {!isOwner && !role.is_filled && !userApplied && (
                                  <button onClick={() => {
                                    setApplyingRole(role);
                                    const qs = role.questions ? JSON.parse(role.questions) : [];
                                    setApplyAnswers(qs.map(() => ""));
                                  }} className="glow-button !py-1.5 !px-3 text-xs flex items-center gap-1">
                                    <Send className="h-3 w-3" /> Apply
                                  </button>
                                )}
                                {userApplied && (
                                  <span className="text-[11px] text-emerald-400">✓ Applied</span>
                                )}
                              </div>
                            </div>
                            {role.description && <p className="text-xs text-muted-foreground mt-2">{role.description}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 border-t border-border/50 pt-5">
                  {isOwner ? (
                    <button onClick={() => handleDelete(selected.id)} className="glow-button-outline flex items-center gap-2 text-sm border-red-500/50 text-red-500 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  ) : (
                    <button onClick={async () => {
                      const reason = window.prompt("Why are you reporting this project?");
                      if (!reason) return;
                      await fetch("/api/v1/reports/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                        body: JSON.stringify({ type: "project", target_id: selected.id, target_name: selected.title, reason })
                      });
                      alert("Project reported.");
                      setSelected(null);
                    }} className="glow-button-outline flex items-center gap-2 text-sm border-destructive/30 text-destructive hover:bg-destructive/10">
                      Report
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== APPLY MODAL ==================== */}
      <AnimatePresence>
        {applyingRole && selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm" onClick={() => setApplyingRole(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[80] flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="glass-card border border-border/50 p-6 shadow-2xl w-full max-w-md pointer-events-auto max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Apply for {applyingRole.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">in {selected.title}</p>
                  </div>
                  <button onClick={() => setApplyingRole(null)} className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
                </div>

                {applyingRole.questions && JSON.parse(applyingRole.questions).length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">Please answer the following questions:</p>
                    {JSON.parse(applyingRole.questions).map((q: string, qi: number) => (
                      <div key={qi}>
                        <label className="mb-1.5 block text-xs font-medium text-foreground">{qi + 1}. {q}</label>
                        <textarea
                          value={applyAnswers[qi] || ""}
                          onChange={(e) => {
                            const updated = [...applyAnswers];
                            updated[qi] = e.target.value;
                            setApplyAnswers(updated);
                          }}
                          rows={2}
                          className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 resize-none transition-colors"
                          placeholder="Your answer..."
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">No screening questions. Click submit to apply!</p>
                )}

                <button onClick={handleApply} className="glow-button flex w-full items-center justify-center gap-2 text-sm mt-6">
                  <Send className="h-4 w-4" /> Submit Application
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== VIEW APPLICATIONS MODAL (OWNER) ==================== */}
      <AnimatePresence>
        {viewAppRole && selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm" onClick={() => { setViewAppRole(null); setSelectedApp(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[80] flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="glass-card border border-border/50 shadow-2xl w-full max-w-4xl pointer-events-auto h-[85vh] flex flex-col md:flex-row overflow-hidden">
                {/* Left Sidebar: List of Applicants */}
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border/30 flex flex-col h-1/3 md:h-full bg-secondary/10">
                  <div className="p-4 border-b border-border/30 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Applicants</h2>
                      <p className="text-[10px] text-muted-foreground">{viewAppRole.title}</p>
                    </div>
                    <button onClick={() => { setViewAppRole(null); setSelectedApp(null); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {(!viewAppRole.applications || viewAppRole.applications.length === 0) ? (
                      <p className="text-xs text-muted-foreground p-4 text-center">No applications yet.</p>
                    ) : (
                      viewAppRole.applications.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => setSelectedApp(app)}
                          className={`cursor-pointer rounded-xl p-3 transition-all border ${
                            selectedApp?.id === app.id
                              ? "bg-primary/15 border-primary/30"
                              : "border-transparent hover:bg-secondary/50 hover:border-border/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {app.user.profile_image ? (
                                <img src={app.user.profile_image} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                app.user.full_name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{app.user.full_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-tighter ${
                                  app.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                                  app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' :
                                  'bg-destructive/10 text-destructive'
                                }`}>{app.status}</span>
                                <span className="text-[8px] text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Content: Applicant Detail */}
                <div className="flex-1 overflow-y-auto bg-background/50">
                  {selectedApp ? (
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-5">
                          <div className="h-16 w-16 rounded-3xl bg-primary/15 border border-primary/20 flex items-center justify-center text-2xl font-black text-primary overflow-hidden">
                             {selectedApp.user.profile_image ? (
                                <img src={selectedApp.user.profile_image} className="h-full w-full object-cover" />
                              ) : (
                                selectedApp.user.full_name.substring(0, 2).toUpperCase()
                              )}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">{selectedApp.user.full_name}</h2>
                            <p className="text-sm text-primary font-medium tracking-wide flex items-center gap-2">
                              {selectedApp.user.field_of_study || "Student"} 
                              <span className="h-1 w-1 rounded-full bg-muted" /> 
                              {selectedApp.user.university || "Campus"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">@{selectedApp.user.username}</p>
                          </div>
                        </div>

                        {selectedApp.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleAppAction(selectedApp.id, 'reject')}
                              className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground border border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleAppAction(selectedApp.id, 'accept')}
                              className="glow-button !text-xs !py-2 !px-4"
                            >
                              Accept Applicant
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bio & Links */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                              <UserPlus className="h-3 w-3" /> About Applicant
                            </h3>
                            <p className="text-sm text-foreground leading-relaxed bg-secondary/20 p-4 rounded-2xl border border-border/20 italic">
                              "{selectedApp.user.bio || "No bio provided."}"
                            </p>
                          </div>
                          
                          {selectedApp.user.links && (
                            <div>
                               <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                 <Globe className="h-3 w-3" /> Connect & Social
                               </h3>
                               <div className="flex flex-wrap gap-2">
                                  {(() => {
                                    try {
                                      const links = JSON.parse(selectedApp.user.links);
                                      return Object.entries(links).map(([platform, url]) => {
                                        if (!url || url === "#" || url === "student.dev") return null;
                                        return (
                                          <a 
                                            key={platform}
                                            href={url as string} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-xs text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all capitalize"
                                          >
                                            <Link className="h-3 w-3" /> {platform}
                                          </a>
                                        );
                                      });
                                    } catch {
                                      return <p className="text-[10px] text-muted-foreground italic">No valid links provided.</p>;
                                    }
                                  })()}
                               </div>
                            </div>
                          )}
                        </div>

                        {/* Answers */}
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                            <Sparkles className="h-3 w-3" /> Screening Answers
                          </h3>
                          <div className="space-y-4">
                            {(() => {
                              const questions = viewAppRole.questions ? JSON.parse(viewAppRole.questions) : [];
                              const answers = selectedApp.answers ? JSON.parse(selectedApp.answers) : [];
                              if (questions.length === 0) return <p className="text-xs text-muted-foreground italic">No screening questions were required for this position.</p>;
                              
                              return questions.map((q: string, qi: number) => (
                                <div key={qi} className="group">
                                  <p className="text-xs font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">{qi + 1}. {q}</p>
                                  <div className="bg-secondary/40 rounded-xl p-3 text-xs text-muted-foreground group-hover:bg-secondary/60 transition-colors">
                                    {answers[qi] || "No answer provided"}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 p-12 text-center">
                      <Users className="h-16 w-16 mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-bold">Select an Applicant</h3>
                      <p className="text-sm max-w-xs mt-2">Click on a user from the list on the left to review their profile and application details.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== CREATE PROJECT MODAL ==================== */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-0 z-[60] flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="glass-card border border-border/50 p-6 shadow-2xl w-full max-w-lg pointer-events-auto max-h-[85vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="heading-tight text-xl font-bold text-foreground">New Project</h2>
                  <button onClick={() => setShowCreate(false)} className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-4">
                  {/* Banner Upload */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Project Banner (Optional)</label>
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="group relative h-24 w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-border/50 bg-secondary/20 transition-all hover:border-primary/50 hover:bg-secondary/30"
                    >
                      {newProject.banner_image ? (
                        <img src={newProject.banner_image} alt="Banner Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-[10px] font-medium">{uploadingBanner ? "Processing..." : "Select Banner"}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change Banner</span>
                      </div>
                    </div>
                    <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} accept="image/*" className="hidden" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Project Name</label>
                    <input value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} placeholder="My Awesome Project" className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                    <textarea value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} rows={3} placeholder="What's this project about?" className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 resize-none transition-colors" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Field / Tech Stack</label>
                    <input value={newProject.field} onChange={(e) => setNewProject({ ...newProject, field: e.target.value })} placeholder="e.g., React, AI, Mobile" className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors" />
                  </div>

                  {/* Roles section */}
                  <div className="border-t border-border/30 pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                      <UserPlus className="h-3.5 w-3.5" /> Open Positions
                    </h3>

                    {/* Already added roles */}
                    {newRoles.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/20 px-3 py-2 mb-2">
                        <Layers className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground">{r.title}</span>
                          {r.questions.length > 0 && <span className="text-[10px] text-muted-foreground ml-2">({r.questions.length} questions)</span>}
                        </div>
                        <button onClick={() => setNewRoles(newRoles.filter((_, idx) => idx !== i))} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add role form */}
                    <div className="rounded-xl border border-dashed border-border/50 p-3 space-y-3">
                      <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Role title (e.g., Frontend Developer)" className="w-full rounded-lg border border-border/30 bg-secondary/20 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50" />
                      <input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Brief description (optional)" className="w-full rounded-lg border border-border/30 bg-secondary/20 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50" />
                      
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Screening Questions</p>
                        {roleQuestions.map((q, qi) => (
                          <div key={qi} className="flex items-center gap-2 mb-1.5">
                            <input
                              value={q}
                              onChange={(e) => {
                                const updated = [...roleQuestions];
                                updated[qi] = e.target.value;
                                setRoleQuestions(updated);
                              }}
                              placeholder={`Question ${qi + 1}`}
                              className="flex-1 rounded-lg border border-border/30 bg-secondary/10 px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
                            />
                            {roleQuestions.length > 1 && (
                              <button onClick={() => setRoleQuestions(roleQuestions.filter((_, idx) => idx !== qi))} className="text-destructive"><X className="h-3 w-3" /></button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => setRoleQuestions([...roleQuestions, ""])} className="text-[10px] text-primary hover:underline mt-1">+ Add question</button>
                      </div>

                      <button onClick={addRoleToForm} disabled={!roleTitle.trim()} className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-primary py-2 text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-30">
                        <Plus className="h-3 w-3" /> Add Position
                      </button>
                    </div>
                  </div>

                  <button onClick={handleCreateProject} className="glow-button flex w-full items-center justify-center gap-2 text-sm mt-4">
                    <Sparkles className="h-4 w-4" /> Create Project
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
