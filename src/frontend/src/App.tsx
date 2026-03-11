import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  BookImage,
  BookOpen,
  BookType,
  Clapperboard,
  Compass,
  Film,
  FlaskConical,
  Globe,
  Globe2,
  Image,
  Loader2,
  Mail,
  MessageSquare,
  Microscope,
  MoreHorizontal,
  Music,
  Newspaper,
  Search,
  Settings,
  ShieldAlert,
  Smile,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AIChatPage } from "./components/AIChatPage";
import { AdminPage } from "./components/AdminPage";
import { ArticleDetailPage } from "./components/ArticleDetailPage";
import { ArticlesTab } from "./components/ArticlesTab";
import { AudioTab } from "./components/AudioTab";
import { BrowserPage } from "./components/BrowserPage";
import { ComicsTab } from "./components/ComicsTab";
import { CommunityChatsPage } from "./components/CommunityChatsPage";
import { DatasetsTab } from "./components/DatasetsTab";
import { DictionaryTab } from "./components/DictionaryTab";
import { DiscoverPage } from "./components/DiscoverPage";
import { FilmsTab } from "./components/FilmsTab";
import { ImagesTab } from "./components/ImagesTab";
import { InteractiveToolsTab } from "./components/InteractiveToolsTab";
import { MemesTab } from "./components/MemesTab";
import { MessagesPage } from "./components/MessagesPage";
import { NewsTab } from "./components/NewsTab";
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { UniversalSearchResults } from "./components/UniversalSearchResults";
import { VideosTab } from "./components/VideosTab";
import { useResearch } from "./hooks/useResearch";
import type { WikiArticle } from "./types/research";
import { claimDailyLogin } from "./utils/aiCredits";

const TOPIC_CHIPS = [
  { label: "Space", query: "space cosmos universe" },
  { label: "History", query: "ancient history civilization" },
  { label: "Science", query: "biology evolution ecology" },
  { label: "Technology", query: "technology computing innovation" },
  { label: "Nature", query: "nature wildlife environment" },
  { label: "Art", query: "art culture renaissance" },
  { label: "Comics", query: "comics superhero batman superman" },
];

const COLLECTION_TILES = [
  {
    id: "articles",
    icon: BookOpen,
    title: "Books & Articles",
    desc: "Wikipedia, Project Gutenberg, PubMed, arXiv, Internet Archive texts & more",
    colorVar: "--books-accent",
    count: "50M+ texts",
  },
  {
    id: "images",
    icon: Image,
    title: "Images & Art",
    desc: "NASA, Met Museum, Wikimedia Commons, Rijksmuseum, Reddit, Pixabay & more",
    colorVar: "--images-accent",
    count: "100M+ images",
  },
  {
    id: "videos",
    icon: Film,
    title: "Videos",
    desc: "Internet Archive, NASA, PBS, TED, Prelinger Archives, British Pathé & more",
    colorVar: "--video-accent",
    count: "10M+ videos",
  },
  {
    id: "films",
    icon: Clapperboard,
    title: "Films",
    desc: "Public domain classics, documentary films, newsreels and archival footage",
    colorVar: "--video-accent",
    count: "500K+ films",
  },
  {
    id: "audio",
    icon: Music,
    title: "Audio & Music",
    desc: "LibriVox audiobooks, Archive.org music, live concerts, radio broadcasts & more",
    colorVar: "--audio-accent",
    count: "14M+ recordings",
  },
  {
    id: "memes",
    icon: Smile,
    title: "GIFs & Memes",
    desc: "Giphy, Tenor, Imgflip, Reddit meme communities and Archive.org collections",
    colorVar: "--memes-accent",
    count: "Millions of GIFs",
  },
  {
    id: "comics",
    icon: BookImage,
    title: "Comics",
    desc: "Public domain comics from Archive.org, Digital Comic Museum & more",
    colorVar: "--comics-accent",
    count: "50K+ comics",
  },
];

type NavKey =
  | "search"
  | "discover"
  | "browser"
  | "ai"
  | "chat"
  | "dictionary"
  | "profile"
  | "comics"
  | "admin"
  | "settings"
  | "messages"
  | "news"
  | "datasets"
  | "tools";

