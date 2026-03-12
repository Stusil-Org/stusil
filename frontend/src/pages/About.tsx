import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Zap, Target, Heart, Shield } from "lucide-react";

export default function About() {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-16">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-glow-secondary">Stusil</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            The global network empowering university students to build the future together.
          </p>
        </div>

        <div className="space-y-16">
          <section className="glass-card p-8 md:p-12 border-primary/20">
            <div className="flex items-center gap-4 mb-6">
              <Target className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold">Our Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg">
              To democratize access to innovation by connecting talented, driven students across academic boundaries. We believe the next big breakthroughs will come from diverse teams forming in dorm rooms and university libraries worldwide. Stusil is the launchpad for those teams.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            <section className="glass-card p-8 border-emerald-500/20">
              <div className="flex items-center gap-4 mb-6">
                <Heart className="h-6 w-6 text-emerald-500" />
                <h2 className="text-xl font-bold">How Students Benefit</h2>
              </div>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                  <span>Find technical or business co-founders.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                  <span>Build a verified portfolio of real-world projects.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                  <span>Connect globally outside your immediate degree.</span>
                </li>
              </ul>
            </section>

            <section className="glass-card p-8 border-purple-500/20">
              <div className="flex items-center gap-4 mb-6">
                <Shield className="h-6 w-6 text-purple-500" />
                <h2 className="text-xl font-bold">Platform Principles</h2>
              </div>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500 mt-2" />
                  <span>Student-first ecosystem and tooling.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500 mt-2" />
                  <span>Secure, verified academic identities.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500 mt-2" />
                  <span>Open collaboration without boundaries.</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
