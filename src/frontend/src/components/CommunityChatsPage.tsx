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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowLeft,
  ChevronUp,
  Clock,
  Edit3,
  Flame,
  Lock,
  MessageCircle,
  Plus,
  Search,
  Share2,
  Star,
  TrendingUp,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CurrentUser {
  username: string;
  avatar: string;
  isAdmin: boolean;
}

interface BanEntry {
  username: string;
  type: "ban" | "mute";
  until: string; // ISO string or "permanent"
  reason: string;
}

interface ForumReply {
  id: number;
  body: string;
  author: string;
  upvotes: number;
  createdAt: number;
  upvotedBy: string[];
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
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

const POSTS_KEY = "communityPosts";
const BANS_KEY = "bannedUsers";

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
  if (expiry <= new Date()) return { banned: false, muted: false }; // expired
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
      },
      {
        id: 102,
        body: "Let's not get ahead of ourselves – DMS can potentially have abiotic origins too. Exciting but cautious optimism needed.",
        author: "SkepticalScientist",
        upvotes: 189,
        createdAt: Date.now() - 1800000,
        upvotedBy: [],
      },
    ],
    createdAt: Date.now() - 7200000,
  },
  {
    id: 2,
    title: "How do you organize your research notes? Share your system!",
    body: "I've been struggling with keeping my research organized across different topics. Currently using a combination of Obsidian and physical notebooks but looking for better ways. What systems work for you?",
    category: "Research",
    author: "KnowledgeSeeker42",
    upvotes: 312,
    upvotedBy: [],
    replies: [
      {
        id: 201,
        body: "Zettelkasten method changed my life. Each note is atomic and linked. Takes getting used to but so worth it.",
        author: "NoteTaker99",
        upvotes: 156,
        createdAt: Date.now() - 86400000,
        upvotedBy: [],
      },
    ],
    createdAt: Date.now() - 172800000,
  },
  {
    id: 3,
    title:
      "Newly digitized collection: 10,000 pages of Tesla's personal notes now on Archive.org",
    body: "The Nikola Tesla Museum has just completed digitizing 10,000+ pages of Tesla's handwritten notes and correspondence. Everything from his AC motor experiments to his Wardenclyffe Tower plans. Completely free to browse.",
    category: "Science",
    author: "ArchiveDigger",
    upvotes: 1204,
    upvotedBy: [],
    replies: [],
    createdAt: Date.now() - 259200000,
  },
  {
    id: 4,
    title: "Best public domain illustrated books for art history research?",
    body: "Working on a paper about Art Nouveau and looking for high-quality digitized illustrated books, particularly from 1890-1920. Any recommendations from Archive.org, Europeana, or other open sources?",
    category: "Art",
    author: "ArtHistoryNerd",
    upvotes: 145,
    upvotedBy: [],
    replies: [
      {
        id: 401,
        body: "Europeana has fantastic Art Nouveau collections, especially from Austrian and Czech museums. Also check the Met's digital library.",
        author: "EuropaMuseumFan",
        upvotes: 78,
        createdAt: Date.now() - 43200000,
        upvotedBy: [],
      },
    ],
    createdAt: Date.now() - 432000000,
  },
  {
    id: 5,
    title:
      "Breaking: Researchers decode 3,000-year-old Ugaritic tablet with AI assistance",
    body: "A team at MIT has used large language models trained on ancient Near Eastern languages to successfully decode a previously untranslatable Ugaritic administrative tablet from 1200 BCE. The tablet appears to be a merchant's ledger listing trade goods between Canaan and Egypt.",
    category: "History",
    author: "AncientWorldsProf",
    upvotes: 967,
    upvotedBy: [],
    replies: [],
    createdAt: Date.now() - 518400000,
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

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUser,
  onOpen,
  onUpvote,
}: {
  post: ForumPost;
  currentUser: CurrentUser | null;
  onOpen: () => void;
  onUpvote: () => void;
}) {
  const hasUpvoted = currentUser
    ? post.upvotedBy.includes(currentUser.username)
    : false;

  return (
    <div
      className="rounded-lg border cursor-pointer transition-all hover:border-opacity-60"
      style={{
        background: "oklch(0.13 0.03 260)",
        borderColor: "oklch(0.22 0.04 260)",
      }}
    >
      {/* Votes sidebar */}
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

        {/* Post content */}
        <button
          type="button"
          className="flex-1 p-3 text-left cursor-pointer"
          onClick={onOpen}
        >
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge
              className="text-xs px-1.5 py-0 border-0"
              style={{
                background: `${CATEGORY_COLORS[post.category] ?? "oklch(0.55 0.12 240)"}/0.15`,
                color: CATEGORY_COLORS[post.category] ?? "oklch(0.72 0.12 240)",
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
                <Lock className="w-2.5 h-2.5 mr-1" />
                Locked
              </Badge>
            )}
          </div>
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

  const status = currentUser ? getUserStatus(currentUser.username) : null;

  const handleUpvotePost = () => {
    if (!currentUser) {
      toast.error("Login to upvote");
      return;
    }
    const already = post.upvotedBy.includes(currentUser.username);
    const updated = {
      ...post,
      upvotes: already ? post.upvotes - 1 : post.upvotes + 1,
      upvotedBy: already
        ? post.upvotedBy.filter((u) => u !== currentUser.username)
        : [...post.upvotedBy, currentUser.username],
    };
    onPostUpdate(updated);
  };

  const handleUpvoteReply = (replyId: number) => {
    if (!currentUser) {
      toast.error("Login to upvote");
      return;
    }
    const updated = {
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
    };
    onPostUpdate(updated);
  };

  const handleSubmitReply = () => {
    if (!replyText.trim() || !currentUser) return;
    setSubmitting(true);
    const newReply: ForumReply = {
      id: Date.now(),
      body: replyText.trim(),
      author: currentUser.username,
      upvotes: 0,
      createdAt: Date.now(),
      upvotedBy: [],
    };
    const updated = { ...post, replies: [...post.replies, newReply] };
    onPostUpdate(updated);
    setReplyText("");
    setSubmitting(false);
    toast.success("Reply posted!");
  };

  const postUpvoted = currentUser
    ? post.upvotedBy.includes(currentUser.username)
    : false;

  return (
    <div className="flex flex-col h-full">
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
            className="rounded-xl border p-4"
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
                  <Lock className="w-3 h-3 mr-1" />
                  Locked – no new replies
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
              <img
                src={post.imageUrl}
                alt="post"
                className="rounded-lg max-h-96 object-cover mb-3"
              />
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
                  <div className="flex justify-end">
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
                    className="rounded-lg border p-3"
                    style={{
                      background: "oklch(0.13 0.03 260)",
                      borderColor: "oklch(0.20 0.04 260)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
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
                    <p
                      className="text-sm mb-2"
                      style={{ color: "oklch(0.78 0.02 240)" }}
                    >
                      {reply.body}
                    </p>
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
                );
              })
            )}
          </div>
        </div>
      </ScrollArea>
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

  // Create post form state
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("Research");
  const [newImageUrl, setNewImageUrl] = useState("");

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
      author: currentUser.username,
      upvotes: 1,
      upvotedBy: [currentUser.username],
      replies: [],
      createdAt: Date.now(),
      imageUrl: newImageUrl.trim() || undefined,
    };
    const next = [newPost, ...posts];
    setPosts(next);
    savePosts(next);
    setNewTitle("");
    setNewBody("");
    setNewCategory("Research");
    setNewImageUrl("");
    setShowCreateModal(false);
    toast.success("Post created!");
  };

  // Sort and filter
  let filtered = posts.filter((p) => {
    const matchCat =
      selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (sort === "new")
    filtered = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
  else if (sort === "top")
    filtered = [...filtered].sort((a, b) => b.upvotes - a.upvotes);
  else {
    // hot: weighted by upvotes and recency
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
    <div
      className="flex flex-col h-full"
      style={{ background: "oklch(0.10 0.02 260)" }}
    >
      {/* Header */}
      <div
        className="p-3 border-b"
        style={{
          borderColor: "oklch(0.20 0.04 260)",
          background: "oklch(0.12 0.03 260)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2
              className="font-bold text-base"
              style={{ color: "oklch(0.92 0.02 240)" }}
            >
              Community
            </h2>
            <p className="text-xs" style={{ color: "oklch(0.50 0.04 240)" }}>
              {posts.length} posts ·{" "}
              {posts.reduce((s, p) => s + p.replies.length, 0)} comments
            </p>
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
                  sort === s ? "oklch(0.72 0.18 220)" : "oklch(0.50 0.04 240)",
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
        style={{ borderColor: "oklch(0.20 0.04 260)", scrollbarWidth: "none" }}
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
              border: `1px solid ${selectedCategory === cat ? `${CATEGORY_COLORS[cat] ?? "oklch(0.60 0.18 220)"}/0.4` : "oklch(0.22 0.04 260)"}`,
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
                  style={{ background: "oklch(0.60 0.18 220)", color: "white" }}
                  onClick={() => setShowCreateModal(true)}
                >
                  Create the first post
                </Button>
              )}
            </div>
          ) : (
            filtered.map((post, idx) => (
              <div key={post.id} data-ocid={`community.posts.item.${idx + 1}`}>
                <PostCard
                  post={post}
                  currentUser={currentUser}
                  onOpen={() => setOpenPost(post)}
                  onUpvote={() => handleUpvote(post.id)}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>

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
              Create a Post
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
                placeholder="An interesting title..."
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
                Category
              </Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger
                  data-ocid="community.create.select"
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
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <SelectItem
                      key={c}
                      value={c}
                      style={{ color: "oklch(0.85 0.02 240)" }}
                    >
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
