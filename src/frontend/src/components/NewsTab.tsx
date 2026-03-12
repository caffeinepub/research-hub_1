import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Clock,
  MessageCircle,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Send,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  body?: string;
  source: string;
  sourceType:
    | "wikipedia"
    | "reddit"
    | "hackernews"
    | "guardian"
    | "arxiv"
    | "community"
    | "bbc"
    | "npr";
  category: string;
  publishedAt: string;
  thumbnail?: string;
  author?: string;
  comments?: NewsComment[];
  url?: string;
}

interface NewsComment {
  id: number;
  author: string;
  text: string;
  time: string;
}

interface ForumThread {
  id: number;
  title: string;
  body: string;
  category: string;
  replies: ForumReply[];
  author: string;
  createdAt: string;
  views: number;
}

interface ForumReply {
  id: number;
  author: string;
  body: string;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────

const NEWS_CATEGORIES = [
  "All",
  "World",
  "Science",
  "Tech",
  "Health",
  "Space",
  "History",
  "Community",
];

const SOURCE_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  wikipedia: {
    bg: "oklch(0.25 0.08 220 / 0.3)",
    color: "oklch(0.72 0.14 220)",
    label: "Wikipedia",
  },
  reddit: {
    bg: "oklch(0.25 0.10 25 / 0.3)",
    color: "oklch(0.72 0.16 25)",
    label: "Reddit",
  },
  hackernews: {
    bg: "oklch(0.28 0.12 45 / 0.3)",
    color: "oklch(0.78 0.18 45)",
    label: "HN",
  },
  guardian: {
    bg: "oklch(0.22 0.08 290 / 0.3)",
    color: "oklch(0.72 0.14 290)",
    label: "Guardian",
  },
  arxiv: {
    bg: "oklch(0.25 0.08 170 / 0.3)",
    color: "oklch(0.68 0.14 170)",
    label: "arXiv",
  },
  bbc: {
    bg: "oklch(0.22 0.10 330 / 0.3)",
    color: "oklch(0.72 0.14 330)",
    label: "BBC",
  },
  npr: {
    bg: "oklch(0.22 0.10 190 / 0.3)",
    color: "oklch(0.70 0.14 190)",
    label: "NPR",
  },
  community: {
    bg: "oklch(0.22 0.10 140 / 0.3)",
    color: "oklch(0.70 0.16 140)",
    label: "Community",
  },
};

