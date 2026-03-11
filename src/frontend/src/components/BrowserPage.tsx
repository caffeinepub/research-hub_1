import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Clock,
  ExternalLink,
  Globe,
  Home,
  Loader2,
  RotateCw,
  Search,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Bookmark_ {
  url: string;
  title: string;
  favicon?: string;
}

interface HistoryEntry {
  url: string;
  title?: string;
  visitedAt: number;
}

const DEFAULT_URL = "https://search.brave.com";

const POPULAR_SHORTCUTS = [
  {
    label: "Archive.org",
    url: "https://archive.org",
    color: "oklch(0.70 0.18 150)",
  },
  {
    label: "Wikipedia",
    url: "https://en.wikipedia.org",
    color: "oklch(0.75 0.10 230)",
  },
  {
    label: "Gutenberg",
    url: "https://www.gutenberg.org",
    color: "oklch(0.70 0.16 55)",
  },
  {
    label: "PubMed",
    url: "https://pubmed.ncbi.nlm.nih.gov",
    color: "oklch(0.65 0.18 200)",
  },
  { label: "NASA", url: "https://nasa.gov", color: "oklch(0.70 0.18 25)" },
  {
    label: "Europeana",
    url: "https://www.europeana.eu",
    color: "oklch(0.68 0.16 280)",
  },
];

const SEARCH_ENGINES = [
  {
    id: "brave",
    label: "Brave",
    color: "oklch(0.72 0.18 40)",
    buildUrl: (q: string) =>
      `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "wikipedia",
    label: "Wikipedia",
    color: "oklch(0.75 0.10 230)",
    buildUrl: (q: string) =>
      `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
  },
  {
    id: "archive",
    label: "Archive.org",
    color: "oklch(0.70 0.18 150)",
    buildUrl: (q: string) =>
      `https://archive.org/search?query=${encodeURIComponent(q)}`,
  },
];

function getBookmarks(): Bookmark_[] {
  try {
    return JSON.parse(localStorage.getItem("rh_browser_bookmarks") ?? "[]");
  } catch {
    return [];
  }
}

function saveBookmarks(bm: Bookmark_[]) {
  localStorage.setItem("rh_browser_bookmarks", JSON.stringify(bm));
}

function getRecentSites(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("rh_browser_recent") ?? "[]");
  } catch {
    return [];
  }
}

function addRecentSite(url: string, title?: string) {
  const recent = getRecentSites();
  const filtered = recent.filter((r) => r.url !== url);
  const updated = [
    { url, title: title || url, visitedAt: Date.now() },
    ...filtered,
  ].slice(0, 10);
  localStorage.setItem("rh_browser_recent", JSON.stringify(updated));
}

function resolveInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_URL;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  if (trimmed.includes(".") && !trimmed.includes(" "))
    return `https://${trimmed}`;
  return `https://search.brave.com/search?q=${encodeURIComponent(trimmed)}`;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function BrowserPage() {
  const [addressInput, setAddressInput] = useState(DEFAULT_URL);
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [navHistory, setNavHistory] = useState<HistoryEntry[]>([
    { url: DEFAULT_URL, visitedAt: Date.now() },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark_[]>(() => getBookmarks());
  const [recentSites, setRecentSites] = useState<HistoryEntry[]>(() =>
    getRecentSites(),
  );
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsLoading(true);
  }, []);

  const navigate = useCallback(
    (url: string, pushHistory = true) => {
      if (!url) return;
      setBlocked(false);
      setCurrentUrl(url);
      setAddressInput(url);
      setIsLoading(true);
      setShowRecent(false);
      if (pushHistory) {
        const entry: HistoryEntry = { url, visitedAt: Date.now() };
        setNavHistory((prev) => {
          const next = prev.slice(0, historyIndex + 1);
          return [...next, entry];
        });
        setHistoryIndex((prev) => prev + 1);
        addRecentSite(url);
        setRecentSites(getRecentSites());
      }
    },
    [historyIndex],
  );

  const handleGo = () => {
    const url = resolveInput(addressInput);
    navigate(url);
  };

  const handleBack = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const entry = navHistory[newIndex];
    setHistoryIndex(newIndex);
    setBlocked(false);
    setCurrentUrl(entry.url);
    setAddressInput(entry.url);
    setIsLoading(true);
  };

  const handleForward = () => {
    if (historyIndex >= navHistory.length - 1) return;
    const newIndex = historyIndex + 1;
    const entry = navHistory[newIndex];
    setHistoryIndex(newIndex);
    setBlocked(false);
    setCurrentUrl(entry.url);
    setAddressInput(entry.url);
    setIsLoading(true);
  };

  const handleReload = () => {
    if (!currentUrl) return;
    const url = currentUrl;
    setBlocked(false);
    setCurrentUrl("");
    setIsLoading(true);
    setTimeout(() => setCurrentUrl(url), 50);
  };

  const handleHome = () => navigate(DEFAULT_URL);

  const handleIframeLoad = () => setIsLoading(false);
  const handleIframeError = () => {
    setIsLoading(false);
    setBlocked(true);
  };

  const isBookmarked = bookmarks.some((b) => b.url === currentUrl);

  const handleToggleBookmark = () => {
    let updated: Bookmark_[];
    if (isBookmarked) {
      updated = bookmarks.filter((b) => b.url !== currentUrl);
    } else {
      if (bookmarks.length >= 8) {
        updated = [
          ...bookmarks.slice(1),
          { url: currentUrl, title: getDomain(currentUrl) },
        ];
      } else {
        updated = [
          ...bookmarks,
          { url: currentUrl, title: getDomain(currentUrl) },
        ];
      }
    }
    setBookmarks(updated);
    saveBookmarks(updated);
  };

  const handleQuickSearch = (engineId: string) => {
    const engine = SEARCH_ENGINES.find((e) => e.id === engineId);
    if (!engine) return;
    const q = addressInput.trim() || "research";
    navigate(engine.buildUrl(q));
  };

  const canBack = historyIndex > 0;
  const canForward = historyIndex < navHistory.length - 1;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Address bar */}
      <div
        className="shrink-0 px-3 py-2"
        style={{
          background: "oklch(0.14 0.06 265 / 0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(0.22 0.04 260)",
        }}
      >
        {/* Nav + URL row */}
        <div className="flex items-center gap-1.5 mb-2">
          <button
            type="button"
            data-ocid="browser.back_button"
            disabled={!canBack}
            onClick={handleBack}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{
              color: canBack ? "oklch(0.78 0.12 220)" : "oklch(0.45 0.04 240)",
            }}
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-ocid="browser.forward_button"
            disabled={!canForward}
            onClick={handleForward}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{
              color: canForward
                ? "oklch(0.78 0.12 220)"
                : "oklch(0.45 0.04 240)",
            }}
            title="Forward"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-ocid="browser.reload_button"
            onClick={handleReload}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "oklch(0.78 0.12 220)" }}
            title="Reload"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-ocid="browser.home_button"
            onClick={handleHome}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "oklch(0.78 0.12 220)" }}
            title="Home (Brave Search)"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* URL form */}
          <form
            className="flex flex-1 items-center gap-1.5 relative"
            onSubmit={(e) => {
              e.preventDefault();
              handleGo();
            }}
          >
            <div className="relative flex-1">
              {isLoading && currentUrl && !blocked ? (
                <Loader2
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin pointer-events-none"
                  style={{ color: "oklch(0.6 0.15 220)" }}
                />
              ) : (
                <Globe
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: "oklch(0.55 0.08 240)" }}
                />
              )}
              <Input
                ref={inputRef}
                data-ocid="browser.address_input"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onFocus={() => {
                  inputRef.current?.select();
                  setShowRecent(true);
                }}
                onBlur={() => setTimeout(() => setShowRecent(false), 200)}
                placeholder="Enter URL or search..."
                className="pl-8 h-9 text-sm rounded-xl border-0 text-white"
                style={{
                  background: "oklch(0.22 0.06 260 / 0.8)",
                  color: "white",
                }}
              />
              {/* Recent sites dropdown */}
              {showRecent && recentSites.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl z-50"
                  style={{
                    background: "oklch(0.14 0.05 260)",
                    border: "1px solid oklch(0.28 0.06 260)",
                  }}
                >
                  <div className="px-3 py-1.5 flex items-center gap-1.5">
                    <Clock
                      className="w-3 h-3"
                      style={{ color: "oklch(0.50 0.05 240)" }}
                    />
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: "oklch(0.50 0.05 240)" }}
                    >
                      Recent
                    </span>
                  </div>
                  {recentSites.slice(0, 5).map((site) => (
                    <button
                      key={site.url}
                      type="button"
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5 text-left transition-colors"
                      onMouseDown={() => {
                        setAddressInput(site.url);
                        navigate(site.url);
                      }}
                    >
                      <Globe
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: "oklch(0.55 0.08 240)" }}
                      />
                      <span className="text-sm text-white truncate">
                        {getDomain(site.url)}
                      </span>
                      <span
                        className="text-xs ml-auto shrink-0"
                        style={{ color: "oklch(0.45 0.04 240)" }}
                      >
                        {site.url.length > 40
                          ? `${site.url.slice(0, 40)}...`
                          : site.url}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="submit"
              data-ocid="browser.go_button"
              size="sm"
              className="h-9 px-4 rounded-xl text-sm font-semibold shrink-0"
              style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
            >
              Go
            </Button>
            {/* Bookmark toggle */}
            <button
              type="button"
              data-ocid="browser.toggle"
              onClick={handleToggleBookmark}
              className="p-2 rounded-lg transition-colors shrink-0"
              style={{
                color: isBookmarked
                  ? "oklch(0.78 0.18 55)"
                  : "oklch(0.55 0.06 240)",
                background: isBookmarked
                  ? "oklch(0.78 0.18 55 / 0.12)"
                  : "transparent",
              }}
              title={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Star className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>

        {/* Bookmarks bar */}
        {bookmarks.length > 0 && (
          <div
            className="flex items-center gap-1.5 overflow-x-auto mb-1"
            style={{ scrollbarWidth: "none" }}
          >
            <Bookmark
              className="w-3 h-3 shrink-0"
              style={{ color: "oklch(0.50 0.05 240)" }}
            />
            {bookmarks.map((bm) => (
              <button
                key={bm.url}
                type="button"
                data-ocid="browser.link"
                onClick={() => navigate(bm.url)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80 shrink-0"
                style={{
                  background: "oklch(0.22 0.06 260 / 0.6)",
                  border: "1px solid oklch(0.30 0.06 260)",
                  color: "oklch(0.78 0.10 230)",
                }}
              >
                <Globe className="w-3 h-3" />
                <span className="max-w-[80px] truncate">{bm.title}</span>
                <button
                  type="button"
                  className="ml-0.5 opacity-40 hover:opacity-100 leading-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = bookmarks.filter((b) => b.url !== bm.url);
                    setBookmarks(updated);
                    saveBookmarks(updated);
                  }}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </button>
            ))}
          </div>
        )}

        {/* Search engines + popular shortcuts */}
        <div
          className="flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <Search
            className="w-3 h-3 shrink-0"
            style={{ color: "oklch(0.45 0.05 240)" }}
          />
          {SEARCH_ENGINES.map((engine) => (
            <button
              key={engine.id}
              type="button"
              data-ocid={`browser.${engine.id}_button`}
              onClick={() => handleQuickSearch(engine.id)}
              className="text-xs px-2.5 py-1 rounded-full transition-all shrink-0 font-medium"
              style={{
                background: engine.color.replace(")", " / 0.12)"),
                border: `1px solid ${engine.color.replace(")", " / 0.35)")}`,
                color: engine.color,
              }}
            >
              {engine.label}
            </button>
          ))}
          <div
            className="w-px h-4 shrink-0"
            style={{ background: "oklch(0.28 0.04 260)" }}
          />
          {POPULAR_SHORTCUTS.map((site) => (
            <button
              key={site.url}
              type="button"
              data-ocid="browser.link"
              onClick={() => navigate(site.url)}
              className="text-xs px-2.5 py-1 rounded-full transition-all shrink-0"
              style={{
                background: "oklch(0.16 0.04 260)",
                border: "1px solid oklch(0.26 0.04 260)",
                color: site.color,
              }}
            >
              {site.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Loading bar */}
        {isLoading && currentUrl && !blocked && (
          <div
            className="absolute top-0 left-0 right-0 h-0.5 z-20 overflow-hidden"
            style={{ background: "oklch(0.20 0.04 260)" }}
          >
            <div
              className="h-full animate-pulse"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.52 0.18 220), oklch(0.65 0.18 200), oklch(0.52 0.18 220))",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s linear infinite",
                width: "60%",
              }}
            />
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && currentUrl && !blocked && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
            style={{ background: "oklch(0.12 0.04 265 / 0.5)" }}
          >
            <div className="flex items-center gap-3">
              <Loader2
                className="w-5 h-5 animate-spin"
                style={{ color: "oklch(0.65 0.18 200)" }}
              />
              <span
                className="text-sm"
                style={{ color: "oklch(0.65 0.06 240)" }}
              >
                Loading {getDomain(currentUrl)}...
              </span>
            </div>
          </div>
        )}

        {/* Blocked state */}
        {blocked && currentUrl && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 z-20"
            style={{ background: "oklch(0.12 0.04 265)" }}
            data-ocid="browser.error_state"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "oklch(0.55 0.18 30 / 0.15)",
                border: "1px solid oklch(0.55 0.18 30 / 0.35)",
              }}
            >
              <Globe
                className="w-7 h-7"
                style={{ color: "oklch(0.72 0.18 30)" }}
              />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold mb-1 text-white">
                Embedding blocked
              </h3>
              <p
                className="text-sm max-w-sm"
                style={{ color: "oklch(0.55 0.05 240)" }}
              >
                <span
                  className="font-mono"
                  style={{ color: "oklch(0.70 0.12 220)" }}
                >
                  {getDomain(currentUrl)}
                </span>{" "}
                blocks display inside other apps. This is a browser security
                restriction.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="browser.primary_button"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </a>
              <button
                type="button"
                data-ocid="browser.secondary_button"
                onClick={() =>
                  navigate(
                    `https://search.brave.com/search?q=${encodeURIComponent(getDomain(currentUrl))}`,
                  )
                }
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: "oklch(0.20 0.06 260 / 0.8)",
                  border: "1px solid oklch(0.35 0.08 255 / 0.5)",
                  color: "oklch(0.80 0.08 240)",
                }}
              >
                <Search className="w-4 h-4" />
                Search on Brave
              </button>
            </div>

            {/* Try these instead */}
            <div className="text-center">
              <p
                className="text-xs mb-3"
                style={{ color: "oklch(0.45 0.05 240)" }}
              >
                Try these sites that work well:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {POPULAR_SHORTCUTS.map((site) => (
                  <button
                    key={site.url}
                    type="button"
                    data-ocid="browser.link"
                    onClick={() => navigate(site.url)}
                    className="text-sm px-3 py-1.5 rounded-full transition-colors"
                    style={{
                      background: site.color.replace(")", " / 0.12)"),
                      border: `1px solid ${site.color.replace(")", " / 0.35)")}`,
                      color: site.color,
                    }}
                  >
                    {site.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* iframe */}
        {currentUrl && !blocked && (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            title="Browser"
            className="w-full h-full border-0"
            allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    </div>
  );
}
