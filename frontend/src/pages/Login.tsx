import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Corrected production path for v1 auth
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        if (data.user?.email === 'stusil.org@gmail.com') {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
        toast.success("Welcome back!");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Left Form Section */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:flex-none lg:w-1/2 xl:w-5/12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="mx-auto w-full max-sm lg:w-96"
        >
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/5 overflow-hidden border border-border/30">
              <img src="/favicon.ico" alt="Stusil Logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground uppercase tracking-widest">STUSIL</span>
          </div>

          <div>
            <h1 className="heading-tight text-3xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 focus-within:border-primary/50 transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 focus-within:border-primary/50 transition-colors">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="rounded border-border bg-transparent" />
                  Remember me
                </label>
                <Link to="/forgot-password" stroke-width="1.5" className="text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading} className="glow-button flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold disabled:opacity-50">
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/join" className="font-semibold text-primary hover:text-primary/80 transition-colors">Join Stusil</Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Graphic Section - Enhanced for Trust and Opportunity */}
      <div className="relative hidden w-0 flex-1 lg:block border-l border-border/10 bg-secondary/5 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <div className="absolute top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
           <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-glow-secondary/20 blur-[100px]" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12">
           <div className="w-full max-w-lg space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Sparkles className="h-3 w-3" /> Live Ecosystem Activity
                 </div>
                 <h2 className="text-4xl xl:text-5xl font-black text-foreground leading-[1.1] tracking-tighter">
                    Where students turn <span className="text-primary italic">ideas</span> into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-glow-secondary">impact.</span>
                 </h2>
              </motion.div>

              <div className="grid gap-4">
                 {[
                    { label: "New Project Launched", user: "Sarah L.", domain: "FinTech", color: "primary" },
                    { label: "Secured Beta Testing", user: "David K.", domain: "AI/ML", color: "glow-secondary" },
                    { label: "Community Milestone", user: "1.2k members", domain: "Growth", color: "primary" }
                 ].map((item, i) => (
                    <motion.div
                       key={i}
                       initial={{ opacity: 0, x: 50 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: 0.4 + (i * 0.1), duration: 0.6 }}
                    >
                       <GlassCard className="p-4 border-white/5 bg-white/5 backdrop-blur-3xl group hover:border-primary/30 transition-all duration-500">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-xl bg-${item.color}/10 flex items-center justify-center text-${item.color === 'primary' ? 'primary' : 'glow-secondary'}`}>
                                   {item.user[0]}
                                </div>
                                <div>
                                   <div className="text-sm font-bold text-foreground">{item.label}</div>
                                   <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{item.user} • {item.domain}</div>
                                </div>
                             </div>
                             <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300" />
                          </div>
                       </GlassCard>
                    </motion.div>
                 ))}
              </div>
           </div>
        </div>

        <div className="absolute bottom-12 left-12 right-12 z-20 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">U{i}</div>
                 ))}
              </div>
              <p className="text-xs font-bold text-muted-foreground">Joined by 2,000+ builders this month</p>
           </div>
        </div>
      </div>
    </div>
  );
}