const MOCK_FORUM_THREADS: ForumThread[] = [
  {
    id: 1,
    title: "Climate change latest findings — record ocean temperatures in 2026",
    body: "Scientists have recorded unprecedented ocean temperatures this year. Several studies suggest we're approaching tipping points faster than previously modeled. What does the latest research tell us?",
    category: "Science",
    author: "JordanLee",
    createdAt: "3h ago",
    views: 847,
    replies: [
      {
        id: 1,
        author: "AlexChen",
        body: "The IPCC models from 2023 seem to have underestimated the pace significantly. This is alarming.",
        createdAt: "2h ago",
      },
      {
        id: 2,
        author: "MayaPatel",
        body: "There are also positive developments in carbon capture tech — we shouldn't lose hope.",
        createdAt: "1h ago",
      },
    ],
  },
  {
    id: 2,
    title:
      "Space exploration updates 2026 — Artemis III crew selection announced",
    body: "NASA has announced the crew for the first crewed lunar landing since Apollo 17. The mission is scheduled for late 2026. What's your take on the mission plan and science objectives?",
    category: "Space",
    author: "AlexChen",
    createdAt: "6h ago",
    views: 1203,
    replies: [
      {
        id: 1,
        author: "SamTorres",
        body: "The South Pole landing site is strategically important for water ice discovery. Smart choice.",
        createdAt: "5h ago",
      },
    ],
  },
  {
    id: 3,
    title: "AI in medicine: FDA approves 3rd AI diagnostic tool this year",
    body: "The FDA has approved another AI-based diagnostic tool, this time for early Alzheimer's detection. The tool claims 94% accuracy on early-stage cases. How should we think about AI replacing radiologists and pathologists?",
    category: "Tech",
    author: "SamTorres",
    createdAt: "1d ago",
    views: 2341,
    replies: [
      {
        id: 1,
        author: "JordanLee",
        body: "Augmenting, not replacing — that's the key. These tools are most powerful when paired with human expertise.",
        createdAt: "20h ago",
      },
      {
        id: 2,
        author: "RileyKim",
        body: "The ethics of algorithmic diagnosis are underexplored. Who bears liability when the AI is wrong?",
        createdAt: "18h ago",
      },
    ],
  },
  {
    id: 4,
    title:
      "Historical discoveries this year — Bronze Age site found in northern Scotland",
    body: "Archaeologists have uncovered a well-preserved Bronze Age settlement in the Scottish Highlands, dating back 3,500 years. Artifacts suggest trade connections with Scandinavia. This could rewrite the history of early Scottish civilization.",
    category: "History",
    author: "MayaPatel",
    createdAt: "2d ago",
    views: 891,
    replies: [],
  },
  {
    id: 5,
    title:
      "Technology breakthroughs — solid-state batteries hit commercial production",
    body: "Toyota has begun limited commercial production of solid-state batteries with 2x energy density over lithium-ion. This could be the breakthrough that finally makes EVs competitive on range and cost. When will we see these in consumer vehicles?",
    category: "Tech",
    author: "SamTorres",
    createdAt: "2d ago",
    views: 3456,
    replies: [
      {
        id: 1,
        author: "AlexChen",
        body: "I've been following Toyota's SSB program for years. If these numbers hold up in real-world conditions, it's genuinely transformative.",
        createdAt: "1d ago",
      },
    ],
  },
  {
    id: 6,
    title: "Global health watch — new MRSA strain identified in 12 countries",
    body: "A new antibiotic-resistant strain of MRSA has been identified in hospital settings across 12 countries. The WHO has issued a level-2 alert. What should we know about containment and treatment?",
    category: "Health",
    author: "JordanLee",
    createdAt: "4h ago",
    views: 1567,
    replies: [],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SourceBadge({
  type,
  source,
}: { type: NewsItem["sourceType"]; source: string }) {
  const style = SOURCE_STYLES[type] || SOURCE_STYLES.wikipedia;
  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.color}44`,
      }}
    >
      {source}
    </span>
  );
}

// ─── Data Fetching ──────────────────────────────────────────────────────────

async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
    );
    if (!res.ok) return [];
    const ids: number[] = await res.json();
    const top = ids.slice(0, 12);
    const items = await Promise.allSettled(
      top.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
          (r) => r.json(),
        ),
      ),
    );
    return items
      .filter((r) => r.status === "fulfilled" && r.value?.title)
      .map((r, i) => {
        const v = (r as PromiseFulfilledResult<any>).value;
        return {
          id: `hn-${v.id || i}`,
          title: v.title || "Untitled",
          summary: v.text
            ? v.text.replace(/<[^>]+>/g, "").slice(0, 300)
            : `${v.score || 0} points · ${v.descendants || 0} comments`,
          body: v.text ? v.text.replace(/<[^>]+>/g, "") : undefined,
          source: "Hacker News",
          sourceType: "hackernews" as const,
          category: "Tech",
          publishedAt: new Date((v.time || 0) * 1000).toISOString(),
          url: v.url,
        };
      });
  } catch {
    return [];
  }
}

async function fetchRedditSub(
  sub: string,
  category: string,
): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${sub}/hot.json?limit=15`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.children || []).map((p: any, i: number) => {
      const d = p.data;
      return {
        id: `reddit-${sub}-${d.id || i}`,
        title: d.title || "Untitled",
        summary: d.selftext
          ? d.selftext.slice(0, 300)
          : `${d.score || 0} upvotes · ${d.num_comments || 0} comments`,
        body: d.selftext || undefined,
        source: `r/${sub}`,
        sourceType: "reddit" as const,
        category,
        publishedAt: new Date((d.created_utc || 0) * 1000).toISOString(),
        thumbnail:
          d.thumbnail?.startsWith("http") && !d.thumbnail.includes("self")
            ? d.thumbnail
            : undefined,
      };
    });
  } catch {
    return [];
  }
}

async function fetchGuardianNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://content.guardianapis.com/search?api-key=test&show-fields=headline,trailText,bodyText,thumbnail&page-size=20",
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.response?.results || []).map((item: any, i: number) => ({
      id: `guardian-${item.id || i}`,
      title: item.webTitle || item.fields?.headline || "Untitled",
      summary: item.fields?.trailText || "",
      body: item.fields?.bodyText || undefined,
      source: "The Guardian",
      sourceType: "guardian" as const,
      category: item.sectionName || "World",
      publishedAt: item.webPublicationDate || new Date().toISOString(),
      thumbnail: item.fields?.thumbnail || undefined,
    }));
  } catch {
    return [];
  }
}

