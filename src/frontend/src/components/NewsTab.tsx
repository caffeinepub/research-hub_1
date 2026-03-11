import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Newspaper, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string;
  thumbnail?: string;
}

const NEWS_CATEGORIES = [
  { label: "All", value: "" },
  { label: "Science", value: "science" },
  { label: "Tech", value: "technology" },
  { label: "Health", value: "health" },
  { label: "Space", value: "space" },
  { label: "Environment", value: "environment" },
];

const SOURCE_COLORS: Record<string, string> = {
  "Hacker News": "oklch(0.65 0.18 40)",
  "r/science": "oklch(0.65 0.18 20)",
  "r/technology": "oklch(0.65 0.18 220)",
  "r/worldnews": "oklch(0.65 0.14 55)",
  "r/space": "oklch(0.65 0.18 280)",
  "r/environment": "oklch(0.65 0.18 140)",
  arXiv: "oklch(0.65 0.18 200)",
  Wikipedia: "oklch(0.65 0.10 240)",
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

async function fetchHackerNews(query: string): Promise<NewsItem[]> {
  try {
    const url = query
      ? `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`
      : "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20";
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || []).slice(0, 20).map((h: any, i: number) => ({
      id: `hn-${h.objectID || i}`,
      title: h.title || "Untitled",
      summary: h.story_text
        ? h.story_text.replace(/<[^>]+>/g, "").slice(0, 200)
        : `${h.points || 0} points · ${h.num_comments || 0} comments`,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: "Hacker News",
      category: "technology",
      publishedAt: h.created_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

async function fetchRedditNews(
  sub: string,
  query: string,
): Promise<NewsItem[]> {
  try {
    const url = query
      ? `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&sort=hot&limit=15&restrict_sr=1`
      : `https://www.reddit.com/r/${sub}/hot.json?limit=15`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const posts = data?.data?.children || [];
    return posts.map((p: any, i: number) => {
      const d = p.data;
      return {
        id: `reddit-${sub}-${d.id || i}`,
        title: d.title || "Untitled",
        summary: d.selftext
          ? d.selftext.slice(0, 200)
          : `${d.score || 0} upvotes · ${d.num_comments || 0} comments`,
        url: d.url || `https://reddit.com${d.permalink}`,
        source: `r/${sub}`,
        category:
          sub === "science" ? "science" : sub === "space" ? "space" : "general",
        publishedAt: new Date((d.created_utc || 0) * 1000).toISOString(),
        thumbnail: d.thumbnail?.startsWith("http") ? d.thumbnail : undefined,
      };
    });
  } catch {
    return [];
  }
}

async function fetchArxivNews(query: string): Promise<NewsItem[]> {
  try {
    const q = query || "recent advances";
    const res = await fetch(
      `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&sortBy=submittedDate&sortOrder=descending&max_results=10`,
    );
    if (!res.ok) return [];
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    const entries = xml.querySelectorAll("entry");
    return Array.from(entries).map((e, i) => ({
      id: `arxiv-${i}`,
      title: e.querySelector("title")?.textContent?.trim() || "Untitled",
      summary: (e.querySelector("summary")?.textContent?.trim() || "").slice(
        0,
        250,
      ),
      url: e.querySelector("id")?.textContent?.trim() || "https://arxiv.org",
      source: "arXiv",
      category: "science",
      publishedAt:
        e.querySelector("published")?.textContent?.trim() ||
        new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function NewsTab() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const loadNews = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const subs =
        cat === "science"
          ? ["science"]
          : cat === "technology"
            ? ["technology"]
            : cat === "space"
              ? ["space"]
              : cat === "environment"
                ? ["environment"]
                : cat === "health"
                  ? ["health"]
                  : ["science", "worldnews", "technology", "space"];

      const fetches: Promise<NewsItem[]>[] = [
        fetchHackerNews(q),
        fetchArxivNews(q),
        ...subs.map((s) => fetchRedditNews(s, q)),
      ];

      const results = await Promise.allSettled(fetches);
      const all: NewsItem[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") all.push(...r.value);
      }
      // Sort by date
      all.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      setNews(all);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews("", "");
  }, [loadNews]);

  const handleSearch = () => {
    loadNews(query, activeCategory);
  };

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    loadNews(query, cat);
  };

  const displayed = news.slice(0, page * ITEMS_PER_PAGE);

  return (
    <div data-ocid="news.section" className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "oklch(0.50 0.06 240)" }}
          />
          <Input
            data-ocid="news.search_input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search news (science, technology, space...)"
            className="pl-9 h-10"
            style={{ color: "white" }}
          />
        </div>
        <Button
          type="button"
          data-ocid="news.primary_button"
          onClick={handleSearch}
          style={{ background: "oklch(0.52 0.18 220)" }}
          className="h-10 px-4"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
        <Button
          type="button"
          data-ocid="news.secondary_button"
          variant="outline"
          onClick={() => loadNews(query, activeCategory)}
          className="h-10 px-3"
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap">
        {NEWS_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            data-ocid="news.tab"
            onClick={() => handleCategory(c.value)}
            className="chip-btn"
            style={{
              background:
                activeCategory === c.value
                  ? "oklch(0.52 0.18 220 / 0.2)"
                  : undefined,
              borderColor:
                activeCategory === c.value
                  ? "oklch(0.52 0.18 220 / 0.5)"
                  : undefined,
              color:
                activeCategory === c.value ? "oklch(0.72 0.15 220)" : undefined,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div
          data-ocid="news.loading_state"
          className="flex items-center justify-center py-12"
        >
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: "oklch(0.65 0.18 220)" }}
          />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading latest news...
          </span>
        </div>
      )}

      {/* Empty state */}
      {!loading && news.length === 0 && (
        <div
          data-ocid="news.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Newspaper
            className="w-12 h-12 mb-3"
            style={{ color: "oklch(0.40 0.06 240)" }}
          />
          <p className="text-muted-foreground text-sm">
            No news found. Try a different search.
          </p>
        </div>
      )}

      {/* News grid */}
      {!loading && news.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayed.map((item, i) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid={`news.item.${i + 1}`}
                className="archive-card p-4 flex gap-3 cursor-pointer hover:no-underline block"
              >
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        background:
                          `${SOURCE_COLORS[item.source] || "oklch(0.55 0.08 240)"} / 0.15`.replace(
                            "oklch(",
                            "oklch(",
                          ),
                        color:
                          SOURCE_COLORS[item.source] || "oklch(0.65 0.08 240)",
                        backgroundColor: (
                          SOURCE_COLORS[item.source] || "oklch(0.55 0.08 240)"
                        ).replace(")", " / 0.15)"),
                      }}
                    >
                      {item.source}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {timeAgo(item.publishedAt)}
                    </span>
                  </div>
                  <p
                    className="font-semibold text-sm leading-snug"
                    style={{ color: "oklch(0.92 0.02 240)" }}
                  >
                    {item.title}
                  </p>
                  {item.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>

          {displayed.length < news.length && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                data-ocid="news.pagination_next"
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                className="px-6"
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
