import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Hash,
  Image,
  Newspaper,
  Play,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SensitiveContentBlur } from "./SensitiveContentBlur";

// ─── Types ────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  body?: string;
  source: string;
  sourceType: "wikipedia" | "reddit" | "hackernews" | "guardian" | "community";
  category: string;
  publishedAt: string;
  thumbnail?: string;
  author?: string;
  url?: string;
  hashtags?: string[];
}

interface VideoNewsItem {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  source: string;
  duration?: string;
}

interface CommunityPost {
  id: string;
  headline: string;
  body: string;
  hashtags: string[];
  imageUrl?: string;
  author: string;
  createdAt: number;
}

// ─── Source Config ─────────────────────────────────────────────────────

const SOURCE_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  wikipedia: {
    bg: "oklch(0.20 0.06 220 / 0.4)",
    color: "oklch(0.75 0.14 220)",
    label: "Wikipedia",
  },
  reddit: {
    bg: "oklch(0.22 0.10 25 / 0.4)",
    color: "oklch(0.78 0.18 25)",
    label: "Reddit",
  },
  hackernews: {
    bg: "oklch(0.24 0.12 45 / 0.4)",
    color: "oklch(0.82 0.18 45)",
    label: "Hacker News",
  },
  guardian: {
    bg: "oklch(0.20 0.08 290 / 0.4)",
    color: "oklch(0.75 0.14 290)",
    label: "The Guardian",
  },
  community: {
    bg: "oklch(0.20 0.10 140 / 0.4)",
    color: "oklch(0.75 0.16 140)",
    label: "Community",
  },
};

const CATEGORIES = [
  "All",
  "World",
  "Tech",
  "Science",
  "Health",
  "Space",
  "Politics",
  "Community",
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  World: "oklch(0.35 0.12 220), oklch(0.25 0.08 260)",
  Tech: "oklch(0.30 0.14 260), oklch(0.22 0.10 300)",
  Science: "oklch(0.28 0.12 180), oklch(0.22 0.08 220)",
  Health: "oklch(0.30 0.12 145), oklch(0.22 0.08 180)",
  Space: "oklch(0.22 0.10 270), oklch(0.15 0.06 290)",
  Politics: "oklch(0.30 0.12 30), oklch(0.22 0.08 55)",
  Community: "oklch(0.28 0.10 130), oklch(0.20 0.06 160)",
  default: "oklch(0.25 0.08 240), oklch(0.18 0.05 260)",
};

// ─── Fetchers ─────────────────────────────────────────────────────────

async function fetchHackerNews(limit = 20): Promise<NewsItem[]> {
  try {
    const r = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
    );
    const ids: number[] = await r.json();
    const top = ids.slice(0, limit);
    const stories = await Promise.allSettled(
      top.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
          (res) => res.json(),
        ),
      ),
    );
    return stories
      .filter((s) => s.status === "fulfilled" && s.value?.title)
      .map((s) => {
        const v = (s as PromiseFulfilledResult<any>).value;
        return {
          id: `hn-${v.id}`,
          title: v.title,
          summary: v.url
            ? `${v.score} points · ${v.descendants ?? 0} comments`
            : (v.text?.slice(0, 200) ?? ""),
          source: "Hacker News",
          sourceType: "hackernews" as const,
          category: "Tech",
          publishedAt: new Date(v.time * 1000).toISOString(),
          url: v.url || `https://news.ycombinator.com/item?id=${v.id}`,
          author: v.by,
          hashtags: ["tech", "hackernews"],
        };
      });
  } catch {
    return [];
  }
}

async function fetchRedditNews(): Promise<NewsItem[]> {
  try {
    const [worldR, scienceR] = await Promise.allSettled([
      fetch("https://www.reddit.com/r/worldnews.json?limit=15", {
        headers: { Accept: "application/json" },
      }).then((r) => r.json()),
      fetch("https://www.reddit.com/r/science.json?limit=10", {
        headers: { Accept: "application/json" },
      }).then((r) => r.json()),
    ]);

    const posts: any[] = [];
    if (worldR.status === "fulfilled")
      posts.push(...(worldR.value?.data?.children ?? []));
    if (scienceR.status === "fulfilled")
      posts.push(...(scienceR.value?.data?.children ?? []));

    return posts
      .filter((p) => p.data?.title)
      .map((p) => {
        const d = p.data;
        const thumb = d.thumbnail?.startsWith("http") ? d.thumbnail : undefined;
        return {
          id: `reddit-${d.id}`,
          title: d.title,
          summary: d.selftext?.slice(0, 200) || d.title,
          body: d.selftext || undefined,
          source: `r/${d.subreddit}`,
          sourceType: "reddit" as const,
          category: d.subreddit === "science" ? "Science" : "World",
          publishedAt: new Date(d.created_utc * 1000).toISOString(),
          thumbnail: thumb,
          url: `https://reddit.com${d.permalink}`,
          author: d.author,
          hashtags: [d.subreddit.toLowerCase(), "news"],
        };
      });
  } catch {
    return [];
  }
}

