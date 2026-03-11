import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BookImage,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Comic {
  id: string;
  title: string;
  coverUrl: string;
  creator?: string;
  year?: string;
  source: string;
  archiveId?: string;
  pageUrl?: string;
}

async function fetchComics(q: string, page = 1): Promise<Comic[]> {
  const results: Comic[] = [];

  try {
    const collectionFilter =
      "(collection:digitalcomicmuseum OR collection:comicbookplus OR collection:comics OR subject:comics)";
    const fullQuery = q ? `${q} AND ${collectionFilter}` : collectionFilter;
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(fullQuery)}&fl[]=identifier,title,creator,year,subject&output=json&rows=40&page=${page}&sort[]=downloads+desc`;
    const r = await fetch(url);
    const data = await r.json();
    for (const doc of data.response?.docs ?? []) {
      results.push({
        id: `archive-${doc.identifier}`,
        title: doc.title || doc.identifier,
        coverUrl: `https://archive.org/services/img/${doc.identifier}`,
        creator: Array.isArray(doc.creator) ? doc.creator[0] : doc.creator,
        year: Array.isArray(doc.year) ? doc.year[0] : doc.year,
        source: "Archive.org",
        archiveId: doc.identifier,
        pageUrl: `https://archive.org/details/${doc.identifier}`,
      });
    }
  } catch {}

  return results;
}

interface ComicReaderProps {
  comic: Comic;
  onClose: () => void;
}

