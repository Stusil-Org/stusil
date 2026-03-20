import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail, Lock, User, ArrowRight, ArrowLeft, Sparkles, Check,
  Code, Briefcase, FlaskConical, Palette, BookOpen, Rocket, Users, Target,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { toast } from "sonner";

export default function Join() {
  const [form, setForm] = useState({
    name: "", email: "", password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const canSubmit = () => {
    return form.name && form.email && form.password;
  };

  const handleFinish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const storedAnswers = JSON.parse(localStorage.getItem("onboarding_answers") || "{}");

      const payload = {
        email: form.email,
        password: form.password,
        username: form.email.split('@')[0] + Math.floor(Math.random() * 1000),
        full_name: form.name,
        field_of_study: storedAnswers.field || "Not Specified",
        bio: `Role: ${storedAnswers.role || "Student"} | Goal: ${storedAnswers.goal || "Build projects"} | Skill Level: ${storedAnswers.skill || "Beginner"} | Open to Collab: ${storedAnswers.collab || "Yes"}`,
      };

      // Corrected production path for v1 auth
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        toast.success("Welcome to Stusil!");
        navigate("/dashboard");
      } else {
        toast.error(data.error || "Signup failed");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Left Form Section */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:flex-none lg:w-1/2 xl:w-5/12 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="mx-auto w-full max-sm lg:w-96 my-auto"
        >
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/5 overflow-hidden border border-border/30">
              <img src="/favicon.ico" alt="Stusil Logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground uppercase tracking-widest">STUSIL</span>
          </div>

          <div className="glass-card p-8 border-transparent lg:border-border/50 bg-transparent lg:bg-secondary/10">
            <AnimatePresence mode="wait">
              <motion.div key="step0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", damping: 25 }}>
                <h2 className="heading-tight mb-2 text-3xl font-bold text-foreground">Create account</h2>
                <p className="mb-8 text-sm text-muted-foreground">Join hundreds of students building together.</p>
                <form onSubmit={handleFinish} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full Name</label>
                    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 focus-within:border-primary/50 transition-colors">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alex Johnson" className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">University Email</label>
                    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 focus-within:border-primary/50 transition-colors">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@university.edu" className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
                    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 focus-within:border-primary/50 transition-colors">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                    </div>
                  </div>

                  <div className="mt-10 flex items-center justify-between">
                    <Link to="/login" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                      Log In instead
                    </Link>

                    <button type="submit" disabled={!canSubmit() || loading} className="glow-button flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-30">
                      {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      ) : (
                        <>Complete <Rocket className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Right Graphic Section - Enhanced for Opportunity and Growth */}
      <div className="relative hidden w-0 flex-1 lg:block border-l border-border/10 bg-secondary/5 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <div className="absolute top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
           <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12">
           <div className="w-full max-w-lg space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6 text-center lg:text-left"
              >
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <Rocket className="h-3 w-3" /> Start Your Journey
                 </div>
                 <h2 className="text-4xl xl:text-6xl font-black text-foreground leading-[1.1] tracking-tighter">
                    Expand your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">horizons.</span>
                 </h2>
                 <p className="text-muted-foreground text-lg max-w-md">Find the perfect team, collaborate on projects, and launch the next big thing.</p>
              </motion.div>

              <div className="relative">
                 <motion.div
                   initial={{ x: -20, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   transition={{ delay: 0.4 }}
                   className="absolute -top-12 -left-8 glass-card p-4 border-primary/20 shadow-2xl z-20 w-48"
                 >
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Users className="h-4 w-4" />
                       </div>
                       <div className="text-[10px] font-bold">20+ Teams Hiring</div>
                    </div>
                 </motion.div>

                 <div className="space-y-4 pt-8">
                    {[
                       { title: "Project Collaboration", desc: "Work together on course assignments", icon: Code, color: "primary" },
                       { title: "Startup Incubation", desc: "Get resources for your big idea", icon: Target, color: "emerald" }
                    ].map((feature, i) => (
                       <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + (i * 0.1) }}
                       >
                          <GlassCard className="p-5 border-white/5 bg-white/5 backdrop-blur-3xl">
                             <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl bg-${feature.color === 'primary' ? 'primary' : 'emerald-500'}/10 flex items-center justify-center text-${feature.color === 'primary' ? 'primary' : 'emerald-500'}`}>
                                   <feature.icon className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                   <div className="text-sm font-bold text-foreground">{feature.title}</div>
                                   <div className="text-xs text-muted-foreground">{feature.desc}</div>
                                </div>
                             </div>
                          </GlassCard>
                       </motion.div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="absolute bottom-12 left-12 right-12 z-20 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">U{i}</div>
                 ))}
              </div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Trusted by 5,000+ students</p>
           </div>
        </div>
      </div>
    </div>
  );
}