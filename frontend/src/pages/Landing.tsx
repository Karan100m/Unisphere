import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Compass, Video, FolderKanban, CalendarDays, Building2, ShieldCheck,
  ArrowRight, Sparkles, MessageSquare, Star, Code2, Globe, Users,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  {
    icon: Compass,
    title: "Discover students anywhere",
    body: "Filter by college, major, year, skills and interests. Find the exact people building what you care about.",
    testId: "landing-feature-discover",
  },
  {
    icon: FolderKanban,
    title: "Find project partners",
    body: "Post your project, list the roles you need, and review applications from students across campuses.",
    testId: "landing-feature-projects",
  },
  {
    icon: Video,
    title: "Spontaneous video networking",
    body: "\"Meet Someone\" pairs you with a student who matches your intent — friends, teammates or career chats.",
    testId: "landing-feature-video",
  },
  {
    icon: Building2,
    title: "Campus communities",
    body: "Follow Stanford, MIT, Oxford, LPU, Berkeley and more. See their events, projects and student rosters.",
    testId: "landing-feature-communities",
  },
  {
    icon: CalendarDays,
    title: "Meeting scheduling",
    body: "Publish your weekly availability and let peers book a 30-minute slot without a single back-and-forth.",
    testId: "landing-feature-meetings",
  },
  {
    icon: ShieldCheck,
    title: "Safety, built in",
    body: "Report, block, granular privacy controls and a live moderation queue reviewed by the safety team.",
    testId: "landing-feature-safety",
  },
];

const STATS = [
  { value: "120K+", label: "Students" },
  { value: "480+", label: "Campuses" },
  { value: "9.2K", label: "Projects shipped" },
  { value: "1.4M", label: "Connections made" },
];

