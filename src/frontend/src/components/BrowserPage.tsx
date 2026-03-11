import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  Home,
  Loader2,
  RotateCw,
  Search,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface HistoryEntry {
  url: string;
}

function resolveInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // Has a dot and no spaces — treat as URL
  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    return `https://${trimmed}`;
  }
  // Otherwise treat as search query
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}&ia=web`;
}

const QUICK_ENGINES = [
  {
    id: "duckduckgo",
    label: "DuckDuckGo",
    color: "oklch(0.70 0.18 40)",
    bg: "oklch(0.70 0.18 40 / 0.12)",
    border: "oklch(0.70 0.18 40 / 0.35)",
    buildUrl: (q: string) =>
      `https://duckduckgo.com/?q=${encodeURIComponent(q)}&ia=web`,
  },
  {
    id: "wikipedia",
    label: "Wikipedia",
    color: "oklch(0.75 0.10 230)",
    bg: "oklch(0.75 0.10 230 / 0.12)",
    border: "oklch(0.75 0.10 230 / 0.35)",
    buildUrl: (q: string) =>
      `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
  },
  {
    id: "archive",
    label: "Archive.org",
    color: "oklch(0.70 0.18 150)",
    bg: "oklch(0.70 0.18 150 / 0.12)",
    border: "oklch(0.70 0.18 150 / 0.35)",
    buildUrl: (q: string) =>
      `https://archive.org/search?query=${encodeURIComponent(q)}`,
  },
];