function ComicReader({ comic, onClose }: ComicReaderProps) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!comic.archiveId) return;
    setLoading(true);
    fetch(`https://archive.org/metadata/${comic.archiveId}`)
      .then((r) => r.json())
      .then((data) => {
        const files: any[] = data.files ?? [];
        const imageFiles = files
          .filter(
            (f) =>
              /\.(jpg|jpeg|png|gif)$/i.test(f.name) &&
              !f.name.includes("thumb"),
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(
            (f) =>
              `https://archive.org/download/${comic.archiveId}/${encodeURIComponent(f.name)}`,
          );
        if (imageFiles.length > 0) {
          setPageUrls(imageFiles);
          setTotalPages(imageFiles.length);
        } else {
          setPageUrls([]);
          setTotalPages(0);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [comic.archiveId]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "oklch(0.08 0.02 265)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <button
          type="button"
          data-ocid="comics.close_button"
          onClick={onClose}
          className="p-2 rounded-lg transition-colors"
          style={{
            background: "oklch(0.22 0.05 260)",
            color: "oklch(0.9 0.02 240)",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="font-display font-bold text-sm truncate"
            style={{ color: "oklch(0.95 0.02 240)" }}
          >
            {comic.title}
          </p>
          {comic.creator && (
            <p className="text-xs" style={{ color: "oklch(0.55 0.05 240)" }}>
              {comic.creator}
            </p>
          )}
        </div>
        {totalPages !== null && totalPages > 0 && (
          <span className="text-xs" style={{ color: "oklch(0.55 0.05 240)" }}>
            {page} / {totalPages}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex items-center justify-center relative">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full"
              style={{ color: "oklch(0.65 0.18 200)" }}
            />
            <p className="text-sm" style={{ color: "oklch(0.55 0.05 240)" }}>
              Loading comic...
            </p>
          </div>
        ) : pageUrls.length > 0 ? (
          <>
            <img
              src={pageUrls[page - 1]}
              alt={`Page ${page}`}
              className="max-h-full max-w-full object-contain"
              style={{ maxHeight: "calc(100vh - 140px)" }}
            />
            {page > 1 && (
              <button
                type="button"
                data-ocid="comics.pagination_prev"
                onClick={() => setPage((p) => p - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full"
                style={{
                  background: "oklch(0.12 0.03 260 / 0.85)",
                  color: "white",
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {page < (totalPages ?? 1) && (
              <button
                type="button"
                data-ocid="comics.pagination_next"
                onClick={() => setPage((p) => p + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full"
                style={{
                  background: "oklch(0.12 0.03 260 / 0.85)",
                  color: "white",
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full p-4">
            <iframe
              src={`https://archive.org/embed/${comic.archiveId}`}
              className="w-full h-full rounded-xl"
              allowFullScreen
              title={comic.title}
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          </div>
        )}
      </div>

      {/* Page navigation bar */}
      {totalPages !== null && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-white/10 shrink-0">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <span
            className="text-sm font-mono"
            style={{ color: "oklch(0.72 0.06 240)" }}
          >
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= (totalPages ?? 1)}
            onClick={() => setPage((p) => Math.min(totalPages ?? 1, p + 1))}
            className="h-8"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ComicsTab() {
  const [query, setQuery] = useState("");
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string, pg = 1) => {
    setLoading(true);
    setHasSearched(true);
    if (pg === 1) setComics([]);
    const results = await fetchComics(q, pg);
    setComics((prev) => (pg === 1 ? results : [...prev, ...results]));
    setPage(pg);
    setLoading(false);
  }, []);

  // Don't auto-search - show empty state first
  // useEffect(() => { doSearch("", 1); }, [doSearch]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          doSearch(query, page + 1);
        }
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, page, query, doSearch]);

  if (selectedComic) {
    return (
      <ComicReader
        comic={selectedComic}
        onClose={() => setSelectedComic(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSearch(query, 1);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "oklch(0.6 0.1 230)" }}
          />
          <Input
            data-ocid="comics.search_input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search comics — Superman, Batman, horror..."
            className="pl-10 h-11 rounded-xl"
            style={{
              background: "oklch(0.18 0.04 260)",
              border: "1px solid oklch(0.3 0.06 260)",
              color: "oklch(0.95 0.02 240)",
            }}
          />
        </div>
        <Button
          data-ocid="comics.submit_button"
          type="submit"
          disabled={loading}
          className="h-11 px-5 rounded-xl"
          style={{ background: "oklch(0.52 0.18 220)" }}
        >
          {loading ? (
            <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </form>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2">
        {[
          "Superman",
          "Batman",
          "Horror",
          "Romance",
          "Western",
          "Sci-Fi",
          "Crime",
          "War",
        ].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              setQuery(chip);
              doSearch(chip, 1);
            }}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={{
              borderColor: "oklch(0.4 0.06 260)",
              color: "oklch(0.72 0.08 230)",
              background: "oklch(0.18 0.04 260 / 0.5)",
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Info badge */}
      <div className="flex items-center gap-2">
        <BookImage
          className="w-4 h-4"
          style={{ color: "oklch(0.65 0.14 55)" }}
        />
        <span className="text-xs" style={{ color: "oklch(0.55 0.05 240)" }}>
          Public domain comics from Archive.org, Digital Comic Museum &amp;
          Comic Book Plus
        </span>
      </div>

      {/* Grid */}
      {loading && comics.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"].map(
            (sk) => (
              <div key={sk} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-xl" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ),
          )}
        </div>
      ) : !hasSearched ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="comics.empty_state"
        >
          <div className="text-5xl mb-4">🦸</div>
          <p
            className="font-display text-xl font-semibold mb-2"
            style={{ color: "oklch(0.85 0.04 240)" }}
          >
            Search for Public Domain Comics
          </p>
          <p className="text-sm mb-6" style={{ color: "oklch(0.55 0.05 240)" }}>
            Digital Comic Museum, Comic Book Plus, Archive.org
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Superman", "Batman", "Horror", "Romance"].map((chip) => (
              <button
                key={chip}
                type="button"
                data-ocid="comics.tab"
                onClick={() => {
                  setQuery(chip);
                  doSearch(chip, 1);
                }}
                className="px-4 py-2 rounded-full text-sm border transition-colors"
                style={{
                  borderColor: "oklch(0.4 0.08 55)",
                  color: "oklch(0.72 0.1 55)",
                  background: "oklch(0.18 0.04 260 / 0.5)",
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      ) : comics.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="comics.empty_state"
        >
          <BookImage
            className="w-12 h-12 mb-3"
            style={{ color: "oklch(0.45 0.08 260)" }}
          />
          <p style={{ color: "oklch(0.55 0.05 240)" }}>
            No comics found. Try a different search!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {comics.map((comic, idx) => (
            <button
              key={comic.id}
              type="button"
              data-ocid={`comics.item.${idx + 1}`}
              className="cursor-pointer group text-left"
              onClick={() => setSelectedComic(comic)}
            >
              <div
                className="relative aspect-[2/3] rounded-xl overflow-hidden border transition-all duration-200 group-hover:border-primary/50"
                style={{
                  background: "oklch(0.16 0.04 260)",
                  borderColor: "oklch(0.3 0.04 260)",
                }}
              >
                <img
                  src={comic.coverUrl}
                  alt={comic.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      background: "oklch(0.52 0.18 220 / 0.9)",
                      color: "white",
                    }}
                  >
                    Read
                  </span>
                </div>
                {comic.year && (
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5"
                      style={{
                        background: "oklch(0.12 0.03 260 / 0.8)",
                        borderColor: "oklch(0.35 0.06 260)",
                        color: "oklch(0.72 0.06 240)",
                      }}
                    >
                      {comic.year}
                    </Badge>
                  </div>
                )}
              </div>
              <p
                className="mt-1.5 text-xs font-medium line-clamp-2 px-0.5"
                style={{ color: "oklch(0.82 0.04 240)" }}
              >
                {comic.title}
              </p>
              {comic.creator && (
                <p
                  className="text-xs line-clamp-1 px-0.5"
                  style={{ color: "oklch(0.55 0.05 240)" }}
                >
                  {comic.creator}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && comics.length > 0 && (
        <div ref={sentinelRef} className="h-10" aria-hidden="true" />
      )}
      {loading && comics.length > 0 && (
        <div className="flex justify-center py-4">
          <span
            className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full"
            style={{ color: "oklch(0.65 0.14 240)" }}
          />
        </div>
      )}
    </div>
  );
}
