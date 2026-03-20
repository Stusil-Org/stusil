import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, LogOut, Globe, Lock, Link as LinkIcon, Briefcase, Settings, Save, Camera } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getApiData, apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

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
      { label: "Country", key: "country", type: "text", placeholder: "e.g., India, USA, Germany" },
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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      setLoading(true);
      try {
        const data = await getApiData("/api/v1/auth/me");
        setUser(data);
        let links = {};
        try {
          if (data.links) links = JSON.parse(data.links);
        } catch (e) { console.error("Error parsing links", e); }
        
        setFormData({
          ...data,
          ...links
        });
      } catch (err) {
        console.error("Error fetching user", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
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
      country: formData.country,
      links: JSON.stringify(links)
    };

    try {
      const res = await apiFetch("/api/v1/users/profile", {
        method: "PUT",
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings.");
      }
    } catch (err) {
      console.error("Error saving profile", err);
      toast.error("Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await apiFetch("/api/v1/users/profile-photo", {
          method: "PUT",
          body: JSON.stringify({ profile_image: reader.result }),
        });
        if (res.ok) {
          const data = await res.json();
          setUser({ ...user, profile_image: data.profile_image });
          toast.success("Profile photo updated!");
        }
      } catch (err) { console.error(err); toast.error("Error uploading photo."); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-6xl space-y-8 px-4">
          <div className="flex justify-between items-end mb-12">
            <Skeleton className="h-20 w-1/2 rounded-3xl" />
            <Skeleton className="h-12 w-32 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-3 space-y-10">
              <Skeleton className="h-80 w-full rounded-[2.5rem]" />
              <Skeleton className="h-80 w-full rounded-[2.5rem]" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl relative z-10 px-4 pb-20">
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                    <Settings className="h-5 w-5 text-primary" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System Architecture</span>
              </div>
              <h1 className="heading-tight text-4xl font-black text-foreground tracking-tight lg:text-5xl">Preferences</h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground max-w-md">Configure your identity, security protocols, and external ecosystem nodes.</p>
           </motion.div>
           
           <div className="flex items-center gap-3 self-end md:self-center">
              <button 
                onClick={handleLogout} 
                className="h-11 px-4 rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all group gap-2"
              >
                <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">De-sync</span>
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="glow-button flex items-center justify-center gap-2 group !bg-primary hover:!bg-primary/90 border-none shadow-xl shadow-primary/20 h-11 px-6 min-w-[160px]"
              >
                {saving ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="font-bold">Sync Changes</span>
                  </>
                )}
              </button>
           </div>
        </div>

        {/* Mobile Section Tabs (Horizontal Scroll) */}
        <div className="lg:hidden sticky top-0 z-30 -mx-4 px-4 py-4 bg-background/80 backdrop-blur-xl border-b border-border/30 mb-8 overflow-x-auto no-scrollbar flex items-center gap-2">
            {sectionsBase.map((section) => (
              <button
                key={section.id}
                onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-secondary/20 hover:bg-primary/10 transition-all"
              >
                <section.icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{section.title}</span>
              </button>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Desktop Sidebar Navigation (Sticky) */}
           <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24 space-y-1">
                {sectionsBase.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    className="flex w-full items-center gap-4 rounded-2xl border border-transparent p-4 text-left transition-all hover:bg-secondary/40 group hover:border-border/30"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                      <section.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{section.title}</p>
                      <p className="text-[9px] font-bold text-muted-foreground line-clamp-1">{section.description}</p>
                    </div>
                  </button>
                ))}
                
                <div className="mt-10 p-6 rounded-3xl bg-primary/5 border border-primary/10">
                   <Shield className="h-6 w-6 text-primary mb-3" />
                   <h4 className="text-xs font-black text-foreground uppercase tracking-widest mb-1">Security Status</h4>
                   <p className="text-[10px] text-muted-foreground leading-relaxed">Your account is protected by industry standard encryption protocols.</p>
                </div>
              </div>
           </div>

           {/* Main Content Areas */}
           <div className="lg:col-span-9 space-y-12">
              {sectionsBase.map((section, si) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="rounded-[3rem] border-border/50 p-0 overflow-hidden relative group shadow-2xl shadow-black/5 hover:border-primary/20 transition-all duration-500">
                     <div className="p-10 border-b border-border/30 bg-secondary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/50">
                              <section.icon className="h-6 w-6" />
                           </div>
                           <div>
                              <h2 className="text-2xl font-black text-foreground tracking-tight">{section.title}</h2>
                              <p className="text-xs font-medium text-muted-foreground mt-0.5">{section.description}</p>
                           </div>
                        </div>
                     </div>
                     
                     <div className="p-10 space-y-10">
                        {section.id === "profile" && (
                          <div className="flex flex-col sm:flex-row items-center gap-8 pb-10 border-b border-border/20">
                            <div className="relative group/avatar">
                              <div className="h-36 w-36 rounded-[2.5rem] overflow-hidden border-4 border-background shadow-2xl relative bg-secondary/30">
                                {user.profile_image ? (
                                  <img src={user.profile_image} className="h-full w-full object-cover transition-transform group-hover/avatar:scale-105 duration-700" />
                                ) : (
                                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-glow-secondary/20 flex items-center justify-center text-5xl font-black text-primary uppercase">
                                    {(user.full_name || user.username || "??").substring(0, 2)}
                                  </div>
                                )}
                                {uploading && (
                                  <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                       <div className="h-6 w-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                                       <span className="text-[10px] font-black uppercase text-primary tracking-widest">Syncing</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button 
                                onClick={() => (document.getElementById("profile-upload") as HTMLInputElement)?.click()}
                                className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10 border-2 border-background"
                                title="Update avatar"
                              >
                                <Camera className="h-5 w-5" />
                              </button>
                              <input 
                                id="profile-upload"
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleImageUpload}
                              />
                            </div>
                            <div className="text-center sm:text-left">
                               <h4 className="text-base font-bold text-foreground mb-1 uppercase tracking-tight">Biometric Signature</h4>
                               <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-4">Update your profile identity across the Stusil ecosystem.</p>
                               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-[10px] font-black text-primary uppercase tracking-widest">
                                  Unique Identifier: {user.username}
                               </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          {section.fields.map((field) => (
                            <div key={field.label} className="group/field">
                              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within/field:text-primary transition-colors">
                                {field.label}
                              </label>
                              <div className="relative">
                                {field.type === "password" ? (
                                  <>
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within/field:text-primary" />
                                    <input
                                      type="password"
                                      value={formData[field.key] || ""}
                                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                      placeholder={field.placeholder}
                                      className="w-full rounded-2xl border border-border/50 bg-secondary/20 py-3.5 pl-11 pr-4 text-sm text-foreground outline-none ring-primary/20 transition-all focus:border-primary focus:bg-background focus:ring-4 placeholder:text-muted-foreground/30 font-mono shadow-sm"
                                    />
                                  </>
                                ) : (
                                  <input
                                    type={field.type}
                                    value={formData[field.key] || ""}
                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                    placeholder={field.placeholder}
                                    className="w-full rounded-2xl border border-border/50 bg-secondary/20 py-3.5 px-4 text-sm text-foreground outline-none ring-primary/20 transition-all focus:border-primary focus:bg-background focus:ring-4 placeholder:text-muted-foreground/30 shadow-sm"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
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
