import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Archive,
  BookOpen,
  Film,
  Image,
  Music,
  Package,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ArchiveDoc {
  identifier: string;
  title?: string;
  description?: string | string[];
  mediatype?: string;
  subject?: string | string[];
}

const MEDIA_CATEGORIES = [
  { key: "all", label: "All", icon: Package },
  { key: "texts", label: "Texts", icon: BookOpen },
  { key: "audio", label: "Audio", icon: Music },
  { key: "movies", label: "Video", icon: Film },
  { key: "image", label: "Images", icon: Image },
  { key: "software", label: "Software", icon: Archive },
];

const MEDIA_BADGE_STYLES: Record<string, string> = {
  movies: "bg-green-500/15 text-green-400 border-green-500/25",
  audio: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  texts: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  image: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  software: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
};

const MEDIA_LABELS: Record<string, string> = {
  movies: "Video",
  audio: "Audio",
  texts: "Text",
  image: "Image",
  software: "Software",
};

const SKELETON_IDS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
];

interface ArchiveItemViewerProps {
  doc: ArchiveDoc;
  onClose: () => void;
}

function ArchiveItemViewer({ doc, onClose }: ArchiveItemViewerProps) {
  const mt = doc.mediatype ?? "texts";
  let src = "";
  let height = 400;

  if (mt === "movies" || mt === "audio") {
    src = `https://archive.org/embed/${doc.identifier}`;
    height = mt === "audio" ? 200 : 400;
  } else if (mt === "texts") {
    src = `https://archive.org/stream/${doc.identifier}`;
    height = 600;
  }

  const desc = Array.isArray(doc.description)
    ? doc.description[0]
    : doc.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "oklch(0.06 0.03 260 / 0.97)",
        backdropFilter: "blur(8px)",
      }}
      data-ocid="archive.modal"
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "oklch(0.20 0.04 260)" }}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white line-clamp-1">
            {doc.title ?? doc.identifier}
          </h2>
          {desc && (
            <p
              className="text-xs mt-0.5 line-clamp-1"
              style={{ color: "oklch(0.55 0.05 240)" }}
            >
              {desc}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-3 text-white hover:bg-white/10"
          onClick={onClose}
          data-ocid="archive.close_button"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {mt === "image" ? (
          <div className="flex items-center justify-center h-full">
            <img
              src={`https://archive.org/services/img/${doc.identifier}`}
              alt={doc.title ?? doc.identifier}
              className="max-w-full max-h-full rounded-xl object-contain"
            />
          </div>
        ) : src ? (
          <iframe
            src={src}
            title={doc.title ?? doc.identifier}
            width="100%"
            height={height}
            allowFullScreen
            style={{ border: "none", borderRadius: "12px", background: "#000" }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Archive
              className="w-10 h-10"
              style={{ color: "oklch(0.45 0.06 260)" }}
            />
            <a
              href={`https://archive.org/details/${doc.identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              View on Archive.org
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ArchiveTab() {
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [docs, setDocs] = useState<ArchiveDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<ArchiveDoc | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchDocs = useCallback(
    async (query: string, mt: string, pg: number, append = false) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const q =
          query.trim() ||
          "subject:(history OR science OR art OR music OR film)";
        const mtPart =
          mt === "all"
            ? "(mediatype:movies OR mediatype:audio OR mediatype:texts OR mediatype:image)"
            : `mediatype:${mt}`;
        const fullQuery = `(${q}) AND ${mtPart}`;

        const params = new URLSearchParams();
        params.set("q", fullQuery);
        params.set("output", "json");
        params.set("rows", "50");
        params.set("page", String(pg));
        params.append("fl[]", "identifier");
        params.append("fl[]", "title");
        params.append("fl[]", "description");
        params.append("fl[]", "mediatype");
        params.append("fl[]", "subject");
        params.append("sort[]", "downloads desc");
        const url = `https://archive.org/advancedsearch.php?${params.toString()}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const fetched: ArchiveDoc[] = data?.response?.docs ?? [];
        if (append) {
          setDocs((prev) => [...prev, ...fetched]);
        } else {
          setDocs(fetched);
        }
        setHasMore(fetched.length === 50);
      } catch (err) {
        console.error("Archive fetch error:", err);
        if (!append) {
          setDocs([]);
          setErrorMsg(
            "Archive.org is temporarily unavailable. Try searching again.",
          );
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    fetchDocs("", "all", 1, false);
  }, [fetchDocs]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchDocs(activeQuery, mediaFilter, nextPage, true);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, activeQuery, mediaFilter, fetchDocs]);

  const handleSearch = () => {
    setPage(1);
    setActiveQuery(searchInput);
    setDocs([]);
    fetchDocs(searchInput, mediaFilter, 1, false);
  };

  const handleFilterChange = (mt: string) => {
    setMediaFilter(mt);
    setPage(1);
    setDocs([]);
    fetchDocs(activeQuery, mt, 1, false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "oklch(0.12 0.04 240)",
          border: "1px solid oklch(0.22 0.04 260)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Archive
            className="w-5 h-5"
            style={{ color: "oklch(0.72 0.18 220)" }}
          />
          <span className="font-bold text-white text-lg">Archive.org</span>
          <Badge
            variant="outline"
            className="ml-1 text-[10px] px-1.5 py-0"
            style={{
              borderColor: "oklch(0.30 0.08 220)",
              color: "oklch(0.65 0.12 220)",
            }}
          >
            Internet Archive
          </Badge>
        </div>
        <p className="text-xs mb-3" style={{ color: "oklch(0.55 0.05 240)" }}>
          Browse millions of free books, movies, music, and more
        </p>

        {/* Search bar */}
        <div className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search Archive.org..."
            className="flex-1 bg-background border-border text-white placeholder:text-muted-foreground"
            data-ocid="archive.search_input"
          />
          <Button
            type="button"
            onClick={handleSearch}
            className="shrink-0"
            style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
            data-ocid="archive.primary_button"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Category chips */}
        <div
          className="flex gap-2 mt-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {MEDIA_CATEGORIES.map((cat) => {
            const isActive = mediaFilter === cat.key;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                type="button"
                data-ocid={`archive.${cat.key}_tab`}
                onClick={() => handleFilterChange(cat.key)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: isActive
                    ? "oklch(0.52 0.18 220 / 0.2)"
                    : "oklch(0.16 0.03 260)",
                  border: `1px solid ${isActive ? "oklch(0.52 0.18 220 / 0.5)" : "oklch(0.24 0.04 260)"}`,
                  color: isActive
                    ? "oklch(0.78 0.18 220)"
                    : "oklch(0.60 0.05 240)",
                }}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {errorMsg && !loading && (
        <div
          data-ocid="archive.error_state"
          className="flex flex-col items-center justify-center py-10 gap-4"
        >
          <Archive
            className="w-10 h-10"
            style={{ color: "oklch(0.55 0.14 25)" }}
          />
          <p
            className="text-sm text-center"
            style={{ color: "oklch(0.75 0.10 25)" }}
          >
            {errorMsg}
          </p>
          <Button
            type="button"
            data-ocid="archive.primary_button"
            onClick={() => fetchDocs(activeQuery, mediaFilter, 1, false)}
            style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      )}

      {/* Results */}
      {loading && docs.length === 0 ? (
        <div
          data-ocid="archive.loading_state"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        >
          {SKELETON_IDS.map((id) => (
            <div key={id} className="rounded-xl overflow-hidden">
              <Skeleton className="w-full h-32" />
              <div className="p-2 space-y-1">
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : docs.length === 0 && !loading && !errorMsg ? (
        <div
          data-ocid="archive.empty_state"
          className="flex flex-col items-center justify-center py-20 gap-3"
        >
          <Archive
            className="w-12 h-12"
            style={{ color: "oklch(0.35 0.05 260)" }}
          />
          <p className="text-sm" style={{ color: "oklch(0.50 0.05 240)" }}>
            No results found. Try a different search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {docs.map((doc, i) => {
            const mt = doc.mediatype ?? "texts";
            const badgeStyle =
              MEDIA_BADGE_STYLES[mt] ??
              "bg-gray-500/15 text-gray-400 border-gray-500/25";
            const desc = Array.isArray(doc.description)
              ? doc.description[0]
              : doc.description;
            return (
              <motion.button
                key={doc.identifier}
                type="button"
                data-ocid={`archive.item.${(i % 50) + 1}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i % 12) * 0.03 }}
                onClick={() => setSelectedDoc(doc)}
                className="rounded-xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: "oklch(0.12 0.03 260)",
                  border: "1px solid oklch(0.20 0.04 260)",
                }}
              >
                <div
                  className="w-full h-28 overflow-hidden relative"
                  style={{ background: "oklch(0.09 0.03 260)" }}
                >
                  <img
                    src={`https://archive.org/services/img/${doc.identifier}`}
                    alt={doc.title ?? doc.identifier}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-white line-clamp-2 leading-tight mb-1">
                    {doc.title ?? doc.identifier}
                  </p>
                  {desc && (
                    <p
                      className="text-[10px] line-clamp-2 mb-1.5"
                      style={{ color: "oklch(0.52 0.04 240)" }}
                    >
                      {desc}
                    </p>
                  )}
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border ${badgeStyle}`}
                  >
                    {MEDIA_LABELS[mt] ?? mt}
                  </span>
                </div>
              </motion.button>
            );
          })}

          {/* Infinite scroll sentinel */}
          <div ref={observerRef} className="col-span-full h-8" />
          {loading && hasMore && (
            <div className="col-span-full flex justify-center py-4">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{
                  borderColor: "oklch(0.52 0.18 220)",
                  borderTopColor: "transparent",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Item viewer modal */}
      {selectedDoc && (
        <ArchiveItemViewer
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
