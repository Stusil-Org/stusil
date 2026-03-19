import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Users, Clock, X, Sparkles, Briefcase, ChevronDown,
  Check, UserPlus, Trash2, Eye, MessageCircle, Code, Palette, Server,
  Layers, Send, FileText, Share2, Link, Image as ImageIcon, Globe, ArrowUpRight, Pencil,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { getApiData, apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { ShareModal } from "@/components/modals/ShareModal";

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
  deadline?: string;
  visibility?: string;
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
  const t = title.toLowerCase();
  if (t.includes("front")) return roleIcons.frontend;
  if (t.includes("back") || t.includes("api") || t.includes("engine")) return roleIcons.backend;
  if (t.includes("design") || t.includes("ui") || t.includes("ux")) return roleIcons.designer;
  return roleIcons.default;
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
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProjectType | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [applyingRole, setApplyingRole] = useState<RoleType | null>(null);
  const [applyAnswers, setApplyAnswers] = useState<string[]>([]);
  const [viewAppRole, setViewAppRole] = useState<RoleType | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<ProjectType | null>(null);
  
  // Custom Modals State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [showMemberRemoveConfirm, setShowMemberRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{projectId: string, memberId: string} | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [projectToShare, setProjectToShare] = useState<{title: string, id: string} | null>(null);

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
        getApiData(`/api/v1/projects/${projectId}`).then(data => data && setSelected(data));
      }
    }
  }, [projects]);

  const handleCopyLink = (id: string, title?: string) => {
    const url = `${window.location.origin}${window.location.pathname}?project=${id}`;
    if (title) {
      setProjectToShare({ title, id });
      setShowShareModal(true);
    } else {
      navigator.clipboard.writeText(url);
    }
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
      try {
        const data = await getApiData("/api/v1/auth/me");
        setUser(data);
      } catch (err) { console.error(err); }
    };
    fetchUser();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getApiData("/api/v1/projects");
      if (Array.isArray(data)) setProjects(data);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
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
      const isEditing = !!editingProject;
      const url = isEditing ? `/api/v1/projects/${editingProject.id}` : "/api/v1/projects/create";
      const method = isEditing ? "PUT" : "POST";
      
      const body: any = {
        ...newProject,
        team_size: newRoles.length + 1,
        visibility: "public"
      };

      if (!isEditing) {
        body.roles = newRoles;
      }

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchProjects();
        setShowCreate(false);
        setNewProject({ title: "", description: "", field: "", banner_image: "" });
        setNewRoles([]);
        setEditingProject(null);
        if (isEditing) {
           // Reload current selected
           const data = await getApiData(`/api/v1/projects/${editingProject.id}`);
           setSelected(data);
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleApply = async () => {
    if (!selected || !applyingRole) return;
    try {
      const res = await apiFetch(`/api/v1/projects/${selected.id}/roles/${applyingRole.id}/apply`, {
        method: "POST",
        body: JSON.stringify({ answers: applyAnswers }),
      });
      if (res.ok) {
        await fetchProjects();
        setApplyingRole(null);
        setApplyAnswers([]);
        // Refresh selected
        try {
          const data = await getApiData(`/api/v1/projects/${selected.id}`);
          setSelected(data);
        } catch { /* ignore refresh error */ }
      } else {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          alert(parsed.error || "Failed to apply.");
        } catch {
          console.error("Non-JSON response:", text.substring(0, 200));
          alert("Server error. Please try again.");
        }
      }
    } catch (err) { console.error(err); alert("Error applying."); }
  };

  const handleAppAction = async (applicationId: string, action: "accept" | "reject") => {
    if (!selected) return;
    try {
      const res = await apiFetch(`/api/v1/projects/${selected.id}/applications/${applicationId}`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchProjects();
        try {
          const data = await getApiData(`/api/v1/projects/${selected.id}`);
          setSelected(data);
        } catch { /* ignore refresh error */ }
      }
    } catch (err) { console.error(err); }
  };

  const handleRemoveMember = async (projectId: string, memberId: string) => {
    try {
      const res = await apiFetch(`/api/v1/projects/${projectId}/members/${memberId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchProjects();
        const data = await getApiData(`/api/v1/projects/${projectId}`);
        if (data) setSelected(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await apiFetch(`/api/v1/projects/${projectId}`, {
        method: "DELETE"
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
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Discovery Engine</span>
            </div>
            <h1 className="heading-tight text-4xl font-black text-foreground tracking-tight lg:text-5xl">Projects</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground max-w-md">Find your next big venture. Explore projects, define roles, and build your legacy.</p>
          </motion.div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search stacks, fields..." 
                className="w-full sm:w-64 rounded-2xl border border-border/50 bg-secondary/20 py-3 pl-11 pr-4 text-sm text-foreground outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4 placeholder:text-muted-foreground" 
              />
            </div>
            <button onClick={() => setShowCreate(true)} className="glow-button flex items-center justify-center gap-2 group">
              <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
              <span className="font-bold">Initialize</span>
            </button>
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-[2.5rem] w-full" />
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((project, i) => {
              const openRoles = project.roles?.filter(r => !r.is_filled) || [];
              const cardGradients = [
                "from-blue-600 via-indigo-600 to-violet-600",
                "from-emerald-600 via-teal-500 to-cyan-500",
                "from-orange-600 via-amber-500 to-yellow-500",
                "from-fuchsia-600 via-purple-500 to-pink-500",
              ];
              const gradient = cardGradients[i % cardGradients.length];

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 100 }}
                  onClick={async () => {
                    setApplyingRole(null);
                    setViewAppRole(null);
                    try {
                      const res = await apiFetch(`/api/v1/projects/${project.id}`);
                      if (res.ok) {
                        setSelected(await res.json());
                      } else {
                        setSelected(project);
                      }
                    } catch (e) {
                      setSelected(project);
                    }
                  }}
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-secondary/5 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
                >
                  {/* Visual Header */}
                  <div className={`relative h-44 w-full bg-gradient-to-br ${gradient} overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    {project.banner_image ? (
                      <img src={project.banner_image} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center opacity-30 select-none">
                         <Code className="h-20 w-20 text-white transform rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                      </div>
                    )}
                    
                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                       <span className="rounded-full bg-black/30 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                         {project.field}
                       </span>
                    </div>

                    <div className="absolute top-4 right-4 group-hover:translate-y-[-2px] transition-transform">
                       <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors" onClick={(e) => { e.stopPropagation(); handleCopyLink(project.id, project.title); }}>
                          <Share2 className="h-3.5 w-3.5" />
                       </div>
                    </div>

                    {/* Bottom Info Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                       <div className="flex -space-x-2">
                          {[1,2,3].map(n => (
                            <div key={n} className="h-7 w-7 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[8px] font-black text-muted-foreground uppercase">
                               U
                            </div>
                          ))}
                          <div className="h-7 w-7 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[8px] font-black text-white">
                             +{project.members?.length || 1}
                          </div>
                       </div>
                       <span className="text-[10px] font-black text-white/90 uppercase tracking-widest bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-md">
                         {timeAgo(project.created_at)}
                       </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-start justify-between">
                       <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">{project.title}</h3>
                       {openRoles.length > 0 && (
                         <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                       )}
                    </div>
                    <p className="mb-4 text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">{project.description}</p>
                    
                    <div className="mt-auto space-y-4">
                       {/* Roles Preview */}
                       <div className="flex flex-wrap gap-2">
                          {openRoles.slice(0, 2).map((r, ri) => (
                             <div key={ri} className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-secondary/30 px-3 py-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${ri === 0 ? 'bg-primary' : 'bg-glow-secondary'}`} />
                                <span className="text-[10px] font-bold text-foreground/80 uppercase">{r.title}</span>
                             </div>
                          ))}
                          {openRoles.length > 2 && (
                            <div className="flex items-center justify-center px-2 py-1.5 rounded-xl border border-dashed border-border/50 text-[10px] font-bold text-muted-foreground">
                               +{openRoles.length - 2}
                            </div>
                          )}
                       </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/30">
                           <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary border border-primary/20">
                                 {project.owner?.full_name?.substring(0,1).toUpperCase()}
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{project.owner?.full_name}</span>
                           </div>
                           
                           <div className="flex items-center gap-3">
                             {project.owner_id === user?.id && (
                               <div className="flex items-center gap-2 mr-2">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setEditingProject(project);
                                     setNewProject({
                                       title: project.title,
                                       description: project.description,
                                       field: project.field,
                                       banner_image: project.banner_image || ""
                                     });
                                     setShowCreate(true);
                                   }}
                                   className="p-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/20 hover:scale-110 transition-all"
                                   title="Edit Strategy"
                                 >
                                   <Pencil className="h-3 w-3" />
                                 </button>
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setProjectToDelete(project.id);
                                     setShowDeleteConfirm(true);
                                   }}
                                   className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/20 hover:scale-110 transition-all"
                                   title="Dissolve"
                                 >
                                   <Trash2 className="h-3 w-3" />
                                 </button>
                               </div>
                             )}
                             <button 
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 setApplyingRole(null);
                                 setViewAppRole(null);
                                 try {
                                   const res = await apiFetch(`/api/v1/projects/${project.id}`);
                                   if (res.ok) {
                                     const data = await res.json();
                                     setSelected(data);
                                   } else {
                                     setSelected(project);
                                   }
                                 } catch (err) {
                                   setSelected(project);
                                 }
                               }}
                               className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform"
                             >
                               View Mission <ArrowUpRight className="h-3 w-3" />
                             </button>
                           </div>
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

      {/* ==================== PROJECT DETAIL MODAL ==================== */}
      <AnimatePresence>
        {selected && !applyingRole && !viewAppRole && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="fixed inset-0 z-[60] flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="glass-card border border-border/50 p-0 shadow-[0_0_100px_rgba(0,0,0,0.4)] w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col rounded-[2.5rem]">
                {/* Immersive Header */}
                <div className="relative h-64 w-full flex-shrink-0">
                   {selected.banner_image ? (
                     <img src={selected.banner_image} className="h-full w-full object-cover" />
                   ) : (
                     <div className="h-full w-full bg-gradient-to-br from-primary to-indigo-900 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        <h2 className="text-8xl font-black text-white/5 uppercase tracking-tighter select-none">{selected.title}</h2>
                     </div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                   
                   <button onClick={() => setSelected(null)} className="absolute top-6 right-6 h-10 w-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-all">
                      <X className="h-5 w-5" />
                   </button>

                   <div className="absolute bottom-6 left-8 right-8">
                      <div className="flex items-center gap-3 mb-3">
                         <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">{selected.field}</span>
                         <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
                           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Formation
                         </span>
                      </div>
                      <h2 className="heading-tight text-4xl font-black text-foreground tracking-tight">{selected.title}</h2>
                   </div>
                </div>

                <div className="p-8 pt-4 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3">Briefing</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">{selected.description}</p>
                      </div>

                      {/* Team Section */}
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center justify-between">
                          Current Operatives
                          <span className="text-[10px] text-muted-foreground">{selected.members?.length || 0} Members</span>
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {(selected.members || []).map((m) => (
                            <div key={m.id} className="group/mem flex items-center gap-3 rounded-2xl border border-border/50 bg-secondary/20 p-2 pr-4 transition-all hover:bg-secondary/40">
                              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary border border-primary/20 shrink-0">
                                {m.user.full_name.substring(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-black text-foreground truncate">{m.user.full_name}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase">{m.role}</p>
                              </div>
                              {(selected.owner_id === user?.id && m.user.id !== user?.id) && (
                                <button onClick={() => { setMemberToRemove({ projectId: selected.id, memberId: m.id }); setShowMemberRemoveConfirm(true); }} className="ml-2 h-6 w-6 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover/mem:opacity-100 transition-opacity">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sidebar / Roles */}
                    <div className="space-y-6">
                      <div className="rounded-3xl bg-secondary/10 border border-border/50 p-5">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Open Positions</h3>
                         {(!selected.roles || selected.roles.length === 0) ? (
                            <p className="text-xs text-muted-foreground font-medium">Full squad established.</p>
                         ) : (
                           <div className="space-y-3">
                              {selected.roles.map((role, ri) => {
                                const Icon = getRoleIcon(role.title);
                                const userApplied = role.applications?.some(a => a.user_id === user?.id);
                                return (
                                  <div key={role.id} className="relative group/role rounded-2xl border border-border/30 bg-background/50 p-4 transition-all hover:border-primary/50">
                                     <div className="flex items-center justify-between mb-2">
                                        <div className={`h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/role:bg-primary group-hover/role:text-white transition-all`}>
                                           <Icon className="h-4 w-4" />
                                        </div>
                                        {userApplied && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active App</span>}
                                     </div>
                                     <h4 className="text-[11px] font-black text-foreground uppercase tracking-tight">{role.title}</h4>
                                     
                                     {!role.is_filled && !userApplied && (selected.owner_id !== user?.id) && (
                                       <button 
                                         onClick={() => {
                                           setApplyingRole(role);
                                           let qs: string[] = [];
                                           try { qs = role.questions ? (typeof role.questions === 'string' ? JSON.parse(role.questions) : role.questions) : []; } catch { qs = []; }
                                           setApplyAnswers(qs.map(() => ""));
                                         }}
                                         className="w-full mt-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                                       >
                                         Initiate
                                       </button>
                                     )}
                                     
                                     {selected.owner_id === user?.id && role.applications?.length > 0 && (
                                       <button onClick={() => setViewAppRole(role)} className="w-full mt-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                                          Review {role.applications.length}
                                       </button>
                                     )}
                                  </div>
                                );
                              })}
                           </div>
                         )}
                      </div>

                      <div className="pt-6 border-t border-border/30">
                        {selected.owner_id === user?.id ? (
                          <div className="flex gap-3">
                            <button 
                              onClick={() => {
                                setEditingProject(selected);
                                setNewProject({
                                  title: selected.title,
                                  description: selected.description,
                                  field: selected.field,
                                  banner_image: selected.banner_image || ""
                                });
                                // We also need to handle roles if we want to edit them, but let's start with basic info
                                setShowCreate(true);
                              }} 
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-primary/30 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all font-bold"
                            >
                              <Pencil className="h-4 w-4" /> Edit Project
                            </button>
                            <button onClick={() => { setProjectToDelete(selected.id); setShowDeleteConfirm(true); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">
                              <Trash2 className="h-4 w-4" /> Dissolve
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                             <button className="w-full py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                                Message Owner
                             </button>
                             <button onClick={async () => {
                                const reason = window.prompt("Why are you reporting this project?");
                                if (!reason) return;
                                await apiFetch("/api/v1/reports/create", {
                                  method: "POST",
                                  body: JSON.stringify({ type: "project", target_id: selected.id, target_name: selected.title, reason })
                                });
                                alert("Project reported.");
                                setSelected(null);
                             }} className="w-full py-3 rounded-2xl border border-border/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-secondary/30 transition-all">
                                Report Anomaly
                             </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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

                {(() => { try { const qs = applyingRole.questions ? (typeof applyingRole.questions === 'string' ? JSON.parse(applyingRole.questions) : applyingRole.questions) : []; return qs.length > 0; } catch { return false; } })() ? (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">Please answer the following questions:</p>
                    {(typeof applyingRole.questions === 'string' ? JSON.parse(applyingRole.questions) : applyingRole.questions).map((q: string, qi: number) => (
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

                        <div className="flex gap-2 items-center">
                          <button 
                            onClick={() => window.open(`/u/${selectedApp.user.username}`, '_blank')}
                            className="rounded-xl px-4 py-2 text-xs font-bold text-primary border border-primary/20 hover:bg-primary/10 transition-all font-sans"
                          >
                            View Portfolio
                          </button>
                          {selectedApp.status === 'pending' && (
                            <>
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
                            </>
                          )}
                        </div>
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

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setProjectToDelete(null); }}
        onConfirm={() => projectToDelete && handleDelete(projectToDelete)}
        title="Dissolve Project"
        message="Are you sure you want to dissolve this project? This action is permanent and all associated data will be lost."
        confirmText="Dissolve"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showMemberRemoveConfirm}
        onClose={() => { setShowMemberRemoveConfirm(false); setMemberToRemove(null); }}
        onConfirm={() => memberToRemove && handleRemoveMember(memberToRemove.projectId, memberToRemove.memberId)}
        title="Remove Member"
        message="Are you sure you want to remove this member from the project team?"
        confirmText="Remove"
        variant="warning"
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setProjectToShare(null); }}
        title={projectToShare?.title || "Project"}
        link={`${window.location.origin}${window.location.pathname}?project=${projectToShare?.id}`}
      />
    </AppLayout>
  );
}
