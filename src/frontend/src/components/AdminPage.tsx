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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Ban,
  CheckCircle,
  Globe,
  Lock,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  Trash2,
  Users,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ADMIN_PASSCODE = "TRX";

interface BanEntry {
  username: string;
  type: "ban" | "mute";
  until: string;
  reason: string;
}

interface ForumPost {
  id: number;
  title: string;
  body: string;
  category: string;
  author: string;
  upvotes: number;
  replies: {
    id: number;
    body: string;
    author: string;
    upvotes: number;
    createdAt: number;
    upvotedBy: string[];
  }[];
  createdAt: number;
  locked?: boolean;
  upvotedBy: string[];
  imageUrl?: string;
}

function loadBans(): BanEntry[] {
  try {
    return JSON.parse(localStorage.getItem("bannedUsers") || "[]");
  } catch {
    return [];
  }
}

function saveBans(bans: BanEntry[]) {
  localStorage.setItem("bannedUsers", JSON.stringify(bans));
}

function loadPosts(): ForumPost[] {
  try {
    return JSON.parse(localStorage.getItem("communityPosts") || "[]");
  } catch {
    return [];
  }
}

function savePosts(posts: ForumPost[]) {
  localStorage.setItem("communityPosts", JSON.stringify(posts));
}

function loadDomains(): string[] {
  try {
    return JSON.parse(localStorage.getItem("customDomains") || "[]");
  } catch {
    return [];
  }
}

function getUserStatus(
  username: string,
  bans: BanEntry[],
): "active" | "banned" | "muted" {
  const entry = bans.find((b) => b.username === username);
  if (!entry) return "active";
  if (entry.until === "permanent")
    return entry.type === "ban" ? "banned" : "muted";
  if (new Date(entry.until) <= new Date()) return "active";
  return entry.type === "ban" ? "banned" : "muted";
}