export function BrowserPage() {
  const [addressInput, setAddressInput] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = useCallback(
    (url: string, pushHistory = true) => {
      if (!url) return;
      setBlocked(false);
      setCurrentUrl(url);
      setAddressInput(url);
      setIsLoading(true);
      if (pushHistory) {
        setHistory((prev) => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push({ url });
          return newHistory;
        });
        setHistoryIndex((prev) => prev + 1);
      }
    },
    [historyIndex],
  );

  const handleGo = () => {
    const url = resolveInput(addressInput);
    if (!url) return;
    navigate(url);
  };

  const handleBack = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    setHistoryIndex(newIndex);
    setBlocked(false);
    setCurrentUrl(entry.url);
    setAddressInput(entry.url);
    setIsLoading(true);
  };

  const handleForward = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
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

  const handleHome = () => {
    setCurrentUrl("");
    setAddressInput("");
    setIsLoading(false);
    setBlocked(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setBlocked(true);
  };

  const handleQuickEngine = (engineId: string) => {
    const engine = QUICK_ENGINES.find((e) => e.id === engineId);
    if (!engine) return;
    const q = addressInput.trim() || "research";
    navigate(engine.buildUrl(q));
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const canBack = historyIndex > 0;
  const canForward = historyIndex < history.length - 1;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Address Bar */}
      <div
        className="flex flex-col gap-2 px-3 py-2 border-b border-border/60"
        style={{
          background: "oklch(0.14 0.06 265 / 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Nav + address row */}
        <div className="flex items-center gap-2">
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
            disabled={!currentUrl}
            onClick={handleReload}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
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
            title="Home"
          >
            <Home className="w-4 h-4" />
          </button>

          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleGo();
            }}
          >
            <div className="relative flex-1">
              {isLoading && currentUrl ? (
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
                data-ocid="browser.address_input"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="Enter URL or search query..."
                className="pl-8 h-9 text-sm rounded-xl border-0"
                style={{
                  background: "oklch(0.22 0.06 260 / 0.8)",
                  color: "oklch(0.93 0.02 240)",
                }}
              />
            </div>
            <Button
              type="submit"
              data-ocid="browser.go_button"
              size="sm"
              className="h-9 px-4 rounded-xl text-sm font-semibold"
              style={{
                background: "oklch(0.52 0.18 220)",
                color: "white",
              }}
            >
              Go
            </Button>
          </form>
        </div>

        {/* Quick engine buttons */}
        <div className="flex items-center gap-2 pl-24">
          <Search
            className="w-3 h-3 flex-shrink-0"
            style={{ color: "oklch(0.45 0.05 240)" }}
          />
          {QUICK_ENGINES.map((engine) => (
            <button
              key={engine.id}
              type="button"
              data-ocid={`browser.${engine.id}_button`}
              onClick={() => handleQuickEngine(engine.id)}
              className="text-xs px-2.5 py-1 rounded-full transition-all duration-150 font-medium"
              style={{
                background: engine.bg,
                border: `1px solid ${engine.border}`,
                color: engine.color,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  engine.color
                    .replace(")", " / 0.25)")
                    .replace("oklch(", "oklch(");
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  engine.bg;
              }}
            >
              {engine.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Loading overlay */}
        {isLoading && currentUrl && !blocked && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
            style={{ background: "oklch(0.12 0.04 265 / 0.6)" }}
          >
            <div className="flex items-center gap-3">
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: "oklch(0.65 0.18 200)" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "oklch(0.75 0.08 230)" }}
              >
                Loading...
              </span>
            </div>
          </div>
        )}

        {/* Blocked / embedding error state */}
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
              <h3
                className="font-display text-lg font-bold mb-1"
                style={{ color: "oklch(0.92 0.03 240)" }}
              >
                This site doesn't allow embedding
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
                blocks being displayed inside other apps.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="browser.primary_button"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: "oklch(0.52 0.18 220)",
                  color: "white",
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </a>
              <button
                type="button"
                data-ocid="browser.secondary_button"
                onClick={() => {
                  const domain = getDomain(currentUrl);
                  navigate(
                    `https://duckduckgo.com/?q=${encodeURIComponent(domain)}&ia=web`,
                  );
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: "oklch(0.20 0.06 260 / 0.8)",
                  border: "1px solid oklch(0.35 0.08 255 / 0.5)",
                  color: "oklch(0.80 0.08 240)",
                }}
              >
                <Search className="w-4 h-4" />
                Try DuckDuckGo Search
              </button>
            </div>
          </div>
        )}

        {/* Welcome screen */}
        {!currentUrl && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6"
            style={{ background: "oklch(0.12 0.04 265)" }}
          >
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{
                  background: "oklch(0.65 0.18 200 / 0.15)",
                  border: "1px solid oklch(0.65 0.18 200 / 0.3)",
                }}
              >
                <Globe
                  className="w-8 h-8"
                  style={{ color: "oklch(0.65 0.18 200)" }}
                />
              </div>
              <h2
                className="font-display text-2xl font-bold mb-2"
                style={{ color: "oklch(0.95 0.01 240)" }}
              >
                Research Browser
              </h2>
              <p
                className="text-sm max-w-md"
                style={{ color: "oklch(0.65 0.06 240)" }}
              >
                Enter a URL or search query above to browse the web. Use the
                quick search buttons to jump straight to DuckDuckGo, Wikipedia,
                or Archive.org.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl w-full">
              {[
                {
                  label: "Internet Archive",
                  url: "https://archive.org",
                  hint: "archive.org",
                },
                {
                  label: "Wikipedia",
                  url: "https://en.wikipedia.org",
                  hint: "en.wikipedia.org",
                },
                {
                  label: "NASA",
                  url: "https://nasa.gov",
                  hint: "nasa.gov",
                },
                {
                  label: "Library of Congress",
                  url: "https://loc.gov",
                  hint: "loc.gov",
                },
              ].map((site) => (
                <button
                  key={site.url}
                  type="button"
                  data-ocid="browser.primary_button"
                  onClick={() => navigate(site.url)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 text-center"
                  style={{
                    background: "oklch(0.18 0.06 260 / 0.7)",
                    border: "1px solid oklch(0.3 0.06 255 / 0.5)",
                    color: "oklch(0.88 0.06 220)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "oklch(0.25 0.09 250 / 0.8)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "oklch(0.5 0.15 220 / 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "oklch(0.18 0.06 260 / 0.7)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "oklch(0.3 0.06 255 / 0.5)";
                  }}
                >
                  <Globe
                    className="w-5 h-5"
                    style={{ color: "oklch(0.65 0.18 200)" }}
                  />
                  <span className="text-xs font-medium leading-tight">
                    {site.label}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "oklch(0.5 0.06 240)" }}
                  >
                    {site.hint}
                  </span>
                </button>
              ))}
            </div>

            <p
              className="text-xs text-center max-w-sm"
              style={{ color: "oklch(0.45 0.04 250)" }}
            >
              Works great with open-access sites. Some sites (Google, YouTube)
              block embedding by default.
            </p>
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