async function fetchGuardianNews(): Promise<NewsItem[]> {
  try {
    const r = await fetch(
      "https://content.guardianapis.com/search?api-key=test&show-fields=thumbnail,trailText,bodyText&page-size=20&order-by=newest",
    );
    const data = await r.json();
    const results = data?.response?.results ?? [];
    return results.map((item: any) => ({
      id: `guardian-${item.id}`,
      title: item.webTitle,
      summary:
        item.fields?.trailText?.replace(/<[^>]+>/g, "").slice(0, 200) ||
        item.webTitle,
      body:
        item.fields?.bodyText?.replace(/<[^>]+>/g, "").slice(0, 1000) ||
        undefined,
      source: "The Guardian",
      sourceType: "guardian" as const,
      category:
        item.sectionId === "technology"
          ? "Tech"
          : item.sectionId === "science"
            ? "Science"
            : item.sectionId === "politics"
              ? "Politics"
              : "World",
      publishedAt: item.webPublicationDate,
      thumbnail: item.fields?.thumbnail || undefined,
      url: item.webUrl,
      hashtags: [item.sectionId?.toLowerCase(), "guardian"].filter(Boolean),
    }));
  } catch {
    return [];
  }
}

async function fetchWikipediaCurrentEvents(): Promise<NewsItem[]> {
  try {
    const r = await fetch(
      `https://en.wikipedia.org/api/rest_v1/feed/featured/${new Date().toISOString().slice(0, 10).replace(/-/g, "/")}`,
    );
    const data = await r.json();
    const items: NewsItem[] = [];
    if (data.news) {
      for (const n of data.news.slice(0, 10)) {
        const article = n.links?.[0];
        if (!article) continue;
        items.push({
          id: `wiki-${article.pageid || Math.random()}`,
          title: article.normalizedtitle || article.title,
          summary: article.extract?.slice(0, 200) || "",
          body: article.extract || undefined,
          source: "Wikipedia",
          sourceType: "wikipedia" as const,
          category: "World",
          publishedAt: new Date().toISOString(),
          thumbnail: article.thumbnail?.source || undefined,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title || "")}`,
          hashtags: ["wikipedia", "currentevents"],
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

async function fetchNewsVideos(): Promise<VideoNewsItem[]> {
  const collections = [
    { id: "prelinger", label: "Prelinger Archives" },
    { id: "newsandpublicaffairs", label: "News & Public Affairs" },
    { id: "computersandtechvideos", label: "Tech Videos" },
    { id: "911", label: "Historical News" },
    { id: "moviesandfilms", label: "Newsreels" },
  ];
  const results: VideoNewsItem[] = [];
  try {
    const settled = await Promise.allSettled(
      collections.map((col) =>
        fetch(
          `https://archive.org/advancedsearch.php?q=collection:${col.id}+AND+mediatype:movies&output=json&rows=4&fl[]=identifier,title,description&sort[]=downloads+desc`,
        ).then((r) => r.json()),
      ),
    );
    for (let i = 0; i < settled.length; i++) {
      const res = settled[i];
      if (res.status !== "fulfilled") continue;
      const docs = res.value?.response?.docs ?? [];
      for (const doc of docs.slice(0, 2)) {
        results.push({
          id: `av-${doc.identifier}`,
          title: doc.title || doc.identifier,
          thumbnail: `https://archive.org/services/img/${doc.identifier}`,
          embedUrl: `https://archive.org/embed/${doc.identifier}`,
          source: collections[i].label,
        });
      }
    }
  } catch {
    // ignore
  }
  return results;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "";
  }
}

