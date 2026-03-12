import { motion } from "framer-motion";
import {
  ExternalLink, Calendar, Star, Github, Linkedin, Globe, Mail,
  MapPin, Code, Briefcase, Award, BookOpen, Camera, Pencil, Trash2, X, Save,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { useState, useEffect, useRef } from "react";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [editingProject, setEditingProject] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token");

  const fetchPortfolio = async () => {
    if (!token) return;
    try {
      const meRes = await fetch("/api/v1/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (meRes.ok) {
        const meData = await meRes.json();
        const portRes = await fetch(`/api/v1/portfolio/${meData.username}`);
        if (portRes.ok) {
          const { user, portfolio, projects } = await portRes.json();

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
              stars: p.likes || Math.floor(Math.random() * 20),
              role: p.isOwner ? "Owner" : p.role || "Member",
              isOwner: p.isOwner,
              color: colors[i % colors.length],
              field: p.field || "",
              owner: p.owner?.full_name || "You"
            })),
            links: portfolio?.links ? JSON.parse(portfolio.links) : { github: "#", linkedin: "#", website: "student.dev" },
            stats: { projects: projects.length, contributions: projects.length * 3, endorsements: 0 },
          });
        }
      }
    } catch (err) { console.error("Error", err); }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  const handleUpdateSkills = async () => {
    if (!profile) return;
    try {
      const newSkills = skillsInput.split(",").map(s => s.trim()).filter(s => s);
      const res = await fetch("/api/v1/portfolio/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skills: newSkills })
      });
      if (res.ok) { setProfile({ ...profile, skills: newSkills }); setIsEditingSkills(false); }
    } catch (err) { console.error(err); }
  };

  const handleUpdateBio = async () => {
    if (!profile) return;
    try {
      // Update both portfolio bio and user bio
      await fetch("/api/v1/portfolio/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bio: bioInput })
      });
      await fetch("/api/v1/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bio: bioInput })
      });
      setProfile({ ...profile, bio: bioInput });
      setIsEditingBio(false);
    } catch (err) { console.error(err); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB."); return; }

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/v1/users/profile-photo", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ profile_image: base64 })
        });
        if (res.ok && profile) {
          setProfile({ ...profile, profileImage: base64 });
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) { console.error(err); setUploading(false); }
  };

  const handleEditProject = async () => {
    if (!editingProject) return;
    try {
      const res = await fetch(`/api/v1/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editingProject.title, description: editingProject.desc })
      });
      if (res.ok) { await fetchPortfolio(); setEditingProject(null); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) await fetchPortfolio();
    } catch (err) { console.error(err); }
  };

  if (!profile) return <AppLayout><div className="flex h-screen items-center justify-center p-8 text-muted-foreground animate-pulse">Loading portfolio...</div></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile Header */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
          {/* Profile Photo */}
          <div className="relative group flex-shrink-0">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={profile.name}
                className="h-24 w-24 rounded-3xl object-cover border-2 border-border/50"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-glow-secondary text-3xl font-bold text-white uppercase">
                {profile.name.substring(0, 2)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className={`h-6 w-6 text-white ${uploading ? "animate-pulse" : ""}`} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div className="flex-1">
            <h1 className="heading-tight text-3xl font-bold text-foreground">{profile.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{profile.title}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}</span>
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {profile.university}</span>
            </div>

            {/* Bio - editable */}
            {isEditingBio ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows={3}
                  className="w-full max-w-xl rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={handleUpdateBio} className="glow-button flex items-center gap-1 text-xs !py-1.5 !px-3"><Save className="h-3 w-3" /> Save</button>
                  <button onClick={() => setIsEditingBio(false)} className="glow-button-outline text-xs !py-1.5 !px-3">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-2">
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
                <button
                  onClick={() => { setIsEditingBio(true); setBioInput(profile.bio); }}
                  className="text-muted-foreground hover:text-primary flex-shrink-0 mt-0.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Links */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: Github, label: profile.links.github },
                { icon: Linkedin, label: profile.links.linkedin },
                { icon: Globe, label: profile.links.website },
                { icon: Mail, label: profile.email },
              ].map((link) => (
                <span key={link.label} className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <link.icon className="h-3 w-3" /> {link.label}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 md:gap-8">
            {[
              { num: profile.stats.projects, label: "Projects" },
              { num: profile.stats.contributions, label: "Contributions" },
              { num: profile.stats.endorsements, label: "Endorsements" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="heading-tight text-2xl font-bold text-foreground">{s.num}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <GlassCard className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Skills</h2>
            <button onClick={() => { setIsEditingSkills(true); setSkillsInput(profile.skills.join(", ")); }} className="text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          {isEditingSkills ? (
            <div className="space-y-3">
              <input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="React, TypeScript, Node.js" className="w-full rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" />
              <div className="flex gap-2">
                <button onClick={handleUpdateSkills} className="glow-button flex items-center gap-2 text-xs py-1.5 px-3">Save</button>
                <button onClick={() => setIsEditingSkills(false)} className="glow-button-outline flex items-center gap-2 text-xs py-1.5 px-3">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary">{s}</span>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Achievements */}
        <GlassCard className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Achievements</h2>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => (
              <div key={a.title} className="flex items-center gap-2 rounded-xl border border-border/30 bg-secondary/20 px-3 py-2">
                <a.icon className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium text-foreground">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground">{a.date}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Projects - 3 columns */}
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Project History</h2>
        {profile.projects.length === 0 ? (
          <div className="text-sm text-muted-foreground p-6 text-center border border-dashed border-border/50 rounded-xl">No projects created yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profile.projects.map((p, i) => (
              <motion.div
                key={p.id || p.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="glass-card-hover group overflow-hidden h-full flex flex-col">
                  {/* Gradient header strip */}
                  <div className={`h-24 bg-gradient-to-br ${p.color} opacity-80 group-hover:opacity-100 transition-opacity relative`}>
                    <div className="absolute top-2 right-2 rounded-full bg-black/25 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                      {p.role}
                    </div>
                    <div className="absolute bottom-2 left-3 text-[10px] font-medium text-white/80 bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      {p.field || "Project"}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="heading-tight text-sm font-semibold text-foreground line-clamp-1">{p.title}</h3>
                      {p.isOwner && (
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <button onClick={() => setEditingProject({ id: p.id, title: p.title, desc: p.desc })} className="text-muted-foreground hover:text-amber-500 transition-colors"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => handleDeleteProject(p.id)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                    {!p.isOwner && <p className="text-[10px] text-primary/80 font-medium mb-1">Owner: {p.owner}</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 flex-1">{p.desc}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.date}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {p.stars}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Project Modal */}
        {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingProject(null)} />
            <div className="glass-card z-50 w-full max-w-md p-6 border border-border/50 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Edit Project</h2>
                <button onClick={() => setEditingProject(null)} className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
              </div>
              <input value={editingProject.title} onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })} className="w-full mb-3 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" />
              <textarea value={editingProject.desc} onChange={(e) => setEditingProject({ ...editingProject, desc: e.target.value })} rows={4} className="w-full mb-4 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 resize-none" />
              <div className="flex gap-2">
                <button onClick={handleEditProject} className="glow-button text-sm w-full py-2">Save</button>
                <button onClick={() => setEditingProject(null)} className="glow-button-outline text-sm w-full py-2">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button className="glow-button flex items-center gap-2 text-sm">
            <ExternalLink className="h-4 w-4" /> Add New Project
          </button>
          <button className="glow-button-outline flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4" /> View Public Portfolio
          </button>
        </div>
      </motion.div>
    </AppLayout>
  );
}
