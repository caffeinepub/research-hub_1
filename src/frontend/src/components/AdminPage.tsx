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
  BookImage,
  CheckCircle,
  Crown,
  Flag,
  Globe,
  Lock,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  Users,
  VolumeX,
  Vote,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ComicsTab } from "./ComicsTab";

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
  const isHeadAdmin = (() => {
    try {
      const role = JSON.parse(localStorage.getItem("adminRole") || "{}");
      return role.isHeadAdmin === true;
    } catch {
      return false;
    }
  })();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [reports, setReports] = useState<ReportEntry[]>([]);

  // Role management state
  const [roles, setRoles] = useState<
    Record<string, "user" | "moderator" | "admin">
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("researchhub_roles") || "{}");
    } catch {
      return {};
    }
  });
  const [roleRequests, setRoleRequests] = useState<
    {
      id: number;
      requester: string;
      targetUser: string;
      targetRole: string;
      timestamp: number;
    }[]
  >(() => {
    try {
      return JSON.parse(
        localStorage.getItem("researchhub_role_requests") || "[]",
      );
    } catch {
      return [];
    }
  });

  // Chat controls state
  const [chatBlocks, setChatBlocks] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("researchhub_chat_blocks") || "{}",
      );
    } catch {
      return {};
    }
  });
  const [polls, setPolls] = useState<
    {
      id: number;
      roomId: string;
      targetUser: string;
      question: string;
      yesVotes: number;
      noVotes: number;
      createdAt: number;
      resolved: boolean;
    }[]
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("researchhub_polls") || "[]");
    } catch {
      return [];
    }
  });
  const [liveCounts] = useState<Record<string, number>>(() => {
    const rooms = [
      "general",
      "science",
      "history",
      "technology",
      "art",
      "memes",
    ];
    return Object.fromEntries(
      rooms.map((r) => [r, Math.floor(Math.random() * 50) + 1]),
    );
  });

  const [blockChatTarget, setBlockChatTarget] = useState<{
    room: string;
    username: string;
  } | null>(null);
  const [pollTarget, setPollTarget] = useState<{
    room: string;
    username: string;
  } | null>(null);
  const [newBlockUser, setNewBlockUser] = useState("");
  const [newPollUser, setNewPollUser] = useState("");

  const saveRoles = (r: Record<string, "user" | "moderator" | "admin">) => {
    localStorage.setItem("researchhub_roles", JSON.stringify(r));
    setRoles(r);
  };

  const promoteUser = (
    username: string,
    role: "user" | "moderator" | "admin",
  ) => {
    const updated = { ...roles, [username]: role };
    saveRoles(updated);
    toast.success(`${username} is now ${role}`);
  };

  const blockFromChat = (room: string, username: string) => {
    const updated = {
      ...chatBlocks,
      [room]: [...(chatBlocks[room] || []), username],
    };
    localStorage.setItem("researchhub_chat_blocks", JSON.stringify(updated));
    setChatBlocks(updated);
    toast.success(`${username} blocked from #${room}`);
    setBlockChatTarget(null);
    setNewBlockUser("");
  };

  const unblockFromChat = (room: string, username: string) => {
    const updated = {
      ...chatBlocks,
      [room]: (chatBlocks[room] || []).filter((u) => u !== username),
    };
    localStorage.setItem("researchhub_chat_blocks", JSON.stringify(updated));
    setChatBlocks(updated);
    toast.success(`${username} unblocked from #${room}`);
  };

  const createPoll = (room: string, username: string) => {
    const newPoll = {
      id: Date.now(),
      roomId: room,
      targetUser: username,
      question: `Should ${username} be blocked from #${room}?`,
      yesVotes: 0,
      noVotes: 0,
      createdAt: Date.now(),
      resolved: false,
    };
    const updated = [...polls, newPoll];
    localStorage.setItem("researchhub_polls", JSON.stringify(updated));
    setPolls(updated);
    toast.success(`Poll created for ${username} in #${room}`);
    setPollTarget(null);
    setNewPollUser("");
  };

  const resolvePoll = (pollId: number) => {
    const updated = polls.map((p) =>
      p.id === pollId ? { ...p, resolved: true } : p,
    );
    localStorage.setItem("researchhub_polls", JSON.stringify(updated));
    setPolls(updated);
    toast.success("Poll resolved");
  };

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
      setReports(loadReports());
    }
  }, [unlocked]);

  const handleUnlock = () => {
    if (passcode === ADMIN_PASSCODE) {
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminRole", JSON.stringify({ isHeadAdmin: true }));
      localStorage.setItem(
        "researchHubUser",
        JSON.stringify({
          username: "Admin",
          avatar: "",
          isAdmin: true,
          isHeadAdmin: true,
          credits: 9999,
        }),
      );
      setUnlocked(true);
      setError("");
      toast.success("Head Admin access granted");
    } else {
      setError("Incorrect passcode");
      toast.error("Incorrect passcode");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("researchHubUser");
    localStorage.removeItem("adminRole");
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
                style={
                  isHeadAdmin
                    ? {
                        background: "oklch(0.75 0.16 85 / 0.2)",
                        color: "oklch(0.85 0.16 85)",
                        border: "1px solid oklch(0.75 0.16 85 / 0.4)",
                      }
                    : {
                        background: "oklch(0.60 0.18 30 / 0.2)",
                        color: "oklch(0.80 0.18 30)",
                      }
                }
              >
                {isHeadAdmin ? "HEAD ADMIN" : "ADMIN"}
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
        <div
          className="overflow-x-auto mx-3 mt-3 mb-0"
          style={{ scrollbarWidth: "none" }}
        >
          <TabsList
            className="grid grid-cols-9 h-8 w-max min-w-full"
            style={{ background: "oklch(0.15 0.03 260)" }}
          >
            {(
              [
                "overview",
                "reports",
                "users",
                "posts",
                "banned",
                "roles",
                "chats",
                "comics",
                "settings",
              ] as const
            ).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                data-ocid={`admin.${tab}.tab`}
                className="text-xs capitalize"
                style={{ color: "oklch(0.65 0.04 240)" }}
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* ── Overview ── */}
          <TabsContent value="overview" className="p-3 space-y-3 m-0">
            <div className="grid grid-cols-2 gap-2">
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
              <div style={cardStyle}>
                <div
                  className="text-xs mb-1"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                >
                  Reports
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{
                    color:
                      reports.length > 0
                        ? "oklch(0.75 0.18 50)"
                        : "oklch(0.92 0.02 240)",
                  }}
                >
                  {reports.length}
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

          {/* ── Reports ── */}
          <TabsContent value="reports" className="p-3 m-0">
            <h3
              className="text-xs font-semibold mb-3"
              style={{ color: "oklch(0.60 0.04 240)" }}
            >
              REPORTED CONTENT ({reports.length})
            </h3>
            {reports.length === 0 ? (
              <div
                data-ocid="admin.reports.empty_state"
                className="text-center py-8"
                style={{ color: "oklch(0.45 0.04 240)" }}
              >
                <Flag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No reports yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((report, idx) => (
                  <div
                    key={report.id}
                    data-ocid={`admin.report.item.${idx + 1}`}
                    className="rounded-lg p-3 space-y-2"
                    style={{
                      background: "oklch(0.14 0.03 260)",
                      border: "1px solid oklch(0.22 0.04 260)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            report.type === "post"
                              ? "oklch(0.55 0.18 220 / 0.2)"
                              : "oklch(0.55 0.18 290 / 0.2)",
                          color:
                            report.type === "post"
                              ? "oklch(0.72 0.18 220)"
                              : "oklch(0.72 0.18 290)",
                        }}
                      >
                        {report.type.toUpperCase()}
                      </span>
                      <span
                        className="text-xs flex-1 truncate"
                        style={{ color: "oklch(0.80 0.02 240)" }}
                      >
                        {report.content.slice(0, 80)}
                        {report.content.length > 80 ? "..." : ""}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 text-[10px]"
                      style={{ color: "oklch(0.50 0.04 240)" }}
                    >
                      <span>By: {report.author}</span>
                      <span>Reported by: {report.reportedBy}</span>
                      <span>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        data-ocid={`admin.report.delete_button.${idx + 1}`}
                        className="h-7 text-xs"
                        style={{
                          background: "oklch(0.55 0.18 30)",
                          color: "white",
                        }}
                        onClick={() => {
                          // Delete the post/reply
                          const updatedPosts = posts
                            .map((p) => {
                              if (p.id !== report.postId) return p;
                              if (report.type === "post") return null;
                              return {
                                ...p,
                                replies: p.replies.filter(
                                  (r) => r.id !== report.replyId,
                                ),
                              };
                            })
                            .filter(Boolean) as typeof posts;
                          setPosts(updatedPosts);
                          savePosts(updatedPosts);
                          // Remove the report
                          const updatedReports = reports.filter(
                            (r) => r.id !== report.id,
                          );
                          setReports(updatedReports);
                          saveReports(updatedReports);
                          toast.success("Content deleted");
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`admin.report.cancel_button.${idx + 1}`}
                        className="h-7 text-xs"
                        style={{
                          borderColor: "oklch(0.25 0.05 260)",
                          color: "oklch(0.65 0.04 240)",
                        }}
                        onClick={() => {
                          const updatedReports = reports.filter(
                            (r) => r.id !== report.id,
                          );
                          setReports(updatedReports);
                          saveReports(updatedReports);
                          toast.success("Report dismissed");
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          {/* ── Roles Tab ── */}
          <TabsContent value="roles" className="p-3 space-y-3 m-0">
            <h3
              className="text-xs font-semibold"
              style={{ color: "oklch(0.60 0.04 240)" }}
            >
              USER ROLES
            </h3>
            <p className="text-xs" style={{ color: "oklch(0.50 0.04 240)" }}>
              As head admin, you can promote/demote any user. Lower admins can
              only submit promotion requests.
            </p>
            {/* Pending requests */}
            {roleRequests.filter((r) => !r.id).length > 0 && (
              <div
                style={{
                  background: "oklch(0.14 0.03 260)",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <p
                  className="text-xs font-semibold mb-2"
                  style={{ color: "oklch(0.75 0.14 50)" }}
                >
                  Pending Requests
                </p>
                {roleRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-2 py-1"
                  >
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.80 0.02 240)" }}
                    >
                      Promote <strong>{req.targetUser}</strong> to{" "}
                      {req.targetRole}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-6 text-xs px-2"
                        style={{ background: "oklch(0.52 0.18 145)" }}
                        onClick={() => {
                          promoteUser(
                            req.targetUser,
                            req.targetRole as "moderator" | "admin",
                          );
                          setRoleRequests((prev) =>
                            prev.filter((r) => r.id !== req.id),
                          );
                          localStorage.setItem(
                            "researchhub_role_requests",
                            JSON.stringify(
                              roleRequests.filter((r) => r.id !== req.id),
                            ),
                          );
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
                        onClick={() => {
                          const u = roleRequests.filter((r) => r.id !== req.id);
                          setRoleRequests(u);
                          localStorage.setItem(
                            "researchhub_role_requests",
                            JSON.stringify(u),
                          );
                        }}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* User list */}
            <div className="space-y-2">
              {allUsers.map((username) => {
                const role = roles[username] || "user";
                return (
                  <div
                    key={username}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: "oklch(0.14 0.03 260)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "oklch(0.22 0.05 260)",
                          color: "oklch(0.72 0.08 240)",
                        }}
                      >
                        {username.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className="text-sm"
                        style={{ color: "oklch(0.88 0.02 240)" }}
                      >
                        {username}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background:
                            role === "admin"
                              ? "oklch(0.60 0.18 30 / 0.2)"
                              : role === "moderator"
                                ? "oklch(0.60 0.18 220 / 0.2)"
                                : "oklch(0.22 0.04 260)",
                          color:
                            role === "admin"
                              ? "oklch(0.80 0.18 30)"
                              : role === "moderator"
                                ? "oklch(0.72 0.18 220)"
                                : "oklch(0.60 0.04 240)",
                        }}
                      >
                        {role}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {isHeadAdmin ? (
                        <>
                          {role !== "admin" && (
                            <Button
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              style={{
                                background: "oklch(0.60 0.18 30 / 0.2)",
                                color: "oklch(0.80 0.18 30)",
                              }}
                              onClick={() => promoteUser(username, "admin")}
                            >
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Button>
                          )}
                          {role !== "moderator" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2"
                              onClick={() => promoteUser(username, "moderator")}
                            >
                              Mod
                            </Button>
                          )}
                          {role !== "user" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2"
                              onClick={() => promoteUser(username, "user")}
                            >
                              Demote
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={() => {
                            const req = {
                              id: Date.now(),
                              requester: "Admin",
                              targetUser: username,
                              targetRole: "admin",
                              timestamp: Date.now(),
                            };
                            const updated = [...roleRequests, req];
                            setRoleRequests(updated);
                            localStorage.setItem(
                              "researchhub_role_requests",
                              JSON.stringify(updated),
                            );
                            toast.success(
                              `Promotion request submitted for ${username}`,
                            );
                          }}
                        >
                          Request Promotion
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {allUsers.length === 0 && (
                <p
                  className="text-sm italic text-center py-8"
                  style={{ color: "oklch(0.50 0.04 240)" }}
                >
                  No users yet. Users appear here once they post in Community.
                </p>
              )}
            </div>
          </TabsContent>

          {/* ── Chats Tab ── */}
          <TabsContent value="chats" className="p-3 space-y-3 m-0">
            <div className="flex items-center justify-between">
              <h3
                className="text-xs font-semibold"
                style={{ color: "oklch(0.60 0.04 240)" }}
              >
                LIVE CHAT CONTROLS
              </h3>
            </div>
            <p className="text-xs" style={{ color: "oklch(0.50 0.04 240)" }}>
              Head admin can block directly. Lower admins must run a poll
              (majority Yes required to block).
            </p>
            {Object.entries(liveCounts).map(([room, count]) => (
              <div
                key={room}
                className="p-3 rounded-xl space-y-2"
                style={{
                  background: "oklch(0.14 0.03 260)",
                  border: "1px solid oklch(0.22 0.04 260)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare
                      className="w-3.5 h-3.5"
                      style={{ color: "oklch(0.60 0.10 220)" }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "oklch(0.88 0.02 240)" }}
                    >
                      #{room}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "oklch(0.52 0.18 145 / 0.15)",
                        color: "oklch(0.65 0.18 145)",
                      }}
                    >
                      {count} online
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      style={{
                        background: "oklch(0.60 0.18 30 / 0.2)",
                        color: "oklch(0.80 0.18 30)",
                      }}
                      onClick={() => setBlockChatTarget({ room, username: "" })}
                    >
                      <Ban className="w-3 h-3 mr-1" />
                      Block User
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setPollTarget({ room, username: "" })}
                    >
                      <Vote className="w-3 h-3 mr-1" />
                      Run Poll
                    </Button>
                  </div>
                </div>
                {/* Blocked users in this room */}
                {(chatBlocks[room] || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(chatBlocks[room] || []).map((u) => (
                      <span
                        key={u}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "oklch(0.60 0.18 30 / 0.1)",
                          color: "oklch(0.70 0.10 30)",
                        }}
                      >
                        {u}
                        <button
                          type="button"
                          onClick={() => unblockFromChat(room, u)}
                          className="hover:opacity-70"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Active polls for this room */}
                {polls
                  .filter((p) => p.roomId === room && !p.resolved)
                  .map((poll) => (
                    <div
                      key={poll.id}
                      className="p-2 rounded-lg"
                      style={{
                        background: "oklch(0.18 0.05 260)",
                        border: "1px solid oklch(0.28 0.06 260)",
                      }}
                    >
                      <p
                        className="text-xs mb-1"
                        style={{ color: "oklch(0.80 0.02 240)" }}
                      >
                        {poll.question}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px]"
                          style={{ color: "oklch(0.65 0.18 145)" }}
                        >
                          Yes: {poll.yesVotes}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: "oklch(0.65 0.18 30)" }}
                        >
                          No: {poll.noVotes}
                        </span>
                        <Button
                          size="sm"
                          className="h-5 text-[10px] px-2 ml-auto"
                          style={{
                            background: "oklch(0.60 0.18 220 / 0.2)",
                            color: "oklch(0.72 0.18 220)",
                          }}
                          onClick={() => resolvePoll(poll.id)}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </TabsContent>

          {/* ── Comics Tab ── */}
          <TabsContent value="comics" className="p-3 m-0">
            <div className="flex items-center gap-2 mb-3">
              <BookImage
                className="w-4 h-4"
                style={{ color: "oklch(0.72 0.14 280)" }}
              />
              <h3
                className="text-xs font-semibold"
                style={{ color: "oklch(0.60 0.04 240)" }}
              >
                COMICS LIBRARY
              </h3>
              <span
                className="text-xs"
                style={{ color: "oklch(0.50 0.04 240)" }}
              >
                (Admin only)
              </span>
            </div>
            <ComicsTab />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Block from Chat Dialog */}
      <Dialog
        open={!!blockChatTarget}
        onOpenChange={(v) => !v && setBlockChatTarget(null)}
      >
        <DialogContent
          data-ocid="admin.block_chat.dialog"
          style={{
            background: "oklch(0.13 0.03 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.02 240)" }}>
              Block User from Chat
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs" style={{ color: "oklch(0.60 0.04 240)" }}>
              Room: #{blockChatTarget?.room}
            </p>
            <div>
              <Label style={{ color: "oklch(0.65 0.04 240)" }}>
                Username to block
              </Label>
              <Input
                value={newBlockUser}
                onChange={(e) => setNewBlockUser(e.target.value)}
                placeholder="Enter username"
                style={{ background: "oklch(0.16 0.03 260)", color: "white" }}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockChatTarget(null)}
              data-ocid="admin.block_chat.cancel_button"
            >
              Cancel
            </Button>
            <Button
              style={{ background: "oklch(0.60 0.18 30)" }}
              data-ocid="admin.block_chat.confirm_button"
              onClick={() =>
                blockChatTarget &&
                newBlockUser.trim() &&
                blockFromChat(blockChatTarget.room, newBlockUser.trim())
              }
            >
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Poll Dialog */}
      <Dialog
        open={!!pollTarget}
        onOpenChange={(v) => !v && setPollTarget(null)}
      >
        <DialogContent
          data-ocid="admin.poll.dialog"
          style={{
            background: "oklch(0.13 0.03 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.02 240)" }}>
              Run a Poll
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs" style={{ color: "oklch(0.60 0.04 240)" }}>
              Room: #{pollTarget?.room}
            </p>
            <div>
              <Label style={{ color: "oklch(0.65 0.04 240)" }}>
                Username for poll
              </Label>
              <Input
                value={newPollUser}
                onChange={(e) => setNewPollUser(e.target.value)}
                placeholder="Enter username"
                style={{ background: "oklch(0.16 0.03 260)", color: "white" }}
                className="mt-1"
              />
            </div>
            <p className="text-xs" style={{ color: "oklch(0.55 0.04 240)" }}>
              A poll will be created: "Should [username] be blocked from
              #[room]?"
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPollTarget(null)}
              data-ocid="admin.poll.cancel_button"
            >
              Cancel
            </Button>
            <Button
              style={{ background: "oklch(0.60 0.18 220)" }}
              data-ocid="admin.poll.confirm_button"
              onClick={() =>
                pollTarget &&
                newPollUser.trim() &&
                createPoll(pollTarget.room, newPollUser.trim())
              }
            >
              Create Poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