function gradientForCategory(category: string): string {
  return CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.default;
}

function loadCommunityPosts(): CommunityPost[] {
  try {
    return JSON.parse(localStorage.getItem("newsCommunityPosts") || "[]");
  } catch {
    return [];
  }
}

function saveCommunityPosts(posts: CommunityPost[]) {
  localStorage.setItem("newsCommunityPosts", JSON.stringify(posts));
}

// ─── Article Reader ────────────────────────────────────────────────────

function ArticleReader({
  article,
  onClose,
}: {
  article: NewsItem | CommunityPost;
  onClose: () => void;
}) {
  const isNews = "sourceType" in article;
  const title = isNews ? article.title : (article as CommunityPost).headline;
  const body = isNews
    ? (article as NewsItem).body ||
      (article as NewsItem).summary ||
      "No content available."
    : (article as CommunityPost).body;
  const thumbnail = isNews
    ? (article as NewsItem).thumbnail
    : (article as CommunityPost).imageUrl;
  const source = isNews ? (article as NewsItem).source : "Community";
  const time = isNews
    ? timeAgo((article as NewsItem).publishedAt)
    : timeAgo(new Date((article as CommunityPost).createdAt).toISOString());
  const hashtags = isNews
    ? (article as NewsItem).hashtags || []
    : (article as CommunityPost).hashtags || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "oklch(0.10 0.02 260)" }}
    >
      {/* Reader header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{
          background: "oklch(0.12 0.04 260)",
          borderColor: "oklch(0.20 0.04 260)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          data-ocid="news.reader.button"
          className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "oklch(0.75 0.14 220)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background:
              SOURCE_STYLES[
                isNews ? (article as NewsItem).sourceType : "community"
              ]?.bg || "oklch(0.20 0.06 260)",
            color:
              SOURCE_STYLES[
                isNews ? (article as NewsItem).sourceType : "community"
              ]?.color || "oklch(0.75 0.08 240)",
          }}
        >
          {source}
        </span>
      </div>

      {/* Article content */}
      <ScrollArea className="flex-1">
        <article className="max-w-2xl mx-auto px-4 py-6">
          {thumbnail && (
            <div className="rounded-xl overflow-hidden mb-5 aspect-video">
              <SensitiveContentBlur label={title}>
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </SensitiveContentBlur>
            </div>
          )}
          <h1
            className="text-xl font-bold leading-tight mb-3"
            style={{ color: "oklch(0.95 0.02 240)" }}
          >
            {title}
          </h1>
          <div
            className="flex items-center gap-3 mb-4 text-xs"
            style={{ color: "oklch(0.55 0.05 240)" }}
          >
            <span>{source}</span>
            <span>·</span>
            <span>{time}</span>
            {isNews && (article as NewsItem).author && (
              <>
                <span>·</span>
                <span>by {(article as NewsItem).author}</span>
              </>
            )}
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.52 0.18 220 / 0.15)",
                    color: "oklch(0.72 0.14 220)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "oklch(0.82 0.02 240)" }}
          >
            {body}
          </div>
          {isNews && (article as NewsItem).url && (
            <div className="mt-6">
              <a
                href={(article as NewsItem).url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "oklch(0.72 0.14 220)" }}
              >
                View original source ↗
              </a>
            </div>
          )}
        </article>
      </ScrollArea>
    </motion.div>
  );
}

// ─── Video Card ────────────────────────────────────────────────────────

function VideoNewsCard({ video }: { video: VideoNewsItem }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div
      className="flex-shrink-0 rounded-xl overflow-hidden w-56"
      style={{
        background: "oklch(0.14 0.03 260)",
        border: "1px solid oklch(0.22 0.04 260)",
      }}
    >
      {playing ? (
        <iframe
          src={video.embedUrl}
          title={video.title}
          className="w-full aspect-video"
          allow="autoplay"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          data-ocid="news.video.button"
          className="relative w-full aspect-video group"
        >
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
            }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "oklch(0 0 0 / 0.45)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ background: "oklch(0.52 0.18 220 / 0.9)" }}
            >
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        </button>
      )}
      <div className="p-2">
        <p
          className="text-xs font-medium line-clamp-2"
          style={{ color: "oklch(0.88 0.02 240)" }}
        >
          {video.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.05 240)" }}>
          {video.source}
        </p>
      </div>
    </div>
  );
}

