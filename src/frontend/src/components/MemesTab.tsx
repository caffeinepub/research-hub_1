import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Search, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SensitiveContentBlur } from "./SensitiveContentBlur";

interface MemeItem {
  id: string;
  url: string;
  title: string;
  source: "Giphy" | "Tenor" | "Imgflip" | "Archive" | "Reddit";
  previewUrl?: string;
  pageUrl?: string;
}

const SOURCE_COLORS: Record<string, string> = {
  Giphy: "oklch(0.65 0.18 320)",
  Tenor: "oklch(0.65 0.18 160)",
  Imgflip: "oklch(0.65 0.18 55)",
  Archive: "oklch(0.65 0.14 240)",
  Reddit: "oklch(0.65 0.18 25)",
};

async function fetchRedditMemes(q: string, after = ""): Promise<MemeItem[]> {
  try {
    const subreddits = ["memes", "funny", "dankmemes", "reactiongifs"];
    const sub = subreddits[Math.floor(Math.random() * subreddits.length)];
    const afterParam = after ? `&after=${after}` : "";
    const r = await fetch(
      `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&limit=25&sort=relevance&t=all${afterParam}`,
      { headers: { Accept: "application/json" } },
    );
    const data = await r.json();
    const posts = data?.data?.children ?? [];
    return posts
      .filter(
        (p: any) =>
          p.data?.url &&
          (p.data.url.endsWith(".gif") ||
            p.data.url.endsWith(".jpg") ||
            p.data.url.endsWith(".png") ||
            p.data.url.includes("i.redd.it") ||
            p.data.url.includes("imgur.com")),
      )
      .map((p: any) => ({
        id: `reddit-${p.data.id}`,
        url: p.data.url,
        previewUrl:
          p.data.thumbnail !== "self" && p.data.thumbnail !== "default"
            ? p.data.thumbnail
            : p.data.url,
        title: p.data.title || "Reddit Meme",
        source: "Reddit" as const,
        pageUrl: `https://reddit.com${p.data.permalink}`,
      }));
  } catch {
    return [];
  }
}

async function fetchGiphy(q: string, offset = 0): Promise<MemeItem[]> {
  try {
    const endpoint = q.trim()
      ? `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(q)}&limit=50&offset=${offset}&rating=g`
      : "https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=50&rating=g";
    const r = await fetch(endpoint);
    const data = await r.json();
    return (data.data || []).map((g: any) => ({
      id: `giphy-${g.id}`,
      url: g.images?.original?.url || g.images?.downsized?.url || "",
      previewUrl:
        g.images?.fixed_width_small?.url || g.images?.preview_gif?.url || "",
      title: g.title || "GIF",
      source: "Giphy" as const,
      pageUrl: g.url,
    }));
  } catch (err) {
    console.error("Giphy fetch error:", err);
    return [];
  }
}

async function fetchTenor(q: string, pos = ""): Promise<MemeItem[]> {
  try {
    const posParam = pos ? `&pos=${pos}` : "";
    const endpoint = q.trim()
      ? `https://tenor.googleapis.com/v2/search?key=AIzaSyAyimkuYQYF_FXVALexPzkcsvZpe6AoxjI&q=${encodeURIComponent(q)}&limit=20${posParam}`
      : "https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPzkcsvZpe6AoxjI&limit=20";
    const r = await fetch(endpoint);
    const data = await r.json();
    return (data.results || []).map((g: any) => ({
      id: `tenor-${g.id}`,
      url: g.media_formats?.gif?.url || g.media_formats?.tinygif?.url || "",
      previewUrl:
        g.media_formats?.tinygif?.url || g.media_formats?.nanogif?.url || "",
      title: g.content_description || "GIF",
      source: "Tenor" as const,
      pageUrl: g.itemurl,
    }));
  } catch {
    return [];
  }
}

async function fetchImgflip(): Promise<MemeItem[]> {
  try {
    const r = await fetch("https://api.imgflip.com/get_memes");
    const data = await r.json();
    const memes: any[] = data.data?.memes || [];
    return memes.slice(0, 100).map((m) => ({
      id: `imgflip-${m.id}`,
      url: m.url,
      previewUrl: m.url,
      title: m.name,
      source: "Imgflip" as const,
      pageUrl: `https://imgflip.com/meme/${m.id}`,
    }));
  } catch {
    return [];
  }
}

