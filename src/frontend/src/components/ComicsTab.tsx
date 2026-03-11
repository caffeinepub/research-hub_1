import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  BookImage,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Search,
  Send,
  ZoomIn,
  ZoomOut,
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
}

interface Comment {
  id: string;
  text: string;
  timestamp: number;
  author: string;
}

interface SavedComic {
  id: string;
  title: string;
  coverUrl: string;
  creator?: string;
  year?: string;
  archiveId?: string;
  savedAt: number;
}

function getSavedComics(): SavedComic[] {
  try {
    return JSON.parse(localStorage.getItem("rh_saved_comics") ?? "[]");
  } catch {
    return [];
  }
}

function setSavedComics(comics: SavedComic[]) {
  localStorage.setItem("rh_saved_comics", JSON.stringify(comics));
}

function getComicComments(comicId: string): Comment[] {
  try {
    return JSON.parse(
      localStorage.getItem(`rh_comic_comments_${comicId}`) ?? "[]",
    );
  } catch {
    return [];
  }
}

function setComicComments(comicId: string, comments: Comment[]) {
  localStorage.setItem(
    `rh_comic_comments_${comicId}`,
    JSON.stringify(comments),
  );
}

async function fetchComics(q: string, page = 1): Promise<Comic[]> {
  const results: Comic[] = [];
  try {
    const subject = q
      ? `subject:(comics OR "comic strips" OR "comic books") AND (${q})`
      : `(subject:comics OR subject:"comic strips" OR subject:"comic books" OR collection:digitalcomicmuseum OR collection:comicbookplus)`;
    const params = new URLSearchParams({
      q: `mediatype:texts AND (${subject})`,
      output: "json",
      rows: "50",
      page: String(page),
    });
    params.append("fl[]", "identifier");
    params.append("fl[]", "title");
    params.append("fl[]", "creator");
    params.append("fl[]", "year");
    params.append("sort[]", "downloads desc");
    const r = await fetch(
      `https://archive.org/advancedsearch.php?${params.toString()}`,
    );
    if (!r.ok) return results;
    const data = await r.json();
    for (const doc of data.response?.docs ?? []) {
      if (!doc.identifier) continue;
      results.push({
        id: `archive-${doc.identifier}`,
        title: doc.title || doc.identifier,
        coverUrl: `https://archive.org/services/img/${doc.identifier}`,
        creator: Array.isArray(doc.creator) ? doc.creator[0] : doc.creator,
        year: Array.isArray(doc.year) ? doc.year[0] : doc.year,
        source: "Archive.org",
        archiveId: doc.identifier,
      });
    }
  } catch {
    // ignore fetch errors
  }
  return results;
}

interface ComicReaderProps {
  comic: Comic;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (comic: Comic) => void;
}