// ─── News Card ─────────────────────────────────────────────────────────

function NewsCard({
  item,
  onOpen,
  onHashtagClick,
}: {
  item: NewsItem;
  onOpen: () => void;
  onHashtagClick: (tag: string) => void;
}) {
  const srcStyle = SOURCE_STYLES[item.sourceType] || SOURCE_STYLES.wikipedia;
  const grad = gradientForCategory(item.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: "oklch(0.13 0.03 260)",
        border: "1px solid oklch(0.22 0.04 260)",
      }}
      onClick={onOpen}
      data-ocid="news.card"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {item.thumbnail ? (
          <SensitiveContentBlur label={item.title}>
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.parentElement!.style.background = `linear-gradient(135deg, ${grad})`;
                el.style.display = "none";
              }}
            />
          </SensitiveContentBlur>
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${grad})`,
            }}
          />
        )}
        {/* Source badge overlay */}
        <span
          className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm"
          style={{ background: srcStyle.bg, color: srcStyle.color }}
        >
          {srcStyle.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3
          className="text-sm font-bold leading-snug mb-1.5 line-clamp-2 group-hover:opacity-80 transition-opacity"
          style={{ color: "oklch(0.94 0.02 240)" }}
        >
          {item.title}
        </h3>
        <p
          className="text-xs line-clamp-2 mb-2"
          style={{ color: "oklch(0.58 0.04 240)" }}
        >
          {item.summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "oklch(0.45 0.04 240)" }}>
            {timeAgo(item.publishedAt)}
          </span>
          <div
            className="flex gap-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {(item.hashtags || []).slice(0, 2).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onHashtagClick(tag);
                }}
                className="text-xs px-1.5 py-0.5 rounded-full transition-opacity hover:opacity-70"
                style={{
                  background: "oklch(0.52 0.18 220 / 0.12)",
                  color: "oklch(0.68 0.12 220)",
                }}
                data-ocid="news.hashtag.button"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Community Post Card ───────────────────────────────────────────────

function CommunityCard({
  post,
  onOpen,
  onHashtagClick,
}: {
  post: CommunityPost;
  onOpen: () => void;
  onHashtagClick: (tag: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: "oklch(0.13 0.03 260)",
        border: "1px solid oklch(0.25 0.06 140 / 0.4)",
      }}
      onClick={onOpen}
      data-ocid="news.community.card"
    >
      {post.imageUrl && (
        <div className="aspect-video overflow-hidden">
          <SensitiveContentBlur label={post.headline}>
            <img
              src={post.imageUrl}
              alt={post.headline}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </SensitiveContentBlur>
        </div>
      )}
      {!post.imageUrl && (
        <div
          className="aspect-video"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.28 0.10 130), oklch(0.20 0.06 160))",
          }}
        />
      )}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: SOURCE_STYLES.community.bg,
              color: SOURCE_STYLES.community.color,
            }}
          >
            Community
          </span>
          <span className="text-xs" style={{ color: "oklch(0.45 0.04 240)" }}>
            by {post.author}
          </span>
        </div>
        <h3
          className="text-sm font-bold leading-snug mb-1.5 line-clamp-2"
          style={{ color: "oklch(0.94 0.02 240)" }}
        >
          {post.headline}
        </h3>
        <p
          className="text-xs line-clamp-2 mb-2"
          style={{ color: "oklch(0.58 0.04 240)" }}
        >
          {post.body}
        </p>
        <div
          className="flex gap-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {post.hashtags.slice(0, 3).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHashtagClick(tag);
              }}
              className="text-xs px-1.5 py-0.5 rounded-full transition-opacity hover:opacity-70"
              style={{
                background: "oklch(0.70 0.16 140 / 0.12)",
                color: "oklch(0.70 0.14 140)",
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export function NewsTab() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoNewsItem[]>([]);
  const [communityPosts, setCommunityPosts] =
    useState<CommunityPost[]>(loadCommunityPosts);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [openArticle, setOpenArticle] = useState<
    NewsItem | CommunityPost | null
  >(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postHeadline, setPostHeadline] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postHashtagInput, setPostHashtagInput] = useState("");
  const [postHashtags, setPostHashtags] = useState<string[]>([]);
  const [postImageUrl, setPostImageUrl] = useState("");
  const [postImagePreview, setPostImagePreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("researchHubUser") || "{}");
    } catch {
      return {};
    }
  })();

  const loadNews = useCallback(async () => {
    setLoading(true);
    const [hn, reddit, guardian, wiki, videos] = await Promise.allSettled([
      fetchHackerNews(20),
      fetchRedditNews(),
      fetchGuardianNews(),
      fetchWikipediaCurrentEvents(),
      fetchNewsVideos(),
    ]);

    const allNews = [
      ...(hn.status === "fulfilled" ? hn.value : []),
      ...(reddit.status === "fulfilled" ? reddit.value : []),
      ...(guardian.status === "fulfilled" ? guardian.value : []),
      ...(wiki.status === "fulfilled" ? wiki.value : []),
    ];
    setNewsItems(
      allNews.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      ),
    );
    if (videos.status === "fulfilled") setVideoItems(videos.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Breaking news ticker auto-scroll - restart when new items arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional restart on newsItems
  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;
    let pos = 0;
    const speed = 0.5;
    const animate = () => {
      pos += speed;
      if (pos >= ticker.scrollWidth / 2) pos = 0;
      ticker.scrollLeft = pos;
      raf = requestAnimationFrame(animate);
    };
    let raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [newsItems]);

  const handleHashtagKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === " " || e.key === "Enter") && postHashtagInput.trim()) {
      e.preventDefault();
      const tag = postHashtagInput.trim().replace(/^#/, "").toLowerCase();
      if (tag && !postHashtags.includes(tag)) {
        setPostHashtags((prev) => [...prev, tag]);
      }
      setPostHashtagInput("");
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setPostImageUrl(data);
      setPostImagePreview(data);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = () => {
    if (!postHeadline.trim() || !postBody.trim()) return;
    const author = currentUser?.username || "Anonymous";
    const post: CommunityPost = {
      id: `cp-${Date.now()}`,
      headline: postHeadline.trim(),
      body: postBody.trim(),
      hashtags: postHashtags,
      imageUrl: postImageUrl || undefined,
      author,
      createdAt: Date.now(),
    };
    const updated = [post, ...communityPosts];
    setCommunityPosts(updated);
    saveCommunityPosts(updated);
    setPostHeadline("");
    setPostBody("");
    setPostHashtags([]);
    setPostHashtagInput("");
    setPostImageUrl("");
    setPostImagePreview("");
    setShowPostModal(false);
    toast.success("News post published!");
  };

  // Filtered items
  const q = searchQ.toLowerCase().trim();
  const filteredNews = newsItems.filter((item) => {
    if (activeCategory !== "All" && item.category !== activeCategory)
      return false;
    if (activeHashtag && !(item.hashtags || []).includes(activeHashtag))
      return false;
    if (
      q &&
      !item.title.toLowerCase().includes(q) &&
      !item.summary.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  const filteredCommunity = communityPosts.filter((post) => {
    if (activeCategory !== "All" && activeCategory !== "Community")
      return false;
    if (activeHashtag && !post.hashtags.includes(activeHashtag)) return false;
    if (
      q &&
      !post.headline.toLowerCase().includes(q) &&
      !post.body.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  const tickerHeadlines = newsItems.slice(0, 20);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div
        className="flex-shrink-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.14 0.05 220) 0%, oklch(0.11 0.03 240) 100%)",
          borderBottom: "1px solid oklch(0.20 0.04 240)",
        }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Newspaper
              className="w-5 h-5"
              style={{ color: "oklch(0.72 0.18 220)" }}
            />
            <span
              className="font-bold text-base tracking-tight"
              style={{ color: "oklch(0.95 0.02 240)" }}
            >
              Research Hub{" "}
              <span style={{ color: "oklch(0.72 0.18 220)" }}>News</span>
            </span>
          </div>
          <div className="flex-1 relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: "oklch(0.50 0.06 240)" }}
            />
            <input
              data-ocid="news.search_input"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search news..."
              className="w-full pl-8 pr-3 h-8 text-xs rounded-lg outline-none transition-all"
              style={{
                background: "oklch(0.17 0.04 260)",
                border: "1px solid oklch(0.26 0.05 260)",
                color: "oklch(0.92 0.02 240)",
              }}
            />
          </div>
          <Button
            data-ocid="news.post.open_modal_button"
            size="sm"
            onClick={() => setShowPostModal(true)}
            className="h-8 px-3 text-xs flex-shrink-0"
            style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
          >
            <Plus className="w-3 h-3 mr-1" /> Post News
          </Button>
          <Button
            data-ocid="news.refresh.button"
            size="sm"
            variant="ghost"
            onClick={loadNews}
            disabled={loading}
            className="h-8 w-8 p-0 flex-shrink-0"
            style={{ color: "oklch(0.60 0.06 240)" }}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Breaking news ticker */}
        {tickerHeadlines.length > 0 && (
          <div
            className="flex items-center overflow-hidden border-t"
            style={{
              borderColor: "oklch(0.20 0.04 240)",
              background: "oklch(0.52 0.18 220)",
              height: "28px",
            }}
          >
            <div
              className="flex-shrink-0 px-3 text-xs font-bold tracking-widest uppercase h-full flex items-center"
              style={{
                background: "oklch(0.38 0.16 220)",
                color: "white",
              }}
            >
              LIVE
            </div>
            <div
              ref={tickerRef}
              className="flex items-center gap-0 overflow-hidden whitespace-nowrap"
              style={{ scrollBehavior: "auto" }}
            >
              {/* Duplicate for seamless loop */}
              {[...tickerHeadlines, ...tickerHeadlines].map((h, i) => (
                <span
                  key={`ticker-${h.id}-${i}`}
                  className="text-xs font-medium px-4 inline-block"
                  style={{ color: "white" }}
                >
                  {h.title}
                  <span className="mx-4 opacity-50">•</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Active hashtag filter */}
        {activeHashtag && (
          <div
            className="flex items-center gap-2 px-4 py-1.5 border-t"
            style={{ borderColor: "oklch(0.20 0.04 240)" }}
          >
            <Hash
              className="w-3 h-3"
              style={{ color: "oklch(0.68 0.14 220)" }}
            />
            <span className="text-xs" style={{ color: "oklch(0.80 0.10 220)" }}>
              #{activeHashtag}
            </span>
            <button
              type="button"
              onClick={() => setActiveHashtag(null)}
              data-ocid="news.hashtag.close_button"
              className="ml-auto"
              style={{ color: "oklch(0.55 0.06 240)" }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Category tabs */}
        <div
          className="flex gap-1 px-3 py-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              data-ocid="news.category.tab"
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background:
                  activeCategory === cat
                    ? "oklch(0.52 0.18 220)"
                    : "oklch(0.16 0.04 260 / 0.6)",
                color:
                  activeCategory === cat ? "white" : "oklch(0.68 0.06 240)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* News Videos row */}
          {videoItems.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp
                  className="w-4 h-4"
                  style={{ color: "oklch(0.72 0.18 220)" }}
                />
                <h2
                  className="text-sm font-bold"
                  style={{ color: "oklch(0.90 0.02 240)" }}
                >
                  News Reels
                </h2>
              </div>
              <div
                className="flex gap-3 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {videoItems.map((v) => (
                  <VideoNewsCard key={v.id} video={v} />
                ))}
              </div>
            </section>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => i).map((i) => (
                <div
                  key={`skeleton-${i}`}
                  className="rounded-xl overflow-hidden"
                  style={{ background: "oklch(0.13 0.03 260)" }}
                >
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-3 space-y-1.5">
                    <Skeleton className="h-3.5 w-full rounded" />
                    <Skeleton className="h-3 w-4/5 rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading &&
            filteredNews.length === 0 &&
            filteredCommunity.length === 0 && (
              <div className="text-center py-12" data-ocid="news.empty_state">
                <Newspaper
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "oklch(0.35 0.05 240)" }}
                />
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                >
                  No articles found. Try a different search.
                </p>
                <Button
                  onClick={loadNews}
                  size="sm"
                  className="mt-3"
                  style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
                >
                  Refresh
                </Button>
              </div>
            )}

          {/* News grid */}
          {!loading &&
            (filteredNews.length > 0 || filteredCommunity.length > 0) && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {/* Community posts first */}
                {filteredCommunity.map((post, idx) => (
                  <CommunityCard
                    key={post.id}
                    post={post}
                    onOpen={() => setOpenArticle(post)}
                    onHashtagClick={setActiveHashtag}
                    data-ocid={`news.community.item.${idx + 1}`}
                  />
                ))}
                {/* News articles */}
                {filteredNews.map((item, idx) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    onOpen={() => setOpenArticle(item)}
                    onHashtagClick={setActiveHashtag}
                    data-ocid={`news.article.item.${idx + 1}`}
                  />
                ))}
              </div>
            )}
        </div>
      </ScrollArea>

      {/* ── Article Reader Overlay ── */}
      <AnimatePresence>
        {openArticle && (
          <ArticleReader
            article={openArticle}
            onClose={() => setOpenArticle(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Post News Modal ── */}
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent
          data-ocid="news.post.dialog"
          className="max-w-md"
          style={{
            background: "oklch(0.13 0.03 260)",
            borderColor: "oklch(0.22 0.04 260)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.02 240)" }}>
              Post News Article
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                Headline *
              </Label>
              <Input
                data-ocid="news.post.input"
                value={postHeadline}
                onChange={(e) => setPostHeadline(e.target.value)}
                placeholder="Enter your headline..."
                style={{
                  background: "oklch(0.16 0.03 260)",
                  borderColor: "oklch(0.26 0.05 260)",
                  color: "white",
                }}
              />
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                Article Body *
              </Label>
              <Textarea
                data-ocid="news.post.textarea"
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                placeholder="Write your article..."
                className="min-h-[100px] resize-none text-sm"
                style={{
                  background: "oklch(0.16 0.03 260)",
                  borderColor: "oklch(0.26 0.05 260)",
                  color: "white",
                }}
              />
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                Hashtags (press Space or Enter to add)
              </Label>
              <div
                className="flex flex-wrap gap-1 p-2 rounded-md mb-1.5 min-h-[32px]"
                style={{
                  background: "oklch(0.16 0.03 260)",
                  border: "1px solid oklch(0.26 0.05 260)",
                }}
              >
                {postHashtags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(0.52 0.18 220 / 0.2)",
                      color: "oklch(0.75 0.14 220)",
                    }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() =>
                        setPostHashtags((prev) => prev.filter((t) => t !== tag))
                      }
                      style={{ color: "oklch(0.55 0.08 220)" }}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  data-ocid="news.post.hashtag.input"
                  value={postHashtagInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.includes(" ") || v.includes("#")) {
                      const tag = v.replace(/[# ]/g, "").toLowerCase().trim();
                      if (tag && !postHashtags.includes(tag)) {
                        setPostHashtags((prev) => [...prev, tag]);
                      }
                      setPostHashtagInput("");
                    } else {
                      setPostHashtagInput(v);
                    }
                  }}
                  onKeyDown={handleHashtagKeyDown}
                  placeholder="#topic"
                  className="flex-1 min-w-[80px] bg-transparent text-xs outline-none"
                  style={{ color: "oklch(0.88 0.02 240)" }}
                />
              </div>
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                Image (optional)
              </Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFile}
              />
              <div className="flex gap-2 items-center">
                <Input
                  value={postImageUrl.startsWith("data:") ? "" : postImageUrl}
                  onChange={(e) => {
                    setPostImageUrl(e.target.value);
                    setPostImagePreview(e.target.value);
                  }}
                  placeholder="Image URL..."
                  style={{
                    background: "oklch(0.16 0.03 260)",
                    borderColor: "oklch(0.26 0.05 260)",
                    color: "white",
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-ocid="news.post.upload_button"
                  onClick={() => fileRef.current?.click()}
                  className="flex-shrink-0"
                  style={{
                    borderColor: "oklch(0.28 0.05 260)",
                    color: "oklch(0.70 0.08 240)",
                  }}
                >
                  <Image className="w-3.5 h-3.5" />
                </Button>
              </div>
              {postImagePreview && (
                <div className="mt-2 relative rounded-lg overflow-hidden">
                  <img
                    src={postImagePreview}
                    alt="Preview"
                    className="w-full h-24 object-cover rounded-lg"
                    onError={() => setPostImagePreview("")}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPostImageUrl("");
                      setPostImagePreview("");
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0 0 0 / 0.6)" }}
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              data-ocid="news.post.cancel_button"
              variant="ghost"
              onClick={() => setShowPostModal(false)}
              style={{ color: "oklch(0.60 0.04 240)" }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="news.post.submit_button"
              onClick={handleCreatePost}
              disabled={!postHeadline.trim() || !postBody.trim()}
              style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