export default function App() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("articles");
  const [bottomNav, setBottomNav] = useState<NavKey>("search");
  const [view, setView] = useState<NavKey | "article">("search");
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(
    null,
  );
  const [prevView, setPrevView] = useState<"search" | "discover">("search");
  const [showUniversal, setShowUniversal] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Claim daily login reward silently on app start
  useEffect(() => {
    claimDailyLogin();
  }, []);
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
    setShowUniversal(true);
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
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <main className="flex-1 overflow-hidden">
          <BrowserPage />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Discover page view
  if (view === "discover") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <main className="flex-1 pb-16">
          <DiscoverPage
            results={results}
            lastQuery={lastQuery}
            isLoading={isLoading}
            onSearch={(q) => {
              search(q);
            }}
            onSelectArticle={handleSelectArticle}
          />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // AI Chat view
  if (view === "ai") {
    return (
      <div
        className="min-h-screen bg-background flex flex-col"
        style={{ height: "100dvh" }}
      >
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <div
          className="shrink-0 px-4 py-2 flex items-center gap-2"
          style={{ borderBottom: "1px solid oklch(0.20 0.04 260)" }}
        >
          <Sparkles
            className="w-4 h-4"
            style={{ color: "oklch(0.72 0.18 150)" }}
          />
          <span className="font-display font-semibold text-sm">
            AI Research Chat
          </span>
        </div>
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
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <main
          className="flex-1 flex flex-col overflow-hidden"
          style={{ paddingBottom: "56px" }}
        >
          <div className="flex-1 overflow-hidden px-4 py-4">
            <CommunityChatsPage />
          </div>
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Dictionary view
  if (view === "dictionary") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
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
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
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
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <main className="flex-1 container mx-auto px-4 py-4 max-w-6xl pb-24 overflow-auto">
          <ComicsTab />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Admin view
  if (view === "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <main className="flex-1 container mx-auto px-4 py-4 max-w-6xl pb-24 overflow-auto">
          <AdminPage />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Settings view
  if (view === "settings") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <main className="flex-1 container mx-auto px-4 py-4 max-w-4xl pb-24 overflow-auto">
          <SettingsPage />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Messages view
  if (view === "messages") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <main className="flex-1 container mx-auto px-4 py-4 max-w-5xl pb-24 overflow-auto">
          <MessagesPage />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // News view
  if (view === "news") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <main className="flex-1 container mx-auto px-4 py-4 max-w-6xl pb-24 overflow-auto">
          <NewsTab />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Datasets view
  if (view === "datasets") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <main className="flex-1 container mx-auto px-4 py-4 max-w-6xl pb-24 overflow-auto">
          <DatasetsTab />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Interactive Tools view
  if (view === "tools") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ArchiveHeader
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          activeNav={bottomNav}
          onNav={handleBottomNav}
        />
        <main className="flex-1 container mx-auto px-4 py-4 max-w-6xl pb-24 overflow-auto">
          <InteractiveToolsTab />
        </main>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Google-style homepage when idle on search tab
  if (status === "idle" && view === "search") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
          {/* Logo / Title */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "oklch(0.52 0.18 220 / 0.15)",
                  border: "1px solid oklch(0.52 0.18 220 / 0.35)",
                }}
              >
                <Globe
                  className="w-6 h-6"
                  style={{ color: "oklch(0.72 0.18 220)" }}
                />
              </div>
              <h1
                className="font-display text-4xl font-bold tracking-tight"
                style={{ color: "white" }}
              >
                Research Hub
              </h1>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.55 0.06 240)" }}>
              Search everything. Read everything. Discover everything.
            </p>
          </div>

          {/* Big search bar */}
          <form
            className="w-full max-w-2xl mb-8"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) handleSearch();
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-3xl shadow-2xl transition-all focus-within:shadow-primary/20"
              style={{
                background: "oklch(0.16 0.04 260)",
                border: "2px solid oklch(0.28 0.06 260)",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "oklch(0.52 0.18 220 / 0.7)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "oklch(0.28 0.06 260)";
              }}
            >
              <Search
                className="w-5 h-5 flex-shrink-0"
                style={{ color: "oklch(0.55 0.08 240)" }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, images, videos, comics, audio..."
                className="flex-1 bg-transparent outline-none text-white placeholder:text-muted-foreground text-base"
                style={{ color: "white" }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="flex-shrink-0 p-1 rounded-full transition-colors"
                  style={{ color: "oklch(0.55 0.06 240)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="flex-shrink-0 px-5 py-2 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Topic chips */}
          <div className="flex flex-wrap gap-2 justify-center max-w-xl mb-10">
            {TOPIC_CHIPS.map((chip, i) => (
              <button
                key={chip.label}
                type="button"
                data-ocid={`topic.chip.${i + 1}`}
                onClick={() => handleChip(chip.query, chip.label)}
                className="chip-btn"
                style={{ fontSize: "0.875rem", padding: "0.45rem 1.1rem" }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Quick nav cards */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full max-w-xl">
            {[
              {
                label: "AI Chat",
                nav: "ai" as NavKey,
                color: "oklch(0.72 0.18 150)",
              },
              {
                label: "Browser",
                nav: "browser" as NavKey,
                color: "oklch(0.72 0.14 220)",
              },
              {
                label: "Comics",
                nav: "comics" as NavKey,
                color: "oklch(0.72 0.18 30)",
              },
              {
                label: "Community",
                nav: "chat" as NavKey,
                color: "oklch(0.72 0.14 280)",
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleBottomNav(item.nav)}
                className="rounded-2xl p-3 text-center text-sm font-medium transition-all hover:scale-[1.03]"
                style={{
                  background: "oklch(0.16 0.04 260)",
                  border: `1px solid ${item.color.replace(")", " / 0.3)")}`,
                  color: item.color,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <BottomNav current={bottomNav} onChange={handleBottomNav} />
      </div>
    );
  }

  // Main search view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ArchiveHeader
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
        activeNav={bottomNav}
        onNav={handleBottomNav}
      />

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl pb-24">
        {/* Idle / home state — Archive.org-style collection tiles */}
        {status === "idle" && (
          <motion.div
            data-ocid="search.empty_state"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Homepage Hero — tagline + topic chips */}
            <div className="text-center mb-10 mt-4">
              <p
                className="text-sm font-medium tracking-wide mb-6"
                style={{ color: "oklch(0.55 0.06 240)" }}
              >
                Search everything. Read everything. Discover everything.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {TOPIC_CHIPS.map((chip, i) => (
                  <button
                    key={chip.label}
                    type="button"
                    data-ocid={`topic.chip.${i + 1}`}
                    onClick={() => handleChip(chip.query, chip.label)}
                    className="chip-btn"
                    style={{ fontSize: "0.875rem", padding: "0.5rem 1.25rem" }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Collection tiles */}
            <h2
              className="text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: "oklch(0.50 0.06 240)" }}
            >
              Collections
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {COLLECTION_TILES.map((tile, i) => {
                const Icon = tile.icon;
                const color = `oklch(var(${tile.colorVar}))`;
                return (
                  <motion.button
                    key={tile.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="archive-card text-left p-4 flex flex-col gap-3 cursor-pointer"
                    onClick={() => {
                      if (tile.id === "study") {
                        handleBottomNav("ai");
                      } else if (tile.id === "comics") {
                        handleBottomNav("comics");
                      } else {
                        // Focus on search
                        inputRef.current?.focus();
                      }
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${color.replace(")", " / 0.15)")}`.replace(
                          "oklch(",
                          "oklch(",
                        ),
                        // Use inline style with opacity
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm leading-tight mb-1">
                        {tile.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                        {tile.desc}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-mono mt-auto"
                      style={{ color: `${color}` }}
                    >
                      {tile.count}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* About section */}
            <div
              className="mt-8 p-4 rounded-lg"
              style={{
                background: "oklch(0.13 0.025 260)",
                border: "1px solid oklch(0.20 0.04 260)",
              }}
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">
                  Research Hub
                </span>{" "}
                is your universal research platform — search Wikipedia, NASA,
                Internet Archive, PubMed, arXiv, Library of Congress, Europeana,
                Reddit, Pixabay, and 50+ other public domain sources
                simultaneously. All content is displayed inline with no
                redirects.
              </p>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div
            data-ocid="search.error_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <p
              className="font-display font-semibold text-lg mb-1"
              style={{ color: "oklch(0.65 0.18 25)" }}
            >
              Search failed
            </p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => search(lastQuery)}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {(hasResults || isLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* View switcher */}
              {hasResults && (
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-ocid="search.universal_tab"
                      onClick={() => setShowUniversal(true)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: showUniversal
                          ? "oklch(0.52 0.18 220)"
                          : "oklch(0.15 0.03 260)",
                        color: showUniversal ? "white" : "oklch(0.58 0.05 240)",
                        border: showUniversal
                          ? "none"
                          : "1px solid oklch(0.22 0.04 260)",
                      }}
                    >
                      All Results
                    </button>
                    <button
                      type="button"
                      data-ocid="search.tab_view_tab"
                      onClick={() => setShowUniversal(false)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: !showUniversal
                          ? "oklch(0.52 0.18 220)"
                          : "oklch(0.15 0.03 260)",
                        color: !showUniversal
                          ? "white"
                          : "oklch(0.58 0.05 240)",
                        border: !showUniversal
                          ? "none"
                          : "1px solid oklch(0.22 0.04 260)",
                      }}
                    >
                      By Tab
                    </button>
                  </div>
                  {fuzzyUsed && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: "oklch(0.35 0.08 55)",
                        color: "oklch(0.72 0.14 55)",
                      }}
                    >
                      Similar match
                    </Badge>
                  )}
                </div>
              )}

              {/* Universal Search Results */}
              {showUniversal ? (
                <UniversalSearchResults
                  results={results}
                  isLoading={isLoading}
                  lastQuery={lastQuery}
                  onSelectArticle={handleSelectArticle}
                  onGoToTab={(tab) => {
                    setShowUniversal(false);
                    setActiveTab(tab);
                  }}
                />
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList
                    className="mb-5 h-auto p-1 gap-0.5 flex-wrap"
                    style={{ background: "oklch(0.13 0.025 260)" }}
                  >
                    {[
                      {
                        value: "articles",
                        icon: BookOpen,
                        label: "Articles",
                        count: results.articles.length,
                        ocid: "tabs.articles_tab",
                      },
                      {
                        value: "images",
                        icon: Image,
                        label: "Images",
                        count: results.images.length,
                        ocid: "tabs.images_tab",
                      },
                      {
                        value: "audio",
                        icon: Music,
                        label: "Audio",
                        count: results.audio.length,
                        ocid: "tabs.audio_tab",
                      },
                      {
                        value: "videos",
                        icon: Film,
                        label: "Videos",
                        count: results.videos.length,
                        ocid: "tabs.videos_tab",
                      },
                      {
                        value: "films",
                        icon: Clapperboard,
                        label: "Films",
                        count: results.films.length,
                        ocid: "tabs.films_tab",
                      },
                      {
                        value: "memes",
                        icon: Smile,
                        label: "GIFs & Memes",
                        count: 0,
                        ocid: "tabs.memes_tab",
                      },
                    ].map(
                      ({ value, icon: Icon, label, count, ocid }) =>
                        (value === "memes" || isLoading || count > 0) && (
                          <TabsTrigger
                            key={value}
                            data-ocid={ocid}
                            value={value}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm"
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                            {hasResults && count > 0 && (
                              <Badge
                                variant="secondary"
                                className="ml-0.5 text-xs px-1.5 py-0 h-4"
                              >
                                {count}
                              </Badge>
                            )}
                          </TabsTrigger>
                        ),
                    )}
                  </TabsList>

                  <TabsContent value="articles">
                    <ArticlesTab
                      articles={results.articles}
                      loading={isLoading}
                      onExpand={expandArticle}
                      onSelect={handleSelectArticle}
                      hasSearched={hasResults || isLoading}
                    />
                  </TabsContent>
                  <TabsContent value="images">
                    <ImagesTab
                      images={results.images}
                      loading={isLoading}
                      fuzzyUsed={fuzzyUsed}
                      hasSearched={hasResults || isLoading}
                    />
                  </TabsContent>
                  <TabsContent value="audio">
                    <AudioTab
                      audio={results.audio}
                      loading={isLoading}
                      hasSearched={hasResults || isLoading}
                    />
                  </TabsContent>
                  <TabsContent value="videos">
                    <VideosTab
                      videos={results.videos}
                      loading={isLoading}
                      fuzzyUsed={fuzzyUsed}
                      hasSearched={hasResults || isLoading}
                    />
                  </TabsContent>
                  <TabsContent value="films">
                    <FilmsTab
                      films={results.films}
                      loading={isLoading}
                      fuzzyUsed={fuzzyUsed}
                      hasSearched={hasResults || isLoading}
                    />
                  </TabsContent>
                  <TabsContent value="memes">
                    <MemesTab />
                  </TabsContent>
                </Tabs>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-5 mb-16 mt-auto"
        style={{ borderColor: "oklch(0.20 0.04 260)" }}
      >
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            <span>
              Research Hub — Wikipedia · NASA · Internet Archive · PubMed ·
              arXiv · Library of Congress · Reddit · and 50+ more
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

// User header button showing name + admin badge
function UserHeaderButton({
  activeNav,
  onNav,
}: { activeNav: NavKey; onNav: (nav: NavKey) => void }) {
  let currentUser: { username: string; isAdmin: boolean } | null = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("researchHubUser") || "null");
  } catch {
    currentUser = null;
  }

  return (
    <button
      type="button"
      data-ocid="nav.profile_tab"
      className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors"
      style={{
        color:
          activeNav === "profile"
            ? "oklch(0.72 0.18 220)"
            : "oklch(0.55 0.05 240)",
        background:
          activeNav === "profile"
            ? "oklch(0.60 0.18 220 / 0.1)"
            : "transparent",
      }}
      onClick={() => onNav("profile")}
    >
      <User className="w-5 h-5" />
      {currentUser && (
        <span className="hidden sm:flex items-center gap-1 text-xs">
          <span style={{ color: "oklch(0.80 0.02 240)" }}>
            {currentUser.username}
          </span>
          {currentUser.isAdmin && (
            <span
              className="text-[10px] font-bold px-1 py-0.5 rounded"
              style={{
                background: "oklch(0.60 0.18 30 / 0.2)",
                color: "oklch(0.80 0.18 30)",
              }}
            >
              ADMIN
            </span>
          )}
        </span>
      )}
    </button>
  );
}

// Archive.org-style header with search bar
function ArchiveHeader({
  query,
  setQuery,
  onSearch,
  isLoading,
  activeNav,
  onNav,
}: {
  query: string;
  setQuery: (v: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  activeNav: NavKey;
  onNav: (nav: NavKey) => void;
}) {
  return (
    <header className="archive-header sticky top-0 z-30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-3 h-14">
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2 flex-shrink-0 group"
            onClick={() => onNav("search")}
          >
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
              className="font-display font-bold text-base hidden sm:block"
              style={{ color: "oklch(0.92 0.02 240)" }}
            >
              ResearchHub
            </span>
          </button>

          {/* Search bar */}
          <form
            className="flex-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
          >
            <div
              className="relative flex-1 search-glow rounded border"
              style={{ borderColor: "oklch(0.28 0.05 260)" }}
            >
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "oklch(0.50 0.06 240)" }}
              />
              <Input
                data-ocid="search.search_input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search books, images, videos, audio..."
                className="pl-9 h-9 text-sm rounded"
                style={{
                  background: "oklch(0.14 0.03 260)",
                  borderColor: "oklch(0.25 0.05 260)",
                  color: "oklch(0.92 0.01 240)",
                }}
              />
            </div>
            <Button
              data-ocid="search.submit_button"
              type="submit"
              size="sm"
              disabled={isLoading || !query.trim()}
              className="h-9 px-4 rounded text-sm font-semibold"
              style={{
                background: "oklch(0.60 0.18 220)",
                color: "white",
              }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </form>

          {/* Profile nav item with user badge */}
          <UserHeaderButton activeNav={activeNav} onNav={onNav} />
        </div>

        {/* Archive-style nav tab strip */}
        <div
          className="flex items-stretch gap-0 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {(
            [
              { key: "search" as NavKey, icon: Search, label: "Search" },
              { key: "discover" as NavKey, icon: Compass, label: "Discover" },
              { key: "ai" as NavKey, icon: Sparkles, label: "AI Chat" },
              {
                key: "chat" as NavKey,
                icon: MessageSquare,
                label: "Community",
              },
              { key: "browser" as NavKey, icon: Globe2, label: "Browser" },
              {
                key: "dictionary" as NavKey,
                icon: BookType,
                label: "Dictionary",
              },
              { key: "comics" as NavKey, icon: BookImage, label: "Comics" },
              { key: "messages" as NavKey, icon: Mail, label: "Messages" },
              { key: "settings" as NavKey, icon: Settings, label: "Settings" },
              { key: "admin" as NavKey, icon: ShieldAlert, label: "Admin" },
            ] as { key: NavKey; icon: React.ElementType; label: string }[]
          ).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              data-ocid={`nav.${key}_tab`}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative whitespace-nowrap"
              style={{
                color:
                  activeNav === key
                    ? "oklch(0.78 0.18 220)"
                    : "oklch(0.52 0.05 240)",
                borderBottom:
                  activeNav === key
                    ? "2px solid oklch(0.60 0.18 220)"
                    : "2px solid transparent",
              }}
              onClick={() => onNav(key)}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// Bottom nav for mobile
function BottomNav({
  current,
  onChange,
}: {
  current: NavKey;
  onChange: (nav: NavKey) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems: {
    key: NavKey;
    icon: React.ElementType;
    label: string;
  }[] = [
    { key: "search", icon: Search, label: "Search" },
    { key: "discover", icon: Compass, label: "Discover" },
    { key: "browser", icon: Globe2, label: "Browser" },
    { key: "ai", icon: Sparkles, label: "AI" },
    { key: "chat", icon: MessageSquare, label: "Community" },
    { key: "news", icon: Newspaper, label: "News" },
    { key: "profile", icon: User, label: "Profile" },
  ];

  const moreItems: { key: NavKey; icon: React.ElementType; label: string }[] = [
    { key: "dictionary", icon: BookType, label: "Dictionary" },
    { key: "comics", icon: BookImage, label: "Comics" },
    { key: "datasets", icon: BarChart3, label: "Datasets" },
    { key: "tools", icon: FlaskConical, label: "Tools" },
    { key: "messages", icon: Mail, label: "Messages" },
    { key: "settings", icon: Settings, label: "Settings" },
    { key: "admin", icon: ShieldAlert, label: "Admin" },
  ];

  const isMoreActive = moreItems.some((i) => i.key === current);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t md:hidden"
        style={{
          background: "oklch(0.07 0.03 260 / 0.97)",
          backdropFilter: "blur(20px)",
          borderColor: "oklch(0.20 0.04 260)",
        }}
      >
        <div className="flex items-stretch h-[56px]">
          {primaryItems.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              data-ocid={`nav.${key}_tab`}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative"
              style={{
                color:
                  current === key
                    ? "oklch(0.78 0.18 220)"
                    : "oklch(0.48 0.05 240)",
              }}
              onClick={() => onChange(key)}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="text-[9px] font-medium leading-none">
                {label}
              </span>
              {current === key && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full"
                  style={{ background: "oklch(0.72 0.18 220)" }}
                />
              )}
            </button>
          ))}
          {/* More button */}
          <button
            type="button"
            data-ocid="nav.more_button"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative"
            style={{
              color:
                isMoreActive || moreOpen
                  ? "oklch(0.78 0.18 220)"
                  : "oklch(0.48 0.05 240)",
            }}
            onClick={() => setMoreOpen(true)}
          >
            <MoreHorizontal className="w-[18px] h-[18px]" />
            <span className="text-[9px] font-medium leading-none">More</span>
            {isMoreActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full"
                style={{ background: "oklch(0.72 0.18 220)" }}
              />
            )}
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl pb-8"
          style={{
            background: "oklch(0.10 0.025 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
          data-ocid="nav.more_sheet"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="text-white text-sm">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-3">
            {moreItems.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                data-ocid={`nav.more_${key}_button`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                style={{
                  background:
                    current === key
                      ? "oklch(0.20 0.06 220 / 0.4)"
                      : "oklch(0.14 0.025 260)",
                  border: `1px solid ${current === key ? "oklch(0.35 0.10 220 / 0.4)" : "oklch(0.22 0.04 260)"}`,
                  color:
                    current === key
                      ? "oklch(0.78 0.18 220)"
                      : "oklch(0.65 0.05 240)",
                }}
                onClick={() => {
                  onChange(key);
                  setMoreOpen(false);
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
