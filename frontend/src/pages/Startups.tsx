import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Search, Users, Lightbulb, X, Zap, MessageCircle,
  Heart, Send, Check, Eye, Trash2, Plus, Layers, Code, Palette,
  Server, UserPlus, Sparkles, Share2, Image as ImageIcon, ArrowUpRight,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getApiData, apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { ShieldAlert } from "lucide-react";

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

interface StartupRoleType {
  id: string;
  title: string;
  description: string | null;
  questions: string | null;
  is_filled: boolean;
  applications: StartupAppType[];
}

interface StartupAppType {
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

interface StartupType {
  id: string;
  title: string;
  description: string;
  field: string;
  team_needed: boolean;
  banner_image: string | null;
  views: number;
  created_at: string;
  creator: { id: string; username: string; full_name: string };
  roles: StartupRoleType[];
}

function getRoleIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("frontend") || lower.includes("react") || lower.includes("ui dev")) return Code;
  if (lower.includes("backend") || lower.includes("api") || lower.includes("server")) return Server;
  if (lower.includes("design") || lower.includes("ux") || lower.includes("ui")) return Palette;
  if (lower.includes("co-founder") || lower.includes("business") || lower.includes("marketing")) return Rocket;
  return Layers;
}

const roleColors = [
  "from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400",
  "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400",
  "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
  "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400",
  "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400",
];