async function fetchArchiveMemes(q: string, page = 1): Promise<MemeItem[]> {
  try {
    const searchQ = q.trim()
      ? `${q} AND (collection:GIFs OR collection:memes OR subject:memes OR subject:gif) AND mediatype:image`
      : "(collection:GIFs OR collection:memes OR subject:memes) AND mediatype:image";
    const params = new URLSearchParams();
    params.set("q", searchQ);
    params.set("output", "json");
    params.set("rows", "30");
    params.set("page", String(page));
    params.append("fl[]", "identifier");
    params.append("fl[]", "title");
    params.append("sort[]", "downloads desc");
    const url = `https://archive.org/advancedsearch.php?${params.toString()}`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    return (data?.response?.docs ?? []).map((d: any, idx: number) => ({
      id: `archive-${d.identifier}-${idx}`,
      url: `https://archive.org/services/img/${d.identifier}`,
      previewUrl: `https://archive.org/services/img/${d.identifier}`,
      title: d.title || d.identifier,
      source: "Archive" as const,
      pageUrl: `https://archive.org/details/${d.identifier}`,
    }));
  } catch {
    return [];
  }
}

function interleave(arrays: MemeItem[][]): MemeItem[] {
  const merged: MemeItem[] = [];
  const max = Math.max(...arrays.map((a) => a.length));
  for (let i = 0; i < max; i++) {
    for (const arr of arrays) {
      if (arr[i]) merged.push(arr[i]);
    }
  }
  return merged;
}

interface MemesTabProps {
  onSendToChat?: (item: MemeItem) => void;
}

