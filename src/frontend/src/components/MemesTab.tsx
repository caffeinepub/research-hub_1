import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, Search, Smile } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface MemeItem {
  id: string;
  url: string;
  title: string;
  source: "Giphy" | "Tenor" | "Imgflip" | "Archive";
  previewUrl?: string;
  pageUrl?: string;
}

const SOURCE_COLORS: Record<string, string> = {
  Giphy: "oklch(0.65 0.18 320)",
  Tenor: "oklch(0.65 0.18 160)",
  Imgflip: "oklch(0.65 0.18 55)",
  Archive: "oklch(0.65 0.14 240)",
};

async function fetchGiphy(q: string): Promise<MemeItem[]> {
  try {
    const r = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(q)}&limit=20&rating=g`,
    );
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
  } catch {
    return [];
  }
}

async function fetchTenor(q: string): Promise<MemeItem[]> {
  try {
    const r = await fetch(
      `https://tenor.googleapis.com/v2/search?key=AIzaSyAyimkuYQYF_FXVALexPzkcsvZiClL7blc&q=${encodeURIComponent(q)}&limit=20`,
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

async function fetchImgflip(q: string): Promise<MemeItem[]> {
  try {
    const r = await fetch("https://api.imgflip.com/get_memes");
    const data = await r.json();
    const memes: any[] = data.data?.memes || [];
    const lower = q.toLowerCase();
    const filtered = memes
      .filter((m) => m.name.toLowerCase().includes(lower) || lower.length < 3)
      .slice(0, 20);
    return filtered.map((m) => ({
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

async function fetchArchiveMemes(q: string): Promise<MemeItem[]> {
  try {
    const r = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}+AND+mediatype:image&fl[]=identifier,title,format&output=json&rows=16`,
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

interface MemesTabProps {
  onSendToChat?: (item: MemeItem) => void;
}

export function MemesTab({ onSendToChat }: MemesTabProps) {
  const [query, setQuery] = useState("funny");
  const [items, setItems] = useState<MemeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const [giphy, tenor, imgflip, archive] = await Promise.all([
      fetchGiphy(q),
      fetchTenor(q),
      fetchImgflip(q),
      fetchArchiveMemes(q),
    ]);
    // Interleave sources
    const merged: MemeItem[] = [];
    const max = Math.max(
      giphy.length,
      tenor.length,
      imgflip.length,
      archive.length,
    );
    for (let i = 0; i < max; i++) {
      if (giphy[i]) merged.push(giphy[i]);
      if (tenor[i]) merged.push(tenor[i]);
      if (imgflip[i]) merged.push(imgflip[i]);
      if (archive[i]) merged.push(archive[i]);
    }
    setItems(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    doSearch("funny meme");
  }, [doSearch]);

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
      {!loading && searched && items.length === 0 && (
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
      {!loading && items.length > 0 && (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-3">
          {items.map((item, idx) => (
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
