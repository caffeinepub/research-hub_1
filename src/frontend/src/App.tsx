import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  BookImage,
  BookOpen,
  BookType,
  Clapperboard,
  Compass,
  Film,
  Globe,
  Globe2,
  GraduationCap,
  Image,
  Loader2,
  MessageSquare,
  Microscope,
  Music,
  Search,
  Smile,
  Sparkles,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { AIChatPage } from "./components/AIChatPage";
import { ArticleDetailPage } from "./components/ArticleDetailPage";
import { ArticlesTab } from "./components/ArticlesTab";
import { AudioTab } from "./components/AudioTab";
import { BrowserPage } from "./components/BrowserPage";
import { ComicsTab } from "./components/ComicsTab";
import { CommunityChatsPage } from "./components/CommunityChatsPage";
import { DictionaryTab } from "./components/DictionaryTab";
import { DiscoverPage } from "./components/DiscoverPage";
import { FilmsTab } from "./components/FilmsTab";
import { HomeworkHelpPage } from "./components/HomeworkHelpPage";
import { ImagesTab } from "./components/ImagesTab";
import { MemesTab } from "./components/MemesTab";
import { ProfilePage } from "./components/ProfilePage";
import { VideosTab } from "./components/VideosTab";
import { useResearch } from "./hooks/useResearch";
import type { WikiArticle } from "./types/research";

const TOPIC_CHIPS = [
  { label: "Space & Cosmos", query: "space cosmos universe" },
  { label: "Human History", query: "ancient history civilization" },
  { label: "Life Sciences", query: "biology evolution ecology" },
  { label: "Technology", query: "technology computing innovation" },
  { label: "World Nature", query: "nature wildlife environment" },
  { label: "Art & Culture", query: "art culture renaissance" },
];

type NavKey =
  | "search"
  | "discover"
  | "browser"
  | "ai"
  | "chat"
  | "dictionary"
  | "study"
  | "profile"
  | "comics";

