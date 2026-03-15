import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Hash,
  MapPin,
  MessageCircle,
  Newspaper,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SensitiveContentBlur } from "./SensitiveContentBlur";

// ─── Types ─────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  body?: string;
  source: string;
  sourceType: "hackernews" | "reddit" | "guardian" | "wikipedia" | "community";
  category: string;
  publishedAt: string;
  thumbnail?: string;
  url?: string;
  hashtags?: string[];
  author?: string;
  comments?: NewsComment[];
}

interface NewsComment {
  id: string;
  author: string;
  body: string;
  createdAt: number;
  replies?: NewsComment[];
}

interface VideoNewsItem {
  id: string;
  title: string;
  embedUrl: string;
  source: string;
}

interface UserPost {
  id: string;
  headline: string;
  body: string;
  hashtags: string[];
  imageUrl?: string;
  author: string;
  createdAt: number;
  comments: NewsComment[];
}

// ─── Config ────────────────────────────────────────────────────────────────

const SOURCE_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  hackernews: {
    bg: "oklch(0.22 0.10 30/0.4)",
    color: "#f97316",
    label: "HackerNews",
  },
  reddit: { bg: "oklch(0.22 0.10 25/0.4)", color: "#ff4500", label: "Reddit" },
  guardian: {
    bg: "oklch(0.22 0.08 250/0.4)",
    color: "#0ea5e9",
    label: "The Guardian",
  },
  wikipedia: {
    bg: "oklch(0.20 0.04 240/0.4)",
    color: "#94a3b8",
    label: "Wikipedia",
  },
  community: {
    bg: "oklch(0.22 0.10 150/0.4)",
    color: "#22c55e",
    label: "Community",
  },
};

const CATEGORIES = [
  "All",
  "Top",
  "Science",
  "Tech",
  "World",
  "Health",
  "Sports",
  "Entertainment",
  "Local",
];

const PLACEHOLDER_THUMBNAILS: Record<string, string> = {
  hackernews:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Crect width='120' height='80' fill='%23f97316' rx='4'/%3E%3Ctext x='60' y='45' text-anchor='middle' fill='white' font-size='14' font-family='monospace' font-weight='bold'%3EHN%3C/text%3E%3C/svg%3E",
  reddit:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Crect width='120' height='80' fill='%23ff4500' rx='4'/%3E%3Ctext x='60' y='45' text-anchor='middle' fill='white' font-size='12' font-family='sans-serif' font-weight='bold'%3EReddit%3C/text%3E%3C/svg%3E",
  guardian:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Crect width='120' height='80' fill='%230369a1' rx='4'/%3E%3Ctext x='60' y='45' text-anchor='middle' fill='white' font-size='11' font-family='sans-serif' font-weight='bold'%3EGuardian%3C/text%3E%3C/svg%3E",
  wikipedia:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Crect width='120' height='80' fill='%23334155' rx='4'/%3E%3Ctext x='60' y='45' text-anchor='middle' fill='white' font-size='12' font-family='sans-serif' font-weight='bold'%3EWiki%3C/text%3E%3C/svg%3E",
};

// ─── Fetch Functions ───────────────────────────────────────────────────────

async function fetchHackerNews(
  query: string,
  _category: string,
): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
    );
    const ids: number[] = await res.json();
    const top = ids.slice(0, 20);
    const items = await Promise.allSettled(
      top.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
          (r) => r.json(),
        ),
      ),
    );
    const results: NewsItem[] = [];
    for (const r of items) {
      if (r.status !== "fulfilled" || !r.value) continue;
      const item = r.value;
      if (!item.title) continue;
      const q = query.toLowerCase();
      const inQuery = !query || item.title.toLowerCase().includes(q);
      if (!inQuery) continue;
      results.push({
        id: `hn-${item.id}`,
        title: item.title,
        summary: item.text
          ? item.text.replace(/<[^>]+>/g, "").slice(0, 200)
          : `Discussion on HackerNews · ${item.score ?? 0} points · ${item.descendants ?? 0} comments`,
        body: item.text ? item.text.replace(/<[^>]+>/g, "") : "",
        source: "HackerNews",
        sourceType: "hackernews",
        category: "Tech",
        publishedAt: new Date((item.time ?? 0) * 1000).toISOString(),
        url: item.url,
        thumbnail: PLACEHOLDER_THUMBNAILS.hackernews,
        author: item.by,
      });
    }
    return results.slice(0, 8);
  } catch {
    return [];
  }
}

