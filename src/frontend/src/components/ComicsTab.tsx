import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  BookImage,
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  Search,
  Send,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SensitiveContentBlur } from "./SensitiveContentBlur";

interface Comic {
  id: string;
  title: string;
  coverUrl: string;
  creator?: string;
  year?: string;
  source: string;
  archiveId?: string;
  altText?: string;
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

const XKCD_NUMS = (() => {
  const latest = 2900;
  const nums: number[] = [];
  const used = new Set<number>();
  while (nums.length < 50) {
    const n = Math.floor(Math.random() * latest) + 1;
    if (!used.has(n)) {
      used.add(n);
      nums.push(n);
    }
  }
  return nums;
})();

async function fetchXkcdStrips(nums: number[]): Promise<Comic[]> {
  const results = await Promise.allSettled(
    nums.map((num) =>
      fetch(`https://xkcd.com/${num}/info.0.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ),
  );
  return results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => {
      const c = (r as PromiseFulfilledResult<any>).value;
      return {
        id: `xkcd-${c.num}`,
        title: c.title ?? `XKCD #${c.num}`,
        coverUrl: c.img ?? "",
        creator: "Randall Munroe",
        year: String(c.year ?? ""),
        source: "XKCD",
        archiveId: undefined,
        altText: c.alt ?? "",
      };
    })
    .filter((c) => c.coverUrl);
}

async function fetchArchiveComics(q: string): Promise<Comic[]> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 25000);
  try {
    const subject = q.trim()
      ? `(${q}) AND (subject:"comic book" OR subject:"comic strip" OR subject:comics OR collection:digitalcomicmuseum OR collection:comicbookplus)`
      : `(subject:"comic book" OR subject:"comic strip" OR subject:comics OR collection:digitalcomicmuseum OR collection:comicbookplus) AND mediatype:texts`;
    const params = new URLSearchParams();
    params.set("q", subject);
    params.set("output", "json");
    params.set("rows", "30");
    params.set("page", "1");
    params.append("fl[]", "identifier");
    params.append("fl[]", "title");
    params.append("fl[]", "creator");
    params.append("fl[]", "year");
    params.append("sort[]", "downloads desc");
    const url = `https://archive.org/advancedsearch.php?${params.toString()}`;
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    if (!r.ok) return [];
    const data = await r.json();
    return (data?.response?.docs ?? [])
      .filter((doc: any) => doc.identifier)
      .map((doc: any) => ({
        id: `archive-${doc.identifier}`,
        title: doc.title || doc.identifier,
        coverUrl: `https://archive.org/services/img/${doc.identifier}`,
        creator: Array.isArray(doc.creator) ? doc.creator[0] : doc.creator,
        year: Array.isArray(doc.year) ? doc.year[0] : doc.year,
        source: "Archive.org",
        archiveId: doc.identifier,
      }));
  } catch {
    clearTimeout(tid);
    return [];
  }
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
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [loadingPages, setLoadingPages] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [comments, setComments] = useState<Comment[]>(() =>
    getComicComments(comic.id),
  );
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    // XKCD comics are single images
    if (comic.source === "XKCD" || !comic.archiveId) {
      setPageUrls(comic.coverUrl ? [comic.coverUrl] : []);
      setLoadingPages(false);
      return;
    }
    setLoadingPages(true);
    fetch(`https://archive.org/metadata/${comic.archiveId}`)
      .then((r) => r.json())
      .then((data) => {
        const files: { name: string }[] = data.files ?? [];
        const imgs = files
          .filter(
            (f) =>
              /\.(jpg|jpeg|png|gif)$/i.test(f.name) &&
              !f.name.toLowerCase().includes("thumb"),
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(
            (f) =>
              `https://archive.org/download/${comic.archiveId}/${encodeURIComponent(f.name)}`,
          );
        setPageUrls(imgs.length > 0 ? imgs : [comic.coverUrl]);
        setLoadingPages(false);
      })
      .catch(() => {
        setPageUrls(comic.coverUrl ? [comic.coverUrl] : []);
        setLoadingPages(false);
      });
  }, [comic.archiveId, comic.coverUrl, comic.source]);

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

  const currentPage = pageUrls[pageIdx];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "oklch(0.08 0.02 265)" }}
      data-ocid="comics.reader_panel"
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded-lg"
            style={{
              background: "oklch(0.20 0.04 260)",
              color: "oklch(0.70 0.06 240)",
            }}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-1.5 rounded-lg"
            style={{
              background: "oklch(0.20 0.04 260)",
              color: "oklch(0.70 0.06 240)",
            }}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleSave(comic)}
            className="p-1.5 rounded-lg"
            style={{
              background: isSaved
                ? "oklch(0.52 0.18 220 / 0.2)"
                : "oklch(0.20 0.04 260)",
              color: isSaved ? "oklch(0.72 0.18 220)" : "oklch(0.55 0.05 240)",
            }}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="p-1.5 rounded-lg"
            style={{
              background: showComments
                ? "oklch(0.52 0.18 220 / 0.2)"
                : "oklch(0.20 0.04 260)",
              color: showComments
                ? "oklch(0.72 0.18 220)"
                : "oklch(0.55 0.05 240)",
            }}
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex gap-4 p-4 min-h-0">
        {/* Comic page */}
        <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
          {loadingPages ? (
            <Skeleton className="w-full max-w-2xl h-[400px] rounded-xl" />
          ) : currentPage ? (
            <>
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  transition: "transform 0.2s",
                }}
              >
                <img
                  src={currentPage}
                  alt={comic.title}
                  className="max-w-full rounded-xl object-contain"
                  style={{ maxHeight: "70vh" }}
                />
              </div>
              {/* XKCD alt text */}
              {comic.altText && (
                <p
                  className="text-xs text-center max-w-lg italic"
                  style={{ color: "oklch(0.55 0.05 240)" }}
                >
                  &ldquo;{comic.altText}&rdquo;
                </p>
              )}
              {/* Page navigation (Archive only) */}
              {pageUrls.length > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 0}
                    onClick={() => setPageIdx((i) => i - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30"
                    style={{
                      background: "oklch(0.20 0.04 260)",
                      color: "white",
                    }}
                  >
                    ← Prev
                  </button>
                  <span
                    className="text-xs"
                    style={{ color: "oklch(0.55 0.05 240)" }}
                  >
                    {pageIdx + 1} / {pageUrls.length}
                  </span>
                  <button
                    type="button"
                    disabled={pageIdx >= pageUrls.length - 1}
                    onClick={() => setPageIdx((i) => i + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30"
                    style={{
                      background: "oklch(0.20 0.04 260)",
                      color: "white",
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10">
              <BookImage
                className="w-12 h-12"
                style={{ color: "oklch(0.40 0.05 260)" }}
              />
              <p className="text-sm" style={{ color: "oklch(0.55 0.05 240)" }}>
                No pages available
              </p>
            </div>
          )}
        </div>

        {/* Comments panel */}
        {showComments && (
          <div
            className="w-72 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
            style={{
              background: "oklch(0.11 0.025 265)",
              border: "1px solid oklch(0.20 0.04 260)",
            }}
          >
            <div
              className="px-3 py-2 border-b"
              style={{ borderColor: "oklch(0.18 0.03 260)" }}
            >
              <p className="text-xs font-semibold text-white">
                Comments ({comments.length})
              </p>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {comments.length === 0 && (
                <p
                  className="text-xs text-center py-4"
                  style={{ color: "oklch(0.45 0.04 240)" }}
                >
                  No comments yet
                </p>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-2 rounded-lg"
                  style={{ background: "oklch(0.15 0.03 265)" }}
                >
                  <p className="text-xs font-medium text-white">{c.author}</p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "oklch(0.65 0.05 240)" }}
                  >
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-2 flex gap-1.5">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="text-xs bg-background border-border text-white resize-none"
                rows={2}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddComment}
                style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const GENRE_CHIPS = [
  { label: "All", q: "" },
  { label: "Superhero", q: "superhero" },
  { label: "Golden Age", q: "golden age" },
  { label: "Horror", q: "horror" },
  { label: "Sci-Fi", q: "science fiction" },
  { label: "Romance", q: "romance" },
  { label: "Western", q: "western" },
  { label: "XKCD", q: "xkcd" },
];

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

export function ComicsTab() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [savedComics, setSavedComicsState] =
    useState<SavedComic[]>(getSavedComics);
  const [activeView, setActiveView] = useState<"browse" | "saved">("browse");

  // Load XKCD immediately on mount, then try Archive in background
  const loadComics = useCallback(async (query: string) => {
    setLoading(true);

    if (query.toLowerCase() === "xkcd" || !query) {
      // Load XKCD first — fast
      const xkcdNums = XKCD_NUMS.slice(0, 30);
      const xkcdComics = await fetchXkcdStrips(xkcdNums);
      setComics(xkcdComics);
      setLoading(false);

      // Then load Archive in background
      if (!query) {
        fetchArchiveComics("").then((archiveComics) => {
          setComics((prev) => {
            const seen = new Set(prev.map((c) => c.id));
            const newOnes = archiveComics.filter((c) => !seen.has(c.id));
            return [...prev, ...newOnes];
          });
        });
      }
    } else {
      // For specific queries: filter XKCD client-side + fetch Archive
      const [allXkcd, archiveComics] = await Promise.all([
        fetchXkcdStrips(XKCD_NUMS),
        fetchArchiveComics(query),
      ]);
      const filteredXkcd = allXkcd.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          (c.altText ?? "").toLowerCase().includes(query.toLowerCase()),
      );
      const seen = new Set<string>();
      const merged: Comic[] = [];
      for (const c of [...filteredXkcd, ...archiveComics]) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          merged.push(c);
        }
      }
      setComics(merged.length > 0 ? merged : allXkcd.slice(0, 20));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComics("");
  }, [loadComics]);

  const handleSearch = () => {
    setActiveQuery(searchInput);
    loadComics(searchInput);
  };

  const handleGenreChip = (q: string) => {
    setSearchInput(q);
    setActiveQuery(q);
    loadComics(q);
  };

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

  const displayComics =
    activeView === "saved"
      ? savedComics.map((s) => ({
          id: s.id,
          title: s.title,
          coverUrl: s.coverUrl,
          creator: s.creator,
          year: s.year,
          source: "Saved",
          archiveId: s.archiveId,
        }))
      : comics;

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
          <BookImage
            className="w-5 h-5"
            style={{ color: "oklch(0.72 0.18 220)" }}
          />
          <span className="font-bold text-white text-lg">Comics</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(0.52 0.18 220 / 0.15)",
              color: "oklch(0.72 0.18 220)",
            }}
          >
            XKCD · Archive.org
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: "oklch(0.55 0.05 240)" }}>
          Browse and read public domain comics and strips
        </p>

        {/* Search */}
        <div className="flex gap-2 mb-3">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search comics by title or genre..."
            className="flex-1 bg-background border-border text-white placeholder:text-muted-foreground"
            data-ocid="comics.search_input"
          />
          <Button
            type="button"
            onClick={handleSearch}
            style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
            data-ocid="comics.search_button"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Genre chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {GENRE_CHIPS.map((chip) => {
            const isActive = activeQuery === chip.q;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleGenreChip(chip.q)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
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
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveView("browse")}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background:
              activeView === "browse"
                ? "oklch(0.52 0.18 220 / 0.2)"
                : "oklch(0.14 0.03 260)",
            border: `1px solid ${activeView === "browse" ? "oklch(0.52 0.18 220 / 0.5)" : "oklch(0.22 0.04 260)"}`,
            color:
              activeView === "browse"
                ? "oklch(0.78 0.18 220)"
                : "oklch(0.55 0.05 240)",
          }}
        >
          Browse
        </button>
        <button
          type="button"
          onClick={() => setActiveView("saved")}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background:
              activeView === "saved"
                ? "oklch(0.52 0.18 220 / 0.2)"
                : "oklch(0.14 0.03 260)",
            border: `1px solid ${activeView === "saved" ? "oklch(0.52 0.18 220 / 0.5)" : "oklch(0.22 0.04 260)"}`,
            color:
              activeView === "saved"
                ? "oklch(0.78 0.18 220)"
                : "oklch(0.55 0.05 240)",
          }}
        >
          Saved ({savedComics.length})
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div
          data-ocid="comics.loading_state"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        >
          {SKELETON_IDS.map((id) => (
            <div key={id} className="rounded-xl overflow-hidden">
              <Skeleton className="w-full h-40" />
              <div className="p-2 space-y-1">
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : displayComics.length === 0 ? (
        <div
          data-ocid="comics.empty_state"
          className="flex flex-col items-center justify-center py-20 gap-3"
        >
          <BookImage
            className="w-12 h-12"
            style={{ color: "oklch(0.35 0.05 260)" }}
          />
          <p className="text-sm" style={{ color: "oklch(0.50 0.05 240)" }}>
            {activeView === "saved"
              ? "No saved comics yet"
              : "No comics found. Try a different search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {displayComics.map((comic, i) => {
            const isSaved = savedComics.some((s) => s.id === comic.id);
            return (
              <button
                key={comic.id}
                type="button"
                data-ocid={`comics.item.${(i % 50) + 1}`}
                onClick={() => setSelectedComic(comic)}
                className="rounded-xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                style={{
                  background: "oklch(0.12 0.03 260)",
                  border: "1px solid oklch(0.20 0.04 260)",
                }}
              >
                <div
                  className="w-full h-40 overflow-hidden relative"
                  style={{ background: "oklch(0.09 0.03 260)" }}
                >
                  <SensitiveContentBlur label={comic.title}>
                    <img
                      src={comic.coverUrl}
                      alt={comic.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </SensitiveContentBlur>
                  {isSaved && (
                    <div
                      className="absolute top-1.5 right-1.5 p-1 rounded-full"
                      style={{ background: "oklch(0.52 0.18 220 / 0.9)" }}
                    >
                      <BookmarkCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-white line-clamp-2 leading-tight mb-1">
                    {comic.title}
                  </p>
                  {comic.creator && (
                    <p
                      className="text-[10px] line-clamp-1 mb-1"
                      style={{ color: "oklch(0.52 0.04 240)" }}
                    >
                      {comic.creator}
                    </p>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0"
                    style={{
                      background:
                        comic.source === "XKCD"
                          ? "oklch(0.55 0.18 160 / 0.15)"
                          : "oklch(0.52 0.18 30 / 0.15)",
                      borderColor:
                        comic.source === "XKCD"
                          ? "oklch(0.55 0.18 160 / 0.4)"
                          : "oklch(0.52 0.18 30 / 0.4)",
                      color:
                        comic.source === "XKCD"
                          ? "oklch(0.72 0.18 160)"
                          : "oklch(0.72 0.18 30)",
                    }}
                  >
                    {comic.source}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedComic && (
        <ComicReader
          comic={selectedComic}
          isSaved={savedComics.some((s) => s.id === selectedComic.id)}
          onClose={() => setSelectedComic(null)}
          onToggleSave={handleToggleSave}
        />
      )}
    </div>
  );
}
