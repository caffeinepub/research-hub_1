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
  Ban,
  Clock,
  Edit3,
  Flag,
  Flame,
  Hash,
  Image,
  Lock,
  MessageCircle,
  Plus,
  Search,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

interface ReportEntry {
  id: number;
  type: "post" | "reply";
  postId: number;
  replyId?: number;
  content: string;
  author: string;
  reportedBy: string;
  createdAt: number;
}

function loadReports(): ReportEntry[] {
  try {
    return JSON.parse(localStorage.getItem("communityReports") || "[]");
  } catch {
    return [];
  }
}
function saveReports(r: ReportEntry[]) {
  localStorage.setItem("communityReports", JSON.stringify(r));
}

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

// ─── GIF Picker ───────────────────────────────────────────────────────────────

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
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (query: string) => {
    setLoading(true);
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(query)}&limit=12&rating=g`
        : "https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=12&rating=g";
      const res = await fetch(endpoint);
      const data = await res.json();
      setResults(
        (data.data || []).map((g: any) => ({
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

  // Load trending on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    search("");
  }, []);

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
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search GIFs..."
          className="h-7 text-xs flex-1"
          style={{
            background: "oklch(0.16 0.04 260)",
            borderColor: "oklch(0.28 0.05 260)",
            color: "white",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") search(q);
          }}
          autoFocus
        />
        <Button
          size="sm"
          className="h-7 px-2 text-xs"
          style={{ background: "oklch(0.52 0.18 220)" }}
          onClick={() => search(q)}
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
          No results found
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

// ─── Sticker Picker (Giphy-backed) ────────────────────────────────────────────

interface StickerResult {
  id: string;
  preview: string;
  original: string;
  title: string;
}

function StickerPicker({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [stickerQ, setStickerQ] = useState("");
  const [stickers, setStickers] = useState<StickerResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStickers = async (query: string) => {
    setLoading(true);
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/stickers/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(query)}&limit=24&rating=g`
        : "https://api.giphy.com/v1/stickers/trending?api_key=dc6zaTOxFJmzC&limit=24&rating=g";
      const res = await fetch(endpoint);
      const data = await res.json();
      setStickers(
        (data.data || []).map((g: any) => ({
          id: g.id,
          preview:
            g.images?.fixed_height_small?.url ||
            g.images?.preview_gif?.url ||
            "",
          original: g.images?.original?.url || "",
          title: g.title || "Sticker",
        })),
      );
    } catch {
      toast.error("Failed to load stickers");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    fetchStickers("");
  }, []);

  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: "oklch(0.13 0.03 260)",
        border: "1px solid oklch(0.26 0.05 260)",
        width: "260px",
      }}
    >
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

      {/* Search */}
      <div className="p-2 flex gap-1.5">
        <Input
          value={stickerQ}
          onChange={(e) => setStickerQ(e.target.value)}
          placeholder="Search stickers..."
          className="h-7 text-xs flex-1"
          style={{
            background: "oklch(0.16 0.04 260)",
            borderColor: "oklch(0.28 0.05 260)",
            color: "white",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchStickers(stickerQ);
          }}
        />
        <Button
          size="sm"
          className="h-7 px-2 text-xs"
          style={{ background: "oklch(0.52 0.18 220)" }}
          onClick={() => fetchStickers(stickerQ)}
        >
          Go
        </Button>
      </div>

      {loading && (
        <div
          className="p-3 text-center text-xs"
          style={{ color: "oklch(0.55 0.04 240)" }}
        >
          Loading stickers…
        </div>
      )}

      {/* Sticker grid */}
      <div className="grid grid-cols-4 gap-1 p-2 max-h-52 overflow-y-auto">
        {stickers.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              onSelect(s.original);
              onClose();
            }}
            className="rounded-lg overflow-hidden hover:scale-110 hover:bg-white/10 transition-all p-0.5"
            title={s.title}
          >
            <img
              src={s.preview}
              alt={s.title}
              className="w-full h-12 object-contain"
            />
          </button>
        ))}
        {!loading && stickers.length === 0 && (
          <div
            className="col-span-4 text-center py-4 text-xs"
            style={{ color: "oklch(0.45 0.04 240)" }}
          >
            No stickers found
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile Modal ────────────────────────────────────────────────────────────

function ProfileModal({
  username,
  currentUser,
  posts,
  open,
  onClose,
}: {
  username: string;
  currentUser: CurrentUser;
  posts: ForumPost[];
  open: boolean;
  onClose: () => void;
}) {
  const friendsKey = `friends_${currentUser.username}`;

  function loadFriends(): string[] {
    try {
      return JSON.parse(localStorage.getItem(friendsKey) || "[]");
    } catch {
      return [];
    }
  }

  const [friends, setFriends] = useState<string[]>(loadFriends);
  const isFriend = friends.includes(username);
  const postCount = posts.filter((p) => p.author === username).length;
  const replyCount = posts.reduce(
    (acc, p) => acc + p.replies.filter((r) => r.author === username).length,
    0,
  );

  function toggleFriend() {
    const updated = isFriend
      ? friends.filter((f) => f !== username)
      : [...friends, username];
    setFriends(updated);
    localStorage.setItem(friendsKey, JSON.stringify(updated));
    toast.success(
      isFriend ? `Unfriended ${username}` : `Added ${username} as friend!`,
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="community.profile.dialog"
        style={{
          background: "oklch(0.13 0.03 260)",
          borderColor: "oklch(0.22 0.04 260)",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "oklch(0.92 0.02 240)" }}>
            Profile
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: getAvatarColor(username) }}
          >
            {getInitials(username)}
          </div>
          <div className="text-center">
            <p
              className="text-lg font-semibold"
              style={{ color: "oklch(0.92 0.02 240)" }}
            >
              {username}
            </p>
            <Badge
              className="mt-1 text-xs"
              style={{
                background: "oklch(0.52 0.18 220 / 0.2)",
                color: "oklch(0.72 0.14 220)",
              }}
            >
              Member
            </Badge>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p
                className="text-xl font-bold"
                style={{ color: "oklch(0.92 0.02 240)" }}
              >
                {postCount}
              </p>
              <p className="text-xs" style={{ color: "oklch(0.55 0.04 240)" }}>
                Posts
              </p>
            </div>
            <div>
              <p
                className="text-xl font-bold"
                style={{ color: "oklch(0.92 0.02 240)" }}
              >
                {replyCount}
              </p>
              <p className="text-xs" style={{ color: "oklch(0.55 0.04 240)" }}>
                Replies
              </p>
            </div>
          </div>
          {username !== currentUser.username && (
            <Button
              data-ocid="community.profile.button"
              onClick={toggleFriend}
              className="w-full"
              style={{
                background: isFriend
                  ? "oklch(0.25 0.05 260)"
                  : "oklch(0.52 0.18 220)",
                color: "white",
              }}
            >
              {isFriend ? "Friends ✓" : "Add Friend"}
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button
            data-ocid="community.profile.close_button"
            variant="ghost"
            onClick={onClose}
            style={{ color: "oklch(0.60 0.04 240)" }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUser,
  onOpen,
  onUpvote,
  onReact,
  onViewProfile,
}: {
  post: ForumPost;
  currentUser: CurrentUser;
  onOpen: () => void;
  onUpvote: () => void;
  onReact: (emoji: string) => void;
  onViewProfile: (username: string) => void;
}) {
  const hasUpvoted = post.upvotedBy.includes(currentUser.username);
  const catColor = CATEGORY_COLORS[post.category] || "oklch(0.55 0.08 250)";

  return (
    <div
      className="rounded-xl p-4 transition-all hover:translate-y-[-1px]"
      style={{
        background: "oklch(0.14 0.03 260)",
        border: "1px solid oklch(0.22 0.04 260)",
        boxShadow: "0 2px 8px oklch(0 0 0 / 0.3)",
      }}
    >
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => onViewProfile(post.author)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          data-ocid="community.post.link"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: getAvatarColor(post.author) }}
          >
            {getInitials(post.author)}
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: "oklch(0.70 0.08 220)" }}
          >
            {post.author}
          </span>
        </button>
        {post.channel && (
          <span className="text-xs" style={{ color: "oklch(0.45 0.04 240)" }}>
            in{" "}
            <span style={{ color: "oklch(0.60 0.10 220)" }}>
              #{post.channel}
            </span>
          </span>
        )}
        <span
          className="text-xs ml-auto"
          style={{ color: "oklch(0.42 0.04 240)" }}
        >
          {formatTime(post.createdAt)}
        </span>
      </div>

      {/* Category */}
      <div className="flex items-center gap-2 mb-2">
        <Badge
          className="text-xs px-1.5 py-0"
          style={{
            background: `${catColor}22`,
            color: catColor,
            border: `1px solid ${catColor}44`,
          }}
        >
          {post.category}
        </Badge>
        {post.locked && (
          <Lock className="w-3 h-3" style={{ color: "oklch(0.55 0.14 50)" }} />
        )}
      </div>

      {/* Title */}
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left"
        data-ocid="community.post.card"
      >
        <h3
          className="text-sm font-semibold mb-1 hover:opacity-80 transition-opacity leading-snug"
          style={{ color: "oklch(0.92 0.02 240)" }}
        >
          {post.title}
        </h3>
        <p
          className="text-xs line-clamp-2"
          style={{ color: "oklch(0.60 0.04 240)" }}
        >
          {post.body}
        </p>
      </button>

      {/* Image */}
      {post.imageUrl && (
        <div className="mt-2 rounded-lg overflow-hidden">
          <SensitiveContentBlur label={post.title}>
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full max-h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </SensitiveContentBlur>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-3 mt-3">
        {/* Upvote */}
        <button
          type="button"
          onClick={onUpvote}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all hover:scale-105"
          style={{
            background: hasUpvoted
              ? "oklch(0.55 0.18 25 / 0.15)"
              : "oklch(0.18 0.04 260)",
            color: hasUpvoted ? "oklch(0.70 0.18 25)" : "oklch(0.55 0.04 240)",
          }}
        >
          <ArrowBigUp className="w-3.5 h-3.5" />
          <span>{post.upvotes}</span>
        </button>

        {/* Replies */}
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors hover:opacity-80"
          style={{
            background: "oklch(0.18 0.04 260)",
            color: "oklch(0.55 0.04 240)",
          }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{post.replies.length}</span>
        </button>

        {/* Reaction picker */}
        <div className="flex items-center gap-0.5 ml-auto group">
          {REACTION_EMOJIS.map((emoji) => {
            const count = post.reactions?.[emoji]?.length || 0;
            if (count === 0) return null;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(emoji)}
                className="text-xs px-1.5 py-0.5 rounded-full transition-all hover:scale-110"
                style={{
                  background: "oklch(0.20 0.04 260)",
                  color: "oklch(0.80 0.04 240)",
                }}
              >
                {emoji} {count}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onReact(REACTION_EMOJIS[0])}
            className="text-xs px-1.5 py-0.5 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
            style={{
              background: "oklch(0.20 0.04 260)",
              color: "oklch(0.65 0.04 240)",
            }}
          >
            +😊
          </button>
        </div>
      </div>

      {/* Reaction emoji bar */}
      <div className="flex flex-wrap gap-1 mt-2">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji)}
            className="text-base rounded-full p-1 transition-all hover:scale-125 hover:bg-white/10"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            const reports = loadReports();
            reports.push({
              id: Date.now(),
              type: "post",
              postId: post.id,
              content: post.body,
              author: post.author,
              reportedBy: currentUser.username,
              createdAt: Date.now(),
            });
            saveReports(reports);
            toast.success("Post reported");
          }}
          className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ml-auto hover:opacity-80 transition-opacity"
          style={{ color: "oklch(0.65 0.18 30)" }}
          data-ocid="community.postcard.report.button"
        >
          <Flag className="w-3 h-3" /> Report
        </button>
      </div>
    </div>
  );
}