export default function App() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("articles");
  const [bottomNav, setBottomNav] = useState<NavKey>("search");
  const [view, setView] = useState<NavKey | "article">("search");
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(
    null,
  );
  const [prevView, setPrevView] = useState<"search" | "discover">("search");
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

  const handleSelectArticle = (article: WikiArticle) => {
    setPrevView(
      bottomNav === "browser"
        ? "search"
        : bottomNav === "search" || bottomNav === "discover"
          ? bottomNav
          : "search",
    );
    setSelectedArticle(article);
    setView("article");
  };

  const handleArticleBack = () => {
    setView(prevView);
    setSelectedArticle(null);
  };

  const handleSelectRelated = (title: string, source: string) => {
    const existing = results.articles.find((a) => a.title === title);
    if (existing) {
      setSelectedArticle(existing);
    } else {
      setSelectedArticle({
        pageid: Math.random(),
        title,
        snippet: "",
        source,
        expanded: false,
      } as any);
    }
    setView("article");
  };

  const handleBottomNav = (nav: NavKey) => {
    setBottomNav(nav);
    setView(nav);
  };

  const hasResults = status === "success";
  const isLoading = status === "loading";

  const articleCount = results.articles.length;
  const imageCount = results.images.length;
  const videoCount = results.videos.length;
  const filmCount = results.films.length;
  const audioCount = results.audio.length;

  void inputRef;

  // Article detail view
  if (view === "article" && selectedArticle) {
    return (
      <ArticleDetailPage
        article={selectedArticle}
        onBack={handleArticleBack}
        onSelectRelated={handleSelectRelated}
      />
    );
  }

  // Browser view
  if (view === "browser") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <BrowserPage />
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Discover page view
  if (view === "discover") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DiscoverPage
          results={results}
          lastQuery={lastQuery}
          isLoading={isLoading}
          onSearch={(q) => {
            search(q);
          }}
          onSelectArticle={handleSelectArticle}
        />
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // AI Chat view
  if (view === "ai") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: "oklch(0.72 0.18 150 / 0.15)",
              border: "1px solid oklch(0.72 0.18 150 / 0.3)",
            }}
          >
            <Sparkles
              className="w-5 h-5"
              style={{ color: "oklch(0.72 0.18 150)" }}
            />
          </div>
          <h1 className="font-display text-xl font-bold">AI Research Chat</h1>
        </header>
        <main className="flex-1 overflow-hidden">
          <AIChatPage
            onSearchMore={(q) => {
              setQuery(q);
              search(q);
              setBottomNav("search");
              setView("search");
            }}
          />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Chat view
  if (view === "chat") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: "oklch(0.65 0.18 200 / 0.15)",
              border: "1px solid oklch(0.65 0.18 200 / 0.3)",
            }}
          >
            <MessageSquare
              className="w-5 h-5"
              style={{ color: "oklch(0.78 0.18 200)" }}
            />
          </div>
          <h1 className="font-display text-xl font-bold">Community Chats</h1>
        </header>
        <main className="flex-1 container mx-auto px-4 py-4 max-w-6xl pb-24 overflow-hidden">
          <CommunityChatsPage />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Study / Homework view
  if (view === "study") {
    return (
      <div
        className="min-h-screen bg-background flex flex-col"
        style={{ height: "100dvh" }}
      >
        <header className="px-4 py-3 border-b border-border/60 flex items-center gap-3 shrink-0">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: "oklch(0.72 0.18 55 / 0.15)",
              border: "1px solid oklch(0.72 0.18 55 / 0.3)",
            }}
          >
            <GraduationCap
              className="w-5 h-5"
              style={{ color: "oklch(0.78 0.18 55)" }}
            />
          </div>
          <h1 className="font-display text-xl font-bold">
            Study &amp; Homework Help
          </h1>
        </header>
        <main className="flex-1 overflow-hidden flex flex-col pb-16">
          <HomeworkHelpPage />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Dictionary view
  if (view === "dictionary") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: "oklch(0.72 0.18 55 / 0.15)",
              border: "1px solid oklch(0.72 0.18 55 / 0.3)",
            }}
          >
            <BookType
              className="w-5 h-5"
              style={{ color: "oklch(0.78 0.18 55)" }}
            />
          </div>
          <h1 className="font-display text-xl font-bold">
            Dictionary &amp; Thesaurus
          </h1>
        </header>
        <main className="flex-1 container mx-auto px-4 max-w-3xl pb-24 overflow-auto">
          <DictionaryTab />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Profile view
  if (view === "profile") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: "oklch(0.72 0.18 280 / 0.15)",
              border: "1px solid oklch(0.72 0.18 280 / 0.3)",
            }}
          >
            <User
              className="w-5 h-5"
              style={{ color: "oklch(0.78 0.14 280)" }}
            />
          </div>
          <h1 className="font-display text-xl font-bold">Your Profile</h1>
        </header>
        <main className="flex-1 container mx-auto max-w-6xl pb-24 overflow-auto">
          <ProfilePage />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Comics view
  if (view === "comics") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: "oklch(0.65 0.18 55 / 0.15)",
              border: "1px solid oklch(0.65 0.18 55 / 0.3)",
            }}
          >
            <BookImage
              className="w-5 h-5"
              style={{ color: "oklch(0.78 0.18 55)" }}
            />
          </div>
          <h1 className="font-display text-xl font-bold">Comics &amp; Books</h1>
        </header>
        <main className="flex-1 container mx-auto px-4 py-4 max-w-6xl pb-24 overflow-auto">
          <ComicsTab />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Main search view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header / Hero */}
      <header
        className="relative hero-gradient hero-noise overflow-hidden"
        style={{
          minHeight: hasResults ? "200px" : "420px",
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

        <div className="relative z-10 container mx-auto px-4 pt-8 pb-8 flex flex-col items-center gap-4">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
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
                key="subtitle"
                initial={{ opacity: 0, height: "auto" }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="text-base text-center overflow-hidden"
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
                key="chips"
                initial={{ opacity: 0, height: "auto" }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  transition: { delay: 0.3 },
                }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap gap-2 justify-center overflow-hidden"
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
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl pb-24">
        {/* Initial / idle state */}
        {status === "idle" && (
          <motion.div
            data-ocid="search.empty_state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4"
          >
            {[
              {
                icon: BookOpen,
                title: "Wikipedia & Articles",
                desc: "Search Wikipedia, Project Gutenberg, PubMed, NSF, NIH, OpenAlex, and Internet Archive inline",
                color: "oklch(0.52 0.18 220)",
              },
              {
                icon: Image,
                title: "Public Domain Images",
                desc: "Browse NASA, Met Museum, Library of Congress, Europeana, Flickr Commons, Pixabay, and Wikimedia",
                color: "oklch(0.65 0.18 200)",
              },
              {
                icon: Film,
                title: "Open Media Videos",
                desc: "Watch NASA, Internet Archive, British Pathé, C-SPAN, Vimeo CC, and archived collections",
                color: "oklch(0.78 0.17 55)",
              },
              {
                icon: Smile,
                title: "GIFs, Memes & Stickers",
                desc: "Browse Giphy, Tenor, Imgflip and Archive.org for GIFs, memes and reaction stickers",
                color: "oklch(0.65 0.18 320)",
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
            <TabsList className="mb-6 h-auto p-1 gap-1 bg-muted/60 flex-wrap">
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

              <TabsTrigger
                data-ocid="tabs.audio_tab"
                value="audio"
                className="flex items-center gap-2 px-4 py-2"
              >
                <Music className="w-4 h-4" />
                Audio
                {hasResults && audioCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-xs px-1.5 py-0"
                  >
                    {audioCount}
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

              {(isLoading || filmCount > 0) && (
                <TabsTrigger
                  data-ocid="tabs.films_tab"
                  value="films"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <Clapperboard className="w-4 h-4" />
                  Films
                  {hasResults && filmCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs px-1.5 py-0"
                    >
                      {filmCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}

              <TabsTrigger
                data-ocid="tabs.memes_tab"
                value="memes"
                className="flex items-center gap-2 px-4 py-2"
              >
                <Smile className="w-4 h-4" />
                GIFs &amp; Memes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="articles">
              <ArticlesTab
                articles={results.articles}
                loading={isLoading}
                onExpand={expandArticle}
                onSelect={handleSelectArticle}
                hasSearched={status !== "idle"}
              />
            </TabsContent>

            <TabsContent value="images">
              <ImagesTab
                images={results.images}
                loading={isLoading}
                fuzzyUsed={fuzzyUsed}
                hasSearched={status !== "idle"}
              />
            </TabsContent>

            <TabsContent value="audio">
              <AudioTab
                audio={results.audio}
                loading={isLoading}
                hasSearched={status !== "idle"}
              />
            </TabsContent>

            <TabsContent value="videos">
              <VideosTab
                videos={results.videos}
                loading={isLoading}
                fuzzyUsed={fuzzyUsed}
                hasSearched={status !== "idle"}
              />
            </TabsContent>

            <TabsContent value="films">
              <FilmsTab
                films={results.films}
                loading={isLoading}
                fuzzyUsed={fuzzyUsed}
                hasSearched={status !== "idle"}
              />
            </TabsContent>

            <TabsContent value="memes">
              <MemesTab />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Memes tab always visible when idle too - now handled inside tab */}
        {false && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Smile
                className="w-5 h-5"
                style={{ color: "oklch(0.65 0.18 320)" }}
              />
              <h2 className="font-display text-lg font-bold">
                GIFs &amp; Memes
              </h2>
              <span className="text-xs text-muted-foreground ml-1">
                Giphy · Tenor · Imgflip · Archive
              </span>
            </div>
            <MemesTab />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 mb-16">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>
              Research Hub — Wikipedia, NASA, PBS, TED Talks, MIT
              OpenCourseWare, NFB, Internet Archive, Rijksmuseum &amp; 50+
              sources
            </span>
          </div>
          <p>
            &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
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

      <BottomNav current={bottomNav} onChange={handleBottomNav} />
    </div>
  );
}

// Shared bottom nav component
function BottomNav({
  current,
  onChange,
}: {
  current: NavKey;
  onChange: (nav: NavKey) => void;
}) {
  const items: { key: NavKey; icon: React.ElementType; label: string }[] = [
    { key: "search", icon: Search, label: "Search" },
    { key: "discover", icon: Compass, label: "Discover" },
    { key: "browser", icon: Globe2, label: "Browser" },
    { key: "ai", icon: Sparkles, label: "AI Chat" },
    { key: "chat", icon: MessageSquare, label: "Community" },
    { key: "dictionary", icon: BookType, label: "Dictionary" },
    { key: "study", icon: GraduationCap, label: "Study" },
    { key: "profile", icon: User, label: "Profile" },
    { key: "comics", icon: BookImage, label: "Comics" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60"
      style={{
        background: "oklch(0.12 0.03 260 / 0.92)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div
          className="flex items-stretch h-16 overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {items.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              data-ocid={`nav.${key}_tab`}
              className="flex-shrink-0 min-w-[62px] flex flex-col items-center justify-center gap-1 transition-colors relative"
              style={{
                color:
                  current === key
                    ? "oklch(0.78 0.18 200)"
                    : "oklch(0.55 0.05 240)",
              }}
              onClick={() => onChange(key)}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
              {current === key && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 h-0.5 w-12 rounded-full"
                  style={{ background: "oklch(0.78 0.18 200)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