export function AdminPage() {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem("adminLoggedIn") === "true",
  );
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");

  // Ban dialog state
  const [banTarget, setBanTarget] = useState<string | null>(null);
  const [banDuration, setBanDuration] = useState("24h");
  const [banType, setBanType] = useState<"ban" | "mute">("ban");
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    if (unlocked) {
      setPosts(loadPosts());
      setBans(loadBans());
      setDomains(loadDomains());
    }
  }, [unlocked]);

  const handleUnlock = () => {
    if (passcode === ADMIN_PASSCODE) {
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem(
        "researchHubUser",
        JSON.stringify({
          username: "Admin",
          avatar: "",
          isAdmin: true,
          credits: 9999,
        }),
      );
      setUnlocked(true);
      setError("");
      toast.success("Admin access granted");
    } else {
      setError("Incorrect passcode");
      toast.error("Incorrect passcode");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("researchHubUser");
    setUnlocked(false);
    setPasscode("");
    toast.success("Logged out");
  };

  const applyBan = () => {
    if (!banTarget) return;
    const durationMap: Record<string, string> = {
      "1h": new Date(Date.now() + 3600000).toISOString(),
      "24h": new Date(Date.now() + 86400000).toISOString(),
      "7d": new Date(Date.now() + 7 * 86400000).toISOString(),
      "30d": new Date(Date.now() + 30 * 86400000).toISOString(),
      permanent: "permanent",
    };
    const until = durationMap[banDuration] ?? durationMap["24h"];
    const existing = bans.filter((b) => b.username !== banTarget);
    const updated = [
      ...existing,
      { username: banTarget, type: banType, until, reason: banReason },
    ];
    saveBans(updated);
    setBans(updated);
    setBanTarget(null);
    setBanReason("");
    toast.success(
      `User "${banTarget}" ${banType === "ban" ? "banned" : "muted"} (${banDuration})`,
    );
  };

  const removeBan = (username: string) => {
    const updated = bans.filter((b) => b.username !== username);
    saveBans(updated);
    setBans(updated);
    toast.success(`Ban lifted for "${username}"`);
  };

  const deletePost = (postId: number) => {
    const updated = posts.filter((p) => p.id !== postId);
    savePosts(updated);
    setPosts(updated);
    toast.success("Post deleted");
  };

  const toggleLockPost = (postId: number) => {
    const updated = posts.map((p) =>
      p.id === postId ? { ...p, locked: !p.locked } : p,
    );
    savePosts(updated);
    setPosts(updated);
    toast.success("Post lock toggled");
  };

  const addDomain = () => {
    if (!newDomain.trim()) return;
    const updated = [...domains, newDomain.trim()];
    localStorage.setItem("customDomains", JSON.stringify(updated));
    setDomains(updated);
    setNewDomain("");
    toast.success("Domain added");
  };

  const removeDomain = (domain: string) => {
    const updated = domains.filter((d) => d !== domain);
    localStorage.setItem("customDomains", JSON.stringify(updated));
    setDomains(updated);
    toast.success("Domain removed");
  };

  // Unique authors from posts
  const allUsers = Array.from(
    new Set([
      ...posts.map((p) => p.author),
      ...posts.flatMap((p) => p.replies.map((r) => r.author)),
    ]),
  ).filter(Boolean);

  const activeBans = bans.filter((b) => {
    if (b.until === "permanent") return true;
    return new Date(b.until) > new Date();
  });

  const panelStyle = {
    background: "oklch(0.11 0.025 260)",
    minHeight: "100%",
    color: "oklch(0.92 0.02 240)",
  };

  const cardStyle = {
    background: "oklch(0.14 0.03 260)",
    border: "1px solid oklch(0.22 0.04 260)",
    borderRadius: "10px",
    padding: "12px",
  };

  if (!unlocked) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ background: "oklch(0.10 0.02 260)" }}
      >
        <div
          className="w-full max-w-sm p-6 rounded-xl"
          style={{
            background: "oklch(0.13 0.03 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
              style={{ background: "oklch(0.60 0.18 220 / 0.15)" }}
            >
              <Shield
                className="w-7 h-7"
                style={{ color: "oklch(0.72 0.18 220)" }}
              />
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: "oklch(0.92 0.02 240)" }}
            >
              Admin Login
            </h2>
            <p
              className="text-xs mt-1"
              style={{ color: "oklch(0.50 0.04 240)" }}
            >
              Enter the admin passcode to continue
            </p>
          </div>
          <div className="space-y-3">
            <Label style={{ color: "oklch(0.65 0.04 240)" }}>Passcode</Label>
            <Input
              data-ocid="admin.passcode.input"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              style={{
                background: "oklch(0.16 0.03 260)",
                borderColor: error
                  ? "oklch(0.60 0.18 30)"
                  : "oklch(0.26 0.05 260)",
                color: "oklch(0.92 0.01 240)",
              }}
            />
            {error && (
              <p
                data-ocid="admin.login.error_state"
                className="text-xs"
                style={{ color: "oklch(0.65 0.18 30)" }}
              >
                {error}
              </p>
            )}
            <Button
              data-ocid="admin.login.submit_button"
              className="w-full"
              onClick={handleUnlock}
              style={{ background: "oklch(0.60 0.18 220)", color: "white" }}
            >
              <Shield className="w-4 h-4 mr-2" /> Unlock Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={panelStyle}>
      {/* Admin profile card */}
      <div
        className="p-4 border-b flex items-center justify-between"
        style={{
          borderColor: "oklch(0.20 0.04 260)",
          background: "oklch(0.13 0.03 260)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0.60 0.18 220 / 0.15)",
              border: "2px solid oklch(0.60 0.18 220 / 0.4)",
            }}
          >
            <Shield
              className="w-5 h-5"
              style={{ color: "oklch(0.72 0.18 220)" }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-bold text-sm"
                style={{ color: "oklch(0.92 0.02 240)" }}
              >
                Admin
              </span>
              <Badge
                className="text-xs px-1.5 py-0 border-0"
                style={{
                  background: "oklch(0.60 0.18 30 / 0.2)",
                  color: "oklch(0.80 0.18 30)",
                }}
              >
                ADMIN
              </Badge>
            </div>
            <p className="text-xs" style={{ color: "oklch(0.50 0.04 240)" }}>
              Platform Administrator
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          data-ocid="admin.logout.button"
          className="gap-1.5 text-xs"
          style={{ color: "oklch(0.60 0.18 30)" }}
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </Button>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <TabsList
          className="mx-3 mt-3 mb-0 grid grid-cols-5 h-8"
          style={{ background: "oklch(0.15 0.03 260)" }}
        >
          {(["overview", "users", "posts", "banned", "settings"] as const).map(
            (tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                data-ocid={`admin.${tab}.tab`}
                className="text-xs capitalize"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                {tab}
              </TabsTrigger>
            ),
          )}
        </TabsList>

        <ScrollArea className="flex-1">
          {/* ── Overview ── */}
          <TabsContent value="overview" className="p-3 space-y-3 m-0">
            <div className="grid grid-cols-3 gap-2">
              <div style={cardStyle}>
                <div
                  className="text-xs mb-1"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                >
                  Posts
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "oklch(0.92 0.02 240)" }}
                >
                  {posts.length}
                </div>
              </div>
              <div style={cardStyle}>
                <div
                  className="text-xs mb-1"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                >
                  Users
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "oklch(0.92 0.02 240)" }}
                >
                  {allUsers.length}
                </div>
              </div>
              <div style={cardStyle}>
                <div
                  className="text-xs mb-1"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                >
                  Active Bans
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "oklch(0.80 0.18 30)" }}
                >
                  {activeBans.length}
                </div>
              </div>
            </div>

            <div>
              <h3
                className="text-xs font-semibold mb-2"
                style={{ color: "oklch(0.60 0.04 240)" }}
              >
                RECENT ACTIVITY
              </h3>
              <div className="space-y-1.5">
                {[...posts]
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .slice(0, 10)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start gap-2 p-2 rounded-lg"
                      style={{ background: "oklch(0.14 0.03 260)" }}
                    >
                      <MessageSquare
                        className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                        style={{ color: "oklch(0.60 0.18 220)" }}
                      />
                      <div className="min-w-0">
                        <p
                          className="text-xs truncate"
                          style={{ color: "oklch(0.80 0.02 240)" }}
                        >
                          {p.title}
                        </p>
                        <p
                          className="text-[10px]"
                          style={{ color: "oklch(0.45 0.04 240)" }}
                        >
                          by {p.author}
                        </p>
                      </div>
                    </div>
                  ))}
                {posts.length === 0 && (
                  <p
                    className="text-xs text-center py-4"
                    style={{ color: "oklch(0.40 0.04 240)" }}
                  >
                    No posts yet
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Users ── */}
          <TabsContent value="users" className="p-3 m-0">
            <h3
              className="text-xs font-semibold mb-2"
              style={{ color: "oklch(0.60 0.04 240)" }}
            >
              ALL USERS ({allUsers.length})
            </h3>
            <div className="space-y-2">
              {allUsers.map((username) => {
                const status = getUserStatus(username, bans);
                const postCount =
                  posts.filter((p) => p.author === username).length +
                  posts
                    .flatMap((p) => p.replies)
                    .filter((r) => r.author === username).length;
                return (
                  <div
                    key={username}
                    className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{
                      background: "oklch(0.14 0.03 260)",
                      border: "1px solid oklch(0.20 0.04 260)",
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-sm font-medium"
                          style={{ color: "oklch(0.88 0.02 240)" }}
                        >
                          {username}
                        </span>
                        {status !== "active" && (
                          <Badge
                            className="text-[10px] px-1 py-0 border-0"
                            style={{
                              background:
                                status === "banned"
                                  ? "oklch(0.60 0.18 30/0.2)"
                                  : "oklch(0.60 0.18 50/0.2)",
                              color:
                                status === "banned"
                                  ? "oklch(0.75 0.18 30)"
                                  : "oklch(0.75 0.18 50)",
                            }}
                          >
                            {status}
                          </Badge>
                        )}
                      </div>
                      <p
                        className="text-[11px]"
                        style={{ color: "oklch(0.45 0.04 240)" }}
                      >
                        {postCount} posts/replies
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {status !== "active" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBan(username)}
                          data-ocid="admin.users.unban.button"
                          className="h-7 px-2 text-xs gap-1"
                          style={{ color: "oklch(0.65 0.18 160)" }}
                        >
                          <CheckCircle className="w-3 h-3" /> Unban
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setBanTarget(username);
                              setBanType("mute");
                            }}
                            data-ocid="admin.users.mute.button"
                            className="h-7 px-2 text-xs gap-1"
                            style={{ color: "oklch(0.65 0.18 50)" }}
                          >
                            <VolumeX className="w-3 h-3" /> Mute
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setBanTarget(username);
                              setBanType("ban");
                            }}
                            data-ocid="admin.users.ban.button"
                            className="h-7 px-2 text-xs gap-1"
                            style={{ color: "oklch(0.65 0.18 30)" }}
                          >
                            <Ban className="w-3 h-3" /> Ban
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {allUsers.length === 0 && (
                <p
                  className="text-xs text-center py-8"
                  style={{ color: "oklch(0.40 0.04 240)" }}
                >
                  No users found in community posts
                </p>
              )}
            </div>
          </TabsContent>

          {/* ── Posts ── */}
          <TabsContent value="posts" className="p-3 m-0">
            <h3
              className="text-xs font-semibold mb-2"
              style={{ color: "oklch(0.60 0.04 240)" }}
            >
              ALL POSTS ({posts.length})
            </h3>
            <div className="space-y-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-2.5 rounded-lg"
                  style={{
                    background: "oklch(0.14 0.03 260)",
                    border: "1px solid oklch(0.20 0.04 260)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "oklch(0.88 0.02 240)" }}
                      >
                        {post.title}
                      </p>
                      <p
                        className="text-[11px]"
                        style={{ color: "oklch(0.45 0.04 240)" }}
                      >
                        by {post.author} · {post.replies.length} replies
                        {post.locked && " · 🔒 Locked"}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleLockPost(post.id)}
                        data-ocid="admin.posts.lock.toggle"
                        className="h-7 px-2"
                        style={{
                          color: post.locked
                            ? "oklch(0.65 0.18 50)"
                            : "oklch(0.55 0.04 240)",
                        }}
                      >
                        <Lock className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePost(post.id)}
                        data-ocid="admin.posts.delete.delete_button"
                        className="h-7 px-2"
                        style={{ color: "oklch(0.65 0.18 30)" }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <p
                  className="text-xs text-center py-8"
                  style={{ color: "oklch(0.40 0.04 240)" }}
                >
                  No posts yet
                </p>
              )}
            </div>
          </TabsContent>

          {/* ── Banned ── */}
          <TabsContent value="banned" className="p-3 m-0">
            <h3
              className="text-xs font-semibold mb-2"
              style={{ color: "oklch(0.60 0.04 240)" }}
            >
              ACTIVE BANS ({activeBans.length})
            </h3>
            <div className="space-y-2">
              {activeBans.map((entry) => (
                <div
                  key={entry.username}
                  className="flex items-center justify-between p-2.5 rounded-lg"
                  style={{
                    background: "oklch(0.14 0.03 260)",
                    border: "1px solid oklch(0.60 0.18 30 / 0.2)",
                  }}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-sm font-medium"
                        style={{ color: "oklch(0.88 0.02 240)" }}
                      >
                        {entry.username}
                      </span>
                      <Badge
                        className="text-[10px] px-1 py-0 border-0"
                        style={{
                          background:
                            entry.type === "ban"
                              ? "oklch(0.60 0.18 30/0.2)"
                              : "oklch(0.60 0.18 50/0.2)",
                          color:
                            entry.type === "ban"
                              ? "oklch(0.75 0.18 30)"
                              : "oklch(0.75 0.18 50)",
                        }}
                      >
                        {entry.type}
                      </Badge>
                    </div>
                    <p
                      className="text-[11px]"
                      style={{ color: "oklch(0.45 0.04 240)" }}
                    >
                      Until:{" "}
                      {entry.until === "permanent"
                        ? "Permanent"
                        : new Date(entry.until).toLocaleString()}
                      {entry.reason && ` · ${entry.reason}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeBan(entry.username)}
                    data-ocid="admin.banned.unban.button"
                    className="h-7 px-2 text-xs gap-1"
                    style={{ color: "oklch(0.65 0.18 160)" }}
                  >
                    <CheckCircle className="w-3 h-3" /> Unban
                  </Button>
                </div>
              ))}
              {activeBans.length === 0 && (
                <p
                  className="text-xs text-center py-8"
                  style={{ color: "oklch(0.40 0.04 240)" }}
                >
                  No active bans
                </p>
              )}
            </div>
          </TabsContent>

          {/* ── Settings ── */}
          <TabsContent value="settings" className="p-3 space-y-4 m-0">
            <div>
              <h3
                className="text-xs font-semibold mb-2"
                style={{ color: "oklch(0.60 0.04 240)" }}
              >
                CUSTOM ARCHIVE.ORG DOMAINS
              </h3>
              <div className="flex gap-2 mb-2">
                <Input
                  data-ocid="admin.domains.input"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g. movies, audio, texts"
                  onKeyDown={(e) => e.key === "Enter" && addDomain()}
                  style={{
                    background: "oklch(0.16 0.03 260)",
                    borderColor: "oklch(0.26 0.05 260)",
                    color: "oklch(0.92 0.01 240)",
                  }}
                />
                <Button
                  onClick={addDomain}
                  data-ocid="admin.domains.add.primary_button"
                  style={{ background: "oklch(0.60 0.18 220)", color: "white" }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {domains.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: "oklch(0.14 0.03 260)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Globe
                        className="w-3.5 h-3.5"
                        style={{ color: "oklch(0.60 0.18 220)" }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: "oklch(0.80 0.02 240)" }}
                      >
                        {domain}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDomain(domain)}
                      data-ocid="admin.domains.delete.delete_button"
                      className="h-7 px-2"
                      style={{ color: "oklch(0.65 0.18 30)" }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {domains.length === 0 && (
                  <p
                    className="text-xs text-center py-4"
                    style={{ color: "oklch(0.40 0.04 240)" }}
                  >
                    No custom domains added
                  </p>
                )}
              </div>
            </div>

            <div
              className="pt-2 border-t"
              style={{ borderColor: "oklch(0.20 0.04 260)" }}
            >
              <Button
                variant="ghost"
                onClick={handleLogout}
                data-ocid="admin.settings.logout.button"
                className="w-full gap-2 text-sm"
                style={{ color: "oklch(0.65 0.18 30)" }}
              >
                <LogOut className="w-4 h-4" /> Logout of Admin
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Ban / Mute Dialog */}
      <Dialog open={!!banTarget} onOpenChange={(v) => !v && setBanTarget(null)}>
        <DialogContent
          data-ocid="admin.ban.dialog"
          style={{
            background: "oklch(0.13 0.03 260)",
            borderColor: "oklch(0.22 0.04 260)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.02 240)" }}>
              {banType === "ban" ? "Ban" : "Mute"} user: {banTarget}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                Action
              </Label>
              <Select
                value={banType}
                onValueChange={(v) => setBanType(v as "ban" | "mute")}
              >
                <SelectTrigger
                  data-ocid="admin.ban.type.select"
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
                  <SelectItem
                    value="ban"
                    style={{ color: "oklch(0.85 0.02 240)" }}
                  >
                    Ban (prevent login/posting)
                  </SelectItem>
                  <SelectItem
                    value="mute"
                    style={{ color: "oklch(0.85 0.02 240)" }}
                  >
                    Mute (prevent posting only)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                Duration
              </Label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger
                  data-ocid="admin.ban.duration.select"
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
                  <SelectItem
                    value="1h"
                    style={{ color: "oklch(0.85 0.02 240)" }}
                  >
                    1 Hour
                  </SelectItem>
                  <SelectItem
                    value="24h"
                    style={{ color: "oklch(0.85 0.02 240)" }}
                  >
                    24 Hours
                  </SelectItem>
                  <SelectItem
                    value="7d"
                    style={{ color: "oklch(0.85 0.02 240)" }}
                  >
                    7 Days
                  </SelectItem>
                  <SelectItem
                    value="30d"
                    style={{ color: "oklch(0.85 0.02 240)" }}
                  >
                    30 Days
                  </SelectItem>
                  <SelectItem
                    value="permanent"
                    style={{ color: "oklch(0.85 0.02 240)" }}
                  >
                    Permanent
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                Reason (optional)
              </Label>
              <Input
                data-ocid="admin.ban.reason.input"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Rule violation, spam, etc."
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
              data-ocid="admin.ban.cancel_button"
              onClick={() => setBanTarget(null)}
              style={{ color: "oklch(0.60 0.04 240)" }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.ban.confirm_button"
              onClick={applyBan}
              style={{
                background:
                  banType === "ban"
                    ? "oklch(0.55 0.18 30)"
                    : "oklch(0.55 0.18 50)",
                color: "white",
              }}
            >
              {banType === "ban" ? (
                <Ban className="w-3.5 h-3.5 mr-1.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 mr-1.5" />
              )}
              Apply {banType === "ban" ? "Ban" : "Mute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
