import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink, Calendar, Star, Github, Linkedin, Globe, Mail,
  MapPin, Code, Briefcase, Award, BookOpen, Camera, Pencil, Trash2, X, Save, Rocket, Plus,
  ArrowUpRight, Zap, Lightbulb,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { useState, useEffect, useRef } from "react";
import { getApiData, apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  name: string;
  title: string;
  university: string;
  location: string;
  bio: string;
  skills: string[];
  links: any;
  stats: any;
  email: string;
  projects: any[];
  startups: any[];
  username: string;
  profileImage: string | null;
}

const achievements = [
  { title: "Platform Tester", date: "2026", icon: Award },
  { title: "Early Adopter", date: "2026", icon: Code },
];

const colors = [
  "from-primary to-glow-secondary",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
  "from-violet-500 to-purple-500",
];

export default function Portfolio() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [linksInput, setLinksInput] = useState({ github: "", linkedin: "", website: "" });
  const [editingProject, setEditingProject] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token");

  const fetchPortfolio = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const meData = await getApiData("/api/v1/auth/me");
      const portData = await getApiData(`/api/v1/portfolio/${meData.username}`);
      
      const { user, portfolio, projects } = portData;

      let parsedSkills = ["React", "TypeScript"];
      if (portfolio && portfolio.skills) {
        try { parsedSkills = JSON.parse(portfolio.skills); } catch { parsedSkills = portfolio.skills.split(",").map((s: string) => s.trim()); }
      }

      setProfile({
        username: meData.username,
        name: user.full_name || user.username,
        title: user.field_of_study ? `${user.field_of_study} Student` : "University Student",
        university: user.university || "Campus",
        location: "Local",
        bio: portfolio?.bio || user.bio || "Passionate about building cool tools.",
        email: user.email,
        profileImage: user.profile_image || null,
        skills: parsedSkills,
        projects: projects.map((p: any, i: number) => ({
          id: p.id,
          title: p.title,
          date: new Date(p.created_at || Date.now()).toLocaleDateString(),
          desc: p.description,
          tech: p.skills_needed || [],
          stars: p.stars || 0,
          role: p.isOwner ? "Owner" : p.role || "Member",
          isOwner: p.isOwner,
          color: colors[i % colors.length],
          field: p.field || "",
          owner: p.owner?.full_name || "You"
        })),
        startups: (portData.startup_ideas || []).map((s: any, i: number) => ({
          id: s.id,
          title: s.title,
          field: s.field,
          desc: s.description,
          isOwner: s.isOwner,
          date: new Date(s.created_at).toLocaleDateString(),
          color: colors[(i + 2) % colors.length]
        })),
        links: portfolio?.links ? JSON.parse(portfolio.links) : { github: "https://github.com", linkedin: "https://linkedin.com", website: "student.dev" },
        stats: { 
          projects: projects.length, 
          startups: (portData.startup_ideas?.length || 0),
          contributions: (projects.length + (portData.startup_ideas?.length || 0)) * 3, 
          endorsements: 0 
        },
      });
    } catch (err) { 
      console.error("Error fetching portfolio", err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  const handleUpdateBio = async () => {
    try {
      const res = await fetch("/api/v1/portfolio/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bio: bioInput }),
      });
      if (res.ok) {
        await fetchPortfolio();
        setIsEditingBio(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateSkills = async () => {
    const skills = skillsInput.split(",").map(s => s.trim()).filter(s => s);
    try {
      const res = await fetch("/api/v1/portfolio/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skills }),
      });
      if (res.ok) {
        await fetchPortfolio();
        setIsEditingSkills(false);
      }
    } catch (err) { console.error(err); }
  };

  const formatLink = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `https://${url}`;
  };

  const handleUpdateLinks = async () => {
    const formattedLinks = {
      github: formatLink(linksInput.github),
      linkedin: formatLink(linksInput.linkedin),
      website: formatLink(linksInput.website),
    };
    try {
      const res = await fetch("/api/v1/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ links: formattedLinks }),
      });
      if (res.ok) {
        await fetchPortfolio();
        setIsEditingLinks(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/v1/users/profile-photo", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ profile_image: reader.result }),
        });
        if (res.ok) await fetchPortfolio();
      } catch (err) { console.error(err); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-6xl relative z-10 px-4 space-y-8">
          <Skeleton className="h-64 rounded-[3rem] w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="space-y-8">
                <Skeleton className="h-48 rounded-[2.5rem] w-full" />
                <Skeleton className="h-48 rounded-[2.5rem] w-full" />
             </div>
             <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Skeleton className="h-40 rounded-[2.5rem] w-full" />
                   <Skeleton className="h-40 rounded-[2.5rem] w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Skeleton className="h-40 rounded-[2.5rem] w-full" />
                   <Skeleton className="h-40 rounded-[2.5rem] w-full" />
                </div>
             </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) return null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl relative z-10 px-4">
        {/* Profile Hero Header */}
        <section className="relative mb-12 overflow-hidden rounded-[3rem] border border-border/50 bg-secondary/5 p-8 shadow-2xl backdrop-blur-3xl lg:p-16">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-glow-secondary/10 blur-[100px] -ml-20 -mb-20" />
          
          <div className="relative flex flex-col lg:flex-row items-center lg:items-end gap-12">
            <div className="group relative">
               <div className="relative h-48 w-48 overflow-hidden rounded-[2.5rem] border-8 border-background shadow-[0_0_50px_rgba(0,0,0,0.2)] transition-all duration-500 group-hover:scale-[1.05] group-hover:rotate-2">
                  {profile.profileImage ? (
                    <img src={profile.profileImage} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary via-indigo-600 to-glow-secondary text-7xl font-black text-white uppercase select-none">
                      {profile.name[0]}
                    </div>
                  )}
                  {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest">Syncing...</div>}
               </div>
               <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-4 -right-4 h-14 w-14 rounded-[1.5rem] bg-background border-2 border-border/50 text-foreground shadow-2xl flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all z-10 group/cam">
                  <Camera className="h-6 w-6 group-hover/cam:rotate-12 transition-transform" />
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>

            <div className="flex-1 text-center lg:text-left">
               <div className="mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 border border-primary/20 mb-4 animate-bounce-subtle">
                     <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Elite Innovator</span>
                  </div>
                  <h1 className="heading-tight text-5xl font-black text-foreground lg:text-7xl tracking-tighter mb-2">{profile.name}</h1>
                  <p className="text-xl font-bold bg-gradient-to-r from-primary to-glow-secondary bg-clip-text text-transparent">@{profile.username}</p>
               </div>

               <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/30 px-4 py-2 rounded-2xl border border-border/30">
                    <MapPin className="h-4 w-4 text-primary" /> {profile.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/30 px-4 py-2 rounded-2xl border border-border/30">
                    <Briefcase className="h-4 w-4 text-primary" /> {profile.title}
                  </div>
               </div>
            </div>

            <div className="flex lg:flex-col gap-3">
               <button 
                 onClick={() => { setIsEditingLinks(true); setLinksInput(profile.links); }}
                 className="glass-card flex h-14 w-14 items-center justify-center rounded-3xl border-border/50 transition-all hover:scale-110 text-muted-foreground hover:text-primary mb-2"
                 title="Edit Social Links"
               >
                 <Pencil className="h-5 w-5" />
               </button>
               
               {isEditingLinks ? (
                 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                   <GlassCard className="max-w-md w-full p-8 rounded-[2.5rem]">
                     <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                       <Globe className="h-5 w-5 text-primary" /> Update Links
                     </h3>
                     <div className="space-y-4 mb-8">
                       <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">GitHub</label>
                         <input value={linksInput.github} onChange={e => setLinksInput({...linksInput, github: e.target.value})} className="w-full rounded-2xl border border-border/50 bg-secondary/20 p-4 text-sm outline-none focus:border-primary mt-1" />
                       </div>
                       <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">LinkedIn</label>
                         <input value={linksInput.linkedin} onChange={e => setLinksInput({...linksInput, linkedin: e.target.value})} className="w-full rounded-2xl border border-border/50 bg-secondary/20 p-4 text-sm outline-none focus:border-primary mt-1" />
                       </div>
                       <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Website</label>
                         <input value={linksInput.website} onChange={e => setLinksInput({...linksInput, website: e.target.value})} className="w-full rounded-2xl border border-border/50 bg-secondary/20 p-4 text-sm outline-none focus:border-primary mt-1" />
                       </div>
                     </div>
                     <div className="flex gap-4">
                       <button onClick={handleUpdateLinks} className="flex-1 bg-primary py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20">Sync Nodes</button>
                       <button onClick={() => setIsEditingLinks(false)} className="flex-1 bg-secondary py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-foreground">Retreat</button>
                     </div>
                   </GlassCard>
                 </motion.div>
               ) : (
                 [
                   { icon: Github, link: profile.links.github, color: "hover:text-[#2ea44f]" },
                   { icon: Linkedin, link: profile.links.linkedin, color: "hover:text-[#0a66c2]" },
                   { icon: Globe, link: profile.links.website, color: "hover:text-primary" }
                 ].map((item, i) => (
                   <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className={`glass-card flex h-14 w-14 items-center justify-center rounded-3xl border-border/50 transition-all hover:scale-110 hover:-translate-y-1 ${item.color}`}>
                     <item.icon className="h-6 w-6" />
                   </a>
                 ))
               )}
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: "Active Ops", value: profile.stats.projects, icon: Rocket, color: "from-blue-500 to-indigo-600" },
               { label: "Incubations", value: profile.stats.startups, icon: Lightbulb, color: "from-amber-500 to-orange-600" },
               { label: "XP Points", value: profile.stats.contributions, icon: Zap, color: "from-emerald-500 to-teal-600" },
               { label: "Social Rank", value: "#142", icon: Star, color: "from-rose-500 to-pink-600" }
             ].map((stat, i) => (
               <div key={i} className="group/stat relative overflow-hidden rounded-[2rem] border border-border/50 bg-secondary/20 p-6 transition-all hover:bg-secondary/40">
                  <div className={`absolute top-0 right-0 h-20 w-20 bg-gradient-to-br ${stat.color} opacity-0 blur-[30px] group-hover/stat:opacity-20 transition-opacity`} />
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-2">
                        <stat.icon className="h-5 w-5 text-muted-foreground group-hover/stat:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                     </div>
                     <p className="text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                  </div>
               </div>
             ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-8">
            <GlassCard className="rounded-[2.5rem] p-8 border-border/50 overflow-hidden relative group">
               <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-30" />
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Intelligence Briefing</h2>
                  <button onClick={() => { setIsEditingBio(true); setBioInput(profile.bio); }} className="p-2 text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-4 w-4" /></button>
               </div>
               {isEditingBio ? (
                 <div className="space-y-4">
                   <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} rows={4} className="w-full rounded-2xl border border-border/50 bg-secondary/20 p-4 text-sm text-foreground outline-none focus:border-primary transition-all resize-none" />
                   <div className="flex gap-2">
                     <button onClick={handleUpdateBio} className="flex-1 bg-primary py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20">Save</button>
                     <button onClick={() => setIsEditingBio(false)} className="flex-1 bg-secondary py-2 rounded-xl text-xs font-black uppercase tracking-widest text-foreground">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <p className="text-sm font-medium leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">{profile.bio}</p>
               )}
            </GlassCard>

            <GlassCard className="rounded-[2.5rem] p-8 border-border/50 overflow-hidden relative group">
               <div className="absolute top-0 left-0 w-1 h-full bg-glow-secondary opacity-30" />
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-glow-secondary">Technical Arsenal</h2>
                  <button onClick={() => { setIsEditingSkills(true); setSkillsInput(profile.skills.join(", ")); }} className="p-2 text-muted-foreground hover:text-glow-secondary transition-colors"><Pencil className="h-4 w-4" /></button>
               </div>
               {isEditingSkills ? (
                 <div className="space-y-4">
                   <input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} className="w-full rounded-2xl border border-border/50 bg-secondary/20 px-4 py-2 text-sm text-foreground outline-none focus:border-glow-secondary transition-all" placeholder="React, Node, etc." />
                   <div className="flex gap-2">
                     <button onClick={handleUpdateSkills} className="flex-1 bg-glow-secondary py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-glow-secondary/20">Sync</button>
                     <button onClick={() => setIsEditingSkills(false)} className="flex-1 bg-secondary py-2 rounded-xl text-xs font-black uppercase tracking-widest text-foreground">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-wrap gap-2">
                   {profile.skills.map((skill, i) => (
                     <span key={i} className="rounded-xl border border-border/50 bg-secondary/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground/80 hover:bg-glow-secondary/10 hover:border-glow-secondary/50 transition-all cursor-default">
                       {skill}
                     </span>
                   ))}
                 </div>
               )}
            </GlassCard>
            
            <GlassCard className="rounded-[2.5rem] p-8 border-border/50 overflow-hidden relative group">
               <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Milestones</h2>
               <div className="space-y-4">
                {achievements.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group/item">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary border border-border/50 group-hover/item:border-primary/50 transition-all">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-foreground">{item.title}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-2 space-y-12">
            <section>
              <div className="flex items-center justify-between mb-8 px-4">
                 <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-4">
                    Active Missions
                    <span className="h-px w-24 bg-gradient-to-r from-primary to-transparent" />
                 </h2>
                 <button onClick={() => navigate('/projects')} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Discovery <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {profile.projects.map((project, i) => (
                    <motion.div 
                      key={project.id} 
                      onClick={() => navigate(`/projects?project=${project.id}`)}
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: i * 0.05 }} 
                      className="group/proj relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-secondary/5 p-6 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-2xl cursor-pointer"
                    >
                       <div className={`absolute top-0 right-0 h-40 w-40 bg-gradient-to-br ${project.color} opacity-0 blur-[60px] group-hover/proj:opacity-10 transition-opacity`} />
                       <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                                <Code className="h-6 w-6" />
                             </div>
                             <span className="rounded-full bg-background/50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border/50 backdrop-blur-sm">{project.field}</span>
                          </div>
                          <h3 className="text-xl font-black text-foreground mb-2 group-hover/proj:text-primary transition-colors line-clamp-1">{project.title}</h3>
                          <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed mb-6 h-8">{project.desc}</p>
                          
                          <div className="flex items-center justify-between pt-6 border-t border-border/30">
                             <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-secondary shrink-0 flex items-center justify-center text-[8px] font-black text-muted-foreground uppercase">{project.role[0]}</div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase">{project.role}</span>
                             </div>
                             <div className="text-[10px] font-bold text-muted-foreground">{project.date}</div>
                          </div>
                       </div>
                    </motion.div>
                  ))}
                  {profile.projects.length === 0 && (
                    <div className="col-span-2 flex flex-col items-center justify-center py-20 bg-secondary/5 rounded-[3rem] border border-dashed border-border/50">
                       <Rocket className="h-10 w-10 text-muted-foreground/30 mb-4" />
                       <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Journey begins now.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-8 px-4">
                 <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-4">
                    Inception Lab
                    <span className="h-px w-24 bg-gradient-to-r from-amber-500 to-transparent" />
                 </h2>
                 <button onClick={() => navigate('/startups')} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                    Incubate <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.startups.map((s, i) => (
                  <div key={s.id} onClick={() => navigate('/startups')} className="group/start cursor-pointer relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-secondary/5 p-6 backdrop-blur-md transition-all hover:border-amber-500/50 hover:shadow-2xl">
                     <div className={`absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 blur-[60px] group-hover/start:opacity-10 transition-opacity`} />
                     <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              <Lightbulb className="h-6 w-6" />
                           </div>
                           <span className="rounded-full bg-background/50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/20 backdrop-blur-sm">{s.field}</span>
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-2 group-hover/start:text-amber-500 transition-colors uppercase tracking-tight line-clamp-1">{s.title}</h3>
                        <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed mb-6 h-8">{s.desc}</p>
                        <div className="flex items-center justify-between pt-6 border-t border-border/30">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${s.isOwner ? 'text-amber-500' : 'text-primary'}`}>
                              {s.isOwner ? 'Founder' : 'Founding Member'}
                           </span>
                           <span className="text-[10px] font-bold text-muted-foreground">{s.date}</span>
                        </div>
                     </div>
                  </div>
                ))}
                {profile.startups.length === 0 && (
                   <div className="col-span-2 flex flex-col items-center justify-center py-16 bg-secondary/5 rounded-[3rem] border border-dashed border-border/50">
                      <Lightbulb className="h-10 w-10 text-muted-foreground/30 mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Genisis awaits.</p>
                   </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
