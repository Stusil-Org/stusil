import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";

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
        navigate("/dashboard");
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      alert("Error connecting to server");
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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">STUSIL</span>
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
                <a href="#" className="text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
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

      {/* Right Graphic Section */}
      <div className="relative hidden w-0 flex-1 lg:block border-l border-white/5 bg-secondary/5 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-glow-secondary/20 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="relative w-full max-w-lg">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="glass-card p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative z-20"
            >
              <div className="flex items-center gap-4 mb-4 border-b border-white/5 pb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">AJ</div>
                <div>
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-white/5 rounded mt-2 animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-white/5 rounded animate-pulse" />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 right-12 z-20">
          <h2 className="text-3xl font-bold text-white mb-2">Build something incredible.</h2>
          <p className="text-white/60 text-lg">Join the premier network for student founders and builders.</p>
        </div>
      </div>
    </div>
  );
}