async function fetchRedditNews(
  query: string,
  category: string,
): Promise<NewsItem[]> {
  try {
    const subreddit = category === "Science" ? "science" : "worldnews";
    const q = query ? `&q=${encodeURIComponent(query)}` : "";
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/top.json?limit=10&t=day${q}`,
      { headers: { Accept: "application/json" } },
    );
    const data = await res.json();
    return (data?.data?.children ?? []).map((c: any) => ({
      id: `reddit-${c.data.id}`,
      title: c.data.title,
      summary:
        c.data.selftext?.slice(0, 200) ||
        `r/${c.data.subreddit} · ${c.data.score} upvotes`,
      source: "Reddit",
      sourceType: "reddit" as const,
      category: subreddit === "science" ? "Science" : "World",
      publishedAt: new Date(c.data.created_utc * 1000).toISOString(),
      url: `https://reddit.com${c.data.permalink}`,
      thumbnail:
        c.data.thumbnail !== "self" && c.data.thumbnail !== "default"
          ? c.data.thumbnail
          : PLACEHOLDER_THUMBNAILS.reddit,
      author: c.data.author,
    }));
  } catch {
    return [];
  }
}

async function fetchGuardian(
  query: string,
  category: string,
): Promise<NewsItem[]> {
  try {
    const section =
      category === "Science"
        ? "science"
        : category === "Sports"
          ? "sport"
          : category === "Tech"
            ? "technology"
            : category === "Entertainment"
              ? "culture"
              : "news";
    const q = query ? `&q=${encodeURIComponent(query)}` : "";
    const res = await fetch(
      `https://content.guardianapis.com/search?section=${section}&page-size=10&api-key=test${q}&show-fields=thumbnail,trailText,bodyText`,
    );
    const data = await res.json();
    return (data?.response?.results ?? []).map((r: any) => ({
      id: `guardian-${r.id}`,
      title: r.webTitle,
      summary: r.fields?.trailText?.replace(/<[^>]+>/g, "") || r.webTitle,
      body: r.fields?.bodyText?.replace(/<[^>]+>/g, "")?.slice(0, 2000) || "",
      source: "The Guardian",
      sourceType: "guardian" as const,
      category: r.sectionName || category,
      publishedAt: r.webPublicationDate,
      url: r.webUrl,
      thumbnail: r.fields?.thumbnail || PLACEHOLDER_THUMBNAILS.guardian,
    }));
  } catch {
    return [];
  }
}

async function fetchWikipediaCurrentEvents(query: string): Promise<NewsItem[]> {
  try {
    const topics = query
      ? [query]
      : ["current events", "politics", "science", "health", "technology"];
    const results: NewsItem[] = [];
    await Promise.allSettled(
      topics.slice(0, 3).map(async (topic) => {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
        );
        const data = await res.json();
        if (data.title && data.extract) {
          results.push({
            id: `wiki-${data.pageid || topic}`,
            title: data.title,
            summary: data.extract.slice(0, 200),
            body: data.extract,
            source: "Wikipedia",
            sourceType: "wikipedia",
            category: "World",
            publishedAt: data.timestamp || new Date().toISOString(),
            thumbnail:
              data.thumbnail?.source || PLACEHOLDER_THUMBNAILS.wikipedia,
          });
        }
      }),
    );
    return results;
  } catch {
    return [];
  }
}

async function fetchArchiveNewsVideos(): Promise<VideoNewsItem[]> {
  try {
    const res = await fetch(
      "https://archive.org/advancedsearch.php?q=news+2024&mediatype=movies&output=json&rows=6&fl[]=identifier,title",
    );
    const data = await res.json();
    return (data?.response?.docs ?? []).map((d: any) => ({
      id: d.identifier,
      title: d.title || d.identifier,
      embedUrl: `https://archive.org/embed/${d.identifier}`,
      source: "Internet Archive",
    }));
  } catch {
    return [];
  }
}

// ─── Article Reader Modal ─────────────────────────────────────────────────

