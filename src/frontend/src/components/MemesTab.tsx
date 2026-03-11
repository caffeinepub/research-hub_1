import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, Search, Smile } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
    const r = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(q)}&limit=50&offset=${offset}&rating=g`,
    );
    const data = await r.json();
    const results = (data.data || []).map((g: any) => ({
      id: `giphy-${g.id}`,
      url: g.images?.original?.url || g.images?.downsized?.url || "",
      previewUrl:
        g.images?.fixed_width_small?.url || g.images?.preview_gif?.url || "",
      title: g.title || "GIF",
      source: "Giphy" as const,
      pageUrl: g.url,
    }));
    // Fallback to trending if no results
    if (results.length === 0 && offset === 0) {
      const tr = await fetch(
        "https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=30&rating=g",
      );
      const td = await tr.json();
      return (td.data || []).map((g: any) => ({
        id: `giphy-trend-${g.id}`,
        url: g.images?.original?.url || g.images?.downsized?.url || "",
        previewUrl:
          g.images?.fixed_width_small?.url || g.images?.preview_gif?.url || "",
        title: g.title || "Trending GIF",
        source: "Giphy" as const,
        pageUrl: g.url,
      }));
    }
    return results;
  } catch (err) {
    console.error("Giphy fetch error:", err);
    return [];
  }
}

async function fetchTenor(q: string, pos = ""): Promise<MemeItem[]> {
  try {
    const posParam = pos ? `&pos=${pos}` : "";
    const r = await fetch(
      `https://tenor.googleapis.com/v2/search?key=AIzaSyAyimkuYQYF_FXVALexPzkcsvZpe6AoxjI&q=${encodeURIComponent(q)}&limit=20${posParam}`,
    );
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
    const r = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}+AND+mediatype:image&fl[]=identifier,title,format&output=json&rows=50&page=${page}`,
    );
    const data = await r.json();
    return (data.response?.docs || []).map((d: any) => ({
      id: `archive-${d.identifier}`,
      url: `https://archive.org/download/${d.identifier}/${d.identifier}.jpg`,
      previewUrl: `https://archive.org/services/img/${d.identifier}`,
      title: d.title || d.identifier,
      source: "Archive" as const,
      pageUrl: `https://archive.org/details/${d.identifier}`,
    }));
  } catch {
    return [];
  }
}

