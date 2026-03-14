import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, LogOut, Globe, Lock, Link as LinkIcon, Briefcase, Settings, Save } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Note: Kept toggle visuals for UX placeholder purposes, but form binds to real user attributes.
const sectionsBase = [
  {
    id: "profile",
    title: "Profile Intel",
    icon: User,
    description: "Manage your public identity and credentials.",
    fields: [
      { label: "Display Name", key: "full_name", type: "text", placeholder: "Enter your full name" },
      { label: "Email Address", key: "email", type: "email", placeholder: "you@university.edu" },
      { label: "Headline", key: "bio", type: "text", placeholder: "e.g., Computer Science · Class of 2027" },
      { label: "University", key: "university", type: "text", placeholder: "e.g., MIT, Stanford" },
      { label: "Field of Study", key: "field_of_study", type: "text", placeholder: "e.g., Software Engineering" },
    ],
  },
  {
    id: "social",
    title: "Cyber Connections",
    icon: Globe,
    description: "Sync your external profiles and portfolios.",
    fields: [
      { label: "GitHub Hub", key: "github", type: "text", placeholder: "https://github.com/yourusername" },
      { label: "LinkedIn Link", key: "linkedin", type: "text", placeholder: "https://linkedin.com/in/yourusername" },
      { label: "Nexus Website", key: "website", type: "text", placeholder: "https://yourwebsite.com" },
    ],
  },
  {
    id: "security",
    title: "Guardianship",
    icon: Shield,
    description: "Protect your account with advanced protocols.",
    fields: [
      { label: "Current Password", key: "old_password", type: "password", placeholder: "••••••••" },
      { label: "New Phase Key", key: "new_password", type: "password", placeholder: "••••••••" },
    ],
  },
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          let links = {};
          try {
            if (data.links) links = JSON.parse(data.links);
          } catch (e) { console.error("Error parsing links", e); }
          
          setFormData({
            ...data,
            ...links
          });
        }
      } catch (err) {
        console.error("Error fetching user", err);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    
    // Extract links
    const links = {
      github: formData.github || "",
      linkedin: formData.linkedin || "",
      website: formData.website || ""
    };

    const body = {
      full_name: formData.full_name,
      bio: formData.bio,
      university: formData.university,
      field_of_study: formData.field_of_study,
      links: JSON.stringify(links)
    };

    try {
      const res = await fetch("/api/v1/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings.");
      }
    } catch (err) {
      console.error("Error saving profile", err);
      alert("Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) return <AppLayout><div className="flex h-screen items-center justify-center text-muted-foreground animate-pulse">Loading settings...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl relative z-10 px-4">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-primary" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System Config</span>
              </div>
              <h1 className="heading-tight text-4xl font-black text-foreground tracking-tight lg:text-5xl">Preferences</h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground max-w-md">Calibrate your identity, security, and external nodes in the ecosystem.</p>
           </motion.div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="glow-button flex items-center justify-center gap-2 group !bg-primary hover:!bg-primary/90 border-none shadow-xl shadow-primary/20 min-w-[140px]"
              >
                {saving ? "Syncing..." : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="font-bold">Save System</span>
                  </>
                )}
              </button>
              <button 
                onClick={handleLogout} 
                className="h-[46px] w-[46px] rounded-2xl border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all group"
              >
                <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Sidebar Navigation */}
           <div className="lg:col-span-1 space-y-2">
              {sectionsBase.map((section) => (
                <button
                  key={section.id}
                  onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="flex w-full items-center gap-4 rounded-[1.25rem] border border-transparent p-4 text-left transition-all hover:bg-secondary/30 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-foreground">{section.title}</p>
                    <p className="text-[9px] font-bold text-muted-foreground line-clamp-1">{section.description}</p>
                  </div>
                </button>
              ))}
           </div>

           {/* Main Content Areas */}
           <div className="lg:col-span-3 space-y-10">
              {sectionsBase.map((section, si) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="rounded-[2.5rem] border-border/50 p-0 overflow-hidden relative group">
                     <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary/50 to-transparent" />
                     <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                        <div>
                           <h2 className="text-xl font-black text-foreground tracking-tight">{section.title}</h2>
                           <p className="text-xs font-medium text-muted-foreground mt-1">{section.description}</p>
                        </div>
                        <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center text-primary shadow-sm">
                           <section.icon className="h-5 w-5" />
                        </div>
                     </div>
                     <div className="p-8 space-y-6">
                        {section.fields.map((field) => (
                          <div key={field.label} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center group/field">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover/field:text-primary transition-colors">
                              {field.label}
                            </label>
                            <div className="md:col-span-2">
                              {field.type === "password" ? (
                                <div className="relative">
                                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <input
                                    type="password"
                                    value={formData[field.key] || ""}
                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                    placeholder={field.placeholder}
                                    className="w-full rounded-2xl border border-border/50 bg-secondary/20 py-3 pl-11 pr-4 text-sm text-foreground outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4 placeholder:text-muted-foreground/30 font-mono"
                                  />
                                </div>
                              ) : (
                                <input
                                  type={field.type}
                                  value={formData[field.key] || ""}
                                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                  placeholder={field.placeholder}
                                  className="w-full rounded-2xl border border-border/50 bg-secondary/20 py-3 px-4 text-sm text-foreground outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4 placeholder:text-muted-foreground/30"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                     </div>
                  </GlassCard>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </AppLayout>
  );
}