function ComicReader({
  comic,
  isSaved,
  onClose,
  onToggleSave,
}: ComicReaderProps) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [comments, setComments] = useState<Comment[]>(() =>
    getComicComments(comic.id),
  );
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!comic.archiveId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`https://archive.org/metadata/${comic.archiveId}`)
      .then((r) => r.json())
      .then((data) => {
        const files: { name: string }[] = data.files ?? [];
        const imageFiles = files
          .filter(
            (f) =>
              /\.(jpg|jpeg|png|gif)$/i.test(f.name) &&
              !f.name.toLowerCase().includes("thumb") &&
              !f.name.toLowerCase().includes("_t."),
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(
            (f) =>
              `https://archive.org/download/${comic.archiveId}/${encodeURIComponent(f.name)}`,
          );
        setPageUrls(imageFiles);
        setTotalPages(imageFiles.length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [comic.archiveId]);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: `${Date.now()}`,
      text: commentText.trim(),
      timestamp: Date.now(),
      author: "You",
    };
    const updated = [newComment, ...comments];
    setComments(updated);
    setComicComments(comic.id, updated);
    setCommentText("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "oklch(0.08 0.02 265)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid oklch(0.20 0.04 260)" }}
      >
        <button
          type="button"
          data-ocid="comics.close_button"
          onClick={onClose}
          className="p-2 rounded-lg transition-colors"
          style={{ background: "oklch(0.22 0.05 260)", color: "white" }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-white">
            {comic.title}
          </p>
          {comic.creator && (
            <p className="text-xs" style={{ color: "oklch(0.55 0.05 240)" }}>
              {comic.creator}
            </p>
          )}
        </div>
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-ocid="comics.secondary_button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              background: "oklch(0.20 0.04 260)",
              color: "oklch(0.75 0.08 240)",
            }}
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span
            className="text-xs min-w-[3rem] text-center"
            style={{ color: "oklch(0.65 0.06 240)" }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            data-ocid="comics.primary_button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              background: "oklch(0.20 0.04 260)",
              color: "oklch(0.75 0.08 240)",
            }}
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        {/* Save */}
        <button
          type="button"
          data-ocid="comics.save_button"
          onClick={() => onToggleSave(comic)}
          className="p-2 rounded-lg transition-colors"
          style={{
            background: isSaved
              ? "oklch(0.52 0.18 220 / 0.25)"
              : "oklch(0.20 0.04 260)",
            color: isSaved ? "oklch(0.72 0.18 220)" : "oklch(0.65 0.06 240)",
          }}
          title={isSaved ? "Unsave comic" : "Save comic"}
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
        {/* Comments toggle */}
        <button
          type="button"
          data-ocid="comics.toggle"
          onClick={() => setShowComments((s) => !s)}
          className="p-2 rounded-lg transition-colors"
          style={{
            background: showComments
              ? "oklch(0.52 0.18 150 / 0.25)"
              : "oklch(0.20 0.04 260)",
            color: showComments
              ? "oklch(0.72 0.18 150)"
              : "oklch(0.65 0.06 240)",
          }}
          title="Comments"
        >
          <MessageCircle className="w-4 h-4" />
          {comments.length > 0 && (
            <span className="ml-1 text-xs">{comments.length}</span>
          )}
        </button>
        {totalPages !== null && totalPages > 0 && (
          <span
            className="text-xs shrink-0"
            style={{ color: "oklch(0.55 0.05 240)" }}
          >
            {page} / {totalPages}
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main reading area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content */}
          <div
            className="flex-1 overflow-auto flex items-start justify-center p-4"
            style={{ background: "oklch(0.08 0.02 265)" }}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3 mt-20">
                <div
                  className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full"
                  style={{ color: "oklch(0.65 0.18 200)" }}
                />
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.55 0.05 240)" }}
                >
                  Loading comic pages...
                </p>
              </div>
            ) : pageUrls.length > 0 ? (
              <div className="relative">
                <img
                  src={pageUrls[page - 1]}
                  alt={`Page ${page}`}
                  className="rounded-lg shadow-2xl transition-transform duration-200"
                  style={{
                    maxWidth: "100%",
                    transform: `scale(${zoom})`,
                    transformOrigin: "top center",
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full">
                <iframe
                  src={`https://archive.org/embed/${comic.archiveId}`}
                  className="w-full rounded-xl border-0"
                  style={{ minHeight: "70vh" }}
                  allowFullScreen
                  title={comic.title}
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              </div>
            )}
          </div>

          {/* Page navigation */}
          {totalPages !== null && totalPages > 1 && (
            <div
              className="flex items-center justify-center gap-4 px-4 py-3 shrink-0"
              style={{ borderTop: "1px solid oklch(0.20 0.04 260)" }}
            >
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-ocid="comics.pagination_prev"
                className="h-8"
                style={{ borderColor: "oklch(0.28 0.06 260)", color: "white" }}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <div className="flex items-center gap-1">
                {/* Page number quick jump */}
                <span
                  className="text-sm font-mono"
                  style={{ color: "oklch(0.72 0.06 240)" }}
                >
                  Page {page} of {totalPages}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= (totalPages ?? 1)}
                onClick={() => setPage((p) => Math.min(totalPages ?? 1, p + 1))}
                data-ocid="comics.pagination_next"
                className="h-8"
                style={{ borderColor: "oklch(0.28 0.06 260)", color: "white" }}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Comments panel */}
        {showComments && (
          <div
            className="w-72 flex flex-col shrink-0"
            style={{
              borderLeft: "1px solid oklch(0.20 0.04 260)",
              background: "oklch(0.10 0.025 265)",
            }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid oklch(0.18 0.04 260)" }}
            >
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageCircle
                  className="w-4 h-4"
                  style={{ color: "oklch(0.65 0.14 150)" }}
                />
                Comments ({comments.length})
              </h3>
            </div>
            {/* Add comment */}
            <div
              className="p-3"
              style={{ borderBottom: "1px solid oklch(0.18 0.04 260)" }}
            >
              <Textarea
                data-ocid="comics.textarea"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="text-sm resize-none text-white"
                rows={3}
                style={{
                  background: "oklch(0.16 0.04 260)",
                  border: "1px solid oklch(0.28 0.06 260)",
                  color: "white",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) handleAddComment();
                }}
              />
              <Button
                type="button"
                data-ocid="comics.submit_button"
                size="sm"
                className="mt-2 w-full h-8 gap-1"
                style={{ background: "oklch(0.52 0.18 150)", color: "white" }}
                onClick={handleAddComment}
              >
                <Send className="w-3 h-3" /> Post Comment
              </Button>
            </div>
            {/* Comment list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {comments.length === 0 ? (
                <div
                  className="text-center py-8"
                  data-ocid="comics.empty_state"
                >
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.45 0.05 240)" }}
                  >
                    No comments yet. Be the first!
                  </p>
                </div>
              ) : (
                comments.map((c, idx) => (
                  <div
                    key={c.id}
                    data-ocid={`comments.item.${idx + 1}`}
                    className="rounded-lg p-3"
                    style={{
                      background: "oklch(0.14 0.03 260)",
                      border: "1px solid oklch(0.22 0.04 260)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "oklch(0.72 0.14 220)" }}
                      >
                        {c.author}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: "oklch(0.42 0.04 240)" }}
                      >
                        {new Date(c.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-white leading-relaxed">
                      {c.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ComicsTab() {
  const [query, setQuery] = useState("");
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [savedComics, setSavedComicsState] = useState<SavedComic[]>(() =>
    getSavedComics(),
  );
  const [activeTab, setActiveTab] = useState("browse");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(false);

  const doSearch = useCallback(async (q: string, pg = 1) => {
    setLoading(true);
    if (pg === 1) setComics([]);
    const results = await fetchComics(q, pg);
    setComics((prev) => (pg === 1 ? results : [...prev, ...results]));
    setPage(pg);
    setLoading(false);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      doSearch("", 1);
    }
  }, [doSearch]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && comics.length > 0) {
          doSearch(query, page + 1);
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, page, query, doSearch, comics.length]);

  const handleToggleSave = (comic: Comic) => {
    const existing = savedComics.find((s) => s.id === comic.id);
    let updated: SavedComic[];
    if (existing) {
      updated = savedComics.filter((s) => s.id !== comic.id);
    } else {
      updated = [
        {
          id: comic.id,
          title: comic.title,
          coverUrl: comic.coverUrl,
          creator: comic.creator,
          year: comic.year,
          archiveId: comic.archiveId,
          savedAt: Date.now(),
        },
        ...savedComics,
      ];
    }
    setSavedComicsState(updated);
    setSavedComics(updated);
  };

  const isSaved = (comicId: string) =>
    savedComics.some((s) => s.id === comicId);

  if (selectedComic) {
    return (
      <ComicReader
        comic={selectedComic}
        isSaved={isSaved(selectedComic.id)}
        onClose={() => setSelectedComic(null)}
        onToggleSave={handleToggleSave}
      />
    );
  }

  const GENRE_CHIPS = [
    "Superman",
    "Batman",
    "Horror",
    "Romance",
    "Western",
    "Sci-Fi",
    "Crime",
    "War",
    "Adventure",
    "Funny",
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className="h-9 p-1"
          style={{ background: "oklch(0.14 0.03 260)" }}
        >
          <TabsTrigger
            value="browse"
            data-ocid="comics.tab"
            className="text-sm px-4"
          >
            <BookImage className="w-3.5 h-3.5 mr-1.5" />
            Browse
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            data-ocid="comics.tab"
            className="text-sm px-4"
          >
            <Bookmark className="w-3.5 h-3.5 mr-1.5" />
            Saved ({savedComics.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4 space-y-4">
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
                placeholder="Search comics — Superman, Batman, horror, sci-fi..."
                className="pl-10 h-11 rounded-xl"
                style={{
                  background: "oklch(0.18 0.04 260)",
                  border: "1px solid oklch(0.3 0.06 260)",
                  color: "white",
                }}
              />
            </div>
            <Button
              data-ocid="comics.submit_button"
              type="submit"
              disabled={loading}
              className="h-11 px-5 rounded-xl"
              style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
            >
              {loading && comics.length === 0 ? (
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </form>

          {/* Genre chips */}
          <div className="flex flex-wrap gap-2">
            {GENRE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                data-ocid="comics.tab"
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

          {/* Source info */}
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
              {Array.from({ length: 10 }, (_, i) => `sk-${i}`).map((sk) => (
                <div key={sk} className="space-y-2">
                  <Skeleton
                    className="aspect-[2/3] rounded-xl"
                    style={{ background: "oklch(0.16 0.04 260)" }}
                  />
                  <Skeleton
                    className="h-3 w-4/5"
                    style={{ background: "oklch(0.16 0.04 260)" }}
                  />
                </div>
              ))}
            </div>
          ) : comics.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              data-ocid="comics.empty_state"
            >
              <div className="text-5xl mb-4">🦸</div>
              <p className="font-semibold text-xl mb-2 text-white">
                No Comics Found
              </p>
              <p className="text-sm" style={{ color: "oklch(0.55 0.05 240)" }}>
                Try a different search term or check your connection.
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
                    className="relative aspect-[2/3] rounded-xl overflow-hidden border transition-all duration-200 group-hover:border-blue-500/50"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span
                        className="flex-1 text-xs font-semibold px-2 py-1 rounded-full text-center"
                        style={{
                          background: "oklch(0.52 0.18 220 / 0.9)",
                          color: "white",
                        }}
                      >
                        Read
                      </span>
                      {isSaved(comic.id) && (
                        <span
                          className="p-1 rounded-full"
                          style={{ background: "oklch(0.52 0.18 220 / 0.9)" }}
                        >
                          <BookmarkCheck className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </div>
                    {comic.year && (
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5"
                          style={{
                            background: "oklch(0.12 0.03 260 / 0.85)",
                            borderColor: "oklch(0.35 0.06 260)",
                            color: "oklch(0.72 0.06 240)",
                          }}
                        >
                          {comic.year}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs font-medium line-clamp-2 px-0.5 text-white">
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
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          {savedComics.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              data-ocid="comics.empty_state"
            >
              <Bookmark
                className="w-12 h-12 mb-4"
                style={{ color: "oklch(0.35 0.06 260)" }}
              />
              <p className="text-lg font-semibold mb-2 text-white">
                No Saved Comics
              </p>
              <p className="text-sm" style={{ color: "oklch(0.55 0.05 240)" }}>
                Open any comic and tap the bookmark icon to save it here.
              </p>
              <Button
                type="button"
                className="mt-4"
                data-ocid="comics.secondary_button"
                onClick={() => setActiveTab("browse")}
                style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
              >
                Browse Comics
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {savedComics.map((saved, idx) => (
                <button
                  key={saved.id}
                  type="button"
                  data-ocid={`comics.item.${idx + 1}`}
                  className="cursor-pointer group text-left"
                  onClick={() =>
                    setSelectedComic({
                      id: saved.id,
                      title: saved.title,
                      coverUrl: saved.coverUrl,
                      creator: saved.creator,
                      year: saved.year,
                      source: "Archive.org",
                      archiveId: saved.archiveId,
                    })
                  }
                >
                  <div
                    className="relative aspect-[2/3] rounded-xl overflow-hidden border transition-all"
                    style={{
                      background: "oklch(0.16 0.04 260)",
                      borderColor: "oklch(0.3 0.04 260)",
                    }}
                  >
                    <img
                      src={saved.coverUrl}
                      alt={saved.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span
                        className="block text-xs font-semibold px-2 py-1 rounded-full text-center"
                        style={{
                          background: "oklch(0.52 0.18 220 / 0.9)",
                          color: "white",
                        }}
                      >
                        Read
                      </span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <BookmarkCheck
                        className="w-4 h-4"
                        style={{ color: "oklch(0.72 0.18 220)" }}
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs font-medium line-clamp-2 text-white">
                    {saved.title}
                  </p>
                  {saved.creator && (
                    <p
                      className="text-xs line-clamp-1"
                      style={{ color: "oklch(0.55 0.05 240)" }}
                    >
                      {saved.creator}
                    </p>
                  )}
                  <button
                    type="button"
                    data-ocid={`comics.delete_button.${idx + 1}`}
                    className="mt-1 text-[10px] px-2 py-0.5 rounded-full transition-colors"
                    style={{
                      background: "oklch(0.55 0.18 25 / 0.15)",
                      color: "oklch(0.65 0.14 25)",
                      border: "1px solid oklch(0.40 0.12 25 / 0.3)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSave({
                        id: saved.id,
                        title: saved.title,
                        coverUrl: saved.coverUrl,
                        creator: saved.creator,
                        year: saved.year,
                        source: "Archive.org",
                        archiveId: saved.archiveId,
                      });
                    }}
                  >
                    Remove
                  </button>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
