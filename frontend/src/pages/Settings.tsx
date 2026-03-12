import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, LogOut, Globe, Lock, Link as LinkIcon, Briefcase } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Note: Kept toggle visuals for UX placeholder purposes, but form binds to real user attributes.
const sectionsBase = [
  {
    title: "Profile Information",
    icon: User,
    fields: [
      { label: "Display Name", key: "full_name", type: "text", placeholder: "Enter your full name" },
      { label: "Email Address", key: "email", type: "email", placeholder: "you@university.edu" },
      { label: "Bio / Major", key: "bio", type: "text", placeholder: "e.g., Computer Science · Class of 2027" },
      { label: "University", key: "university", type: "text", placeholder: "e.g., MIT, Stanford" },
      { label: "Field of Study", key: "field_of_study", type: "text", placeholder: "e.g., Software Engineering" },
    ],
  },
  {
    title: "Social Connections",
    icon: Globe,
    fields: [
      { label: "GitHub Profile", key: "github", type: "text", placeholder: "https://github.com/yourusername" },
      { label: "LinkedIn Profile", key: "linkedin", type: "text", placeholder: "https://linkedin.com/in/yourusername" },
      { label: "Personal Portfolio", key: "website", type: "text", placeholder: "https://yourwebsite.com" },
    ],
  },
  {
    title: "Security",
    icon: Shield,
    fields: [
      { label: "Current Password", key: "old_password", type: "password", placeholder: "••••••••" },
      { label: "New Password", key: "new_password", type: "password", placeholder: "••••••••" },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    fields: [
      { label: "Email Alerts", key: "email_notif", type: "toggle", value: true },
      { label: "Community Digests", key: "digest_notif", type: "toggle", value: false },
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="heading-tight text-3xl font-bold text-foreground lg:text-4xl text-gradient">Preferences</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage your account settings and connected apps.</p>
          </div>
        </div>

        <div className="max-w-2xl space-y-6">
          {sectionsBase.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.1, type: "spring", damping: 25 }}
            >
              <GlassCard className="glass-card-hover group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="mb-6 flex items-center gap-3 border-b border-border/50 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground tracking-wide">{section.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Update your {section.title.toLowerCase()}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {section.fields.map((field) => (
                    <div key={field.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl hover:bg-secondary/30 transition-colors">
                      <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
                      {field.type === "toggle" ? (
                        <div
                          className={`h-6 w-11 cursor-pointer rounded-full p-0.5 transition-colors ${field.value ? "bg-primary shadow-[0_0_10px_rgba(88,101,242,0.4)]" : "bg-muted"
                            }`}
                        >
                          <div
                            className={`h-5 w-5 rounded-full bg-foreground transition-transform duration-300 ${field.value ? "translate-x-5" : "translate-x-0"
                              }`}
                          />
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.key] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          placeholder={field.placeholder || ""}
                          className="w-full sm:w-72 rounded-xl border border-border/50 bg-secondary/30 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:bg-secondary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4"
          >
            <button onClick={handleSave} disabled={saving} className="glow-button text-sm disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={handleLogout} className="border border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
