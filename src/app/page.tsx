"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Users,
  TrendingUp,
  MessageCircle,
  Shield,
  BarChart3,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

function AnimatedSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} className={className}>
      {isInView ? children : <div className="opacity-0">{children}</div>}
    </div>
  );
}

/* ─── feature data ─── */
const features = [
  {
    icon: Users,
    title: "Seat Management",
    description:
      "Assign clients to individual seats, track active vs. available slots, and manage bulk renewals effortlessly.",
    gradient: "from-blue-500/10 to-indigo-500/10",
    iconColor: "text-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Automatic Profitability",
    description:
      "Real-time margin calculations per subscription. Know instantly which plans are profitable and which need attention.",
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Reminders",
    description:
      "Automated renewal reminders via WhatsApp. Never miss an expiration—your clients stay subscribed.",
    gradient: "from-green-500/10 to-lime-500/10",
    iconColor: "text-green-600",
  },
];

const trustItems = [
  { icon: Shield, label: "Secure by default" },
  { icon: BarChart3, label: "Real-time analytics" },
  { icon: Zap, label: "Lightning fast" },
];

/* ─── page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={32} className="text-primary transition-transform group-hover:scale-105" />
            <span className="text-lg font-semibold tracking-tight hidden sm:inline">
              Pearfect S.L.
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative px-4 sm:px-6">
        {/* subtle radial gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Now live at sub.peramato.dev
            </span>
          </motion.div>

          <motion.h1
            className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            Your subscription ledger,{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              perfected
            </span>
          </motion.h1>

          <motion.p
            className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            Manage platforms, plans, seats, and client renewals from a single dashboard.
            Track profitability automatically—know exactly where every euro goes.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Button size="lg" asChild className="w-full sm:w-auto shadow-lg shadow-primary/20">
              <Link href="/signup">
                Start for Free
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link href="/login">Sign In</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="text-center mb-12">
            <motion.h2
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              Everything you need to run subscriptions
            </motion.h2>
            <motion.p
              className="mt-3 text-muted-foreground max-w-xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
            >
              Built for professionals who manage multiple platforms and hundreds of clients.
            </motion.p>
          </AnimatedSection>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <AnimatedSection key={f.title}>
                <motion.div
                  className={`group relative rounded-2xl border border-border/60 bg-gradient-to-br ${f.gradient} p-6 sm:p-8 transition-all hover:border-border hover:shadow-lg hover:shadow-black/5`}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                >
                  <div
                    className={`inline-flex items-center justify-center size-10 rounded-xl bg-background shadow-sm border border-border/50 ${f.iconColor} mb-4`}
                  >
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="border-y border-border/50 bg-muted/30 px-4 sm:px-6 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <AnimatedSection className="text-center">
            <motion.p
              className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              Built for professionals
            </motion.p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {trustItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i + 1}
                >
                  <item.icon className="size-4 text-primary/70" />
                  <span>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            Ready to take control?
          </motion.h2>
          <motion.p
            className="mt-3 text-muted-foreground"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            Create your account in seconds and start managing subscriptions like a pro.
          </motion.p>
          <motion.div
            className="mt-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
          >
            <Button size="lg" asChild className="shadow-lg shadow-primary/20">
              <Link href="/signup">
                Get Started — It&apos;s Free
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 px-4 sm:px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo size={18} className="text-muted-foreground/50" />
            <span>Pearfect S.L.</span>
          </div>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
