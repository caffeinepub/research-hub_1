import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  BookOpen,
  Film,
  Globe,
  Image,
  Loader2,
  Microscope,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { ArticlesTab } from "./components/ArticlesTab";
import { ImagesTab } from "./components/ImagesTab";
import { VideosTab } from "./components/VideosTab";
import { useResearch } from "./hooks/useResearch";

const TOPIC_CHIPS = [
  { label: "Space & Cosmos", query: "space cosmos universe" },
  { label: "Human History", query: "ancient history civilization" },
  { label: "Life Sciences", query: "biology evolution ecology" },
  { label: "Technology", query: "technology computing innovation" },
  { label: "World Nature", query: "nature wildlife environment" },
  { label: "Art & Culture", query: "art culture renaissance" },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("articles");
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    status,
    results,
    error,
    lastQuery,
    fuzzyUsed,
    search,
    expandArticle,
  } = useResearch();

  const handleSearch = (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    search(searchQuery);
    setActiveTab("articles");
  };

  const handleChip = (topicQuery: string, label: string) => {
    setQuery(label);
    handleSearch(topicQuery);
  };

  const hasResults = status === "success";
  const isLoading = status === "loading";

  const articleCount = results.articles.length;
  const imageCount = results.images.length;
  const videoCount = results.videos.length;

  // inputRef used for potential future focus management
  void inputRef;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header / Hero */}
      <header
        className="relative hero-gradient hero-noise overflow-hidden"
        style={{
          minHeight: hasResults ? "220px" : "420px",
          transition: "min-height 0.5s ease",
        }}
      >
        {/* Background image overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url('/assets/generated/research-hero-bg.dim_1600x600.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />

        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.8 0.1 220) 1px, transparent 1px), linear-gradient(90deg, oklch(0.8 0.1 220) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 container mx-auto px-4 py-10 flex flex-col items-center">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-3"
          >
            <div
              className="p-2 rounded-xl"
              style={{
                background: "oklch(0.65 0.18 200 / 0.2)",
                border: "1px solid oklch(0.65 0.18 200 / 0.4)",
              }}
            >
              <Microscope
                className="w-6 h-6"
                style={{ color: "oklch(0.78 0.18 200)" }}
              />
            </div>
            <h1
              className="font-display text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: "oklch(0.97 0.01 240)" }}
            >
              Research Hub
            </h1>
          </motion.div>

          <AnimatePresence>
            {!hasResults && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="text-base mb-6 text-center"
                style={{ color: "oklch(0.72 0.08 230)" }}
              >
                Explore Wikipedia, NASA, Internet Archive & more — all in one
                place
              </motion.p>
            )}
          </AnimatePresence>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "oklch(0.6 0.1 230)" }}
                />
                <Input
                  ref={inputRef}
                  data-ocid="search.search_input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any topic — science, history, art..."
                  className="pl-10 h-12 text-base border-0 rounded-xl"
                  style={{
                    background: "oklch(0.26 0.06 260 / 0.8)",
                    color: "oklch(0.95 0.02 240)",
                    backdropFilter: "blur(8px)",
                  }}
                />
              </div>
              <Button
                data-ocid="search.submit_button"
                type="submit"
                size="lg"
                disabled={isLoading || !query.trim()}
                className="h-12 px-6 rounded-xl font-semibold"
                style={{
                  background: isLoading ? undefined : "oklch(0.52 0.18 220)",
                  color: "white",
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
            </form>
          </motion.div>

          {/* Topic chips */}
          <AnimatePresence>
            {!hasResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.3 } }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex flex-wrap gap-2 justify-center mt-6"
              >
                {TOPIC_CHIPS.map((chip, i) => (
                  <button
                    key={chip.label}
                    type="button"
                    data-ocid={`topic.chip.${i + 1}`}
                    onClick={() => handleChip(chip.query, chip.label)}
                    className="chip-btn"
                  >
                    {chip.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Initial / idle state */}
        {status === "idle" && (
          <motion.div
            data-ocid="search.empty_state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4"
          >
            {[
              {
                icon: BookOpen,
                title: "Wikipedia & More Articles",
                desc: "Search Wikipedia, Project Gutenberg, PubMed, and Internet Archive — all inline",
                color: "oklch(0.52 0.18 220)",
              },
              {
                icon: Image,
                title: "Public Domain Images",
                desc: "Browse NASA, Met Museum, Library of Congress, Europeana, Flickr Commons, and Wikimedia",
                color: "oklch(0.65 0.18 200)",
              },
              {
                icon: Film,
                title: "Open Media Videos",
                desc: "Watch NASA, Internet Archive, British Pathé, C-SPAN, Prelinger, DPLA, and more",
                color: "oklch(0.78 0.17 55)",
              },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-card border border-border/60 rounded-2xl p-6 text-center"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: color.replace(")", " / 0.12)"),
                    border: `1px solid ${color.replace(")", " / 0.25)")}`,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="font-display font-semibold text-base mb-2">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div
            data-ocid="search.error_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <p className="font-display font-semibold text-lg">{error}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => search(lastQuery)}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Results */}
        {(isLoading || hasResults) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {hasResults && (
              <p className="text-sm text-muted-foreground mb-4">
                Results for{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{lastQuery}&rdquo;
                </span>
              </p>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 h-auto p-1 gap-1 bg-muted/60">
                <TabsTrigger
                  data-ocid="tabs.articles_tab"
                  value="articles"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Articles
                  {hasResults && articleCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs px-1.5 py-0"
                    >
                      {articleCount}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  data-ocid="tabs.images_tab"
                  value="images"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <Image className="w-4 h-4" />
                  Images
                  {hasResults && imageCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs px-1.5 py-0"
                    >
                      {imageCount}
                    </Badge>
                  )}
                </TabsTrigger>

                {(isLoading || videoCount > 0) && (
                  <TabsTrigger
                    data-ocid="tabs.videos_tab"
                    value="videos"
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <Film className="w-4 h-4" />
                    Videos
                    {hasResults && videoCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 text-xs px-1.5 py-0"
                      >
                        {videoCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="articles">
                <ArticlesTab
                  articles={results.articles}
                  loading={isLoading}
                  onExpand={expandArticle}
                />
              </TabsContent>

              <TabsContent value="images">
                <ImagesTab
                  images={results.images}
                  loading={isLoading}
                  fuzzyUsed={fuzzyUsed}
                />
              </TabsContent>

              <TabsContent value="videos">
                <VideosTab
                  videos={results.videos}
                  loading={isLoading}
                  fuzzyUsed={fuzzyUsed}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 mt-10">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>
              Research Hub — Wikipedia, NASA, Internet Archive, British Pathé
              &amp; more
            </span>
          </div>
          <p>
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