async function fetchWikipediaCurrentEvents(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=2026&srnamespace=0&srlimit=10&format=json&origin=*",
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.query?.search || []).map((item: any, i: number) => ({
      id: `wiki-${item.pageid || i}`,
      title: item.title || "Untitled",
      summary: item.snippet ? item.snippet.replace(/<[^>]+>/g, "") : "",
      source: "Wikipedia",
      sourceType: "wikipedia" as const,
      category: "World",
      publishedAt: item.timestamp || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

function parseRSS(
  xmlText: string,
  sourceType: string,
  source: string,
): NewsItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    const items = Array.from(doc.querySelectorAll("item"));
    return items.slice(0, 15).map((item, i) => ({
      id: `${sourceType}-rss-${i}-${Date.now()}`,
      title: item.querySelector("title")?.textContent || "",
      summary:
        item
          .querySelector("description")
          ?.textContent?.replace(/<[^>]*>/g, "")
          .slice(0, 200) || "",
      source,
      sourceType: sourceType as NewsItem["sourceType"],
      category: "World",
      publishedAt:
        item.querySelector("pubDate")?.textContent || new Date().toISOString(),
      url: item.querySelector("link")?.textContent || "",
    }));
  } catch {
    return [];
  }
}

async function fetchBBCNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent("https://feeds.bbci.co.uk/news/rss.xml")}`,
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, "bbc", "BBC News");
  } catch {
    return [];
  }
}

async function fetchNPRNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent("https://feeds.npr.org/1001/rss.xml")}`,
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, "npr", "NPR");
  } catch {
    return [];
  }
}

// ─── Article Reader ───────────────────────────────────────────────────────────

function ArticleReader({
  article,
  onBack,
}: {
  article: NewsItem;
  onBack: () => void;
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<NewsComment[]>(
    article.comments || [],
  );
  const style = SOURCE_STYLES[article.sourceType] || SOURCE_STYLES.wikipedia;

  const submitComment = () => {
    if (!comment.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: Date.now(), author: "You", text: comment.trim(), time: "Just now" },
    ]);
    setComment("");
    toast.success("Comment posted!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-3xl mx-auto"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity"
        style={{ color: "oklch(0.65 0.12 220)" }}
        data-ocid="news.reader_back_button"
      >
        <ArrowLeft className="w-4 h-4" /> Back to news
      </button>

      {/* Hero image */}
      {article.thumbnail && (
        <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-6">
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Category + source */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <SourceBadge type={article.sourceType} source={article.source} />
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: "oklch(0.18 0.04 260)",
            color: "oklch(0.60 0.06 240)",
          }}
        >
          {article.category}
        </span>
        <span
          className="text-xs flex items-center gap-1"
          style={{ color: "oklch(0.50 0.04 240)" }}
        >
          <Clock className="w-3 h-3" />
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* Headline */}
      <h1 className="font-display font-bold text-2xl md:text-3xl text-white leading-tight mb-4">
        {article.title}
      </h1>

      {/* Body */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          background: "oklch(0.13 0.025 260)",
          border: "1px solid oklch(0.22 0.04 260)",
        }}
      >
        {article.body ? (
          <p
            className="text-sm leading-relaxed whitespace-pre-line"
            style={{ color: "oklch(0.80 0.03 240)" }}
          >
            {article.body}
          </p>
        ) : (
          <p
            className="text-sm leading-relaxed"
            style={{ color: "oklch(0.80 0.03 240)" }}
          >
            {article.summary || "No content available for this article."}
          </p>
        )}
        {article.url && article.sourceType !== "community" && (
          <p className="mt-4 text-xs" style={{ color: "oklch(0.50 0.04 240)" }}>
            Source: <span style={{ color: style.color }}>{article.source}</span>
          </p>
        )}
      </div>

      {/* Comments */}
      {article.sourceType === "community" && (
        <div>
          <h2 className="font-semibold text-white text-base mb-4">
            Comments ({comments.length})
          </h2>

          <div className="space-y-3 mb-4">
            {comments.map((c, i) => (
              <div
                key={c.id}
                data-ocid={`news.comment.item.${i + 1}`}
                className="flex gap-3 p-3 rounded-xl"
                style={{
                  background: "oklch(0.12 0.02 260)",
                  border: "1px solid oklch(0.20 0.03 260)",
                }}
              >
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarFallback
                    style={{
                      background: "oklch(0.20 0.05 260)",
                      color: "oklch(0.75 0.08 240)",
                      fontSize: "10px",
                    }}
                  >
                    {c.author.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">
                      {c.author}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "oklch(0.45 0.04 240)" }}
                    >
                      {c.time}
                    </span>
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.72 0.04 240)" }}
                  >
                    {c.text}
                  </p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p
                className="text-sm text-center py-4"
                style={{ color: "oklch(0.45 0.04 240)" }}
              >
                No comments yet
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              style={{
                background: "oklch(0.13 0.025 260)",
                borderColor: "oklch(0.22 0.04 260)",
                color: "white",
              }}
              data-ocid="news.comment_input"
            />
            <Button
              type="button"
              onClick={submitComment}
              disabled={!comment.trim()}
              style={{ background: "oklch(0.52 0.18 220)" }}
              data-ocid="news.comment_submit_button"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── News Card ────────────────────────────────────────────────────────────────

function HeroCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  const style = SOURCE_STYLES[item.sourceType] || SOURCE_STYLES.wikipedia;
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid="news.hero_card"
      className="w-full text-left rounded-2xl overflow-hidden relative group transition-all hover:scale-[1.005]"
      style={{
        background: "oklch(0.13 0.025 260)",
        border: "1px solid oklch(0.25 0.05 260)",
        minHeight: 280,
      }}
    >
      {item.thumbnail ? (
        <div className="relative">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-52 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 30%, oklch(0.10 0.02 260) 100%)",
            }}
          />
        </div>
      ) : (
        <div
          className="w-full h-32 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, oklch(0.15 0.05 260), oklch(0.12 0.03 ${item.sourceType === "reddit" ? "25" : "220"}))`,
          }}
        >
          <Newspaper
            className="w-12 h-12 opacity-30"
            style={{ color: style.color }}
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <SourceBadge type={item.sourceType} source={item.source} />
          <Badge
            variant="outline"
            className="text-[10px] h-5 px-2"
            style={{
              borderColor: "oklch(0.28 0.04 260)",
              color: "oklch(0.55 0.05 240)",
            }}
          >
            {item.category}
          </Badge>
          <span
            className="text-[10px] ml-auto flex items-center gap-1"
            style={{ color: "oklch(0.48 0.04 240)" }}
          >
            <Clock className="w-3 h-3" />
            {timeAgo(item.publishedAt)}
          </span>
        </div>
        <h2 className="font-display font-bold text-white text-xl leading-snug mb-2 line-clamp-3">
          {item.title}
        </h2>
        {item.summary && (
          <p
            className="text-sm line-clamp-2"
            style={{ color: "oklch(0.62 0.04 240)" }}
          >
            {item.summary}
          </p>
        )}
      </div>
    </button>
  );
}

