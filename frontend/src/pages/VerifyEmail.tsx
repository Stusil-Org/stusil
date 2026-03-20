import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Email verified successfully! You can now access all features.");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The link might be expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Error connecting to server.");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 relative z-10 w-full max-w-lg mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass-card p-10 md:p-14 border border-border/50 shadow-2xl backdrop-blur-3xl text-center"
        >
          {/* Logo */}
          <div className="mb-10 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">STUSIL</span>
          </div>

          {status === "loading" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Connecting...</h2>
                <p className="mt-3 text-sm text-muted-foreground">{message}</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Identity Verified</h2>
                <p className="mt-3 text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="mt-10">
                <Link to="/login" className="glow-button inline-flex items-center gap-2 text-sm p-4 w-full justify-center">
                   Enter Platform <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Failed Verification</h2>
                <p className="mt-3 text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="mt-10 space-y-3">
                <Link to="/join" className="glow-button inline-flex items-center gap-2 text-sm p-4 w-full justify-center">
                   Try Creating New Account
                </Link>
                <Link to="/login" stroke-width="1.5" className="block text-sm text-muted-foreground hover:text-foreground">
                   Back to Login
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>

       {/* Background Aesthetics */}
       <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-glow-secondary/10 blur-[130px]" />
      </div>
    </div>
  );
}
