import {
  Archive,
  BookOpen,
  Brain,
  Globe,
  Image,
  MessageSquare,
  Microscope,
  Newspaper,
  Search,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";

const FEATURES = [
  {
    icon: Search,
    title: "Universal Search",
    desc: "One search bar to rule them all. Articles, images, videos, audio, news — all sources, all in one place.",
    color: "oklch(0.60 0.18 220)",
  },
  {
    icon: Brain,
    title: "AI Research Assistant",
    desc: "Ask anything in plain language. Your AI study partner answers directly, solves math, and dives deep with you.",
    color: "oklch(0.65 0.18 145)",
  },
  {
    icon: Users,
    title: "Community Forums",
    desc: "Reddit-style forums with channels, posts, upvotes, replies, profiles, and direct messaging.",
    color: "oklch(0.65 0.18 280)",
  },
  {
    icon: Newspaper,
    title: "News Aggregator",
    desc: "Live headlines from BBC, NPR, Reuters, AP, The Guardian, HackerNews, and more — read everything in-app.",
    color: "oklch(0.65 0.18 30)",
  },
  {
    icon: BookOpen,
    title: "Literature & Comics",
    desc: "Millions of e-books from Project Gutenberg & Open Library, plus public domain comics from Archive.org.",
    color: "oklch(0.72 0.18 55)",
  },
  {
    icon: Wrench,
    title: "Datasets & Tools",
    desc: "Open datasets, citation generator, timeline builder, mind map, and a calculator — all built in.",
    color: "oklch(0.65 0.18 200)",
  },
];

const SOURCES = [
  "Wikipedia",
  "NASA",
  "Internet Archive",
  "PubMed",
  "arXiv",
  "Project Gutenberg",
  "Reddit",
  "Giphy",
  "Open Library",
  "BBC",
  "NPR",
  "The Guardian",
  "Dailymotion",
  "XKCD",
  "Europeana",
  "50+ more",
];

export function LandingPage({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.08 0.025 260)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: "oklch(0.08 0.025 260 / 0.95)",
          borderColor: "oklch(0.18 0.04 260)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="container mx-auto px-4 max-w-6xl h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{
                background: "oklch(0.60 0.18 220 / 0.2)",
                border: "1px solid oklch(0.60 0.18 220 / 0.4)",
              }}
            >
              <Microscope
                className="w-4 h-4"
                style={{ color: "oklch(0.72 0.18 220)" }}
              />
            </div>
            <span
              className="font-display font-bold text-base"
              style={{ color: "oklch(0.92 0.02 240)" }}
            >
              Research Hub
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-ocid="landing.secondary_button"
              onClick={onGetStarted}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ color: "oklch(0.72 0.08 240)" }}
            >
              Sign In
            </button>
            <button
              type="button"
              data-ocid="landing.primary_button"
              onClick={onGetStarted}
              className="text-sm font-semibold px-5 py-2 rounded-lg transition-all hover:opacity-90"
              style={{ background: "oklch(0.60 0.18 220)", color: "white" }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.25 0.08 220 / 0.25) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 80% 60%, oklch(0.25 0.08 280 / 0.12) 0%, transparent 60%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative max-w-4xl"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 border"
            style={{
              background: "oklch(0.60 0.18 220 / 0.1)",
              borderColor: "oklch(0.60 0.18 220 / 0.3)",
              color: "oklch(0.72 0.18 220)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            The ultimate research platform
          </div>

          <h1
            className="font-display font-bold text-5xl sm:text-6xl md:text-7xl leading-[1.05] mb-6"
            style={{ color: "oklch(0.96 0.01 240)" }}
          >
            Your Universal
            <br />
            <span style={{ color: "oklch(0.65 0.18 220)" }}>Research Hub</span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "oklch(0.65 0.06 240)" }}
          >
            Search across millions of articles, images, videos, audio, books,
            and news — all in one place. Powered by AI. Backed by 50+ sources.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              data-ocid="landing.hero.primary_button"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02] hover:shadow-glow"
              style={{
                background: "oklch(0.60 0.18 220)",
                color: "white",
                boxShadow: "0 0 30px oklch(0.52 0.18 220 / 0.3)",
              }}
            >
              Start Researching — It&apos;s Free
            </button>
            <button
              type="button"
              data-ocid="landing.hero.secondary_button"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base border transition-all hover:bg-white/5"
              style={{
                borderColor: "oklch(0.28 0.06 260)",
                color: "oklch(0.78 0.04 240)",
              }}
            >
              Sign In
            </button>
          </div>
        </motion.div>

        {/* Source scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative mt-16 w-full max-w-3xl overflow-hidden"
        >
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: "oklch(0.40 0.04 260)" }}
          >
            Powered by
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SOURCES.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-full text-xs border"
                style={{
                  borderColor: "oklch(0.22 0.04 260)",
                  color: "oklch(0.50 0.05 260)",
                  background: "oklch(0.12 0.02 260)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section
        className="py-24 px-4"
        style={{ borderTop: "1px solid oklch(0.14 0.03 260)" }}
      >
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2
              className="font-display font-bold text-3xl sm:text-4xl mb-4"
              style={{ color: "oklch(0.92 0.01 240)" }}
            >
              Everything you need to research smarter
            </h2>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ color: "oklch(0.55 0.05 240)" }}
            >
              One platform, infinite sources. No more switching between tabs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="archive-card p-6"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: `${f.color.replace(")", " / 0.12)")}`,
                    border: `1px solid ${f.color.replace(")", " / 0.25)")}`,
                  }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3
                  className="font-display font-semibold text-base mb-2"
                  style={{ color: "oklch(0.92 0.01 240)" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "oklch(0.55 0.05 240)" }}
                >
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section
        className="py-16 px-4"
        style={{
          background: "oklch(0.11 0.025 260)",
          borderTop: "1px solid oklch(0.16 0.03 260)",
          borderBottom: "1px solid oklch(0.16 0.03 260)",
        }}
      >
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "50M+", label: "Articles & Texts" },
              { value: "100M+", label: "Images" },
              { value: "50+", label: "Data Sources" },
              { value: "Free", label: "Always" },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  className="font-display font-bold text-3xl mb-1"
                  style={{ color: "oklch(0.72 0.18 220)" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.50 0.05 240)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="font-display font-bold text-3xl sm:text-4xl mb-5"
              style={{ color: "oklch(0.92 0.01 240)" }}
            >
              Ready to research smarter?
            </h2>
            <p
              className="text-base mb-8"
              style={{ color: "oklch(0.55 0.05 240)" }}
            >
              Join the community and start exploring millions of sources today.
            </p>
            <button
              type="button"
              data-ocid="landing.cta.primary_button"
              onClick={onGetStarted}
              className="px-10 py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02]"
              style={{
                background: "oklch(0.60 0.18 220)",
                color: "white",
                boxShadow: "0 0 30px oklch(0.52 0.18 220 / 0.25)",
              }}
            >
              Create Free Account
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-4 border-t"
        style={{ borderColor: "oklch(0.14 0.03 260)" }}
      >
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.40 0.05 260)" }}
            />
            <span className="text-xs" style={{ color: "oklch(0.40 0.05 260)" }}>
              Research Hub — Powered by 50+ open data sources
            </span>
          </div>
          <p className="text-xs" style={{ color: "oklch(0.38 0.04 260)" }}>
            &copy; {new Date().getFullYear()} by{" "}
            <span
              className="font-semibold"
              style={{ color: "oklch(0.55 0.08 220)" }}
            >
              MEGATRX design
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
