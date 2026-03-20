import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError("This reset link is invalid or has expired.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    if (newPassword.length < 8) {
       setError("Password must be at least 8 characters long.");
       return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Reset failed. The link might be expired.");
      }
    } catch (err) {
      setError("A connection error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 relative z-10 w-full max-w-lg mx-auto">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="glass-card p-8 md:p-12 border border-border/50 shadow-2xl backdrop-blur-3xl"
        >
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/5 overflow-hidden border border-border/30">
              <img src="/favicon.ico" alt="Stusil Logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight uppercase tracking-widest text-foreground">STUSIL</span>
          </div>

          {!submitted ? (
            <>
              <div>
                <h1 className="heading-tight text-3xl font-bold">New Security Key</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Update your credentials and regain full access to your ecosystem.
                </p>
              </div>

              <div className="mt-8">
                <form onSubmit={handleReset} className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">New Password</label>
                    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 focus-within:border-primary/50 transition-colors">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirm Password</label>
                    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 focus-within:border-primary/50 transition-colors">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </p>}

                  <button 
                    type="submit" 
                    disabled={loading || !token} 
                    className="glow-button flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    ) : (
                      <>Update Identity Key <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </form>

                {!token && (
                  <div className="mt-8 pt-6 border-t border-border/30">
                    <Link to="/forgot-password" stroke-width="1.5" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                      Request a New Link
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
               <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">Identity Updated</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                 Your password has been successfully reset. You can now use your new security key to sign in.
              </p>
              <div className="mt-10">
                <Link to="/login" className="glow-button inline-flex items-center gap-2 text-sm">
                   Finalize Login
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Animation Layer */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-glow-secondary/10 blur-[130px]" />
      </div>
    </div>
  );
}
