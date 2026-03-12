import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail, Lock, User, ArrowRight, ArrowLeft, Sparkles, Check,
  Code, Briefcase, FlaskConical, Palette, BookOpen, Rocket, Users, Target,
} from "lucide-react";

const fields = [
  { id: "cs", label: "Computer Science", icon: Code },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "engineering", label: "Engineering", icon: FlaskConical },
  { id: "design", label: "Design", icon: Palette },
  { id: "science", label: "Sciences", icon: BookOpen },
  { id: "other", label: "Other", icon: Sparkles },
];

const goals = [
  { id: "projects", label: "Build projects", icon: Rocket },
  { id: "team", label: "Find teammates", icon: Users },
  { id: "startup", label: "Launch a startup", icon: Target },
  { id: "learn", label: "Learn new skills", icon: BookOpen },
];

const skills = [
  "React", "Python", "TypeScript", "UI/UX Design", "Machine Learning",
  "Node.js", "Data Analysis", "Product Management", "Marketing",
  "Mobile Dev", "DevOps", "Blockchain", "Video Editing", "3D Modeling",
];

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
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      alert("Error connecting to server");
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
          className="mx-auto w-full max-w-sm lg:w-96 my-auto"
        >
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">STUSIL</span>
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

      {/* Right Graphic Section */}
      <div className="relative hidden w-0 flex-1 lg:block border-l border-white/5 bg-secondary/5 overflow-hidden">
        {/* Abstract Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>

        {/* Floating Elements matched to community vibes */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="relative w-full max-w-lg h-96">

            <motion.div
              initial={{ x: -40, y: -40, opacity: 0 }}
              animate={{ x: -20, y: -20, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="absolute top-0 left-0 glass-card p-5 border border-primary/20 shadow-2xl backdrop-blur-3xl z-10 w-64"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Find Co-founders</div>
                  <div className="text-xs text-muted-foreground">Match instantly</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 40, y: 40, opacity: 0 }}
              animate={{ x: 20, y: 20, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="absolute bottom-0 right-0 glass-card p-5 border border-emerald-500/20 shadow-2xl backdrop-blur-3xl z-10 w-72"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Rocket className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Launch Startups</div>
                  <div className="text-xs text-muted-foreground mt-1 text-emerald-400">Join 500+ student teams</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Overlay Graphic text */}
        <div className="absolute bottom-12 left-12 right-12 z-20">
          <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">Expand your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">horizons.</span></h2>
          <p className="text-white/60 text-lg max-w-lg">Find the perfect team, collaborate on assignments, and launch the next big thing right from campus.</p>
        </div>
      </div>
    </div>
  );
}