function NewsCard({
  item,
  index,
  onClick,
}: { item: NewsItem; index: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={`news.item.${index + 1}`}
      className="w-full text-left rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99]"
      style={{
        background: "oklch(0.13 0.025 260)",
        border: "1px solid oklch(0.22 0.04 260)",
      }}
    >
      {item.thumbnail && (
        <div className="w-full h-32 overflow-hidden">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <SourceBadge type={item.sourceType} source={item.source} />
          <span
            className="text-[10px] ml-auto"
            style={{ color: "oklch(0.45 0.04 240)" }}
          >
            {timeAgo(item.publishedAt)}
          </span>
        </div>
        <p className="font-semibold text-white text-sm leading-snug line-clamp-3 mb-1">
          {item.title}
        </p>
        {item.summary && (
          <p
            className="text-xs line-clamp-2"
            style={{ color: "oklch(0.55 0.04 240)" }}
          >
            {item.summary}
          </p>
        )}
        {item.sourceType === "community" && (
          <div
            className="flex items-center gap-1 mt-2"
            style={{ color: "oklch(0.50 0.04 240)" }}
          >
            <MessageCircle className="w-3 h-3" />
            <span className="text-[10px]">
              {item.comments?.length || 0} comments
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Top News Feed ───────────────────────────────────────────────────────────

function TopNewsFeed({
  onSelectArticle,
}: { onSelectArticle: (item: NewsItem) => void }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<string>(
    () => localStorage.getItem("userLocation") || "",
  );
  const [locationInput, setLocationInput] = useState("");
  const [localNews, setLocalNews] = useState<NewsItem[]>([]);
  const ITEMS_PER_PAGE = 12;

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const [hn, reddit1, reddit2, guardian, wiki, bbc, npr] =
        await Promise.allSettled([
          fetchHackerNews(),
          fetchRedditSub("worldnews", "World"),
          fetchRedditSub("science", "Science"),
          fetchGuardianNews(),
          fetchWikipediaCurrentEvents(),
          fetchBBCNews(),
          fetchNPRNews(),
        ]);
      const all: NewsItem[] = [];
      for (const r of [hn, reddit1, reddit2, guardian, wiki, bbc, npr]) {
        if (r.status === "fulfilled") all.push(...r.value);
      }
      all.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      setNews(all);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLocalNews = useCallback(async (city: string) => {
    if (!city.trim()) return;
    try {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${city} news 2026`)}&srnamespace=0&srlimit=6&format=json&origin=*`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const items: NewsItem[] = (data?.query?.search || []).map(
        (item: any, i: number) => ({
          id: `local-wiki-${item.pageid || i}`,
          title: item.title || "Untitled",
          summary: item.snippet ? item.snippet.replace(/<[^>]+>/g, "") : "",
          source: "Wikipedia",
          sourceType: "wikipedia" as const,
          category: "World",
          publishedAt: item.timestamp || new Date().toISOString(),
        }),
      );
      setLocalNews(items);
    } catch {
      // silently fail
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadNews is stable
  useEffect(() => {
    loadNews();
    // Load local news if city is already saved
    const savedCity = localStorage.getItem("userLocation");
    if (savedCity) {
      loadLocalNews(savedCity);
    }
  }, [loadLocalNews]);

  const filtered = news.filter((n) => {
    const matchesCategory =
      activeCategory === "All" ||
      n.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch =
      !searchQuery.trim() ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.summary || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const displayed = filtered.slice(0, page * ITEMS_PER_PAGE);
  const hero = displayed[0];
  const rest = displayed.slice(1);

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "oklch(0.55 0.06 240)" }}
        />
        <Input
          data-ocid="news.search_input"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search news articles..."
          className="pl-9 h-10"
          style={{
            background: "oklch(0.15 0.03 260)",
            borderColor: "oklch(0.26 0.05 260)",
            color: "white",
          }}
        />
      </div>

      {/* Location-based news */}
      {userLocation && localNews.length > 0 && (
        <div
          className="mb-6 p-4 rounded-2xl"
          style={{
            background: "oklch(0.14 0.04 260)",
            border: "1px solid oklch(0.25 0.06 220 / 0.4)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-white">
              📍 News near {userLocation}
            </span>
            <button
              type="button"
              onClick={() => {
                setUserLocation("");
                setLocalNews([]);
                localStorage.removeItem("userLocation");
              }}
              className="ml-auto text-xs px-2 py-0.5 rounded"
              style={{ color: "oklch(0.55 0.05 240)" }}
            >
              Change
            </button>
          </div>
          <div className="space-y-2">
            {localNews.slice(0, 3).map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectArticle(item)}
                data-ocid={`news.local.item.${i + 1}`}
                className="w-full text-left px-3 py-2 rounded-xl transition-all hover:opacity-80"
                style={{ background: "oklch(0.12 0.02 260)" }}
              >
                <p className="text-sm font-medium text-white line-clamp-2">
                  {item.title}
                </p>
                {item.summary && (
                  <p
                    className="text-xs mt-0.5 line-clamp-1"
                    style={{ color: "oklch(0.58 0.04 240)" }}
                  >
                    {item.summary}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No location set - manual input */}
      {!userLocation && (
        <div
          className="mb-5 p-3 rounded-xl flex items-center gap-2"
          style={{
            background: "oklch(0.13 0.03 260)",
            border: "1px solid oklch(0.24 0.05 260)",
          }}
        >
          <span
            className="text-xs flex-1"
            style={{ color: "oklch(0.60 0.04 240)" }}
          >
            📍 Enter your city for local news
          </span>
          <input
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && locationInput.trim()) {
                setUserLocation(locationInput.trim());
                localStorage.setItem("userLocation", locationInput.trim());
                loadLocalNews(locationInput.trim());
                setLocationInput("");
              }
            }}
            placeholder="e.g. Indianapolis"
            className="text-xs px-2 py-1 rounded border w-32"
            style={{
              background: "oklch(0.16 0.04 260)",
              borderColor: "oklch(0.28 0.05 260)",
              color: "white",
            }}
            data-ocid="news.location_input"
          />
          <button
            type="button"
            onClick={() => {
              if (locationInput.trim()) {
                setUserLocation(locationInput.trim());
                localStorage.setItem("userLocation", locationInput.trim());
                loadLocalNews(locationInput.trim());
                setLocationInput("");
              }
            }}
            className="text-xs px-2 py-1 rounded"
            style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
            data-ocid="news.location_button"
          >
            Go
          </button>
        </div>
      )}

      {/* Category filter bar */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-5"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {NEWS_CATEGORIES.filter((c) => c !== "Community").map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setActiveCategory(cat);
              setPage(1);
            }}
            data-ocid="news.category_tab"
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background:
                activeCategory === cat
                  ? "oklch(0.52 0.18 220)"
                  : "oklch(0.15 0.03 260)",
              color: activeCategory === cat ? "white" : "oklch(0.58 0.05 240)",
              border:
                activeCategory === cat
                  ? "none"
                  : "1px solid oklch(0.22 0.04 260)",
            }}
          >
            {cat}
          </button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={loadNews}
          disabled={loading}
          className="flex-shrink-0 h-7 px-3"
          style={{ color: "oklch(0.55 0.05 240)" }}
          data-ocid="news.refresh_button"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Loading state */}
      {loading && news.length === 0 && (
        <div data-ocid="news.loading_state" className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, i) => `skel-${i}`).map((key) => (
            <div
              key={key}
              className="h-32 rounded-xl animate-pulse"
              style={{ background: "oklch(0.14 0.025 260)" }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && news.length === 0 && (
        <div
          data-ocid="news.empty_state"
          className="flex flex-col items-center py-16 text-center"
        >
          <Newspaper
            className="w-10 h-10 mb-3"
            style={{ color: "oklch(0.35 0.04 260)" }}
          />
          <p className="text-sm" style={{ color: "oklch(0.50 0.05 240)" }}>
            Couldn&apos;t load news. Check your connection.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={loadNews}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Hero card */}
      {hero && (
        <div className="mb-5">
          <HeroCard item={hero} onClick={() => onSelectArticle(hero)} />
        </div>
      )}

      {/* Grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {rest.map((item, i) => (
            <NewsCard
              key={item.id}
              item={item}
              index={i + 1}
              onClick={() => onSelectArticle(item)}
            />
          ))}
        </div>
      )}

      {displayed.length < filtered.length && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            data-ocid="news.pagination_next"
            style={{
              borderColor: "oklch(0.28 0.04 260)",
              color: "oklch(0.65 0.05 240)",
            }}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Community Posts ──────────────────────────────────────────────────────────

const INITIAL_COMMUNITY_POSTS: NewsItem[] = [
  {
    id: "comm-1",
    title:
      "I spent a week reading every Wikipedia article on the Byzantine Empire — here's what I learned",
    summary:
      "An amateur historian's deep dive into one of history's most misunderstood civilizations. Spoiler: they called themselves Romans until the very end.",
    body: "Last month I decided to go deep on Byzantine history using only Wikipedia and Archive.org sources. What I found was a civilization far more sophisticated and culturally rich than the caricature of 'the eastern Roman Empire that declined slowly.'\n\nKey takeaways:\n\n1. The Byzantines never called themselves Byzantine — that term was invented by 16th century western historians. They called themselves Romans (Romaioi).\n\n2. Constantinople in the 10th century was the largest city in Europe, with a population of around 400,000 — dwarfing Paris and London at the time.\n\n3. The Byzantines preserved classical Greek texts that would otherwise be lost. Much of what we know about Aristotle came through Byzantine scholars.\n\nI've linked to all my sources in the comments. Would love to discuss!\n",
    source: "Community",
    sourceType: "community" as const,
    category: "History",
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    author: "MayaPatel",
    comments: [
      {
        id: 1,
        author: "AlexChen",
        text: "Excellent write-up! The point about their self-identification is something most people don't know.",
        time: "1d ago",
      },
      {
        id: 2,
        author: "JordanLee",
        text: "Have you read John Julius Norwich's trilogy? He covers this in great depth.",
        time: "20h ago",
      },
    ],
  },
  {
    id: "comm-2",
    title:
      "Open science is changing how research works — and most people haven't noticed",
    summary:
      "Pre-prints, open data, and tools like arXiv are quietly transforming academic publishing. Here's why it matters for everyone.",
    body: "The academic publishing system has been under pressure for years. Journals charge universities billions annually for access to publicly-funded research. But a quiet revolution is underway.\n\nPre-print servers like arXiv, bioRxiv, and medRxiv now host millions of papers before (and sometimes instead of) peer review. During COVID, this allowed research to spread in days rather than months.\n\nWhat this means for you:\n- Research is increasingly free to access\n- You can read papers before they're 'officially' published\n- Tools like Semantic Scholar and OpenAlex make searching this literature easier than ever\n\nThe gatekeepers are losing their grip. Science is becoming more open.\n",
    source: "Community",
    sourceType: "community" as const,
    category: "Science",
    publishedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    author: "JordanLee",
    comments: [],
  },
];

function CommunityPostsFeed({
  onSelectArticle,
}: { onSelectArticle: (item: NewsItem) => void }) {
  const [posts, setPosts] = useState<NewsItem[]>(INITIAL_COMMUNITY_POSTS);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("World");
  const [newImageUrl, setNewImageUrl] = useState("");

  const createPost = () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    const post: NewsItem = {
      id: `comm-${Date.now()}`,
      title: newTitle.trim(),
      summary:
        newBody.trim().slice(0, 200) +
        (newBody.trim().length > 200 ? "..." : ""),
      body: newBody.trim(),
      source: "Community",
      sourceType: "community",
      category: newCategory,
      publishedAt: new Date().toISOString(),
      author: "You",
      thumbnail: newImageUrl.trim() || undefined,
      comments: [],
    };
    setPosts((prev) => [post, ...prev]);
    setNewTitle("");
    setNewBody("");
    setNewCategory("World");
    setNewImageUrl("");
    setCreateOpen(false);
    toast.success("Post published!");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-bold text-white text-lg">
            Community Posts
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.55 0.05 240)" }}
          >
            Articles and research written by community members
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
              data-ocid="news.create_post_button"
            >
              <Plus className="w-4 h-4 mr-1" /> Write Post
            </Button>
          </DialogTrigger>
          <DialogContent
            style={{
              background: "oklch(0.12 0.025 260)",
              border: "1px solid oklch(0.22 0.04 260)",
              maxWidth: "600px",
            }}
            data-ocid="news.create_post_dialog"
          >
            <DialogHeader>
              <DialogTitle className="text-white">
                Write a News Post
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-white text-xs mb-1.5 block">
                  Title *
                </Label>
                <Input
                  placeholder="Your headline..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    background: "oklch(0.15 0.03 260)",
                    borderColor: "oklch(0.25 0.04 260)",
                    color: "white",
                  }}
                  data-ocid="news.post_title_input"
                />
              </div>
              <div>
                <Label className="text-white text-xs mb-1.5 block">
                  Category
                </Label>
                <div className="flex flex-wrap gap-2">
                  {NEWS_CATEGORIES.filter(
                    (c) => c !== "All" && c !== "Community",
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background:
                          newCategory === cat
                            ? "oklch(0.52 0.18 220)"
                            : "oklch(0.18 0.03 260)",
                        color:
                          newCategory === cat
                            ? "white"
                            : "oklch(0.60 0.05 240)",
                        border:
                          newCategory === cat
                            ? "none"
                            : "1px solid oklch(0.25 0.04 260)",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-white text-xs mb-1.5 block">
                  Article Body *
                </Label>
                <Textarea
                  placeholder="Write your article here..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  rows={8}
                  className="resize-none"
                  style={{
                    background: "oklch(0.15 0.03 260)",
                    borderColor: "oklch(0.25 0.04 260)",
                    color: "white",
                  }}
                  data-ocid="news.post_body_textarea"
                />
              </div>
              <div>
                <Label className="text-white text-xs mb-1.5 block">
                  Image URL (optional)
                </Label>
                <Input
                  placeholder="https://..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  style={{
                    background: "oklch(0.15 0.03 260)",
                    borderColor: "oklch(0.25 0.04 260)",
                    color: "white",
                  }}
                  data-ocid="news.post_image_input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                style={{ color: "oklch(0.55 0.05 240)" }}
                data-ocid="news.post_cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={createPost}
                disabled={!newTitle.trim() || !newBody.trim()}
                style={{ background: "oklch(0.70 0.16 140)", color: "white" }}
                data-ocid="news.post_submit_button"
              >
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.map((post, i) => (
          <button
            key={post.id}
            type="button"
            onClick={() => onSelectArticle(post)}
            data-ocid={`news.community_post.item.${i + 1}`}
            className="text-left rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99]"
            style={{
              background: "oklch(0.13 0.025 260)",
              border: "1px solid oklch(0.25 0.07 140 / 0.4)",
            }}
          >
            {post.thumbnail && (
              <div className="h-32 overflow-hidden">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <SourceBadge type="community" source="Community" />
                <span
                  className="text-[10px]"
                  style={{ color: "oklch(0.45 0.04 240)" }}
                >
                  {post.author} · {timeAgo(post.publishedAt)}
                </span>
              </div>
              <h3 className="font-semibold text-white text-sm leading-snug line-clamp-3 mb-2">
                {post.title}
              </h3>
              <p
                className="text-xs line-clamp-2"
                style={{ color: "oklch(0.55 0.04 240)" }}
              >
                {post.summary}
              </p>
              <div
                className="flex items-center gap-1 mt-3"
                style={{ color: "oklch(0.50 0.04 240)" }}
              >
                <MessageCircle className="w-3 h-3" />
                <span className="text-[10px]">
                  {post.comments?.length || 0} comments
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Forum Discussions ─────────────────────────────────────────────────────────

function DiscussionsFeed() {
  const [threads, setThreads] = useState<ForumThread[]>(MOCK_FORUM_THREADS);
  const [selected, setSelected] = useState<ForumThread | null>(null);
  const [replyText, setReplyText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const submitReply = () => {
    if (!replyText.trim() || !selected) return;
    const reply: ForumReply = {
      id: Date.now(),
      author: "You",
      body: replyText.trim(),
      createdAt: "Just now",
    };
    const updated = { ...selected, replies: [...selected.replies, reply] };
    setSelected(updated);
    setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setReplyText("");
    toast.success("Reply posted!");
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };

  if (selected) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm mb-5 hover:opacity-80"
          style={{ color: "oklch(0.65 0.12 220)" }}
          data-ocid="news.discussion_back_button"
        >
          <ArrowLeft className="w-4 h-4" /> Back to discussions
        </button>

        <div
          className="p-4 rounded-xl mb-5"
          style={{
            background: "oklch(0.13 0.025 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3 inline-block"
            style={{
              background: "oklch(0.20 0.05 220 / 0.3)",
              color: "oklch(0.65 0.12 220)",
            }}
          >
            {selected.category}
          </span>
          <h2 className="font-display font-bold text-white text-lg leading-snug mb-2">
            {selected.title}
          </h2>
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: "oklch(0.70 0.04 240)" }}
          >
            {selected.body}
          </p>
          <div
            className="flex items-center gap-3"
            style={{ color: "oklch(0.48 0.04 240)" }}
          >
            <span className="text-xs">{selected.author}</span>
            <span className="text-xs">{selected.createdAt}</span>
            <span className="text-xs flex items-center gap-1 ml-auto">
              <TrendingUp className="w-3 h-3" /> {selected.views} views
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {selected.replies.map((reply, i) => (
            <div
              key={reply.id}
              data-ocid={`news.discussion_reply.item.${i + 1}`}
              className="flex gap-3 p-3 rounded-xl"
              style={{
                background: "oklch(0.12 0.02 260)",
                border: "1px solid oklch(0.20 0.03 260)",
              }}
            >
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback
                  style={{
                    background: "oklch(0.20 0.05 260)",
                    color: "oklch(0.72 0.08 240)",
                    fontSize: "10px",
                  }}
                >
                  {reply.author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-white">
                    {reply.author}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: "oklch(0.45 0.04 240)" }}
                  >
                    {reply.createdAt}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "oklch(0.72 0.04 240)" }}
                >
                  {reply.body}
                </p>
              </div>
            </div>
          ))}
          {selected.replies.length === 0 && (
            <p
              className="text-center text-sm py-6"
              style={{ color: "oklch(0.45 0.04 240)" }}
            >
              No replies yet. Start the discussion!
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitReply()}
            style={{
              background: "oklch(0.13 0.025 260)",
              borderColor: "oklch(0.22 0.04 260)",
              color: "white",
            }}
            data-ocid="news.discussion_reply_input"
          />
          <Button
            type="button"
            onClick={submitReply}
            disabled={!replyText.trim()}
            style={{ background: "oklch(0.52 0.18 220)" }}
            data-ocid="news.discussion_reply_button"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display font-bold text-white text-lg">
          Research Discussions
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.05 240)" }}>
          Community debates on current events and research topics
        </p>
      </div>
      <div className="space-y-3">
        {threads.map((thread, i) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => setSelected(thread)}
            data-ocid={`news.discussion.item.${i + 1}`}
            className="w-full text-left p-4 rounded-xl transition-all hover:scale-[1.005]"
            style={{
              background: "oklch(0.13 0.025 260)",
              border: "1px solid oklch(0.22 0.04 260)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "oklch(0.18 0.05 220 / 0.3)" }}
              >
                <MessageCircle
                  className="w-4 h-4"
                  style={{ color: "oklch(0.65 0.12 220)" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(0.20 0.05 220 / 0.3)",
                      color: "oklch(0.65 0.12 220)",
                    }}
                  >
                    {thread.category}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: "oklch(0.45 0.04 240)" }}
                  >
                    {thread.createdAt}
                  </span>
                </div>
                <p className="font-semibold text-white text-sm leading-snug line-clamp-2 mb-2">
                  {thread.title}
                </p>
                <div
                  className="flex items-center gap-3"
                  style={{ color: "oklch(0.48 0.04 240)" }}
                >
                  <span className="text-[10px]">{thread.author}</span>
                  <span className="text-[10px] flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />{" "}
                    {thread.replies.length} replies
                  </span>
                  <span className="text-[10px] flex items-center gap-1 ml-auto">
                    <TrendingUp className="w-3 h-3" />{" "}
                    {thread.views.toLocaleString()} views
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main NewsTab ────────────────────────────────────────────────────────────────

type NewsSection = "top" | "community" | "discussions";

export function NewsTab() {
  const [section, setSection] = useState<NewsSection>("top");
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  if (selectedArticle) {
    return (
      <AnimatePresence mode="wait">
        <ArticleReader
          key={selectedArticle.id}
          article={selectedArticle}
          onBack={() => setSelectedArticle(null)}
        />
      </AnimatePresence>
    );
  }

  return (
    <div data-ocid="news.section">
      {/* Tab bar */}
      <div
        className="flex gap-2 mb-6 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {(
          [
            {
              key: "top",
              label: "Top News",
              icon: <Newspaper className="w-3.5 h-3.5" />,
            },
            {
              key: "community",
              label: "Community Posts",
              icon: <MessageCircle className="w-3.5 h-3.5" />,
            },
            {
              key: "discussions",
              label: "Discussions",
              icon: <TrendingUp className="w-3.5 h-3.5" />,
            },
          ] as { key: NewsSection; label: string; icon: React.ReactNode }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSection(tab.key)}
            data-ocid={`news.${tab.key}_tab`}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background:
                section === tab.key
                  ? "oklch(0.52 0.18 220)"
                  : "oklch(0.15 0.03 260)",
              color: section === tab.key ? "white" : "oklch(0.58 0.05 240)",
              border:
                section === tab.key ? "none" : "1px solid oklch(0.22 0.04 260)",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {section === "top" && (
            <TopNewsFeed onSelectArticle={setSelectedArticle} />
          )}
          {section === "community" && (
            <CommunityPostsFeed onSelectArticle={setSelectedArticle} />
          )}
          {section === "discussions" && <DiscussionsFeed />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