const TESTIMONIALS = [
  {
    name: "Maya Lin",
    meta: "Stanford • Symbolic Systems",
    quote: "I found my entire TreeHacks team here in one evening. Cross-campus discovery is the whole unlock.",
    avatar: "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
  },
  {
    name: "Aarav Sharma",
    meta: "MIT • EECS",
    quote: "Meet Someone got me a 20-minute chat with a Berkeley bioinformatics student. We open-sourced together.",
    avatar: "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
  },
  {
    name: "Karan Kumar",
    meta: "LPU • B.Tech CSE",
    quote: "Posted my gesture-recognition project, got 4 applications from 3 countries in two days. Unreal.",
    avatar: "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B0713]">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B0713]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" data-testid="landing-brand-link" className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-amber-400 font-heading text-sm font-black text-white">
              U
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">
              Uni<span className="text-amber-400">sphere</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard" className={buttonVariants({ size: "sm" })} data-testid="landing-dashboard-link">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                  data-testid="landing-login-link"
                >
                  Log in
                </Link>
                <Link to="/signup" className={buttonVariants({ size: "sm" })} data-testid="landing-signup-link">
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:pt-24">
        <div
          aria-hidden
          className="aurora-blob pointer-events-none absolute -left-40 -top-40 size-[560px] rounded-full bg-violet-600/25 blur-[130px]"
        />
        <div
          aria-hidden
          className="aurora-blob pointer-events-none absolute -right-32 top-32 size-[420px] rounded-full bg-amber-500/16 blur-[120px]"
          style={{ animationDelay: "-6s" }}
        />
        <div
          aria-hidden
          className="aurora-blob pointer-events-none absolute left-1/3 top-[28rem] size-[360px] rounded-full bg-pink-500/12 blur-[120px]"
          style={{ animationDelay: "-11s" }}
        />

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <Badge className="mb-6 border-violet-500/30 bg-violet-500/10 text-violet-300" data-testid="landing-hero-badge">
              <Sparkles className="mr-1.5 size-3" />
              A social-first home for student creators
            </Badge>

            <h1
              data-testid="landing-hero-heading"
              className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[4.2rem]"
            >
              Your Campus Is{" "}
              <span className="sunset-text">Bigger</span>{" "}
              Than Your Campus.
            </h1>

            <p data-testid="landing-hero-subtext" className="mt-6 max-w-2xl text-base leading-relaxed text-violet-100/60 sm:text-lg">
              Meet students, build projects, share ideas and grow your network beyond your university.
              Post your work, find your people, jump on a spontaneous video call — all in one place.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/signup" data-testid="landing-hero-cta">
                <Button size="lg" className="group h-12 px-7 text-sm font-semibold electric-glow">
                  Join the Community
                  <ArrowRight className="ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link
                to="/login"
                className={buttonVariants({ variant: "outline", size: "lg" })}
                data-testid="landing-hero-secondary-cta"
              >
                I already have an account
              </Link>
            </div>

            <p className="mt-5 font-mono text-xs text-slate-500" data-testid="landing-demo-hint">
              Demo login → karan@unisphere.edu / Student@123456
            </p>
          </motion.div>

          {/* stat ticker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] sm:grid-cols-4"
          >
            {STATS.map((s) => (
              <div key={s.label} className="px-5 py-6" data-testid={`landing-stat-${s.label.split(" ")[0].toLowerCase()}`}>
                <p className="font-heading text-2xl font-bold text-violet-300 sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* WHAT IT DOES / FEATURES */}
      <section className="border-t border-white/[0.06] px-5 py-20" id="features">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">What the platform does</p>
          <h2 data-testid="landing-features-heading" className="mt-3 max-w-2xl font-heading text-2xl font-bold tracking-tight sm:text-4xl">
            Six surfaces that turn a directory into a real network.
          </h2>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                data-testid={f.testId}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors duration-300 hover:border-violet-500/30 hover:bg-violet-500/[0.04]"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-violet-500/10 text-violet-400 transition-transform duration-300 group-hover:scale-105">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT SHOWCASE */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Video networking</p>
            <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-4xl">
              Real conversations, not cold DMs.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
              Pick your intent — new friends, project partners, hackathon teammates, career chat — and we pair you
              with a student who wants the same thing. Camera and mic controls, screen sharing, in-call chat,
              and a one-tap skip if the vibe isn't right.
            </p>
            <ul className="mt-6 space-y-2.5">
              {["Live WebRTC peer-to-peer media", "Intent-based matching, not pure randomness", "Report & block from inside the call"].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <ShieldCheck className="size-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]">
            <img
              src="https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt="Students collaborating around a laptop"
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0713] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 backdrop-blur-md">
              <p className="font-mono text-[11px] text-emerald-400">● connected · 00:04:12</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-xl font-heading text-2xl font-bold tracking-tight sm:text-4xl">
            Students are already building here.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                data-testid={`landing-testimonial-${t.name.split(" ")[0].toLowerCase()}`}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
              >
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} loading="lazy" className="size-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.meta}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-600/15 via-[#16101F] to-amber-500/10 px-7 py-14 text-center">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full bg-violet-500/25 blur-[100px]" />
          <div className="relative">
            <MessageSquare className="mx-auto size-8 text-violet-400" />
            <h2 data-testid="landing-final-cta-heading" className="mt-5 font-heading text-2xl font-bold tracking-tight sm:text-4xl">
              Your next teammate is one campus away.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-slate-400 sm:text-base">
              Free for every undergraduate. Build your profile in under two minutes.
            </p>
            <Link to="/signup" data-testid="landing-final-cta-btn">
              <Button size="lg" className="mt-8 h-12 px-8 text-sm font-semibold electric-glow">
                Join the Community
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] px-5 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-amber-400 font-heading text-xs font-black text-white">
              U
            </div>
            <span className="font-heading text-sm font-bold">Unisphere</span>
          </div>
          <p className="text-xs text-slate-500">© 2026 Unisphere. Built for students, by students.</p>
          <div className="flex gap-3 text-slate-500">
            <Code2 className="size-4" />
            <Users className="size-4" />
            <Globe className="size-4" />
          </div>
        </div>
      </footer>
    </div>
  );
}