export function MemesTab({ onSendToChat }: MemesTabProps) {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState<MemeItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(30);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [giphyOffset, setGiphyOffset] = useState(0);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "gifs" | "memes" | "stickers"
  >("all");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const currentQueryRef = useRef("");
  const loadingRef = useRef(false);

  async function doSearch(q: string, cat = activeCategory) {
    const trimmed = q.trim();
    setAllItems([]);
    setVisibleCount(30);
    setLoading(true);
    setSearched(true);
    setPage(1);
    setGiphyOffset(0);
    currentQueryRef.current = trimmed;
    loadingRef.current = true;

    let items: MemeItem[] = [];
    if (cat === "stickers") {
      const stickerEndpoint = trimmed
        ? `https://api.giphy.com/v1/stickers/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(trimmed)}&limit=50&rating=g`
        : "https://api.giphy.com/v1/stickers/trending?api_key=dc6zaTOxFJmzC&limit=50&rating=g";
      try {
        const r = await fetch(stickerEndpoint);
        const data = await r.json();
        items = (data.data || []).map((g: any) => ({
          id: `giphy-sticker-${g.id}`,
          url: g.images?.original?.url || g.images?.downsized?.url || "",
          previewUrl:
            g.images?.fixed_width_small?.url ||
            g.images?.preview_gif?.url ||
            "",
          title: g.title || "Sticker",
          source: "Giphy" as const,
          pageUrl: g.url,
        }));
      } catch {
        /* ignore */
      }
    } else if (cat === "gifs") {
      const settled = await Promise.allSettled([
        fetchGiphy(trimmed, 0),
        fetchTenor(trimmed, ""),
      ]);
      const [giphy, tenor] = settled.map((r) =>
        r.status === "fulfilled" ? r.value : [],
      );
      items = interleave([giphy, tenor]);
    } else if (cat === "memes") {
      const settled = await Promise.allSettled([
        fetchImgflip(),
        fetchRedditMemes(trimmed, ""),
        fetchArchiveMemes(trimmed, 1),
      ]);
      const [imgflip, reddit, archive] = settled.map((r) =>
        r.status === "fulfilled" ? r.value : [],
      );
      items = interleave([imgflip, reddit, archive]);
    } else {
      const settled = await Promise.allSettled([
        fetchGiphy(trimmed, 0),
        fetchTenor(trimmed, ""),
        fetchImgflip(),
        fetchArchiveMemes(trimmed, 1),
        fetchRedditMemes(trimmed, ""),
      ]);
      const [giphy, tenor, imgflip, archive, reddit] = settled.map((r) =>
        r.status === "fulfilled" ? r.value : [],
      );
      items = interleave([giphy, tenor, imgflip, archive, reddit]);
    }

    setAllItems(items);
    setLoading(false);
    loadingRef.current = false;
  }

  async function loadMore() {
    if (loadingMore || loadingRef.current) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const nextOffset = giphyOffset + 50;
    const q = currentQueryRef.current;
    const settled = await Promise.allSettled([
      fetchGiphy(q, nextOffset),
      fetchArchiveMemes(q, nextPage),
      fetchRedditMemes(q, ""),
    ]);
    const [giphy, archive, reddit] = settled.map((r) =>
      r.status === "fulfilled" ? r.value : [],
    );
    const newItems = interleave([giphy, archive, reddit]);
    if (newItems.length > 0) {
      setAllItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const unique = newItems.filter((i) => !existingIds.has(i.id));
        return [...prev, ...unique];
      });
      setPage(nextPage);
      setGiphyOffset(nextOffset);
    }
    setLoadingMore(false);
  }

  // Load trending on mount only — no debounce auto-search
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    doSearch("");
  }, []);

  // Infinite scroll
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadMore is stable
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (loading || loadingRef.current) return;
        if (visibleCount < allItems.length) {
          setVisibleCount((c) => c + 30);
        } else {
          loadMore();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCount, allItems.length, loading]);

  const copyLink = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied!"));
  };

  const visibleItems = allItems.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      {/* Search bar — only fires on explicit submit */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSearch(query);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
            style={{ color: "oklch(0.6 0.1 230)" }}
          />
          <Input
            data-ocid="memes.search_input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memes, GIFs, stickers..."
            className="pl-11 h-12 text-base rounded-xl"
            style={{
              background: "oklch(0.18 0.04 260)",
              color: "oklch(0.95 0.02 240)",
              borderColor: "oklch(0.28 0.05 260)",
            }}
          />
        </div>
        <Button
          data-ocid="memes.submit_button"
          type="submit"
          disabled={loading}
          className="h-12 px-5 rounded-xl"
          style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
        >
          {loading ? (
            <span className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </Button>
      </form>

      {/* Category filter tabs */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {(["all", "gifs", "memes", "stickers"] as const).map((cat) => {
          const labels = {
            all: "All",
            gifs: "GIFs",
            memes: "Memes",
            stickers: "Stickers",
          };
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              data-ocid={`memes.${cat}_tab`}
              onClick={() => {
                setActiveCategory(cat);
                doSearch(query, cat);
              }}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: isActive
                  ? "oklch(0.52 0.18 220)"
                  : "oklch(0.16 0.03 260)",
                color: isActive ? "white" : "oklch(0.65 0.06 240)",
                border: isActive ? "none" : "1px solid oklch(0.26 0.05 260)",
              }}
            >
              {labels[cat]}
            </button>
          );
        })}
      </div>

      {/* Quick-pick chips */}
      <div className="flex flex-wrap gap-2">
        {[
          "funny",
          "cat",
          "dog",
          "reaction",
          "happy",
          "epic fail",
          "win",
          "minion",
          "doge",
          "spongebob",
          "trending",
          "anime",
        ].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              setQuery(chip);
              doSearch(chip, activeCategory);
            }}
            className="text-xs px-3 py-1 rounded-full border transition-colors hover:opacity-80"
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

      {/* Source legend */}
      <div className="flex flex-wrap gap-2 items-center">
        <Smile className="w-4 h-4" style={{ color: "oklch(0.65 0.14 55)" }} />
        <span className="text-xs" style={{ color: "oklch(0.6 0.04 240)" }}>
          Sources:
        </span>
        {Object.entries(SOURCE_COLORS).map(([src, color]) => (
          <Badge
            key={src}
            variant="outline"
            className="text-xs"
            style={{ borderColor: color, color }}
          >
            {src}
          </Badge>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div
          data-ocid="memes.loading_state"
          className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3"
        >
          {[120, 160, 140, 200, 120, 160, 140, 200, 120, 160, 140, 200].map(
            (h, i) => (
              <Skeleton
                key={`skeleton-item-${i}-${h}`}
                className="w-full rounded-xl"
                style={{ height: `${h}px` }}
              />
            ),
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && allItems.length === 0 && (
        <div
          data-ocid="memes.empty_state"
          className="text-center py-16"
          style={{ color: "oklch(0.55 0.04 240)" }}
        >
          <Smile className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No results found</p>
          <p className="text-xs mt-1 opacity-60">Try a different search term</p>
        </div>
      )}

      {/* Masonry grid */}
      {!loading && visibleItems.length > 0 && (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
          {visibleItems.map((item, idx) => (
            <div
              key={item.id}
              data-ocid={`memes.item.${idx + 1}`}
              className="break-inside-avoid group relative rounded-xl overflow-hidden cursor-pointer"
              style={{ background: "oklch(0.16 0.04 260)" }}
            >
              <SensitiveContentBlur label={item.title}>
                <img
                  src={item.previewUrl || item.url}
                  alt={item.title}
                  className="w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </SensitiveContentBlur>

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col justify-end opacity-0 group-hover:opacity-100">
                <div className="p-2">
                  <p className="text-xs font-medium truncate text-white mb-1">
                    {item.title}
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => copyLink(item.url)}
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/20 text-white hover:bg-white/30 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    {onSendToChat && (
                      <button
                        type="button"
                        onClick={() => onSendToChat(item)}
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/20 text-white hover:bg-white/30 transition-colors"
                      >
                        Send
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Source badge */}
              <div className="absolute top-1.5 left-1.5">
                <Badge
                  className="text-[10px] px-1.5 py-0 h-4 font-medium"
                  style={{
                    background: `${SOURCE_COLORS[item.source]}33`,
                    color: SOURCE_COLORS[item.source],
                    border: `1px solid ${SOURCE_COLORS[item.source]}55`,
                  }}
                >
                  {item.source}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <span
            className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full"
            style={{ color: "oklch(0.52 0.18 220)" }}
          />
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
