import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowBigUp,
  ArrowLeft,
  ChevronUp,
  Clock,
  Edit3,
  Flame,
  Hash,
  Image,
  Lock,
  MessageCircle,
  Plus,
  Search,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SensitiveContentBlur } from "./SensitiveContentBlur";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CurrentUser {
  username: string;
  avatar: string;
  isAdmin: boolean;
}

interface BanEntry {
  username: string;
  type: "ban" | "mute";
  until: string;
  reason: string;
}

interface ReplyRef {
  author: string;
  text: string;
}

interface ForumReply {
  id: number;
  body: string;
  author: string;
  upvotes: number;
  createdAt: number;
  upvotedBy: string[];
  reactions?: Record<string, string[]>;
  imageUrl?: string;
  replyTo?: ReplyRef;
}

interface ForumPost {
  id: number;
  title: string;
  body: string;
  category: string;
  author: string;
  upvotes: number;
  upvotedBy: string[];
  replies: ForumReply[];
  createdAt: number;
  locked?: boolean;
  imageUrl?: string;
  reactions?: Record<string, string[]>;
  channel?: string;
}

// ─── Channels ────────────────────────────────────────────────────────────────

const DEFAULT_CHANNELS = [
  "general",
  "memes",
  "science",
  "technology",
  "art",
  "history",
  "space",
  "random",
];

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥"];

const STICKER_CATEGORIES: Record<string, string[]> = {
  Reactions: [
    "😂",
    "😮",
    "😢",
    "😍",
    "🤣",
    "😊",
    "😎",
    "🥳",
    "😤",
    "🤩",
    "🙄",
    "😴",
  ],
  Fun: ["🎉", "🎊", "🎈", "🌟", "💯", "🔥", "✨", "🎯", "🏆", "👑", "💥", "🚀"],
  Classic: [
    "👋",
    "🤝",
    "👏",
    "💪",
    "🙌",
    "🤞",
    "✌️",
    "🤙",
    "👌",
    "💫",
    "🌈",
    "⭐",
  ],
};

// ─── Storage helpers ─────────────────────────────────────────────────────────

const POSTS_KEY = "communityPosts";
const BANS_KEY = "bannedUsers";
const CHANNELS_KEY = "communityChannels";