function ArticleReaderModal({
  article,
  open,
  onClose,
}: {
  article: NewsItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<NewsComment[]>(
    article?.comments || [],
  );

  useEffect(() => {
    setComments(article?.comments || []);
  }, [article]);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("researchHubUser") || "null");
    } catch {
      return null;
    }
  })();

  const addComment = () => {
    if (!comment.trim() || !currentUser) return;
    const newComment: NewsComment = {
      id: `c${Date.now()}`,
      author: currentUser.username,
      body: comment,
      createdAt: Date.now(),
    };
    setComments((prev) => [...prev, newComment]);
    setComment("");
  };

  if (!article) return null;

  const style = SOURCE_STYLES[article.sourceType] || SOURCE_STYLES.wikipedia;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
        style={{
          background: "oklch(0.10 0.025 260)",
          border: "1px solid oklch(0.22 0.04 260)",
        }}
        data-ocid="news.article.dialog"
      >
        <DialogHeader
          className="px-6 pt-6 pb-4 border-b shrink-0"
          style={{ borderColor: "oklch(0.18 0.04 260)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Badge style={{ background: style.bg, color: style.color }}>
              {style.label}
            </Badge>
            <span className="text-xs" style={{ color: "oklch(0.52 0.05 240)" }}>
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString()
                : ""}
            </span>
          </div>
          <DialogTitle className="text-white text-lg leading-snug">
            {article.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 space-y-4">
            {article.thumbnail && (
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full rounded-xl object-cover max-h-48"
              />
            )}
            <SensitiveContentBlur label={article.title}>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "oklch(0.85 0.02 240)" }}
              >
                {article.body || article.summary}
              </p>
            </SensitiveContentBlur>

            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all hover:opacity-80"
                style={{
                  background: "oklch(0.22 0.06 220 / 0.3)",
                  color: "#00b4d8",
                  border: "1px solid oklch(0.35 0.08 220 / 0.3)",
                }}
              >
                Read original source ↗
              </a>
            )}

            {/* Comments */}
            <div
              className="border-t pt-4"
              style={{ borderColor: "oklch(0.18 0.04 260)" }}
            >
              <h4 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Discussion ({comments.length})
              </h4>
              <div className="space-y-3 mb-4">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl p-3"
                    style={{ background: "oklch(0.14 0.03 260)" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#00b4d8" }}
                      >
                        {c.author}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "oklch(0.45 0.04 260)" }}
                      >
                        {new Date(c.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: "oklch(0.80 0.02 240)" }}
                    >
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>
              {currentUser ? (
                <div className="flex gap-2">
                  <Input
                    data-ocid="news.comment.input"
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                    className="text-white"
                    style={{
                      background: "oklch(0.14 0.03 260)",
                      borderColor: "oklch(0.25 0.04 260)",
                    }}
                  />
                  <Button
                    data-ocid="news.comment.submit_button"
                    onClick={addComment}
                    style={{
                      background: "oklch(0.52 0.18 200)",
                      color: "white",
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.50 0.05 240)" }}
                >
                  Log in to comment
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Post News Modal ───────────────────────────────────────────────────────

function PostNewsModal({
  open,
  onClose,
  onPost,
}: {
  open: boolean;
  onClose: () => void;
  onPost: (post: UserPost) => void;
}) {
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("researchHubUser") || "null");
    } catch {
      return null;
    }
  })();

  const submit = () => {
    if (!headline.trim() || !currentUser) return;
    const tags = tagsInput
      .split(/[\s,]+/)
      .filter((t) => t.startsWith("#"))
      .map((t) => t.toLowerCase());
    onPost({
      id: `up${Date.now()}`,
      headline,
      body,
      hashtags: tags,
      imageUrl: imageUrl || undefined,
      author: currentUser.username,
      createdAt: Date.now(),
      comments: [],
    });
    setHeadline("");
    setBody("");
    setImageUrl("");
    setTagsInput("");
    onClose();
    toast.success("News posted!");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg"
        style={{
          background: "oklch(0.10 0.025 260)",
          border: "1px solid oklch(0.22 0.04 260)",
        }}
        data-ocid="news.post.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-white">Post News</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            data-ocid="news.post.headline_input"
            placeholder="Headline *"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="text-white"
            style={{
              background: "oklch(0.14 0.03 260)",
              borderColor: "oklch(0.25 0.04 260)",
            }}
          />
          <Textarea
            data-ocid="news.post.body_textarea"
            placeholder="Article body…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="text-white resize-none"
            style={{
              background: "oklch(0.14 0.03 260)",
              borderColor: "oklch(0.25 0.04 260)",
            }}
          />
          <Input
            data-ocid="news.post.image_input"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="text-white"
            style={{
              background: "oklch(0.14 0.03 260)",
              borderColor: "oklch(0.25 0.04 260)",
            }}
          />
          <Input
            data-ocid="news.post.tags_input"
            placeholder="Hashtags (#science #tech)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="text-white"
            style={{
              background: "oklch(0.14 0.03 260)",
              borderColor: "oklch(0.25 0.04 260)",
            }}
          />
          <div className="flex gap-3">
            <Button
              data-ocid="news.post.cancel_button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              style={{ borderColor: "oklch(0.28 0.04 260)", color: "white" }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="news.post.submit_button"
              onClick={submit}
              disabled={!headline.trim()}
              className="flex-1"
              style={{ background: "oklch(0.52 0.18 200)", color: "white" }}
            >
              Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Article Card ─────────────────────────────────────────────────────────

function ArticleCard({
  item,
  onOpen,
}: { item: NewsItem; onOpen: (item: NewsItem) => void }) {
  const style = SOURCE_STYLES[item.sourceType] || SOURCE_STYLES.wikipedia;
  const timeStr = (() => {
    try {
      const d = new Date(item.publishedAt);
      const diff = Date.now() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  })();

  return (
    <button
      type="button"
      data-ocid="news.article.card"
      onClick={() => onOpen(item)}
      className="w-full flex flex-col sm:flex-row gap-3 p-4 rounded-2xl text-left transition-all hover:opacity-90"
      style={{
        background: "oklch(0.13 0.03 260)",
        border: "1px solid oklch(0.22 0.04 260)",
      }}
    >
      <div className="sm:w-28 sm:h-20 w-full h-36 flex-shrink-0 rounded-xl overflow-hidden bg-slate-800">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper
              className="w-6 h-6"
              style={{ color: "oklch(0.40 0.04 260)" }}
            />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm leading-snug line-clamp-2">
          {item.title}
        </p>
        <p
          className="text-xs mt-1 line-clamp-2"
          style={{ color: "oklch(0.62 0.04 240)" }}
        >
          {item.summary}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: style.bg, color: style.color }}
          >
            {style.label}
          </span>
          {item.category && (
            <span
              className="text-[10px]"
              style={{ color: "oklch(0.48 0.04 260)" }}
            >
              {item.category}
            </span>
          )}
          <span
            className="text-[10px] ml-auto"
            style={{ color: "oklch(0.48 0.04 260)" }}
          >
            {timeStr}
          </span>
        </div>
        {item.hashtags && item.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-[10px]"
                style={{ color: "#00b4d8" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function NewsTab() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [videos, setVideos] = useState<VideoNewsItem[]>([]);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("Top");
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState(
    () => localStorage.getItem("rh_news_city") || "",
  );
  const [cityInput, setCityInput] = useState(city);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoNewsItem | null>(null);
  const hasFetched = useRef(false);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("researchHubUser") || "null");
    } catch {
      return null;
    }
  })();

  const fetchAll = useCallback(
    async (q = searchQuery, cat = category) => {
      setLoading(true);
      try {
        const [
          hnResults,
          redditResults,
          guardianResults,
          wikiResults,
          archiveVideos,
        ] = await Promise.allSettled([
          fetchHackerNews(q, cat),
          fetchRedditNews(q, cat),
          fetchGuardian(q, cat),
          fetchWikipediaCurrentEvents(q),
          fetchArchiveNewsVideos(),
        ]);

        const all: NewsItem[] = [
          ...(hnResults.status === "fulfilled" ? hnResults.value : []),
          ...(redditResults.status === "fulfilled" ? redditResults.value : []),
          ...(guardianResults.status === "fulfilled"
            ? guardianResults.value
            : []),
          ...(wikiResults.status === "fulfilled" ? wikiResults.value : []),
        ];
        setArticles(all);
        setVideos(
          archiveVideos.status === "fulfilled" ? archiveVideos.value : [],
        );
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, category],
  );

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, [fetchAll]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    fetchAll(searchQuery, cat);
  };

  const handleSearch = () => fetchAll(searchQuery, category);

  const handleCitySet = () => {
    localStorage.setItem("rh_news_city", cityInput);
    setCity(cityInput);
    toast.success(`Location set to ${cityInput}`);
    fetchAll(cityInput, "Local");
    setCategory("Local");
  };

  const openArticle = (item: NewsItem) => {
    setSelectedArticle(item);
    setReaderOpen(true);
  };

  // Combine and sort
  const communityArticles: NewsItem[] = userPosts.map((p) => ({
    id: p.id,
    title: p.headline,
    summary: p.body.slice(0, 200),
    body: p.body,
    source: "Community",
    sourceType: "community" as const,
    category: "Community",
    publishedAt: new Date(p.createdAt).toISOString(),
    thumbnail: p.imageUrl,
    author: p.author,
    hashtags: p.hashtags,
    comments: p.comments,
  }));

  const allArticles = [...communityArticles, ...articles];
  const hero = allArticles[0];
  const gridArticles = allArticles.slice(1);

  return (
    <div className="min-h-full pb-8">
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-3 space-y-3"
        style={{
          background: "oklch(0.09 0.025 260 / 0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(0.18 0.04 260)",
        }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" style={{ color: "#00b4d8" }} />
            <h2 className="font-bold text-lg text-white">News</h2>
            {city && (
              <Badge
                className="text-xs"
                style={{
                  background: "oklch(0.22 0.08 200 / 0.3)",
                  color: "#00b4d8",
                }}
              >
                <MapPin className="w-3 h-3 mr-1" />
                {city}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-ocid="news.refresh_button"
              size="sm"
              variant="outline"
              onClick={() => fetchAll()}
              disabled={loading}
              style={{
                borderColor: "oklch(0.28 0.04 260)",
                color: "white",
                background: "transparent",
              }}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            {currentUser && (
              <Button
                data-ocid="news.post.open_modal_button"
                size="sm"
                onClick={() => setPostModalOpen(true)}
                style={{ background: "oklch(0.52 0.18 200)", color: "white" }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Post
              </Button>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "oklch(0.50 0.05 240)" }}
            />
            <input
              data-ocid="news.search_input"
              type="text"
              placeholder="Search news…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none text-white"
              style={{
                background: "oklch(0.14 0.03 260)",
                border: "1px solid oklch(0.25 0.04 260)",
              }}
            />
          </div>
          <Button
            data-ocid="news.search_button"
            size="sm"
            onClick={handleSearch}
            style={{ background: "oklch(0.52 0.18 200)", color: "white" }}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Category tabs */}
        <div
          className="flex gap-1 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              data-ocid="news.category.tab"
              onClick={() => handleCategoryChange(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background:
                  category === cat
                    ? "oklch(0.52 0.18 200 / 0.2)"
                    : "oklch(0.14 0.03 260)",
                color: category === cat ? "#00b4d8" : "oklch(0.60 0.05 240)",
                border: `1px solid ${category === cat ? "oklch(0.52 0.18 200 / 0.5)" : "oklch(0.22 0.04 260)"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Location setter */}
        {category === "Local" && (
          <div className="flex gap-2">
            <input
              data-ocid="news.city.input"
              type="text"
              placeholder="Enter your city…"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCitySet()}
              className="flex-1 px-3 py-2 text-sm rounded-xl outline-none text-white"
              style={{
                background: "oklch(0.14 0.03 260)",
                border: "1px solid oklch(0.25 0.04 260)",
              }}
            />
            <Button
              data-ocid="news.city.save_button"
              size="sm"
              onClick={handleCitySet}
              style={{ background: "oklch(0.52 0.18 200)", color: "white" }}
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="px-4 pt-4 space-y-6">
        {/* Loading */}
        {loading && (
          <div data-ocid="news.loading_state" className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex gap-3 p-4 rounded-2xl"
                style={{ background: "oklch(0.13 0.03 260)" }}
              >
                <Skeleton className="w-28 h-20 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hero article */}
        {!loading && hero && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" style={{ color: "#00b4d8" }} />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "oklch(0.55 0.06 240)" }}
              >
                Top Story
              </span>
            </div>
            <button
              type="button"
              data-ocid="news.hero.card"
              onClick={() => openArticle(hero)}
              className="w-full rounded-2xl overflow-hidden text-left transition-all hover:opacity-90"
              style={{
                background: "oklch(0.13 0.03 260)",
                border: "1px solid oklch(0.22 0.04 260)",
              }}
            >
              {hero.thumbnail && (
                <img
                  src={hero.thumbnail}
                  alt={hero.title}
                  className="w-full h-48 sm:h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background:
                        SOURCE_STYLES[hero.sourceType]?.bg ||
                        "oklch(0.20 0.04 240/0.4)",
                      color: SOURCE_STYLES[hero.sourceType]?.color || "#94a3b8",
                    }}
                  >
                    {SOURCE_STYLES[hero.sourceType]?.label || hero.source}
                  </span>
                </div>
                <p className="font-bold text-white text-lg leading-snug">
                  {hero.title}
                </p>
                <p
                  className="text-sm mt-2 line-clamp-3"
                  style={{ color: "oklch(0.65 0.04 240)" }}
                >
                  {hero.summary}
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Article grid */}
        {!loading && gridArticles.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Newspaper
                className="w-4 h-4"
                style={{ color: "oklch(0.55 0.06 240)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "oklch(0.55 0.06 240)" }}
              >
                Latest News
              </span>
            </div>
            <div className="space-y-3">
              {gridArticles.map((item, i) => (
                <ArticleCard
                  key={item.id}
                  item={item}
                  onOpen={openArticle}
                  // biome-ignore: numeric index fine for display
                  data-ocid={`news.article.item.${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && allArticles.length === 0 && (
          <div data-ocid="news.empty_state" className="text-center py-16">
            <Newspaper
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: "oklch(0.35 0.04 260)" }}
            />
            <p className="font-semibold text-white">No news found</p>
            <p
              className="text-sm mt-1"
              style={{ color: "oklch(0.50 0.04 260)" }}
            >
              Try a different search or category
            </p>
          </div>
        )}

        {/* News Videos */}
        {videos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Play className="w-4 h-4" style={{ color: "#00b4d8" }} />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "oklch(0.55 0.06 240)" }}
              >
                News Videos
              </span>
            </div>
            {activeVideo && (
              <div
                className="rounded-2xl overflow-hidden border mb-3"
                style={{ borderColor: "oklch(0.25 0.04 260)" }}
              >
                <iframe
                  src={activeVideo.embedUrl}
                  className="w-full aspect-video"
                  allowFullScreen
                  title={activeVideo.title}
                />
                <div
                  className="p-3 flex items-center justify-between"
                  style={{ background: "oklch(0.12 0.03 260)" }}
                >
                  <p className="text-sm font-medium text-white">
                    {activeVideo.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveVideo(null)}
                    style={{ color: "oklch(0.50 0.04 260)" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none" }}
            >
              {videos.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  data-ocid={`news.video.item.${i + 1}`}
                  onClick={() =>
                    setActiveVideo(activeVideo?.id === v.id ? null : v)
                  }
                  className="flex-shrink-0 w-48 rounded-xl overflow-hidden text-left transition-all hover:opacity-80"
                  style={{
                    background: "oklch(0.13 0.03 260)",
                    border: `1px solid ${activeVideo?.id === v.id ? "#00b4d8" : "oklch(0.22 0.04 260)"}`,
                  }}
                >
                  <div
                    className="w-full h-28 flex items-center justify-center"
                    style={{ background: "oklch(0.16 0.04 260)" }}
                  >
                    <Play className="w-8 h-8" style={{ color: "#00b4d8" }} />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-white line-clamp-2">
                      {v.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hashtag section */}
        {!loading && allArticles.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from(new Set(allArticles.flatMap((a) => a.hashtags || [])))
              .slice(0, 12)
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    handleSearch();
                  }}
                  className="text-xs px-3 py-1 rounded-full transition-all"
                  style={{
                    background: "oklch(0.14 0.03 260)",
                    border: "1px solid oklch(0.25 0.04 260)",
                    color: "#00b4d8",
                  }}
                >
                  <Hash className="w-3 h-3 inline-block mr-0.5" />
                  {tag.replace("#", "")}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ArticleReaderModal
        article={selectedArticle}
        open={readerOpen}
        onClose={() => setReaderOpen(false)}
      />
      <PostNewsModal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onPost={(post) => setUserPosts((prev) => [post, ...prev])}
      />
    </div>
  );
}
