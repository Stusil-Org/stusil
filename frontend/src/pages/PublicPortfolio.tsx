import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ExternalLink, Calendar, Star, Github, Linkedin, Globe, Mail,
  MapPin, Code, Briefcase, Award,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { getApiData } from "@/lib/api";

interface UserProfile {
  name: string;
  title: string;
  university: string;
  location: string;
  bio: string;
  skills: string[];
  links: any;
  stats: any;
  projects: any[];
  username: string;
  profileImage: string | null;
}

const colors = [
  "from-primary to-glow-secondary",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
];

const achievements = [
  { title: "Platform Tester", date: "2026", icon: Award },
  { title: "Early Adopter", date: "2026", icon: Code },
];

export default function PublicPortfolio() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!username) return;

      try {
        const data = await getApiData(`/api/v1/portfolio/${username}`);
        if (data) {
          const { user, portfolio, projects } = data;

          let parsedSkills = ["React", "TypeScript"];
          if (portfolio && portfolio.skills) {
            try {
              parsedSkills = JSON.parse(portfolio.skills);
            } catch (e) {
              parsedSkills = portfolio.skills.split(",").map((s: string) => s.trim());
            }
          }

          // Parse links from user.links (primary) or portfolio.links (fallback)
          let parsedLinks = { github: "", linkedin: "", website: "" };
          try {
            if (user.links) {
              parsedLinks = typeof user.links === 'string' ? JSON.parse(user.links) : user.links;
            } else if (portfolio?.links) {
              parsedLinks = typeof portfolio.links === 'string' ? JSON.parse(portfolio.links) : portfolio.links;
            }
          } catch (e) {
            console.error("Error parsing links", e);
          }

          setProfile({
            username: user.username,
            name: user.full_name || user.username,
            title: user.field_of_study ? `${user.field_of_study} Student` : "University Student",
            university: user.university || "Campus",
            location: user.country || "Not specified",
            bio: portfolio?.bio || user.bio || "Passionate about building cool tools and learning new software skills.",
            profileImage: user.profile_image || null,
            skills: parsedSkills,
            projects: projects.map((p: any, i: number) => ({
              id: p.id,
              title: p.title,
              date: new Date(p.created_at || Date.now()).toLocaleDateString(),
              desc: p.description,
              tech: p.skills_needed || [],
              stars: p.stars || 0,
              role: p.isOwner ? "Owner" : "Member",
              color: colors[i % colors.length]
            })),
            links: parsedLinks,
            stats: { projects: projects.length, contributions: projects.length * 3, endorsements: 0 }
          });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching portfolio data", err);
        setError(true);
      }
    };
    fetchPortfolio();
  }, [username]);

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
          <p className="text-muted-foreground mb-6">This user doesn't exist or their profile is private.</p>
          <button onClick={() => navigate(-1)} className="glow-button px-6 py-2 rounded-full">Go Back</button>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center p-8 text-muted-foreground animate-pulse">Loading portfolio...</div>
      </AppLayout>
    );
  }

  const socialLinks = [
    { icon: Github, url: profile.links.github, label: "GitHub" },
    { icon: Linkedin, url: profile.links.linkedin, label: "LinkedIn" },
    { icon: Globe, url: profile.links.website, label: "Website" },
  ].filter(l => l.url && l.url !== "#" && l.url.length > 0);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile Header */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
          {profile.profileImage ? (
            <img src={profile.profileImage} alt={profile.name} className="h-24 w-24 rounded-3xl object-cover flex-shrink-0 border-2 border-primary/20" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-3xl font-bold text-primary flex-shrink-0 uppercase">
              {profile.name.substring(0, 2)}
            </div>
          )}
          <div className="flex-1">
            <h1 className="heading-tight text-3xl font-bold text-foreground">{profile.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{profile.title}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}</span>
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {profile.university}</span>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>

            {/* Social Links */}
            <div className="mt-4 flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.url.startsWith("http") ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <link.icon className="h-3 w-3" /> {link.label}
                </a>
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
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span key={s} className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary">{s}</span>
            ))}
          </div>
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

        {/* Projects */}
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Project History</h2>
        {profile.projects.length === 0 ? (
          <div className="text-sm text-muted-foreground p-6 text-center border border-dashed border-border/50 rounded-xl">No public projects yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {profile.projects.map((p, i) => (
              <motion.div key={p.id || p.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="glass-card-hover group overflow-hidden cursor-pointer" onClick={() => navigate(`/projects?project=${p.id}`)}>
                  <div className={`h-32 bg-gradient-to-br ${p.color} opacity-80 transition-opacity group-hover:opacity-100`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <h3 className="heading-tight text-base font-semibold text-foreground">{p.title}</h3>
                      <span className="rounded-lg bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{p.role}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tech.map((t: string) => (
                        <span key={t} className="rounded-lg bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{t}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.date}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {p.stars}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
