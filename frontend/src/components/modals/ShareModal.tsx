import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  link: string;
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  link
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    { name: "Twitter", icon: Twitter, color: "hover:bg-[#1DA1F2]", url: `https://twitter.com/intent/tweet?text=Check out this project: ${title}&url=${encodeURIComponent(link)}` },
    { name: "LinkedIn", icon: Linkedin, color: "hover:bg-[#0077b5]", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}` },
    { name: "Facebook", icon: Facebook, color: "hover:bg-[#4267B2]", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[110] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="glass-card border border-border/50 p-6 shadow-2xl w-full max-w-sm pointer-events-auto rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">Share Project</h2>
                </div>
                <button onClick={onClose} className="rounded-full h-8 w-8 flex items-center justify-center bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Direct Link</p>
                  <div className="relative group">
                    <div className="w-full bg-secondary/30 rounded-2xl border border-border/50 px-4 py-3.5 pr-12 text-xs text-muted-foreground truncate font-medium">
                      {link}
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`absolute right-2 top-2 h-9 w-9 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Social Networks</p>
                  <div className="flex items-center gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 h-12 rounded-2xl flex items-center justify-center border border-border/50 bg-secondary/20 text-muted-foreground transition-all ${social.color} hover:text-white hover:border-transparent hover:scale-[1.05]`}
                        title={`Share on ${social.name}`}
                      >
                        <social.icon className="h-5 w-5" />
                      </a>
                    ))}
                    <button
                      onClick={handleCopy}
                      className="flex-1 h-12 rounded-2xl flex items-center justify-center border border-border/50 bg-secondary/20 text-muted-foreground transition-all hover:bg-primary hover:text-white hover:border-transparent hover:scale-[1.05]"
                      title="Copy Link"
                    >
                      <LinkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-center text-muted-foreground font-medium">
                  {copied ? "Copied to clipboard!" : "Select an option to share this project."}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