async function fetchOpenverseImages(q: string): Promise<MemeItem[]> {
  try {
    const r = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial,modification&page_size=20`,
    );
    const data = await r.json();
    return (data.results || []).map((img: any) => ({
      id: `openverse-${img.id}`,
      url: img.url,
      previewUrl: img.thumbnail || img.url,
      title: img.title || "Image",
      source: "Archive" as const,
      pageUrl: img.foreign_landing_url,
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
  const [query, setQuery] = useState("funny");
  const [allItems, setAllItems] = useState<MemeItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(30);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [giphyOffset, setGiphyOffset] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const currentQueryRef = useRef("");

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setAllItems([]);
    setLoading(true);
    setSearched(true);
    setPage(1);
    setGiphyOffset(0);
    currentQueryRef.current = q;
    const [giphy, tenor, imgflip, archive, reddit] = await Promise.all([
      fetchGiphy(q, 0),
      fetchTenor(q, ""),
      fetchImgflip(),
      fetchArchiveMemes(q, 1),
      fetchRedditMemes(q, ""),
    ]);
    let items = interleave([giphy, tenor, imgflip, archive, reddit]);
    if (items.length === 0) {
      const openverse = await fetchOpenverseImages(q);
      items = openverse;
    }
    setAllItems(items);
    setVisibleCount(30);
    setLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !currentQueryRef.current) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const nextOffset = giphyOffset + 50;
    const q = currentQueryRef.current;
    const [giphy, archive, reddit] = await Promise.all([
      fetchGiphy(q, nextOffset),
      fetchArchiveMemes(q, nextPage),
      fetchRedditMemes(q, ""),
    ]);
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
  }, [loadingMore, page, giphyOffset]);

  useEffect(() => {
    doSearch("funny meme");
  }, [doSearch]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          if (visibleCount < allItems.length) {
            // Show more already-fetched items first
            setVisibleCount((c) => c + 30);
          } else if (!loadingMore) {
            // Fetch next page from APIs
            loadMore();
          }
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, allItems.length, loadingMore, loadMore]);

  const copyLink = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied!"));
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSearch(query);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "oklch(0.6 0.1 230)" }}
          />
          <Input
            data-ocid="memes.search_input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memes, GIFs, stickers..."
            className="pl-9 h-10"
            style={{
              background: "oklch(0.18 0.04 260)",
              color: "oklch(0.95 0.02 240)",
            }}
          />
        </div>
        <Button
          data-ocid="memes.submit_button"
          type="submit"
          disabled={loading}
          size="sm"
          className="h-10 px-4"
        >
          {loading ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </form>

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
        ].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              setQuery(chip);
              doSearch(chip);
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

      {/* Source legend */}
      <div className="flex flex-wrap gap-2 items-center">
        <Smile className="w-4 h-4" style={{ color: "oklch(0.65 0.14 55)" }} />
        <span className="text-xs text-muted-foreground">Sources:</span>
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
          {[
            "s1",
            "s2",
            "s3",
            "s4",
            "s5",
            "s6",
            "s7",
            "s8",
            "s9",
            "s10",
            "s11",
            "s12",
            "s13",
            "s14",
            "s15",
            "s16",
          ].map((k, i) => (
            <Skeleton
              key={k}
              className="w-full rounded-xl mb-3"
              style={{
                height: `${120 + (i % 3) * 40}px`,
                breakInside: "avoid",
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && allItems.length === 0 && (
        <div
          data-ocid="memes.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Smile
            className="w-12 h-12 mb-3"
            style={{ color: "oklch(0.45 0.08 260)" }}
          />
          <p className="text-muted-foreground">
            No memes found. Try a different search!
          </p>
        </div>
      )}

      {/* Masonry grid */}
      {!loading && allItems.length > 0 && (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-3">
          {allItems.slice(0, visibleCount).map((item, idx) => (
            <MemeCard
              key={item.id}
              item={item}
              index={idx + 1}
              onCopy={() => copyLink(item.url)}
              onSendToChat={onSendToChat ? () => onSendToChat(item) : undefined}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {!loading && (
        <div ref={sentinelRef} className="h-10" aria-hidden="true" />
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div
          className="flex justify-center py-4"
          data-ocid="memes.loading_state"
        >
          <span
            className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full"
            style={{ color: "oklch(0.65 0.14 240)" }}
          />
        </div>
      )}
    </div>
  );
}

function MemeCard({
  item,
  index,
  onCopy,
  onSendToChat,
}: {
  item: MemeItem;
  index: number;
  onCopy: () => void;
  onSendToChat?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const color = SOURCE_COLORS[item.source];

  const displayUrl = item.previewUrl || item.url;

  return (
    <div
      data-ocid={`memes.item.${index}`}
      className="relative group mb-3 rounded-xl overflow-hidden cursor-pointer"
      style={{
        breakInside: "avoid",
        border: "1px solid oklch(0.3 0.04 260)",
        background: "oklch(0.16 0.04 260)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {imgError ? (
        <div
          className="w-full flex items-center justify-center text-xs text-muted-foreground"
          style={{ height: "120px" }}
        >
          <Smile className="w-8 h-8 opacity-30" />
        </div>
      ) : (
        <img
          src={displayUrl}
          alt={item.title}
          className="w-full block"
          loading="lazy"
          onError={() => setImgError(true)}
          style={{ display: "block" }}
        />
      )}

      {/* Source badge */}
      <div className="absolute top-2 left-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: color.replace(")", " / 0.15)"),
            border: `1px solid ${color.replace(")", " / 0.4)")}`,
            color,
          }}
        >
          {item.source}
        </span>
      </div>

      {/* Hover overlay */}
      {hovered && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-end pb-3 gap-2"
          style={{ background: "oklch(0.08 0.03 260 / 0.75)" }}
        >
          <p
            className="text-xs text-center px-2 line-clamp-2"
            style={{ color: "oklch(0.9 0.02 240)" }}
          >
            {item.title}
          </p>
          <div className="flex gap-2">
            <Button
              data-ocid={`memes.item.${index}.button`}
              size="sm"
              variant="secondary"
              className="h-7 px-3 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            {onSendToChat && (
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                style={{ background: "oklch(0.52 0.18 220)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSendToChat();
                }}
              >
                Send
              </Button>
            )}
            {item.pageUrl && (
              <a
                href={item.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center h-7 px-2 rounded-md text-xs"
                style={{
                  background: "oklch(0.22 0.05 260)",
                  color: "oklch(0.72 0.08 230)",
                }}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
