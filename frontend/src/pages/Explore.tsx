import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles, Rocket, Users, Globe, ArrowRight, ExternalLink,
  Search, Eye, Heart, MessageCircle,
} from "lucide-react";

const publicProjects = [
  { id: 1, title: "AI Campus Navigator", author: "Sarah Chen", tags: ["AI", "Python"], likes: 24, desc: "ML-powered campus navigation.", color: "from-primary to-glow-secondary" },
  { id: 2, title: "StudySwap", author: "Marcus Lee", tags: ["React", "Node.js"], likes: 41, desc: "Peer-to-peer skill exchange.", color: "from-emerald-500 to-teal-500" },
  { id: 3, title: "Carbon Tracker", author: "Aisha Patel", tags: ["IoT", "Data"], likes: 18, desc: "Track campus carbon footprint.", color: "from-amber-500 to-orange-500" },
];

const startupIdeas = [
  { title: "EduFi — Student Micro-Lending", seeking: "Co-Founder (Business)", author: "Jake W." },
  { title: "LabSync — Research Collab Tool", seeking: "Full-Stack Dev", author: "Nina K." },
  { title: "FreshBites — Sustainable Food", seeking: "UX Designer", author: "Tom N." },
];

export default function Explore() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-20 right-20 h-60 w-60 rounded-full bg-glow-secondary/5 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">STUSIL</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="glow-button-outline px-4 py-2 text-sm">Sign In</Link>
          <Link to="/join" className="glow-button px-4 py-2 text-sm">Join Now</Link>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-20 text-center lg:pt-32"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Now in Beta
        </div>
        <h1 className="heading-tight text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
          Where student ideas{" "}
          <span className="text-gradient">meet skills</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground leading-relaxed">
          Find teammates, build real projects, and launch startups — all while you're still in school.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/join" className="glow-button flex items-center gap-2 text-sm">
            <Rocket className="h-4 w-4" /> Get Started
          </Link>
          <a href="#explore" className="glow-button-outline flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4" /> Explore
          </a>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-md grid-cols-3 gap-8">
          {[
            { num: "500+", label: "Students" },
            { num: "120+", label: "Projects" },
            { num: "30+", label: "Startups" },
          ].map((s) => (
            <div key={s.label}>
              <p className="heading-tight text-2xl font-bold text-foreground">{s.num}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Public Projects */}
      <section id="explore" className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
        <h2 className="heading-tight mb-8 text-2xl font-bold text-foreground">Trending Projects</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publicProjects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", damping: 25 }}
              viewport={{ once: true }}
              className="glass-card-hover group cursor-pointer overflow-hidden"
            >
              <div className={`h-32 bg-gradient-to-br ${p.color} opacity-80 transition-opacity group-hover:opacity-100`} />
              <div className="p-5">
                <h3 className="heading-tight text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">by {p.author}</p>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-lg bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Startup Ideas */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <h2 className="heading-tight mb-8 text-2xl font-bold text-foreground">Startup Ideas Looking for Co-Founders</h2>
        <div className="space-y-3">
          {startupIdeas.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, type: "spring", damping: 25 }}
              viewport={{ once: true }}
              className="glass-card-hover flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 gap-4"
            >
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{s.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">by {s.author}</p>
              </div>
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <span className="rounded-lg bg-primary/10 px-3 py-1 text-[10px] font-medium text-primary whitespace-nowrap">{s.seeking}</span>
                <Link to="/join" className="glow-button-outline px-3 py-1.5 text-xs whitespace-nowrap">Apply</Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 px-6 py-8 text-center text-xs text-muted-foreground">
        © 2026 Stusil. Built for students, by students.
      </footer>
    </div>
  );
}