function loadPosts(): ForumPost[] {
  try {
    return JSON.parse(localStorage.getItem(POSTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePosts(posts: ForumPost[]) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function loadBans(): BanEntry[] {
  try {
    return JSON.parse(localStorage.getItem(BANS_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadCustomChannels(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHANNELS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCustomChannels(channels: string[]) {
  localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
}

function getUserStatus(username: string): {
  banned: boolean;
  muted: boolean;
  until?: string;
} {
  const bans = loadBans();
  const entry = bans.find((b) => b.username === username);
  if (!entry) return { banned: false, muted: false };
  if (entry.until === "permanent") return { banned: true, muted: false };
  const expiry = new Date(entry.until);
  if (expiry <= new Date()) return { banned: false, muted: false };
  if (entry.type === "ban")
    return { banned: true, muted: false, until: entry.until };
  return { banned: false, muted: true, until: entry.until };
}

function formatTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SEED_POSTS: ForumPost[] = [
  {
    id: 1,
    title:
      "James Webb Space Telescope discovers potential biosignatures on K2-18b",
    body: "The James Webb Space Telescope has detected dimethyl sulfide (DMS) in the atmosphere of K2-18b, a molecule on Earth only produced by living organisms. While scientists are cautious, this could be one of the most significant discoveries in the search for extraterrestrial life.",
    category: "Space",
    channel: "space",
    author: "AstroResearcher",
    upvotes: 847,
    upvotedBy: [],
    replies: [
      {
        id: 101,
        body: "This is incredible! DMS detection would be a massive step. Still need more data but the implications are huge.",
        author: "CosmosExplorer",
        upvotes: 234,
        createdAt: Date.now() - 3600000,
        upvotedBy: [],
        reactions: {},
      },
      {
        id: 102,
        body: "We should be careful about over-interpreting early data. Remember the 'alien megastructure' star? Still fascinating though.",
        author: "SkepticalScientist",
        upvotes: 189,
        createdAt: Date.now() - 7200000,
        upvotedBy: [],
        reactions: {},
      },
    ],
    createdAt: Date.now() - 86400000,
    reactions: {},
  },
  {
    id: 2,
    title: "Open-source AI model beats GPT-4 on coding benchmarks",
    body: "A new open-source model released on HuggingFace has surpassed GPT-4 on HumanEval coding benchmarks while running entirely locally on consumer hardware. The model uses a novel sparse mixture-of-experts architecture that dramatically reduces inference costs.",
    category: "Technology",
    channel: "technology",
    author: "MLEngineer42",
    upvotes: 1203,
    upvotedBy: [],
    replies: [],
    createdAt: Date.now() - 172800000,
    reactions: {},
  },
  {
    id: 3,
    title: "Archive.org digitizes 500,000 rare books from 1400-1800",
    body: "The Internet Archive has completed a massive digitization project bringing half a million rare books from the early modern period into the public domain. The collection includes first editions, illuminated manuscripts, and previously inaccessible private library collections.",
    category: "Research",
    channel: "general",
    author: "LibrarianPro",
    upvotes: 654,
    upvotedBy: [],
    replies: [],
    createdAt: Date.now() - 259200000,
    reactions: {},
  },
  {
    id: 4,
    title: "Best public domain art resources for researchers",
    body: "Compiled a list of the best free art resources: Europeana (15M+ works), Met Museum Open Access (375K+ objects), Rijksmuseum API (700K+ works), Art Institute Chicago (50K+ CC0 images). All are free to use for research and education.",
    category: "Art",
    channel: "art",
    author: "DigitalCurator",
    upvotes: 421,
    upvotedBy: [],
    replies: [
      {
        id: 401,
        body: "Europeana has fantastic Art Nouveau collections, especially from Austrian and Czech museums. Also check the Met's digital library.",
        author: "EuropaMuseumFan",
        upvotes: 78,
        createdAt: Date.now() - 43200000,
        upvotedBy: [],
        reactions: {},
      },
    ],
    createdAt: Date.now() - 432000000,
    reactions: {},
  },
  {
    id: 5,
    title:
      "Researchers decode 3,000-year-old Ugaritic tablet with AI assistance",
    body: "A team at MIT has used large language models trained on ancient Near Eastern languages to successfully decode a previously untranslatable Ugaritic administrative tablet from 1200 BCE. The tablet appears to be a merchant's ledger listing trade goods between Canaan and Egypt.",
    category: "History",
    channel: "history",
    author: "AncientWorldsProf",
    upvotes: 967,
    upvotedBy: [],
    replies: [],
    createdAt: Date.now() - 518400000,
    reactions: {},
  },
];

const CATEGORIES = [
  "All",
  "Science",
  "History",
  "Technology",
  "Art",
  "Space",
  "Gaming",
  "Music",
  "Books",
  "Research",
];

const CATEGORY_COLORS: Record<string, string> = {
  Science: "oklch(0.65 0.18 180)",
  History: "oklch(0.65 0.18 50)",
  Technology: "oklch(0.65 0.18 260)",
  Art: "oklch(0.65 0.18 320)",
  Space: "oklch(0.65 0.18 240)",
  Gaming: "oklch(0.65 0.18 150)",
  Music: "oklch(0.65 0.18 290)",
  Books: "oklch(0.65 0.18 30)",
  Research: "oklch(0.65 0.18 210)",
};

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "oklch(0.52 0.18 220)",
    "oklch(0.55 0.18 160)",
    "oklch(0.55 0.18 320)",
    "oklch(0.55 0.18 50)",
    "oklch(0.55 0.18 280)",
    "oklch(0.55 0.18 120)",
  ];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[Math.abs(hash) % colors.length];
}

// ─── GIF Picker (inline) ──────────────────────────────────────────────────────

interface GifResult {
  id: string;
  title: string;
  url: string;
  preview: string;
}

function GifPickerPanel({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(q)}&limit=12`,
      );
      const data = await res.json();
      setResults(
        data.data.map((g: any) => ({
          id: g.id,
          title: g.title,
          url: g.images.original.url,
          preview: g.images.fixed_height_small.url,
        })),
      );
    } catch {
      toast.error("Failed to load GIFs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: "oklch(0.13 0.03 260)",
        border: "1px solid oklch(0.26 0.05 260)",
      }}
    >
      <div className="p-2 flex items-center gap-1.5">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs..."
          className="h-7 text-xs flex-1"
          style={{
            background: "oklch(0.16 0.04 260)",
            borderColor: "oklch(0.28 0.05 260)",
            color: "white",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") search(query);
          }}
          autoFocus
        />
        <Button
          size="sm"
          className="h-7 px-2 text-xs"
          style={{ background: "oklch(0.52 0.18 220)" }}
          onClick={() => search(query)}
        >
          Go
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="hover:opacity-80 transition-opacity"
          style={{ color: "oklch(0.55 0.04 240)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {loading && (
        <div
          className="p-3 text-center text-xs"
          style={{ color: "oklch(0.55 0.04 240)" }}
        >
          Loading…
        </div>
      )}
      {!loading && results.length === 0 && (
        <div
          className="p-3 text-center text-xs"
          style={{ color: "oklch(0.45 0.04 240)" }}
        >
          Type and press Go to search GIFs
        </div>
      )}
      <div className="grid grid-cols-3 gap-1 p-2 max-h-44 overflow-y-auto">
        {results.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              onSelect(g.url);
              onClose();
            }}
            className="rounded overflow-hidden hover:opacity-80 transition-opacity"
          >
            <img
              src={g.preview}
              alt={g.title}
              className="w-full h-16 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sticker Picker ───────────────────────────────────────────────────────────

function StickerPicker({
  onSelect,
  onClose,
}: {
  onSelect: (sticker: string) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState("Reactions");

  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: "oklch(0.13 0.03 260)",
        border: "1px solid oklch(0.26 0.05 260)",
        width: "240px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "oklch(0.22 0.04 260)" }}
      >
        <span
          className="text-xs font-semibold"
          style={{ color: "oklch(0.72 0.04 240)" }}
        >
          Stickers
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{ color: "oklch(0.50 0.04 240)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category tabs */}
      <div
        className="flex border-b"
        style={{ borderColor: "oklch(0.20 0.04 260)" }}
      >
        {Object.keys(STICKER_CATEGORIES).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveTab(cat)}
            className="flex-1 text-xs py-1.5 transition-colors"
            style={{
              background:
                activeTab === cat
                  ? "oklch(0.52 0.18 220 / 0.15)"
                  : "transparent",
              color:
                activeTab === cat
                  ? "oklch(0.72 0.14 220)"
                  : "oklch(0.50 0.04 240)",
              borderBottom:
                activeTab === cat
                  ? "2px solid oklch(0.60 0.18 220)"
                  : "2px solid transparent",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div className="grid grid-cols-6 gap-0.5 p-2">
        {(STICKER_CATEGORIES[activeTab] ?? []).map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="flex items-center justify-center h-9 w-9 text-xl rounded-lg transition-all hover:scale-125 hover:bg-white/10"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Reaction Bar ─────────────────────────────────────────────────────────────

function ReactionBar({
  reactions = {},
  currentUsername,
  onReact,
}: {
  reactions?: Record<string, string[]>;
  currentUsername?: string;
  onReact: (emoji: string) => void;
}) {
  const activeEmojis = Object.entries(reactions).filter(
    ([, users]) => users.length > 0,
  );

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1.5">
      {activeEmojis.map(([emoji, users]) => {
        const mine = currentUsername ? users.includes(currentUsername) : false;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji)}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all"
            style={{
              background: mine
                ? "oklch(0.52 0.18 220 / 0.2)"
                : "oklch(0.18 0.04 260)",
              border: `1px solid ${mine ? "oklch(0.52 0.18 220 / 0.5)" : "oklch(0.28 0.05 260)"}`,
              color: mine ? "oklch(0.82 0.12 220)" : "oklch(0.72 0.03 240)",
            }}
          >
            <span>{emoji}</span>
            <span className="font-medium">{users.length}</span>
          </button>
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-ocid="community.reaction.button"
            className="flex items-center justify-center w-6 h-6 rounded-full text-xs transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            style={{
              background: "oklch(0.18 0.04 260)",
              border: "1px solid oklch(0.28 0.05 260)",
              color: "oklch(0.55 0.05 240)",
            }}
          >
            +
          </button>
        </PopoverTrigger>
        <PopoverContent
          data-ocid="community.reaction.popover"
          className="w-auto p-2"
          style={{
            background: "oklch(0.15 0.04 260)",
            border: "1px solid oklch(0.26 0.05 260)",
          }}
        >
          <div className="flex gap-1">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1 rounded"
                style={{ lineHeight: 1 }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUser,
  onOpen,
  onUpvote,
  onReact,
}: {
  post: ForumPost;
  currentUser: CurrentUser | null;
  onOpen: () => void;
  onUpvote: () => void;
  onReact: (emoji: string) => void;
}) {
  const hasUpvoted = currentUser
    ? post.upvotedBy.includes(currentUser.username)
    : false;

  return (
    <div
      className="group rounded-lg border cursor-pointer transition-all hover:border-opacity-60"
      style={{
        background: "oklch(0.13 0.03 260)",
        borderColor: "oklch(0.22 0.04 260)",
      }}
    >
      <div className="flex">
        <div
          className="flex flex-col items-center gap-1 p-3 rounded-l-lg"
          style={{ background: "oklch(0.10 0.03 260)" }}
        >
          <button
            type="button"
            data-ocid="community.post.toggle"
            onClick={(e) => {
              e.stopPropagation();
              onUpvote();
            }}
            className="transition-colors rounded p-0.5"
            style={{
              color: hasUpvoted
                ? "oklch(0.72 0.18 40)"
                : "oklch(0.45 0.04 240)",
            }}
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <span
            className="text-xs font-bold"
            style={{
              color: hasUpvoted
                ? "oklch(0.72 0.18 40)"
                : "oklch(0.65 0.04 240)",
            }}
          >
            {post.upvotes}
          </span>
        </div>

        <div className="flex-1 p-3">
          <button type="button" className="w-full text-left" onClick={onOpen}>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge
                className="text-xs px-1.5 py-0 border-0"
                style={{
                  background: `${CATEGORY_COLORS[post.category] ?? "oklch(0.55 0.12 240)"}/0.15`,
                  color:
                    CATEGORY_COLORS[post.category] ?? "oklch(0.72 0.12 240)",
                }}
              >
                {post.category}
              </Badge>
              {post.locked && (
                <Badge
                  className="text-xs px-1.5 py-0 border-0"
                  style={{
                    background: "oklch(0.55 0.18 40)/0.15",
                    color: "oklch(0.72 0.18 40)",
                  }}
                >
                  <Lock className="w-2.5 h-2.5 mr-1" /> Locked
                </Badge>
              )}
            </div>
            <SensitiveContentBlur label={post.title}>
              <h3
                className="text-sm font-semibold mb-1 leading-snug"
                style={{ color: "oklch(0.92 0.02 240)" }}
              >
                {post.title}
              </h3>
              <p
                className="text-xs line-clamp-2 mb-2"
                style={{ color: "oklch(0.58 0.04 240)" }}
              >
                {post.body}
              </p>
            </SensitiveContentBlur>
            <div
              className="flex items-center gap-3 text-xs"
              style={{ color: "oklch(0.45 0.04 240)" }}
            >
              <span className="flex items-center gap-1">
                <Avatar className="w-4 h-4">
                  <AvatarFallback
                    className="text-[8px]"
                    style={{
                      background: getAvatarColor(post.author),
                      color: "white",
                    }}
                  >
                    {getInitials(post.author)}
                  </AvatarFallback>
                </Avatar>
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {post.replies.length} comments
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(post.createdAt)}
              </span>
            </div>
          </button>
          <ReactionBar
            reactions={post.reactions}
            currentUsername={currentUser?.username}
            onReact={onReact}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Thread View ──────────────────────────────────────────────────────────────

function ThreadView({
  post,
  currentUser,
  onBack,
  onPostUpdate,
}: {
  post: ForumPost;
  currentUser: CurrentUser | null;
  onBack: () => void;
  onPostUpdate: (updated: ForumPost) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyRef | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = currentUser ? getUserStatus(currentUser.username) : null;

  const handleUpvotePost = () => {
    if (!currentUser) {
      toast.error("Login to upvote");
      return;
    }
    const already = post.upvotedBy.includes(currentUser.username);
    onPostUpdate({
      ...post,
      upvotes: already ? post.upvotes - 1 : post.upvotes + 1,
      upvotedBy: already
        ? post.upvotedBy.filter((u) => u !== currentUser.username)
        : [...post.upvotedBy, currentUser.username],
    });
  };

  const handleUpvoteReply = (replyId: number) => {
    if (!currentUser) {
      toast.error("Login to upvote");
      return;
    }
    onPostUpdate({
      ...post,
      replies: post.replies.map((r) => {
        if (r.id !== replyId) return r;
        const already = r.upvotedBy.includes(currentUser.username);
        return {
          ...r,
          upvotes: already ? r.upvotes - 1 : r.upvotes + 1,
          upvotedBy: already
            ? r.upvotedBy.filter((u) => u !== currentUser.username)
            : [...r.upvotedBy, currentUser.username],
        };
      }),
    });
  };

  const handleReactPost = (emoji: string) => {
    if (!currentUser) {
      toast.error("Login to react");
      return;
    }
    const existing = post.reactions?.[emoji] ?? [];
    const mine = existing.includes(currentUser.username);
    onPostUpdate({
      ...post,
      reactions: {
        ...(post.reactions ?? {}),
        [emoji]: mine
          ? existing.filter((u) => u !== currentUser.username)
          : [...existing, currentUser.username],
      },
    });
  };

  const handleReactReply = (replyId: number, emoji: string) => {
    if (!currentUser) {
      toast.error("Login to react");
      return;
    }
    onPostUpdate({
      ...post,
      replies: post.replies.map((r) => {
        if (r.id !== replyId) return r;
        const existing = r.reactions?.[emoji] ?? [];
        const mine = existing.includes(currentUser.username);
        return {
          ...r,
          reactions: {
            ...(r.reactions ?? {}),
            [emoji]: mine
              ? existing.filter((u) => u !== currentUser.username)
              : [...existing, currentUser.username],
          },
        };
      }),
    });
  };

  const submitReply = (text: string, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl) || !currentUser) return;
    setSubmitting(true);
    const newReply: ForumReply = {
      id: Date.now(),
      body: text.trim(),
      author: currentUser.username,
      upvotes: 0,
      createdAt: Date.now(),
      upvotedBy: [],
      reactions: {},
      imageUrl,
      replyTo: replyTo ?? undefined,
    };
    onPostUpdate({ ...post, replies: [...post.replies, newReply] });
    setReplyText("");
    setReplyTo(null);
    setSubmitting(false);
    toast.success("Reply posted!");
  };

  const handleSubmitReply = () => submitReply(replyText);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      submitReply("", dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const postUpvoted = currentUser
    ? post.upvotedBy.includes(currentUser.username)
    : false;

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightboxSrc(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") setLightboxSrc(null);
          }}
        >
          <img
            src={lightboxSrc}
            alt="full"
            className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain"
          />
          <button
            type="button"
            className="absolute top-4 right-4 text-white"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Back */}
      <div
        className="p-3 border-b"
        style={{ borderColor: "oklch(0.20 0.04 260)" }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          data-ocid="community.back.button"
          className="gap-1.5 text-sm"
          style={{ color: "oklch(0.65 0.10 220)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 max-w-3xl mx-auto space-y-4">
          {/* Post */}
          <div
            className="group rounded-xl border p-4"
            style={{
              background: "oklch(0.13 0.03 260)",
              borderColor: "oklch(0.22 0.04 260)",
            }}
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                className="text-xs px-2 py-0.5 border-0"
                style={{
                  background: `${CATEGORY_COLORS[post.category] ?? "oklch(0.55 0.12 240)"}/0.15`,
                  color:
                    CATEGORY_COLORS[post.category] ?? "oklch(0.72 0.12 240)",
                }}
              >
                {post.category}
              </Badge>
              {post.locked && (
                <Badge
                  className="text-xs px-2 py-0.5 border-0"
                  style={{
                    background: "oklch(0.55 0.18 40)/0.15",
                    color: "oklch(0.72 0.18 40)",
                  }}
                >
                  <Lock className="w-3 h-3 mr-1" /> Locked – no new replies
                </Badge>
              )}
            </div>
            <h2
              className="text-lg font-bold mb-2"
              style={{ color: "oklch(0.92 0.02 240)" }}
            >
              {post.title}
            </h2>
            <p
              className="text-sm leading-relaxed mb-3"
              style={{ color: "oklch(0.72 0.03 240)" }}
            >
              {post.body}
            </p>
            {post.imageUrl && (
              <button
                type="button"
                onClick={() => setLightboxSrc(post.imageUrl!)}
                className="mb-3"
              >
                <img
                  src={post.imageUrl}
                  alt="post"
                  className="rounded-lg max-h-96 object-cover hover:opacity-90 transition-opacity"
                />
              </button>
            )}
            <div
              className="flex items-center gap-4"
              style={{ color: "oklch(0.45 0.04 240)" }}
            >
              <button
                type="button"
                onClick={handleUpvotePost}
                className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                style={{
                  color: postUpvoted
                    ? "oklch(0.72 0.18 40)"
                    : "oklch(0.50 0.05 240)",
                }}
                data-ocid="community.post.toggle"
              >
                <ArrowBigUp className="w-5 h-5" />
                <span className="font-bold">{post.upvotes}</span> upvotes
              </button>
              <span className="flex items-center gap-1 text-sm">
                <MessageCircle className="w-4 h-4" />
                {post.replies.length} comments
              </span>
              <span className="flex items-center gap-1 text-sm">
                <Avatar className="w-4 h-4">
                  <AvatarFallback
                    className="text-[8px]"
                    style={{
                      background: getAvatarColor(post.author),
                      color: "white",
                    }}
                  >
                    {getInitials(post.author)}
                  </AvatarFallback>
                </Avatar>
                {post.author} · {formatTime(post.createdAt)}
              </span>
            </div>
            <ReactionBar
              reactions={post.reactions}
              currentUsername={currentUser?.username}
              onReact={handleReactPost}
            />
          </div>

          {/* Reply input */}
          {!post.locked && (
            <div
              className="rounded-xl border p-4"
              style={{
                background: "oklch(0.11 0.03 260)",
                borderColor: "oklch(0.22 0.04 260)",
              }}
            >
              {!currentUser ? (
                <p
                  className="text-sm text-center py-2"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                >
                  <User className="w-4 h-4 inline mr-1" />
                  Login to post a reply
                </p>
              ) : status?.banned ? (
                <p
                  className="text-sm text-center py-2"
                  style={{ color: "oklch(0.65 0.18 30)" }}
                >
                  🚫 You are banned from posting
                  {status.until
                    ? ` until ${new Date(status.until).toLocaleString()}`
                    : " permanently"}
                  .
                </p>
              ) : status?.muted ? (
                <p
                  className="text-sm text-center py-2"
                  style={{ color: "oklch(0.65 0.18 50)" }}
                >
                  🔇 You are muted until{" "}
                  {new Date(status.until!).toLocaleString()}.
                </p>
              ) : (
                <div className="space-y-2">
                  <Label
                    className="text-xs"
                    style={{ color: "oklch(0.60 0.04 240)" }}
                  >
                    Reply as {currentUser.username}
                  </Label>

                  {/* Reply-to context */}
                  {replyTo && (
                    <div
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                      style={{
                        background: "oklch(0.16 0.04 260)",
                        borderLeft: "3px solid oklch(0.60 0.18 220)",
                      }}
                    >
                      <div style={{ color: "oklch(0.68 0.06 240)" }}>
                        <span
                          className="font-semibold"
                          style={{ color: "oklch(0.75 0.14 220)" }}
                        >
                          ↩ @{replyTo.author}
                        </span>{" "}
                        <span>{replyTo.text.slice(0, 80)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyTo(null)}
                        style={{ color: "oklch(0.50 0.04 240)" }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <Textarea
                    data-ocid="community.reply.textarea"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="text-sm min-h-[80px] resize-none"
                    style={{
                      background: "oklch(0.16 0.03 260)",
                      borderColor: "oklch(0.26 0.05 260)",
                      color: "oklch(0.92 0.01 240)",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) handleSubmitReply();
                    }}
                  />

                  {/* GIF picker panel */}
                  {showGifPicker && (
                    <GifPickerPanel
                      onSelect={(url) => submitReply("", url)}
                      onClose={() => setShowGifPicker(false)}
                    />
                  )}

                  {/* Sticker picker panel */}
                  {showStickerPicker && (
                    <StickerPicker
                      onSelect={(sticker) => submitReply(sticker)}
                      onClose={() => setShowStickerPicker(false)}
                    />
                  )}

                  {/* Action row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* Photo upload */}
                      <button
                        type="button"
                        data-ocid="community.reply.upload_button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:opacity-80"
                        style={{
                          background: "oklch(0.18 0.04 260)",
                          color: "oklch(0.60 0.08 240)",
                        }}
                        title="Upload photo"
                      >
                        <Image className="w-4 h-4" />
                      </button>

                      {/* GIF button */}
                      <button
                        type="button"
                        data-ocid="community.reply.gif.button"
                        onClick={() => {
                          setShowGifPicker((v) => !v);
                          setShowStickerPicker(false);
                        }}
                        className="h-8 px-2 rounded-lg flex items-center justify-center text-xs font-bold transition-colors hover:opacity-80"
                        style={{
                          background: showGifPicker
                            ? "oklch(0.52 0.18 280 / 0.25)"
                            : "oklch(0.18 0.04 260)",
                          color: "oklch(0.70 0.14 280)",
                        }}
                        title="Search GIFs"
                      >
                        GIF
                      </button>

                      {/* Sticker button */}
                      <button
                        type="button"
                        data-ocid="community.reply.sticker.button"
                        onClick={() => {
                          setShowStickerPicker((v) => !v);
                          setShowGifPicker(false);
                        }}
                        className="h-8 px-2 rounded-lg flex items-center justify-center text-sm transition-colors hover:opacity-80"
                        style={{
                          background: showStickerPicker
                            ? "oklch(0.55 0.18 50 / 0.25)"
                            : "oklch(0.18 0.04 260)",
                          color: "oklch(0.75 0.14 50)",
                        }}
                        title="Stickers"
                      >
                        😊
                      </button>
                    </div>

                    <Button
                      data-ocid="community.reply.submit_button"
                      size="sm"
                      onClick={handleSubmitReply}
                      disabled={!replyText.trim() || submitting}
                      style={{
                        background: "oklch(0.60 0.18 220)",
                        color: "white",
                      }}
                    >
                      Post Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Replies */}
          <div className="space-y-3">
            {post.replies.length === 0 ? (
              <div
                data-ocid="community.replies.empty_state"
                className="text-center py-8"
                style={{ color: "oklch(0.45 0.04 240)" }}
              >
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  No replies yet. Be the first to comment!
                </p>
              </div>
            ) : (
              post.replies.map((reply, idx) => {
                const replyUpvoted = currentUser
                  ? reply.upvotedBy.includes(currentUser.username)
                  : false;
                return (
                  <div
                    key={reply.id}
                    data-ocid={`community.reply.item.${idx + 1}`}
                    className="group rounded-lg border p-3"
                    style={{
                      background: "oklch(0.13 0.03 260)",
                      borderColor: "oklch(0.20 0.04 260)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback
                            className="text-[9px]"
                            style={{
                              background: getAvatarColor(reply.author),
                              color: "white",
                            }}
                          >
                            {getInitials(reply.author)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "oklch(0.78 0.04 240)" }}
                        >
                          {reply.author}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "oklch(0.42 0.04 240)" }}
                        >
                          {formatTime(reply.createdAt)}
                        </span>
                      </div>
                      {/* Reply-to-reply button */}
                      {currentUser && !post.locked && (
                        <button
                          type="button"
                          className="text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all"
                          style={{
                            background: "oklch(0.18 0.04 260)",
                            color: "oklch(0.60 0.06 240)",
                            border: "1px solid oklch(0.26 0.05 260)",
                          }}
                          onClick={() => {
                            setReplyTo({
                              author: reply.author,
                              text: reply.body,
                            });
                            setShowGifPicker(false);
                            setShowStickerPicker(false);
                          }}
                        >
                          ↩ Reply
                        </button>
                      )}
                    </div>

                    {/* Reply-to reference */}
                    {reply.replyTo && (
                      <div
                        className="mb-2 px-2 py-1 rounded text-xs"
                        style={{
                          background: "oklch(0.10 0.03 260)",
                          borderLeft: "3px solid oklch(0.52 0.14 220)",
                          color: "oklch(0.60 0.04 240)",
                        }}
                      >
                        <span
                          className="font-semibold"
                          style={{ color: "oklch(0.72 0.12 220)" }}
                        >
                          @{reply.replyTo.author}
                        </span>{" "}
                        {reply.replyTo.text.slice(0, 80)}
                      </div>
                    )}

                    <SensitiveContentBlur label={reply.body}>
                      {reply.body && (
                        <p
                          className="text-sm mb-2"
                          style={{ color: "oklch(0.78 0.02 240)" }}
                        >
                          {reply.body}
                        </p>
                      )}
                    </SensitiveContentBlur>

                    {reply.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setLightboxSrc(reply.imageUrl!)}
                        className="mb-2"
                      >
                        <img
                          src={reply.imageUrl}
                          alt="reply media"
                          className="rounded-lg max-h-48 object-cover hover:opacity-90 transition-opacity"
                        />
                      </button>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpvoteReply(reply.id)}
                        className="flex items-center gap-1 text-xs transition-colors"
                        style={{
                          color: replyUpvoted
                            ? "oklch(0.72 0.18 40)"
                            : "oklch(0.45 0.04 240)",
                        }}
                      >
                        <ArrowBigUp className="w-3.5 h-3.5" />
                        {reply.upvotes}
                      </button>
                    </div>
                    <ReactionBar
                      reactions={reply.reactions}
                      currentUsername={currentUser?.username}
                      onReact={(emoji) => handleReactReply(reply.id, emoji)}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Channels Sidebar ────────────────────────────────────────────────────────

function ChannelsSidebar({
  channels,
  activeChannel,
  onSelect,
  onAdd,
}: {
  channels: string[];
  activeChannel: string;
  onSelect: (ch: string) => void;
  onAdd: (ch: string) => void;
}) {
  const [newChannelInput, setNewChannelInput] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    const name = newChannelInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    onAdd(name);
    setNewChannelInput("");
    setAdding(false);
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "oklch(0.10 0.03 260)" }}
    >
      <div
        className="px-3 py-2 border-b flex items-center justify-between"
        style={{ borderColor: "oklch(0.18 0.04 260)" }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "oklch(0.50 0.05 240)" }}
        >
          Channels
        </span>
        <button
          type="button"
          data-ocid="community.channel.button"
          onClick={() => setAdding(true)}
          className="w-5 h-5 rounded flex items-center justify-center transition-colors"
          style={{ color: "oklch(0.55 0.05 240)" }}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          <button
            type="button"
            data-ocid="community.channel.all.tab"
            onClick={() => onSelect("all")}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
            style={{
              background:
                activeChannel === "all"
                  ? "oklch(0.52 0.18 220 / 0.15)"
                  : "transparent",
              color:
                activeChannel === "all"
                  ? "oklch(0.82 0.12 220)"
                  : "oklch(0.55 0.04 240)",
            }}
          >
            <Hash className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">all</span>
          </button>

          {channels.map((ch) => (
            <button
              key={ch}
              type="button"
              data-ocid={`community.channel.${ch}.tab`}
              onClick={() => onSelect(ch)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
              style={{
                background:
                  activeChannel === ch
                    ? "oklch(0.52 0.18 220 / 0.15)"
                    : "transparent",
                color:
                  activeChannel === ch
                    ? "oklch(0.82 0.12 220)"
                    : "oklch(0.55 0.04 240)",
              }}
            >
              <Hash className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{ch}</span>
            </button>
          ))}
        </div>
      </ScrollArea>

      {adding && (
        <div
          className="p-2 border-t"
          style={{ borderColor: "oklch(0.18 0.04 260)" }}
        >
          <Input
            data-ocid="community.channel.input"
            value={newChannelInput}
            onChange={(e) => setNewChannelInput(e.target.value)}
            placeholder="new-channel"
            className="h-7 text-xs mb-1.5"
            style={{
              background: "oklch(0.16 0.04 260)",
              borderColor: "oklch(0.26 0.05 260)",
              color: "oklch(0.92 0.01 240)",
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <div className="flex gap-1">
            <Button
              data-ocid="community.channel.save_button"
              size="sm"
              className="flex-1 h-6 text-xs"
              style={{ background: "oklch(0.60 0.18 220)", color: "white" }}
              onClick={handleAdd}
            >
              Add
            </Button>
            <Button
              data-ocid="community.channel.cancel_button"
              size="sm"
              variant="ghost"
              className="flex-1 h-6 text-xs"
              style={{ color: "oklch(0.55 0.04 240)" }}
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CommunityChatsPage() {
  const [posts, setPosts] = useState<ForumPost[]>(() => {
    const stored = loadPosts();
    if (stored.length === 0) {
      savePosts(SEED_POSTS);
      return SEED_POSTS;
    }
    return stored;
  });

  const [currentUser] = useState<CurrentUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("researchHubUser") || "null");
    } catch {
      return null;
    }
  });

  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openPost, setOpenPost] = useState<ForumPost | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeChannel, setActiveChannel] = useState("all");
  const [customChannels, setCustomChannels] = useState<string[]>(() =>
    loadCustomChannels(),
  );
  const [showChannels, setShowChannels] = useState(true);

  const allChannels = [...DEFAULT_CHANNELS, ...customChannels];

  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("Research");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newChannel, setNewChannel] = useState("general");

  const status = currentUser ? getUserStatus(currentUser.username) : null;
  const canCreatePost = currentUser && !status?.banned && !status?.muted;

  const updatePost = (updated: ForumPost) => {
    const next = posts.map((p) => (p.id === updated.id ? updated : p));
    setPosts(next);
    savePosts(next);
    if (openPost?.id === updated.id) setOpenPost(updated);
  };

  const handleUpvote = (postId: number) => {
    if (!currentUser) {
      toast.error("Login to upvote");
      return;
    }
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const already = post.upvotedBy.includes(currentUser.username);
    updatePost({
      ...post,
      upvotes: already ? post.upvotes - 1 : post.upvotes + 1,
      upvotedBy: already
        ? post.upvotedBy.filter((u) => u !== currentUser.username)
        : [...post.upvotedBy, currentUser.username],
    });
  };

  const handleReact = (postId: number, emoji: string) => {
    if (!currentUser) {
      toast.error("Login to react");
      return;
    }
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const existing = post.reactions?.[emoji] ?? [];
    const mine = existing.includes(currentUser.username);
    updatePost({
      ...post,
      reactions: {
        ...(post.reactions ?? {}),
        [emoji]: mine
          ? existing.filter((u) => u !== currentUser.username)
          : [...existing, currentUser.username],
      },
    });
  };

  const handleCreatePost = () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error("Title and body are required");
      return;
    }
    if (!currentUser) {
      toast.error("Login required");
      return;
    }
    const newPost: ForumPost = {
      id: Date.now(),
      title: newTitle.trim(),
      body: newBody.trim(),
      category: newCategory,
      channel: newChannel,
      author: currentUser.username,
      upvotes: 1,
      upvotedBy: [currentUser.username],
      replies: [],
      createdAt: Date.now(),
      imageUrl: newImageUrl.trim() || undefined,
      reactions: {},
    };
    const next = [newPost, ...posts];
    setPosts(next);
    savePosts(next);
    setNewTitle("");
    setNewBody("");
    setNewCategory("Research");
    setNewImageUrl("");
    setNewChannel("general");
    setShowCreateModal(false);
    toast.success("Post created!");
  };

  const handleAddChannel = (ch: string) => {
    if (allChannels.includes(ch)) {
      toast.error("Channel already exists");
      return;
    }
    const updated = [...customChannels, ch];
    setCustomChannels(updated);
    saveCustomChannels(updated);
    setActiveChannel(ch);
    toast.success(`#${ch} created`);
  };

  let filtered = posts.filter((p) => {
    const matchCat =
      selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchChannel =
      activeChannel === "all" || (p.channel ?? "general") === activeChannel;
    return matchCat && matchSearch && matchChannel;
  });

  if (sort === "new")
    filtered = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
  else if (sort === "top")
    filtered = [...filtered].sort((a, b) => b.upvotes - a.upvotes);
  else {
    filtered = [...filtered].sort((a, b) => {
      const scoreA =
        a.upvotes + a.replies.length * 2 - (Date.now() - a.createdAt) / 3600000;
      const scoreB =
        b.upvotes + b.replies.length * 2 - (Date.now() - b.createdAt) / 3600000;
      return scoreB - scoreA;
    });
  }

  if (openPost) {
    return (
      <ThreadView
        post={openPost}
        currentUser={currentUser}
        onBack={() => setOpenPost(null)}
        onPostUpdate={updatePost}
      />
    );
  }

  return (
    <div className="flex h-full" style={{ background: "oklch(0.10 0.02 260)" }}>
      {/* Channels sidebar — desktop */}
      <div
        className="hidden md:flex flex-col flex-shrink-0 border-r"
        style={{ width: "160px", borderColor: "oklch(0.18 0.04 260)" }}
      >
        <ChannelsSidebar
          channels={allChannels}
          activeChannel={activeChannel}
          onSelect={setActiveChannel}
          onAdd={handleAddChannel}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div
          className="p-3 border-b"
          style={{
            borderColor: "oklch(0.20 0.04 260)",
            background: "oklch(0.12 0.03 260)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-ocid="community.channels.toggle"
                onClick={() => setShowChannels((v) => !v)}
                className="md:hidden flex items-center gap-1 text-xs px-2 py-1 rounded"
                style={{
                  background: "oklch(0.16 0.04 260)",
                  color: "oklch(0.65 0.08 220)",
                }}
              >
                <Hash className="w-3 h-3" />
                {activeChannel === "all" ? "all" : `#${activeChannel}`}
              </button>
              <div>
                <h2
                  className="font-bold text-base"
                  style={{ color: "oklch(0.92 0.02 240)" }}
                >
                  Community
                  {activeChannel !== "all" && (
                    <span
                      className="ml-2 text-sm font-normal"
                      style={{ color: "oklch(0.65 0.08 220)" }}
                    >
                      #{activeChannel}
                    </span>
                  )}
                </h2>
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.50 0.04 240)" }}
                >
                  {filtered.length} posts
                </p>
              </div>
            </div>
            {!currentUser ? (
              <Button
                size="sm"
                variant="outline"
                data-ocid="community.login.button"
                className="text-xs gap-1"
                style={{
                  borderColor: "oklch(0.30 0.05 260)",
                  color: "oklch(0.72 0.04 240)",
                }}
              >
                <User className="w-3.5 h-3.5" /> Login to post
              </Button>
            ) : canCreatePost ? (
              <Button
                size="sm"
                data-ocid="community.create.primary_button"
                className="gap-1.5 text-xs"
                style={{ background: "oklch(0.60 0.18 220)", color: "white" }}
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-3.5 h-3.5" /> Create Post
              </Button>
            ) : (
              <Badge
                className="text-xs px-2 border-0"
                style={{
                  background: "oklch(0.55 0.18 30)/0.15",
                  color: "oklch(0.72 0.18 30)",
                }}
              >
                {status?.banned ? "Banned" : "Muted"}
              </Badge>
            )}
          </div>

          {/* Mobile channel list */}
          {showChannels && (
            <div
              className="md:hidden flex gap-1.5 overflow-x-auto pb-1 mb-2"
              style={{ scrollbarWidth: "none" }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveChannel("all");
                  setShowChannels(false);
                }}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs"
                style={{
                  background:
                    activeChannel === "all"
                      ? "oklch(0.52 0.18 220 / 0.2)"
                      : "oklch(0.16 0.04 260)",
                  color:
                    activeChannel === "all"
                      ? "oklch(0.82 0.12 220)"
                      : "oklch(0.55 0.04 240)",
                  border: `1px solid ${
                    activeChannel === "all"
                      ? "oklch(0.52 0.18 220 / 0.4)"
                      : "oklch(0.22 0.04 260)"
                  }`,
                }}
              >
                <Hash className="w-3 h-3" /> all
              </button>
              {allChannels.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => {
                    setActiveChannel(ch);
                    setShowChannels(false);
                  }}
                  className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs"
                  style={{
                    background:
                      activeChannel === ch
                        ? "oklch(0.52 0.18 220 / 0.2)"
                        : "oklch(0.16 0.04 260)",
                    color:
                      activeChannel === ch
                        ? "oklch(0.82 0.12 220)"
                        : "oklch(0.55 0.04 240)",
                    border: `1px solid ${
                      activeChannel === ch
                        ? "oklch(0.52 0.18 220 / 0.4)"
                        : "oklch(0.22 0.04 260)"
                    }`,
                  }}
                >
                  <Hash className="w-3 h-3" /> {ch}
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-2">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: "oklch(0.45 0.04 240)" }}
            />
            <Input
              data-ocid="community.search.search_input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="pl-8 h-8 text-xs"
              style={{
                background: "oklch(0.15 0.03 260)",
                borderColor: "oklch(0.24 0.05 260)",
                color: "oklch(0.92 0.01 240)",
              }}
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1">
            {(["hot", "new", "top"] as const).map((s) => (
              <button
                key={s}
                type="button"
                data-ocid={`community.sort.${s}.tab`}
                onClick={() => setSort(s)}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background:
                    sort === s ? "oklch(0.60 0.18 220 / 0.15)" : "transparent",
                  color:
                    sort === s
                      ? "oklch(0.72 0.18 220)"
                      : "oklch(0.50 0.04 240)",
                }}
              >
                {s === "hot" && <Flame className="w-3 h-3" />}
                {s === "new" && <Clock className="w-3 h-3" />}
                {s === "top" && <TrendingUp className="w-3 h-3" />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div
          className="flex gap-1.5 p-2 overflow-x-auto border-b"
          style={{
            borderColor: "oklch(0.20 0.04 260)",
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              data-ocid={`community.category.${cat.toLowerCase()}.tab`}
              onClick={() => setSelectedCategory(cat)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background:
                  selectedCategory === cat
                    ? `${CATEGORY_COLORS[cat] ?? "oklch(0.60 0.18 220)"}/0.2`
                    : "oklch(0.15 0.03 260)",
                color:
                  selectedCategory === cat
                    ? (CATEGORY_COLORS[cat] ?? "oklch(0.72 0.18 220)")
                    : "oklch(0.55 0.04 240)",
                border: `1px solid ${
                  selectedCategory === cat
                    ? `${CATEGORY_COLORS[cat] ?? "oklch(0.60 0.18 220)"}/0.4`
                    : "oklch(0.22 0.04 260)"
                }`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feed */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2 max-w-3xl mx-auto">
            {filtered.length === 0 ? (
              <div
                data-ocid="community.posts.empty_state"
                className="text-center py-16"
                style={{ color: "oklch(0.45 0.04 240)" }}
              >
                <Edit3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No posts found.</p>
                {currentUser && canCreatePost && (
                  <Button
                    size="sm"
                    className="mt-3"
                    style={{
                      background: "oklch(0.60 0.18 220)",
                      color: "white",
                    }}
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create the first post
                  </Button>
                )}
              </div>
            ) : (
              filtered.map((post, idx) => (
                <div
                  key={post.id}
                  data-ocid={`community.posts.item.${idx + 1}`}
                >
                  <PostCard
                    post={post}
                    currentUser={currentUser}
                    onOpen={() => setOpenPost(post)}
                    onUpvote={() => handleUpvote(post.id)}
                    onReact={(emoji) => handleReact(post.id, emoji)}
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent
          data-ocid="community.create.dialog"
          style={{
            background: "oklch(0.13 0.03 260)",
            borderColor: "oklch(0.22 0.04 260)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.02 240)" }}>
              Create Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                Title *
              </Label>
              <Input
                data-ocid="community.create.input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Post title..."
                style={{
                  background: "oklch(0.16 0.03 260)",
                  borderColor: "oklch(0.26 0.05 260)",
                  color: "oklch(0.92 0.01 240)",
                }}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: "oklch(0.65 0.04 240)" }}
                >
                  Category
                </Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger
                    data-ocid="community.create.category.select"
                    style={{
                      background: "oklch(0.16 0.03 260)",
                      borderColor: "oklch(0.26 0.05 260)",
                      color: "oklch(0.92 0.01 240)",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "oklch(0.15 0.03 260)",
                      borderColor: "oklch(0.24 0.05 260)",
                    }}
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        style={{ color: "oklch(0.85 0.02 240)" }}
                      >
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: "oklch(0.65 0.04 240)" }}
                >
                  Channel
                </Label>
                <Select value={newChannel} onValueChange={setNewChannel}>
                  <SelectTrigger
                    data-ocid="community.create.channel.select"
                    style={{
                      background: "oklch(0.16 0.03 260)",
                      borderColor: "oklch(0.26 0.05 260)",
                      color: "oklch(0.92 0.01 240)",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "oklch(0.15 0.03 260)",
                      borderColor: "oklch(0.24 0.05 260)",
                    }}
                  >
                    {allChannels.map((ch) => (
                      <SelectItem
                        key={ch}
                        value={ch}
                        style={{ color: "oklch(0.85 0.02 240)" }}
                      >
                        #{ch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                Body *
              </Label>
              <Textarea
                data-ocid="community.create.textarea"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[100px] resize-none text-sm"
                style={{
                  background: "oklch(0.16 0.03 260)",
                  borderColor: "oklch(0.26 0.05 260)",
                  color: "oklch(0.92 0.01 240)",
                }}
              />
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                Image URL (optional)
              </Label>
              <Input
                data-ocid="community.create.image.input"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  background: "oklch(0.16 0.03 260)",
                  borderColor: "oklch(0.26 0.05 260)",
                  color: "oklch(0.92 0.01 240)",
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              data-ocid="community.create.cancel_button"
              onClick={() => setShowCreateModal(false)}
              style={{ color: "oklch(0.60 0.04 240)" }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="community.create.submit_button"
              onClick={handleCreatePost}
              disabled={!newTitle.trim() || !newBody.trim()}
              style={{ background: "oklch(0.60 0.18 220)", color: "white" }}
            >
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