// ─── Thread View ──────────────────────────────────────────────────────────────

function ThreadView({
  post,
  currentUser,
  onBack,
  onUpvotePost,
  onUpvoteReply,
  onReactPost,
  onReactReply,
  onAddReply,
  onViewProfile,
}: {
  post: ForumPost;
  currentUser: CurrentUser;
  onBack: () => void;
  onUpvotePost: () => void;
  onUpvoteReply: (replyId: number) => void;
  onReactPost: (emoji: string) => void;
  onReactReply: (replyId: number, emoji: string) => void;
  onAddReply: (body: string, imageUrl?: string, replyTo?: ReplyRef) => void;
  onViewProfile: (username: string) => void;
}) {
  const reportPost = () => {
    const reports = loadReports();
    reports.push({
      id: Date.now(),
      type: "post",
      postId: post.id,
      content: post.body,
      author: post.author,
      reportedBy: currentUser.username,
      createdAt: Date.now(),
    });
    saveReports(reports);
    toast.success("Post reported");
  };
  const reportReply = (replyId: number, body: string, author: string) => {
    const reports = loadReports();
    reports.push({
      id: Date.now(),
      type: "reply",
      postId: post.id,
      replyId,
      content: body,
      author,
      reportedBy: currentUser.username,
      createdAt: Date.now(),
    });
    saveReports(reports);
    toast.success("Reply reported");
  };
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyRef | undefined>(undefined);
  const [showGif, setShowGif] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const status = getUserStatus(currentUser.username);

  const submitReply = () => {
    if (!replyText.trim() && !replyImage) return;
    if (status.muted) {
      toast.error("You are muted and cannot reply");
      return;
    }
    onAddReply(replyText, replyImage || undefined, replyTo);
    setReplyText("");
    setReplyImage("");
    setReplyTo(undefined);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 border-b flex-shrink-0"
        style={{ borderColor: "oklch(0.20 0.04 260)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
          style={{ color: "oklch(0.65 0.08 220)" }}
          data-ocid="community.thread.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2
          className="text-sm font-semibold flex-1 line-clamp-1"
          style={{ color: "oklch(0.90 0.02 240)" }}
        >
          {post.title}
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Post body */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "oklch(0.14 0.03 260)",
              border: "1px solid oklch(0.22 0.04 260)",
            }}
          >
            <button
              type="button"
              onClick={() => onViewProfile(post.author)}
              className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: getAvatarColor(post.author) }}
              >
                {getInitials(post.author)}
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "oklch(0.80 0.08 220)" }}
                >
                  {post.author}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.45 0.04 240)" }}
                >
                  {formatTime(post.createdAt)}
                </p>
              </div>
            </button>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "oklch(0.82 0.02 240)" }}
            >
              {post.body}
            </p>
            {post.imageUrl && (
              <div className="mt-3 rounded-lg overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt=""
                  className="w-full max-h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={onUpvotePost}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                style={{
                  background: post.upvotedBy.includes(currentUser.username)
                    ? "oklch(0.55 0.18 25 / 0.15)"
                    : "oklch(0.18 0.04 260)",
                  color: post.upvotedBy.includes(currentUser.username)
                    ? "oklch(0.70 0.18 25)"
                    : "oklch(0.55 0.04 240)",
                }}
              >
                <ArrowBigUp className="w-3.5 h-3.5" />
                {post.upvotes}
              </button>
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReactPost(emoji)}
                  className="text-base rounded-full p-0.5 hover:scale-125 hover:bg-white/10 transition-all"
                >
                  {emoji}
                </button>
              ))}
              <button
                type="button"
                onClick={reportPost}
                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ml-auto hover:opacity-80 transition-opacity"
                style={{ color: "oklch(0.65 0.18 30)" }}
                data-ocid="community.post.report.button"
              >
                <Flag className="w-3 h-3" /> Report
              </button>
            </div>
          </div>

          {/* Replies */}
          {post.replies.length > 0 && (
            <div className="space-y-3">
              <p
                className="text-xs font-semibold"
                style={{ color: "oklch(0.55 0.04 240)" }}
              >
                {post.replies.length}{" "}
                {post.replies.length === 1 ? "reply" : "replies"}
              </p>
              {post.replies.map((reply, idx) => (
                <div
                  key={reply.id}
                  data-ocid={`community.reply.item.${idx + 1}`}
                  className="rounded-xl p-3"
                  style={{
                    background: "oklch(0.12 0.03 260)",
                    border: "1px solid oklch(0.20 0.04 260)",
                    marginLeft: reply.replyTo ? "16px" : "0",
                  }}
                >
                  {reply.replyTo && (
                    <div
                      className="text-xs px-2 py-1 rounded mb-2 italic"
                      style={{
                        background: "oklch(0.18 0.04 260)",
                        color: "oklch(0.55 0.04 240)",
                        borderLeft: "2px solid oklch(0.52 0.18 220)",
                      }}
                    >
                      <span style={{ color: "oklch(0.65 0.10 220)" }}>
                        {reply.replyTo.author}:
                      </span>{" "}
                      {reply.replyTo.text.slice(0, 80)}
                      {reply.replyTo.text.length > 80 ? "..." : ""}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onViewProfile(reply.author)}
                    className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
                    data-ocid={`community.reply.link.${idx + 1}`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: getAvatarColor(reply.author) }}
                    >
                      {getInitials(reply.author)}
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "oklch(0.70 0.08 220)" }}
                    >
                      {reply.author}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "oklch(0.40 0.04 240)" }}
                    >
                      {formatTime(reply.createdAt)}
                    </span>
                  </button>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "oklch(0.78 0.02 240)" }}
                  >
                    {reply.body}
                  </p>
                  {reply.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <img
                        src={reply.imageUrl}
                        alt=""
                        className="max-h-40 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => onUpvoteReply(reply.id)}
                      className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: reply.upvotedBy.includes(
                          currentUser.username,
                        )
                          ? "oklch(0.55 0.18 25 / 0.15)"
                          : "oklch(0.18 0.04 260)",
                        color: reply.upvotedBy.includes(currentUser.username)
                          ? "oklch(0.70 0.18 25)"
                          : "oklch(0.50 0.04 240)",
                      }}
                    >
                      <ArrowBigUp className="w-3 h-3" />
                      {reply.upvotes}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyTo({ author: reply.author, text: reply.body })
                      }
                      className="text-xs px-1.5 py-0.5 rounded-full hover:opacity-80"
                      style={{
                        background: "oklch(0.18 0.04 260)",
                        color: "oklch(0.50 0.04 240)",
                      }}
                    >
                      Reply
                    </button>
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onReactReply(reply.id, emoji)}
                        className="text-sm rounded-full p-0.5 hover:scale-125 hover:bg-white/10 transition-all"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        reportReply(reply.id, reply.body, reply.author)
                      }
                      className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ml-auto hover:opacity-80 transition-opacity"
                      style={{ color: "oklch(0.65 0.18 30)" }}
                    >
                      <Flag className="w-3 h-3" /> Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reply Input */}
      {!post.locked && (
        <div
          className="p-3 border-t flex-shrink-0"
          style={{
            borderColor: "oklch(0.20 0.04 260)",
            position: "relative",
            zIndex: 10,
          }}
        >
          {replyTo && (
            <div
              className="flex items-center justify-between text-xs px-2 py-1 rounded mb-2"
              style={{
                background: "oklch(0.18 0.04 260)",
                color: "oklch(0.60 0.04 240)",
                borderLeft: "2px solid oklch(0.52 0.18 220)",
              }}
            >
              <span>Replying to {replyTo.author}</span>
              <button type="button" onClick={() => setReplyTo(undefined)}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {replyImage && (
            <div className="flex items-center gap-2 mb-2">
              <img
                src={replyImage}
                alt=""
                className="h-12 rounded-lg object-cover"
              />
              <button type="button" onClick={() => setReplyImage("")}>
                <X
                  className="w-3 h-3"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                />
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="community-reply-file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) =>
                setReplyImage((ev.target?.result as string) ?? "");
              reader.readAsDataURL(file);
            }}
          />
          <div className="flex gap-2 items-end">
            <Textarea
              data-ocid="community.reply.textarea"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 min-h-[36px] max-h-[100px] text-sm resize-none"
              style={{
                background: "oklch(0.16 0.04 260)",
                borderColor: "oklch(0.26 0.05 260)",
                color: "white",
                pointerEvents: "all",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitReply();
                }
              }}
            />
            {/* GIF picker */}
            <Popover open={showGif} onOpenChange={setShowGif}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:opacity-70 transition-opacity flex-shrink-0"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                  data-ocid="community.gif.button"
                >
                  <Image className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-auto border-0"
                side="top"
                align="end"
              >
                <GifPickerPanel
                  onSelect={(url) => {
                    setReplyImage(url);
                    setShowGif(false);
                  }}
                  onClose={() => setShowGif(false)}
                />
              </PopoverContent>
            </Popover>
            {/* Sticker picker */}
            <Popover open={showStickers} onOpenChange={setShowStickers}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:opacity-70 transition-opacity flex-shrink-0 text-base"
                  style={{ color: "oklch(0.65 0.10 60)" }}
                  data-ocid="community.sticker.button"
                >
                  😊
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-auto border-0"
                side="top"
                align="end"
              >
                <StickerPicker
                  onSelect={(url) => {
                    setReplyImage(url);
                    setShowStickers(false);
                  }}
                  onClose={() => setShowStickers(false)}
                />
              </PopoverContent>
            </Popover>
            <Button
              data-ocid="community.reply.submit_button"
              onClick={submitReply}
              disabled={!replyText.trim() && !replyImage}
              size="sm"
              className="flex-shrink-0"
              style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
            >
              Post
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "hot", label: "Hot", icon: Flame },
  { value: "new", label: "New", icon: Clock },
  { value: "top", label: "Top", icon: TrendingUp },
];

export function CommunityChatsPage({
  currentUser,
  onOpenAuth,
}: {
  currentUser: CurrentUser;
  onOpenAuth?: () => void;
}) {
  const [customChannels, setCustomChannels] = useState(loadCustomChannels);
  const allChannels = [...DEFAULT_CHANNELS, ...customChannels];

  const [posts, setPosts] = useState<ForumPost[]>(() => loadPosts());

  // Live counts (simulated, refreshes every 30s)
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      allChannels.map((ch) => [ch, Math.floor(Math.random() * 50) + 1]),
    ),
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: allChannels is stable
  useEffect(() => {
    const id = setInterval(() => {
      setLiveCounts(
        Object.fromEntries(
          allChannels.map((ch) => [ch, Math.floor(Math.random() * 50) + 1]),
        ),
      );
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Chat blocks from admin
  const getChatBlocks = (): Record<string, string[]> => {
    try {
      return JSON.parse(
        localStorage.getItem("researchhub_chat_blocks") || "{}",
      );
    } catch {
      return {};
    }
  };
  const isBlockedFromChannel = (channel: string): boolean => {
    const myUser = localStorage.getItem("chat_username") || "";
    const blocks = getChatBlocks();
    return (blocks[channel] || []).includes(myUser);
  };

  // Active polls
  const getActivePolls = () => {
    try {
      return JSON.parse(
        localStorage.getItem("researchhub_polls") || "[]",
      ).filter((p: { resolved: boolean }) => !p.resolved);
    } catch {
      return [];
    }
  };

  const [activeChannel, setActiveChannel] = useState("general");
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [openPost, setOpenPost] = useState<ForumPost | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChannelInput, setShowChannelInput] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState(
    "General" in CATEGORY_COLORS ? "General" : "Research",
  );
  const [newChannel, setNewChannel] = useState(activeChannel);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [showGifInPost, setShowGifInPost] = useState(false);
  const [showStickerInPost, setShowStickerInPost] = useState(false);
  const [mobileTab, setMobileTab] = useState<"posts" | "members">("posts");

  // Profile modal state
  const [viewedProfile, setViewedProfile] = useState<string | null>(null);

  // Members list (unique authors)
  const allMembers = Array.from(new Set(posts.map((p) => p.author)));

  function handleViewProfile(username: string) {
    setViewedProfile(username);
  }

  function updatePosts(updated: ForumPost[]) {
    setPosts(updated);
    savePosts(updated);
  }

  function handleUpvote(postId: number) {
    updatePosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              upvotes: p.upvotedBy.includes(currentUser.username)
                ? p.upvotes - 1
                : p.upvotes + 1,
              upvotedBy: p.upvotedBy.includes(currentUser.username)
                ? p.upvotedBy.filter((u) => u !== currentUser.username)
                : [...p.upvotedBy, currentUser.username],
            }
          : p,
      ),
    );
  }

  function handleReact(postId: number, emoji: string) {
    updatePosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              reactions: {
                ...p.reactions,
                [emoji]: p.reactions?.[emoji]?.includes(currentUser.username)
                  ? (p.reactions[emoji] || []).filter(
                      (u) => u !== currentUser.username,
                    )
                  : [...(p.reactions?.[emoji] || []), currentUser.username],
              },
            }
          : p,
      ),
    );
  }

  function handleUpvoteReply(postId: number, replyId: number) {
    updatePosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: p.replies.map((r) =>
                r.id === replyId
                  ? {
                      ...r,
                      upvotes: r.upvotedBy.includes(currentUser.username)
                        ? r.upvotes - 1
                        : r.upvotes + 1,
                      upvotedBy: r.upvotedBy.includes(currentUser.username)
                        ? r.upvotedBy.filter((u) => u !== currentUser.username)
                        : [...r.upvotedBy, currentUser.username],
                    }
                  : r,
              ),
            }
          : p,
      ),
    );
  }

  function handleReactReply(postId: number, replyId: number, emoji: string) {
    updatePosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: p.replies.map((r) =>
                r.id === replyId
                  ? {
                      ...r,
                      reactions: {
                        ...r.reactions,
                        [emoji]: r.reactions?.[emoji]?.includes(
                          currentUser.username,
                        )
                          ? (r.reactions[emoji] || []).filter(
                              (u) => u !== currentUser.username,
                            )
                          : [
                              ...(r.reactions?.[emoji] || []),
                              currentUser.username,
                            ],
                      },
                    }
                  : r,
              ),
            }
          : p,
      ),
    );
  }

  function handleAddReply(
    postId: number,
    body: string,
    imageUrl?: string,
    replyTo?: ReplyRef,
  ) {
    const status = getUserStatus(currentUser.username);
    if (status.banned) {
      toast.error("You are banned");
      return;
    }
    if (status.muted) {
      toast.error("You are muted");
      return;
    }
    const newReply: ForumReply = {
      id: Date.now(),
      body,
      author: currentUser.username,
      upvotes: 0,
      upvotedBy: [],
      createdAt: Date.now(),
      reactions: {},
      imageUrl,
      replyTo,
    };
    updatePosts(
      posts.map((p) =>
        p.id === postId ? { ...p, replies: [...p.replies, newReply] } : p,
      ),
    );
    // update openPost too
    if (openPost?.id === postId) {
      setOpenPost((prev) =>
        prev ? { ...prev, replies: [...prev.replies, newReply] } : prev,
      );
    }
  }

  function handleCreatePost() {
    if (!newTitle.trim() || !newBody.trim()) return;
    const status = getUserStatus(currentUser.username);
    if (status.banned) {
      toast.error("You are banned");
      return;
    }
    const post: ForumPost = {
      id: Date.now(),
      title: newTitle.trim(),
      body: newBody.trim(),
      category: newCategory,
      channel: newChannel,
      author: currentUser.username,
      upvotes: 0,
      upvotedBy: [],
      replies: [],
      createdAt: Date.now(),
      imageUrl: newImageUrl.trim() || undefined,
      reactions: {},
    };
    updatePosts([post, ...posts]);
    setNewTitle("");
    setNewBody("");
    setNewImageUrl("");
    setShowCreateModal(false);
    toast.success("Post created!");
  }

  function addCustomChannel() {
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    if (allChannels.includes(name)) {
      toast.error("Channel already exists");
      return;
    }
    const updated = [...customChannels, name];
    setCustomChannels(updated);
    saveCustomChannels(updated);
    setActiveChannel(name);
    setNewChannelName("");
    setShowChannelInput(false);
    toast.success(`#${name} created!`);
  }

  // Filter & sort posts
  const channelPosts = posts.filter(
    (p) => (p.channel || "general") === activeChannel,
  );
  const filtered = channelPosts
    .filter((p) => categoryFilter === "All" || p.category === categoryFilter)
    .filter(
      (p) =>
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.body.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "new") return b.createdAt - a.createdAt;
      if (sort === "top") return b.upvotes - a.upvotes;
      // hot: score based on upvotes + recency
      const scoreA =
        a.upvotes + a.replies.length * 2 - (Date.now() - a.createdAt) / 3600000;
      const scoreB =
        b.upvotes + b.replies.length * 2 - (Date.now() - b.createdAt) / 3600000;
      return scoreB - scoreA;
    });

  const openPostData = openPost
    ? posts.find((p) => p.id === openPost.id) || openPost
    : null;

  // Login gate: require a username to access community
  const isLoggedIn = !!(
    currentUser.username && currentUser.username !== "Guest"
  );
  if (!isLoggedIn) {
    return (
      <div
        data-ocid="community.section"
        className="flex flex-col items-center justify-center h-full py-20 px-6 text-center gap-6"
        style={{ background: "oklch(0.11 0.02 260)" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ background: "oklch(0.18 0.05 260)" }}
        >
          👥
        </div>
        <div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: "oklch(0.92 0.01 240)" }}
          >
            Join the Community
          </h2>
          <p
            className="text-sm max-w-xs mx-auto"
            style={{ color: "oklch(0.55 0.05 240)" }}
          >
            Sign in to join the conversation, post to forums, follow users, and
            send direct messages.
          </p>
        </div>
        <button
          type="button"
          data-ocid="community.primary_button"
          onClick={() => {
            if (onOpenAuth) onOpenAuth();
          }}
          className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
        >
          Sign In to Join
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0"
      style={{ background: "oklch(0.11 0.02 260)" }}
    >
      {/* ── Channels Sidebar ── */}
      <div
        className="hidden md:flex flex-col flex-shrink-0 border-r"
        style={{
          width: "180px",
          borderColor: "oklch(0.20 0.04 260)",
          background: "oklch(0.10 0.02 260)",
        }}
      >
        <div
          className="p-3 border-b"
          style={{ borderColor: "oklch(0.18 0.04 260)" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "oklch(0.50 0.06 240)" }}
          >
            Channels
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {allChannels.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setActiveChannel(ch)}
                data-ocid="community.channel.tab"
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-sm"
                style={{
                  background:
                    activeChannel === ch
                      ? "oklch(0.52 0.18 220 / 0.15)"
                      : "transparent",
                  color:
                    activeChannel === ch
                      ? "oklch(0.78 0.12 220)"
                      : "oklch(0.55 0.04 240)",
                }}
              >
                <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1 truncate">{ch}</span>
                {liveCounts[ch] && (
                  <span
                    className="text-[9px] px-1 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: "oklch(0.52 0.18 145 / 0.15)",
                      color: "oklch(0.65 0.18 145)",
                    }}
                  >
                    {liveCounts[ch]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
        {/* Add channel */}
        <div
          className="p-2 border-t"
          style={{ borderColor: "oklch(0.18 0.04 260)" }}
        >
          {showChannelInput ? (
            <div className="flex gap-1">
              <Input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="channel-name"
                className="h-6 text-xs"
                style={{
                  background: "oklch(0.16 0.04 260)",
                  borderColor: "oklch(0.26 0.05 260)",
                  color: "white",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCustomChannel();
                  if (e.key === "Escape") setShowChannelInput(false);
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={addCustomChannel}
                className="text-xs px-1.5 rounded"
                style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowChannelInput(true)}
              className="w-full flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-80"
              style={{ color: "oklch(0.50 0.06 240)" }}
              data-ocid="community.channel.button"
            >
              <Plus className="w-3 h-3" /> Add Channel
            </button>
          )}
        </div>
      </div>

      {/* ── Center Feed ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile channel picker */}
        <div
          className="md:hidden flex items-center gap-2 px-3 py-2 border-b overflow-x-auto"
          style={{ borderColor: "oklch(0.20 0.04 260)" }}
        >
          {allChannels.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setActiveChannel(ch)}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors"
              style={{
                background:
                  activeChannel === ch
                    ? "oklch(0.52 0.18 220 / 0.2)"
                    : "oklch(0.16 0.04 260)",
                color:
                  activeChannel === ch
                    ? "oklch(0.78 0.12 220)"
                    : "oklch(0.55 0.04 240)",
              }}
            >
              <Hash className="w-2.5 h-2.5" />
              {ch}
            </button>
          ))}
        </div>

        {openPostData ? (
          <ThreadView
            post={openPostData}
            currentUser={currentUser}
            onBack={() => setOpenPost(null)}
            onUpvotePost={() => handleUpvote(openPostData.id)}
            onUpvoteReply={(rid) => handleUpvoteReply(openPostData.id, rid)}
            onReactPost={(emoji) => handleReact(openPostData.id, emoji)}
            onReactReply={(rid, emoji) =>
              handleReactReply(openPostData.id, rid, emoji)
            }
            onAddReply={(body, imageUrl, replyTo) =>
              handleAddReply(openPostData.id, body, imageUrl, replyTo)
            }
            onViewProfile={handleViewProfile}
          />
        ) : (
          <>
            {/* Feed header */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0 flex-wrap"
              style={{ borderColor: "oklch(0.20 0.04 260)" }}
            >
              <h2
                className="text-sm font-bold mr-2"
                style={{ color: "oklch(0.85 0.05 240)" }}
              >
                #{activeChannel}
              </h2>

              {/* Sort */}
              {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSort(value as "hot" | "new" | "top")}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all"
                  style={{
                    background:
                      sort === value
                        ? "oklch(0.52 0.18 220 / 0.2)"
                        : "oklch(0.16 0.04 260)",
                    color:
                      sort === value
                        ? "oklch(0.72 0.14 220)"
                        : "oklch(0.55 0.04 240)",
                  }}
                  data-ocid="community.sort.tab"
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}

              {/* Mobile Members tab */}
              <button
                type="button"
                onClick={() =>
                  setMobileTab((t) => (t === "members" ? "posts" : "members"))
                }
                className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ml-auto"
                style={{
                  background:
                    mobileTab === "members"
                      ? "oklch(0.52 0.18 220 / 0.2)"
                      : "oklch(0.16 0.04 260)",
                  color:
                    mobileTab === "members"
                      ? "oklch(0.72 0.14 220)"
                      : "oklch(0.55 0.04 240)",
                }}
              >
                <Users className="w-3 h-3" />
                Members
              </button>

              {/* New post button */}
              <Button
                data-ocid="community.create.open_modal_button"
                size="sm"
                onClick={() => {
                  setNewChannel(activeChannel);
                  setShowCreateModal(true);
                }}
                className="ml-auto md:ml-0 h-7 px-3 text-xs"
                style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Post
              </Button>
            </div>

            {/* Search + category */}
            <div
              className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0"
              style={{ borderColor: "oklch(0.18 0.04 260)" }}
            >
              <div className="relative flex-1 max-w-xs">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: "oklch(0.50 0.06 240)" }}
                />
                <Input
                  data-ocid="community.search.search_input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts..."
                  className="pl-8 h-7 text-xs"
                  style={{
                    background: "oklch(0.16 0.04 260)",
                    borderColor: "oklch(0.26 0.05 260)",
                    color: "white",
                  }}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger
                  data-ocid="community.category.select"
                  className="h-7 text-xs w-32"
                  style={{
                    background: "oklch(0.16 0.04 260)",
                    borderColor: "oklch(0.26 0.05 260)",
                    color: "white",
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
                  {CATEGORIES.map((cat) => (
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

            {/* Mobile members list */}
            {mobileTab === "members" && (
              <div
                className="md:hidden p-3 border-b"
                style={{ borderColor: "oklch(0.18 0.04 260)" }}
              >
                <p
                  className="text-xs font-semibold mb-2"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                >
                  Members ({allMembers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {allMembers.map((member) => (
                    <button
                      key={member}
                      type="button"
                      onClick={() => handleViewProfile(member)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs hover:opacity-80 transition-opacity"
                      style={{
                        background: "oklch(0.18 0.04 260)",
                        color: "oklch(0.72 0.08 220)",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ background: getAvatarColor(member) }}
                      >
                        {getInitials(member)}
                      </div>
                      {member}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Posts feed */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {/* Active polls in this channel */}
                {getActivePolls()
                  .filter((p: { roomId: string }) => p.roomId === activeChannel)
                  .map(
                    (poll: {
                      id: number;
                      question: string;
                      yesVotes: number;
                      noVotes: number;
                      targetUser: string;
                    }) => (
                      <div
                        key={poll.id}
                        className="p-3 rounded-xl"
                        style={{
                          background: "oklch(0.16 0.06 260)",
                          border: "1px solid oklch(0.30 0.08 260)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold mb-2"
                          style={{ color: "oklch(0.80 0.10 260)" }}
                        >
                          📊 Community Poll
                        </p>
                        <p
                          className="text-sm mb-2"
                          style={{ color: "oklch(0.88 0.02 240)" }}
                        >
                          {poll.question}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: "oklch(0.52 0.18 145 / 0.2)",
                              color: "oklch(0.72 0.18 145)",
                              border: "1px solid oklch(0.52 0.18 145 / 0.3)",
                            }}
                            onClick={() => {
                              const p = JSON.parse(
                                localStorage.getItem("researchhub_polls") ||
                                  "[]",
                              );
                              const u = p.map((x: typeof poll) =>
                                x.id === poll.id
                                  ? { ...x, yesVotes: x.yesVotes + 1 }
                                  : x,
                              );
                              localStorage.setItem(
                                "researchhub_polls",
                                JSON.stringify(u),
                              );
                            }}
                          >
                            Yes ({poll.yesVotes})
                          </button>
                          <button
                            type="button"
                            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: "oklch(0.60 0.18 30 / 0.2)",
                              color: "oklch(0.72 0.18 30)",
                              border: "1px solid oklch(0.60 0.18 30 / 0.3)",
                            }}
                            onClick={() => {
                              const p = JSON.parse(
                                localStorage.getItem("researchhub_polls") ||
                                  "[]",
                              );
                              const u = p.map((x: typeof poll) =>
                                x.id === poll.id
                                  ? { ...x, noVotes: x.noVotes + 1 }
                                  : x,
                              );
                              localStorage.setItem(
                                "researchhub_polls",
                                JSON.stringify(u),
                              );
                            }}
                          >
                            No ({poll.noVotes})
                          </button>
                        </div>
                      </div>
                    ),
                  )}

                {/* Blocked state */}
                {isBlockedFromChannel(activeChannel) ? (
                  <div
                    className="text-center py-16"
                    data-ocid="community.blocked.error_state"
                  >
                    <Ban
                      className="w-12 h-12 mx-auto mb-3 opacity-30"
                      style={{ color: "oklch(0.65 0.18 30)" }}
                    />
                    <p
                      className="text-sm font-medium"
                      style={{ color: "oklch(0.65 0.18 30)" }}
                    >
                      You are blocked from this room
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "oklch(0.50 0.04 240)" }}
                    >
                      Contact an admin if you believe this is a mistake.
                    </p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div
                    data-ocid="community.posts.empty_state"
                    className="text-center py-16"
                    style={{ color: "oklch(0.50 0.04 240)" }}
                  >
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No posts yet</p>
                    <p className="text-xs mt-1 opacity-60 mb-4">
                      Be the first to post in #{activeChannel}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setNewChannel(activeChannel);
                        setShowCreateModal(true);
                      }}
                      style={{
                        background: "oklch(0.52 0.18 220)",
                        color: "white",
                      }}
                    >
                      Create the first post
                    </Button>
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
                        onViewProfile={handleViewProfile}
                      />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* ── Members Sidebar (desktop) ── */}
      <div
        className="hidden md:flex flex-col flex-shrink-0 border-l"
        style={{
          width: "200px",
          borderColor: "oklch(0.20 0.04 260)",
          background: "oklch(0.10 0.02 260)",
        }}
      >
        <div
          className="p-3 border-b flex items-center gap-2"
          style={{ borderColor: "oklch(0.18 0.04 260)" }}
        >
          <Users
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.50 0.06 240)" }}
          />
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "oklch(0.50 0.06 240)" }}
          >
            Members
          </p>
          <span
            className="text-xs ml-auto"
            style={{ color: "oklch(0.40 0.04 240)" }}
          >
            {allMembers.length}
          </span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {allMembers.map((member) => (
              <button
                key={member}
                type="button"
                onClick={() => handleViewProfile(member)}
                data-ocid="community.member.button"
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors hover:opacity-80"
                style={{ color: "oklch(0.68 0.06 240)" }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: getAvatarColor(member) }}
                >
                  {getInitials(member)}
                </div>
                <span className="text-xs truncate">{member}</span>
                {member === currentUser.username && (
                  <span
                    className="text-[9px] ml-auto"
                    style={{ color: "oklch(0.52 0.18 220)" }}
                  >
                    you
                  </span>
                )}
              </button>
            ))}
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
                Image (optional)
              </Label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="community-post-file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) =>
                    setNewImageUrl((ev.target?.result as string) ?? "");
                  reader.readAsDataURL(file);
                }}
              />
              <div className="flex gap-2">
                <Input
                  data-ocid="community.create.image.input"
                  value={newImageUrl.startsWith("data:") ? "" : newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://... or pick a GIF/sticker"
                  style={{
                    background: "oklch(0.16 0.03 260)",
                    borderColor: "oklch(0.26 0.05 260)",
                    color: "oklch(0.92 0.01 240)",
                  }}
                />
                <button
                  type="button"
                  data-ocid="community.create.upload_button"
                  onClick={() =>
                    document.getElementById("community-post-file")?.click()
                  }
                  className="px-2 py-1 rounded text-xs flex-shrink-0"
                  style={{
                    background: "oklch(0.20 0.04 260)",
                    color: "oklch(0.70 0.08 240)",
                    border: "1px solid oklch(0.28 0.05 260)",
                  }}
                >
                  📁
                </button>
                {/* GIF in post */}
                <Popover open={showGifInPost} onOpenChange={setShowGifInPost}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        background: "oklch(0.20 0.04 260)",
                        color: "oklch(0.65 0.08 220)",
                      }}
                    >
                      GIF
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-auto border-0"
                    side="top"
                    align="end"
                  >
                    <GifPickerPanel
                      onSelect={(url) => {
                        setNewImageUrl(url);
                        setShowGifInPost(false);
                      }}
                      onClose={() => setShowGifInPost(false)}
                    />
                  </PopoverContent>
                </Popover>
                {/* Sticker in post */}
                <Popover
                  open={showStickerInPost}
                  onOpenChange={setShowStickerInPost}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="px-2 py-1 rounded text-base"
                      style={{ background: "oklch(0.20 0.04 260)" }}
                    >
                      😊
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-auto border-0"
                    side="top"
                    align="end"
                  >
                    <StickerPicker
                      onSelect={(url) => {
                        setNewImageUrl(url);
                        setShowStickerInPost(false);
                      }}
                      onClose={() => setShowStickerInPost(false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
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

      {/* Profile Modal */}
      {viewedProfile && (
        <ProfileModal
          username={viewedProfile}
          currentUser={currentUser}
          posts={posts}
          open={!!viewedProfile}
          onClose={() => setViewedProfile(null)}
        />
      )}
    </div>
  );
}
