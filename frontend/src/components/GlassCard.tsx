import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  span?: string;
}

export function GlassCard({ children, className = "", hover = true, span = "" }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={`${hover ? "glass-card-hover" : "glass-card"} p-6 ${span} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="skeleton-loader mb-3 h-4 w-1/3" />
      <div className="skeleton-loader mb-2 h-8 w-2/3" />
      <div className="skeleton-loader h-3 w-1/2" />
    </div>
  );
}