export default function Startups() {
  const [startups, setStartups] = useState<StartupType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StartupType | null>(null);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [applyingRole, setApplyingRole] = useState<StartupRoleType | null>(null);
  const [applyAnswers, setApplyAnswers] = useState<string[]>([]);
  const [viewAppRole, setViewAppRole] = useState<StartupRoleType | null>(null);
  
  // Custom Modals State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [startupToDelete, setStartupToDelete] = useState<string | null>(null);
  const [showMemberRemoveConfirm, setShowMemberRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{startupId: string, memberId: string} | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [startupToShare, setStartupToShare] = useState<{title: string, id: string} | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingStartup, setReportingStartup] = useState<any>(null);

  const navigate = useNavigate();

  // Create form
  const [newIdea, setNewIdea] = useState({ title: "", description: "", field: "", banner_image: null as string | null });
  const [newRoles, setNewRoles] = useState<{ title: string; description: string; questions: string[] }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roleTitle, setRoleTitle] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [roleQuestions, setRoleQuestions] = useState<string[]>([""]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getApiData("/api/v1/auth/me");
        setUser(data);
      } catch (err) { console.error(err); }
    };
    fetchUser();
  }, []);

  const fetchStartups = async () => {
    setLoading(true);
    try {
      const data = await getApiData("/api/v1/startups");
      if (Array.isArray(data)) setStartups(data);
    } catch (err) { 
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStartups(); }, []);

  const filtered = startups.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.field.toLowerCase().includes(search.toLowerCase())
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

  const handleCreateStartup = async () => {
    if (!newIdea.title) return;
    try {
      const isEditing = !!editingId;
      const url = isEditing ? `/api/v1/startups/${editingId}` : "/api/v1/startups/create";
      const method = isEditing ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({ ...newIdea, team_needed: true, roles: newRoles }),
      });
      if (res.ok) {
        await fetchStartups();
        setShowCreate(false);
        setNewIdea({ title: "", description: "", field: "", banner_image: null });
        setNewRoles([]);
        setEditingId(null);
      }
    } catch (err) { console.error(err); }
  };

  const handleEdit = (startup: StartupType) => {
    setEditingId(startup.id);
    setNewIdea({ 
      title: startup.title, 
      description: startup.description, 
      field: startup.field,
      banner_image: startup.banner_image 
    });
    // Simplified: we're not editing roles in this pass for simplicity but could be added
    setNewRoles([]); 
    setShowCreate(true);
    setSelected(null);
  };

  const handleShare = (startup: StartupType) => {
    setStartupToShare({ title: startup.title, id: startup.id });
    setShowShareModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewIdea({ ...newIdea, banner_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = async () => {
    if (!selected || !applyingRole) return;
    try {
      const res = await apiFetch(`/api/v1/startups/${selected.id}/roles/${applyingRole.id}/apply`, {
        method: "POST",
        body: JSON.stringify({ answers: applyAnswers }),
      });
      if (res.ok) {
        toast.success("Application submitted!");
        await fetchStartups();
        setApplyingRole(null);
        setApplyAnswers([]);
        const data = await getApiData(`/api/v1/startups/${selected.id}`);
        if (data) setSelected(data);
      } else {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          toast.error(parsed.error || "Failed to apply.");
        } catch {
          toast.error("Server error. Please try again.");
        }
      }
    } catch (err) { console.error(err); toast.error("Error applying."); }
  };

  const handleAppAction = async (applicationId: string, action: "accept" | "reject") => {
    if (!selected) return;
    try {
      const res = await apiFetch(`/api/v1/startups/${selected.id}/applications/${applicationId}`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(`Application ${action === "accept" ? "accepted" : "rejected"}`);
        await fetchStartups();
        const data = await getApiData(`/api/v1/startups/${selected.id}`);
        if (data) setSelected(data);
      } else {
        toast.error("Failed to process application.");
      }
    } catch (err) { console.error(err); toast.error("Error processing application."); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/v1/startups/${id}`, {
        method: "DELETE",
      });
      toast.success("Startup Venture dissolved");
      await fetchStartups();
      setSelected(null);
    } catch (err) { console.error(err); toast.error("Error deleting venture."); }
  };

  const handleRemoveMember = async (startupId: string, memberId: string) => {
    try {
      const res = await apiFetch(`/api/v1/startups/${startupId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Member removed");
        await fetchStartups();
        const data = await getApiData(`/api/v1/startups/${startupId}`);
        if (data) setSelected(data);
      } else {
        toast.error("Failed to remove member.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error removing member.");
    }
  };

  const handleReport = async () => {
    if (!reportReason || !reportingStartup) return;
    try {
       await apiFetch("/api/v1/reports/create", {
         method: "POST",
         body: JSON.stringify({ type: "startup", target_id: reportingStartup.id, target_name: reportingStartup.title, reason: reportReason })
       });
       toast.success("Startup reported for review.");
       setShowReportModal(false);
       setReportReason("");
       setReportingStartup(null);
       setSelected(null);
    } catch (err) {
       toast.error("Failed to report.");
    }
  };

  const isOwner = selected && user && selected.creator?.id === user.id;

  return (
    <AppLayout>
      {/* Background graphics */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-20 right-10 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-rose-500/3 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                   <Lightbulb className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Innovation Hub</span>
             </div>
             <h1 className="heading-tight text-4xl font-black text-foreground tracking-tight lg:text-5xl">Ecosystem</h1>
             <p className="mt-2 text-sm font-medium text-muted-foreground max-w-md">The genesis of greatness. Post ideas, assemble dream teams, and ignite the next revolution.</p>
          </motion.div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
             <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input 
                   value={search} 
                   onChange={(e) => setSearch(e.target.value)} 
                   placeholder="Explore ideas..." 
                   className="w-full sm:w-64 rounded-2xl border border-border/50 bg-secondary/20 py-3 pl-11 pr-4 text-sm text-foreground outline-none ring-amber-500/20 transition-all focus:border-amber-500 focus:ring-4 placeholder:text-muted-foreground" 
                />
             </div>
             <button onClick={() => setShowCreate(true)} className="glow-button flex items-center justify-center gap-2 group !bg-amber-500 hover:!bg-amber-600 border-none shadow-xl shadow-amber-500/20">
                <Rocket className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                <span className="font-bold">Post Idea</span>
             </button>
          </div>
        </div>

        {/* Startup Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-[2.5rem] w-full" />
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((startup, i) => {
                const openRoles = startup.roles?.filter(r => !r.is_filled) || [];
                const colors = ["from-amber-600 to-orange-500", "from-primary to-indigo-600", "from-emerald-600 to-teal-500"];
                const color = colors[i % colors.length];

                return (
                  <motion.div
                    key={startup.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={async () => {
                      const data = await getApiData(`/api/v1/startups/${startup.id}`);
                      if (data) setSelected(data);
                    }}
                  className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-border/50 bg-secondary/5 backdrop-blur-md transition-all hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/5 cursor-pointer h-full"
                >
                  <div className={`absolute top-0 right-0 h-32 w-32 bg-gradient-to-br ${color} opacity-5 blur-[60px] group-hover:opacity-10 transition-opacity`} />
                  
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg overflow-hidden relative`}>
                           {startup.banner_image ? (
                             <img src={startup.banner_image} className="h-full w-full object-cover" />
                           ) : (
                             <Rocket className="h-6 w-6" />
                           )}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-foreground group-hover:text-amber-500 transition-colors line-clamp-1">{startup.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="h-4 w-4 rounded-full bg-secondary flex items-center justify-center text-[7px] font-black text-muted-foreground uppercase border border-border/50">
                                {startup.creator?.full_name?.substring(0,1)}
                             </div>
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{startup.creator?.full_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/20">
                            {startup.field}
                         </span>
                         <span className="text-[9px] font-bold text-muted-foreground uppercase">{timeAgo(startup.created_at)}</span>
                      </div>
                    </div>

                    <p className="mb-6 text-sm font-medium text-muted-foreground line-clamp-2 leading-relaxed">{startup.description}</p>

                    <div className="flex items-center justify-between pt-6 border-t border-border/30">
                       <div className="flex flex-wrap gap-2">
                          {openRoles.slice(0, 3).map((r, ri) => (
                             <div key={ri} className="flex items-center gap-1.5 rounded-xl bg-secondary/30 px-3 py-1.5 border border-border/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                <span className="text-[9px] font-black text-foreground/80 uppercase">{r.title}</span>
                             </div>
                          ))}
                          {openRoles.length > 3 && (
                             <div className="text-[9px] font-black text-muted-foreground uppercase self-center ml-1">+{openRoles.length - 3} More</div>
                          )}
                       </div>
                       <div className="flex items-center gap-2">
                          <button className="h-9 w-9 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all" onClick={(e) => { e.stopPropagation(); handleShare(startup); }}>
                             <Share2 className="h-4 w-4" />
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 text-[10px] font-black uppercase text-foreground group-hover:bg-amber-500 group-hover:text-white transition-all">
                             View Lab <ArrowUpRight className="h-4 w-4" />
                          </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* ==================== DETAIL MODAL ==================== */}
      <AnimatePresence>
        {selected && !applyingRole && !viewAppRole && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[60] flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="glass-card border border-border/50 p-6 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto pointer-events-auto">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Rocket className="h-6 w-6 text-primary" /></div>
                    <div>
                      <h2 className="heading-tight text-xl font-bold text-foreground">{selected.title}</h2>
                      <p className="text-xs text-muted-foreground">{selected.field} · by {selected.creator?.full_name}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{selected.description}</p>

                {/* Founding Team Section */}
                {(() => {
                  const members = selected.roles?.flatMap(r => 
                    r.applications?.filter(a => a.status === 'accepted').map(a => ({ ...a, roleTitle: r.title }))
                  ) || [];
                  
                  if (members.length === 0) return null;

                  return (
                    <div className="mb-6">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Founding Team ({members.length})</h3>
                      <div className="flex flex-wrap gap-2">
                        {members.map((m) => (
                          <span key={m.id} className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-1.5 text-xs font-medium text-white group/member overflow-hidden">
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold uppercase shrink-0">
                              {m.user.full_name.substring(0, 2)}
                            </div>
                            <span className="truncate max-w-[120px]">{m.user.full_name}</span>
                            <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md shrink-0">{m.roleTitle}</span>
                            
                            {isOwner && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMemberToRemove({ startupId: selected.id, memberId: m.id }); setShowMemberRemoveConfirm(true); 
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
                  );
                })()}

                {/* Roles & Positions */}
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
                                {userApplied && <span className="text-[11px] text-emerald-400">✓ Applied</span>}
                              </div>
                            </div>
                            {role.description && <p className="text-xs text-muted-foreground mt-2">{role.description}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 border-t border-border/50 pt-5">
                  <button onClick={() => handleShare(selected)} className="glow-button flex items-center gap-2 text-sm bg-blue-500 hover:bg-blue-600 border-transparent shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <Share2 className="h-4 w-4" /> Share
                  </button>

                  {isOwner ? (
                    <>
                      <button onClick={() => handleEdit(selected)} className="glow-button-outline flex items-center gap-2 text-sm">
                        <UserPlus className="h-4 w-4" /> Edit Details
                      </button>
                      <button onClick={() => { setStartupToDelete(selected.id); setShowDeleteConfirm(true); }} className="glow-button-outline flex items-center gap-2 text-sm border-red-500/50 text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => navigate(`/messages?user=${selected.creator?.id}`)} className="glow-button-outline flex items-center gap-2 text-sm">
                        <MessageCircle className="h-4 w-4" /> Message Founder
                      </button>
                      <button onClick={() => {
                        setReportingStartup(selected);
                        setShowReportModal(true);
                      }} className="glow-button-outline flex items-center gap-2 text-sm border-destructive/30 text-destructive hover:bg-destructive/10 ml-auto">
                        Report
                      </button>
                    </>
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[80] flex items-center justify-center px-4 pointer-events-none">
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
                    <p className="text-xs text-muted-foreground">Answer the screening questions:</p>
                    {JSON.parse(applyingRole.questions).map((q: string, qi: number) => (
                      <div key={qi}>
                        <label className="mb-1.5 block text-xs font-medium text-foreground">{qi + 1}. {q}</label>
                        <textarea value={applyAnswers[qi] || ""} onChange={(e) => { const u = [...applyAnswers]; u[qi] = e.target.value; setApplyAnswers(u); }} rows={2} className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 resize-none" placeholder="Your answer..." />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">No screening questions. Click submit to apply!</p>
                )}
                <button onClick={handleApply} className="glow-button flex w-full items-center justify-center gap-2 text-sm mt-6"><Send className="h-4 w-4" /> Submit Application</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== VIEW APPLICATIONS MODAL ==================== */}
      <AnimatePresence>
        {viewAppRole && selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm" onClick={() => setViewAppRole(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[80] flex items-center justify-center px-4 pointer-events-none">
              <div className="glass-card border border-border/50 p-6 shadow-2xl w-full max-w-lg pointer-events-auto max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Applications for {viewAppRole.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{viewAppRole.applications?.length || 0} total</p>
                  </div>
                  <button onClick={() => setViewAppRole(null)} className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
                </div>
                {(!viewAppRole.applications || viewAppRole.applications.length === 0) ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No applications.</p>
                ) : (
                  <div className="space-y-4">
                    {viewAppRole.applications.map((app) => {
                      const questions = viewAppRole.questions ? JSON.parse(viewAppRole.questions) : [];
                      const answers = app.answers ? JSON.parse(app.answers) : [];
                      return (
                        <div key={app.id} className="rounded-xl border border-border/50 p-4 bg-secondary/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{app.user.full_name.substring(0, 2).toUpperCase()}</div>
                              <div><p className="text-sm font-semibold text-foreground">{app.user.full_name}</p><p className="text-[10px] text-muted-foreground">@{app.user.username}</p></div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${app.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>{app.status}</span>
                          </div>
                          {questions.length > 0 && (
                            <div className="space-y-2 mb-3">
                              {questions.map((q: string, qi: number) => (
                                <div key={qi} className="rounded-lg bg-secondary/30 p-2.5">
                                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Q: {q}</p>
                                  <p className="text-xs text-foreground">{answers[qi] || "No answer"}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {app.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleAppAction(app.id, 'accept')} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-500/15 text-emerald-500 py-1.5 text-xs font-medium hover:bg-emerald-500/25"><Check className="h-3 w-3" /> Accept</button>
                              <button onClick={() => handleAppAction(app.id, 'reject')} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-destructive/15 text-destructive py-1.5 text-xs font-medium hover:bg-destructive/25"><X className="h-3 w-3" /> Reject</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== CREATE STARTUP MODAL ==================== */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[60] flex items-center justify-center px-4 pointer-events-none">
              <div className="glass-card border border-border/50 p-6 shadow-2xl w-full max-w-lg pointer-events-auto max-h-[85vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="heading-tight text-xl font-bold text-foreground">{editingId ? "Edit Startup Idea" : "Post Startup Idea"}</h2>
                  <button onClick={() => setShowCreate(false)} className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Idea Title</label>
                    <input value={newIdea.title} onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })} placeholder="e.g., Next-gen AI Tool" className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                    <textarea value={newIdea.description} onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })} rows={3} placeholder="Describe your idea..." className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 resize-none transition-colors" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Field / Industry</label>
                    <input value={newIdea.field} onChange={(e) => setNewIdea({ ...newIdea, field: e.target.value })} placeholder="e.g., Fintech, HealthTech" className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Banner Image (Optional)</label>
                    <div className="flex flex-col gap-3">
                      {newIdea.banner_image && (
                        <div className="relative h-32 w-full rounded-xl overflow-hidden border border-border/50">
                          <img src={newIdea.banner_image} className="h-full w-full object-cover" />
                          <button onClick={() => setNewIdea({ ...newIdea, banner_image: null })} className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 bg-secondary/20 py-4 text-xs font-medium text-muted-foreground hover:bg-secondary/30 transition-colors">
                        <ImageIcon className="h-4 w-4" />
                        {newIdea.banner_image ? "Change Banner" : "Upload Banner"}
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Roles section */}
                  <div className="border-t border-border/30 pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><UserPlus className="h-3.5 w-3.5" /> Positions Needed</h3>
                    {newRoles.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/20 px-3 py-2 mb-2">
                        <Layers className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground">{r.title}</span>
                          {r.questions.length > 0 && <span className="text-[10px] text-muted-foreground ml-2">({r.questions.length} questions)</span>}
                        </div>
                        <button onClick={() => setNewRoles(newRoles.filter((_, idx) => idx !== i))} className="text-destructive hover:text-destructive/80"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                    <div className="rounded-xl border border-dashed border-border/50 p-3 space-y-3">
                      <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Role (e.g., Co-Founder, CTO)" className="w-full rounded-lg border border-border/30 bg-secondary/20 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" />
                      <input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Description (optional)" className="w-full rounded-lg border border-border/30 bg-secondary/20 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" />
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Screening Questions</p>
                        {roleQuestions.map((q, qi) => (
                          <div key={qi} className="flex items-center gap-2 mb-1.5">
                            <input value={q} onChange={(e) => { const u = [...roleQuestions]; u[qi] = e.target.value; setRoleQuestions(u); }} placeholder={`Question ${qi + 1}`} className="flex-1 rounded-lg border border-border/30 bg-secondary/10 px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary/50" />
                            {roleQuestions.length > 1 && <button onClick={() => setRoleQuestions(roleQuestions.filter((_, idx) => idx !== qi))} className="text-destructive"><X className="h-3 w-3" /></button>}
                          </div>
                        ))}
                        <button onClick={() => setRoleQuestions([...roleQuestions, ""])} className="text-[10px] text-primary hover:underline mt-1">+ Add question</button>
                      </div>
                      <button onClick={addRoleToForm} disabled={!roleTitle.trim()} className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-primary py-2 text-xs font-medium hover:bg-primary/20 disabled:opacity-30"><Plus className="h-3 w-3" /> Add Position</button>
                    </div>
                  </div>

                  <button onClick={handleCreateStartup} className="glow-button flex w-full items-center justify-center gap-2 text-sm mt-4">
                    <Rocket className="h-4 w-4" /> 
                    {editingId ? "Update Idea" : "Post Idea"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setStartupToDelete(null); }}
        onConfirm={() => startupToDelete && handleDelete(startupToDelete)}
        title="Delete Startup Idea"
        message="Are you sure you want to delete this startup idea? This action is permanent and cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showMemberRemoveConfirm}
        onClose={() => { setShowMemberRemoveConfirm(false); setMemberToRemove(null); }}
        onConfirm={() => memberToRemove && handleRemoveMember(memberToRemove.startupId, memberToRemove.memberId)}
        title="Remove Team Member"
        message="Are you sure you want to remove this member from your founding team?"
        confirmText="Remove"
        variant="warning"
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setStartupToShare(null); }}
        title={startupToShare?.title || "Startup Idea"}
        link={`${window.location.origin}/startups?id=${startupToShare?.id}`}
      />

      <AnimatePresence>
        {showReportModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md" onClick={() => setShowReportModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[110] flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="glass-card border border-border/50 p-6 shadow-2xl w-full max-w-sm pointer-events-auto rounded-[2rem]">
                 <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4 bg-amber-500/10 text-amber-500">
                      <ShieldAlert className="h-8 w-8" />
                    </div>
                    <h2 className="heading-tight text-xl font-bold text-foreground mb-2">Report Anomaly</h2>
                    <p className="text-sm text-muted-foreground mb-6">Explain why this idea should be reviewed by moderation.</p>
                    
                    <textarea 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Suspected spam, inappropriate content, etc."
                      className="w-full rounded-2xl bg-secondary/30 border border-border/50 p-4 text-xs text-foreground outline-none focus:border-primary/50 mb-6 resize-none h-24"
                    />

                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button onClick={() => setShowReportModal(false)} className="py-3.5 rounded-2xl border border-border/50 bg-secondary/30 text-xs font-black uppercase tracking-widest text-foreground hover:bg-secondary transition-all">Cancel</button>
                      <button onClick={handleReport} disabled={!reportReason} className="glow-button !text-xs !py-3 font-black uppercase tracking-widest disabled:opacity-30">Transmit Report</button>
                    </div>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
