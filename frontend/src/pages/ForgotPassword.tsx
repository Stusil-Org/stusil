import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowRight, Sparkles, ChevronLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Error connecting to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 relative z-10 w-full max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
                <h1 className="heading-tight text-3xl font-bold">Lost your key?</h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Enter your university email and we'll send you a recovery link to reset your password.
                </p>
              </div>

              <div className="mt-8">
                <form onSubmit={handleForgot} className="space-y-6">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">University Email</label>
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

                  {error && <p className="text-xs font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">{error}</p>}

                  <button type="submit" disabled={loading} className="glow-button flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold disabled:opacity-50">
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    ) : (
                      <>Send Recovery Link <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-border/30">
                  <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ChevronLeft className="h-4 w-4" /> Back to Login
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">Check your inbox</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                If an account exists for <span className="font-semibold text-foreground">{email}</span>, you'll receive a password reset link shortly.
              </p>
              <div className="mt-10">
                <Link to="/login" className="glow-button inline-flex items-center gap-2 text-sm">
                   Return to Login
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Background Decor */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-glow-secondary/10 blur-[130px]" />
      </div>
    </div>
  );
}
