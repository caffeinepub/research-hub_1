import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Globe2,
  Home,
  Loader2,
  RefreshCw,
  Star,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const HOMEPAGE = "https://search.brave.com";
const BOOKMARKS_KEY = "rh_browser_bookmarks";
const RECENT_KEY = "rh_browser_recent";

function loadBookmarks(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveBookmarks(bms: string[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bms));
}

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(url: string) {
  const current = loadRecent().filter((u) => u !== url);
  const updated = [url, ...current].slice(0, 10);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return `https://search.brave.com/search?q=${encodeURIComponent(trimmed)}`;
}

function urlLabel(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 30);
  }
}

export function ResearchHubBrowser({
  initialUrl,
}: { initialUrl?: string } = {}) {
  const startPage = initialUrl ?? HOMEPAGE;
  const [history, setHistory] = useState<string[]>([startPage]);
  const [histIdx, setHistIdx] = useState(0);
  const [addressInput, setAddressInput] = useState(startPage);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks);
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUrl = history[histIdx];

  const startLoading = () => {
    setIsLoading(true);
    setLoadError(false);
    setLoadProgress(10);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setLoadProgress((p) => (p < 85 ? p + Math.random() * 8 : p));
    }, 400);
    // Detect X-Frame-Options block via timeout
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setLoadError(true);
        setIsLoading(false);
        setLoadProgress(0);
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      }
    }, 12000);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadProgress(100);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setTimeout(() => setLoadProgress(0), 500);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: start loading when URL changes
  useEffect(() => {
    setAddressInput(currentUrl);
    setLoadError(false);
    startLoading();
    saveRecent(currentUrl);
    setRecent(loadRecent());
  }, [currentUrl]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const navigate = (url: string) => {
    const newHistory = history.slice(0, histIdx + 1);
    newHistory.push(url);
    setHistory(newHistory);
    setHistIdx(newHistory.length - 1);
  };

  const handleGo = () => {
    const url = normalizeUrl(addressInput);
    navigate(url);
  };

  const handleBack = () => {
    if (histIdx > 0) setHistIdx(histIdx - 1);
  };

  const handleForward = () => {
    if (histIdx < history.length - 1) setHistIdx(histIdx + 1);
  };

  const handleHome = () => navigate(HOMEPAGE);

  const handleRefresh = () => {
    setLoadError(false);
    startLoading();
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const handleBookmark = () => {
    let updated: string[];
    if (bookmarks.includes(currentUrl)) {
      updated = bookmarks.filter((b) => b !== currentUrl);
    } else {
      updated = [currentUrl, ...bookmarks];
    }
    setBookmarks(updated);
    saveBookmarks(updated);
  };

  const removeBookmark = (url: string) => {
    const updated = bookmarks.filter((b) => b !== url);
    setBookmarks(updated);
    saveBookmarks(updated);
  };

  const isBookmarked = bookmarks.includes(currentUrl);

  return (
    <div
      className="flex flex-col h-full min-h-0"
      style={{ background: "oklch(0.07 0.025 265)" }}
    >
      {/* Browser toolbar */}
      <div
        className="flex-shrink-0 px-3 py-2 border-b"
        style={{
          background: "oklch(0.10 0.03 265)",
          borderColor: "oklch(0.20 0.04 260)",
        }}
      >
        {/* Top row: title + nav controls + address bar + bookmark */}
        <div className="flex items-center gap-2">
          {/* App title */}
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            <Globe2
              className="w-4 h-4"
              style={{ color: "oklch(0.65 0.18 220)" }}
            />
            <span
              className="text-xs font-bold whitespace-nowrap"
              style={{ color: "oklch(0.75 0.12 220)" }}
            >
              Research Hub Browser
            </span>
          </div>

          {/* Nav controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              data-ocid="browser.back_button"
              onClick={handleBack}
              disabled={histIdx === 0}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
              style={{
                background: "oklch(0.16 0.03 265)",
                color: "oklch(0.70 0.06 240)",
              }}
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-ocid="browser.forward_button"
              onClick={handleForward}
              disabled={histIdx >= history.length - 1}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
              style={{
                background: "oklch(0.16 0.03 265)",
                color: "oklch(0.70 0.06 240)",
              }}
              title="Forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-ocid="browser.refresh_button"
              onClick={handleRefresh}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                background: "oklch(0.16 0.03 265)",
                color: "oklch(0.70 0.06 240)",
              }}
              title="Refresh"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              data-ocid="browser.home_button"
              onClick={handleHome}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                background: "oklch(0.16 0.03 265)",
                color: "oklch(0.70 0.06 240)",
              }}
              title="Home"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Address bar */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <form
              className="flex-1 flex items-center gap-1.5 rounded-lg overflow-hidden"
              style={{
                background: "oklch(0.13 0.025 265)",
                border: "1px solid oklch(0.24 0.05 265)",
              }}
              onSubmit={(e) => {
                e.preventDefault();
                handleGo();
              }}
            >
              <Globe2
                className="w-3.5 h-3.5 flex-shrink-0 ml-2.5"
                style={{ color: "oklch(0.45 0.06 240)" }}
              />
              <Input
                data-ocid="browser.search_input"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="Search or enter URL..."
                className="border-0 bg-transparent h-8 text-xs text-white placeholder:text-muted-foreground focus-visible:ring-0 px-0"
              />
              {addressInput && (
                <button
                  type="button"
                  onClick={() => setAddressInput("")}
                  className="mr-1 p-0.5 rounded"
                  style={{ color: "oklch(0.45 0.04 240)" }}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>
          </div>

          {/* Bookmark button */}
          <button
            type="button"
            data-ocid="browser.toggle"
            onClick={handleBookmark}
            className="p-1.5 rounded-lg transition-all flex-shrink-0"
            style={{
              background: isBookmarked
                ? "oklch(0.50 0.18 60 / 0.2)"
                : "oklch(0.16 0.03 265)",
              color: isBookmarked
                ? "oklch(0.75 0.18 60)"
                : "oklch(0.55 0.05 240)",
              border: `1px solid ${isBookmarked ? "oklch(0.50 0.18 60 / 0.4)" : "transparent"}`,
            }}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Loading progress bar */}
        {loadProgress > 0 && loadProgress < 100 && (
          <div
            className="mt-1.5 h-0.5 rounded-full overflow-hidden"
            style={{ background: "oklch(0.20 0.04 260)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${loadProgress}%`,
                background: "oklch(0.65 0.18 220)",
              }}
            />
          </div>
        )}
      </div>

      {/* Bookmarks bar */}
      {bookmarks.length > 0 && (
        <div
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 overflow-x-auto border-b"
          style={{
            background: "oklch(0.09 0.025 265)",
            borderColor: "oklch(0.18 0.03 260)",
            scrollbarWidth: "none",
          }}
        >
          <Star
            className="w-3 h-3 flex-shrink-0 mr-0.5"
            style={{ color: "oklch(0.55 0.12 60)" }}
          />
          {bookmarks.map((bm) => (
            <div key={bm} className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                data-ocid="browser.secondary_button"
                onClick={() => navigate(bm)}
                className="px-2 py-0.5 rounded text-[10px] transition-colors"
                style={{
                  background:
                    bm === currentUrl
                      ? "oklch(0.52 0.18 220 / 0.15)"
                      : "oklch(0.16 0.03 265)",
                  color:
                    bm === currentUrl
                      ? "oklch(0.72 0.18 220)"
                      : "oklch(0.60 0.05 240)",
                  border: `1px solid ${
                    bm === currentUrl
                      ? "oklch(0.35 0.10 220 / 0.4)"
                      : "oklch(0.22 0.04 260)"
                  }`,
                }}
              >
                {urlLabel(bm)}
              </button>
              <button
                type="button"
                onClick={() => removeBookmark(bm)}
                className="p-0.5 rounded opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: "oklch(0.65 0.05 240)" }}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recent sites */}
      {recent.length > 0 && (
        <div
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto"
          style={{
            background: "oklch(0.08 0.02 265)",
            borderBottom: "1px solid oklch(0.16 0.03 260)",
            scrollbarWidth: "none",
          }}
        >
          <span
            className="text-[9px] font-semibold uppercase tracking-wider flex-shrink-0"
            style={{ color: "oklch(0.40 0.04 240)" }}
          >
            Recent
          </span>
          {recent.map((url) => (
            <button
              key={url}
              type="button"
              data-ocid="browser.secondary_button"
              onClick={() => navigate(url)}
              className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] transition-colors"
              style={{
                background: "oklch(0.14 0.025 265)",
                color: "oklch(0.55 0.05 240)",
                border: "1px solid oklch(0.20 0.04 260)",
              }}
            >
              {urlLabel(url)}
            </button>
          ))}
        </div>
      )}

      {/* Iframe viewport */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {loadError ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: "oklch(0.08 0.02 265)" }}
            data-ocid="browser.error_state"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.14 0.03 265)" }}
            >
              <Globe2
                className="w-8 h-8"
                style={{ color: "oklch(0.42 0.06 240)" }}
              />
            </div>
            <div className="text-center">
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "oklch(0.75 0.06 240)" }}
              >
                This site can&apos;t be displayed here.
              </p>
              <p
                className="text-xs mb-4"
                style={{ color: "oklch(0.45 0.04 240)" }}
              >
                The page may block embedding or took too long to load.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  type="button"
                  data-ocid="browser.primary_button"
                  onClick={() =>
                    window.open(currentUrl, "_blank", "noopener,noreferrer")
                  }
                  className="text-white text-xs"
                  style={{ background: "oklch(0.52 0.18 220)" }}
                >
                  Open in New Tab
                </Button>
                <Button
                  type="button"
                  data-ocid="browser.secondary_button"
                  variant="outline"
                  onClick={handleRefresh}
                  className="text-white text-xs border-white/20"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            title="Research Hub Browser"
            onLoad={() => {
              stopLoading();
            }}
            onError={() => {
              setLoadError(true);
              setIsLoading(false);
              setLoadProgress(0);
              if (progressTimerRef.current)
                clearInterval(progressTimerRef.current);
              if (errorTimeoutRef.current)
                clearTimeout(errorTimeoutRef.current);
            }}
            allow="fullscreen; autoplay; clipboard-read; clipboard-write"
            data-ocid="browser.canvas_target"
          />
        )}
      </div>
    </div>
  );
}
