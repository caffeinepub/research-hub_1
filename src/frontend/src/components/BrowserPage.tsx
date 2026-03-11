import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Home,
  Loader2,
  RotateCw,
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

export function BrowserPage() {
  const [addressInput, setAddressInput] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = useCallback(
    (url: string, pushHistory = true) => {
      if (!url) return;
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
    setCurrentUrl(entry.url);
    setAddressInput(entry.url);
    setIsLoading(true);
  };

  const handleForward = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    setHistoryIndex(newIndex);
    setCurrentUrl(entry.url);
    setAddressInput(entry.url);
    setIsLoading(true);
  };

  const handleReload = () => {
    if (!currentUrl) return;
    // Force reload by briefly clearing and resetting
    const url = currentUrl;
    setCurrentUrl("");
    setIsLoading(true);
    setTimeout(() => setCurrentUrl(url), 50);
  };

  const handleHome = () => {
    setCurrentUrl("");
    setAddressInput("");
    setIsLoading(false);
  };

  const canBack = historyIndex > 0;
  const canForward = historyIndex < history.length - 1;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Address Bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-border/60"
        style={{
          background: "oklch(0.14 0.06 265 / 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Nav buttons */}
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
            color: canForward ? "oklch(0.78 0.12 220)" : "oklch(0.45 0.04 240)",
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

        {/* Address input */}
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

      {/* Content area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Loading overlay */}
        {isLoading && currentUrl && (
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
                Enter a URL or search query above to browse the web.
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
        {currentUrl && (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            title="Browser"
            className="w-full h-full border-0"
            allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
            onLoad={() => setIsLoading(false)}
          />
        )}
      </div>
    </div>
  );
}
