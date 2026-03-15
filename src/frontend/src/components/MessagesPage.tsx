import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  Image,
  MessageSquare,
  Send,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface FriendRequest {
  from: string;
  to: string;
  timestamp: number;
}

interface ReplyRef {
  username: string;
  text: string;
}

interface DmMessage {
  id: number;
  from: string;
  to: string;
  text: string;
  timestamp: number;
  imageUrl?: string;
  replyTo?: ReplyRef;
}

function getMyUsername(): string {
  return localStorage.getItem("chat_username") || "";
}

function getFriends(username: string): string[] {
  try {
    const raw = localStorage.getItem(`friends_${username}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getIncomingRequests(username: string): FriendRequest[] {
  try {
    const raw = localStorage.getItem("friend_requests");
    const all: FriendRequest[] = raw ? JSON.parse(raw) : [];
    return all.filter((r) => r.to === username);
  } catch {
    return [];
  }
}

function getDmMessages(user1: string, user2: string): DmMessage[] {
  try {
    const key = `dm_${[user1, user2].sort().join("_")}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDmMessage(
  from: string,
  to: string,
  text: string,
  imageUrl?: string,
  replyTo?: ReplyRef,
) {
  const key = `dm_${[from, to].sort().join("_")}`;
  const existing = getDmMessages(from, to);
  const newMsg: DmMessage = {
    id: Date.now(),
    from,
    to,
    text,
    timestamp: Date.now(),
    imageUrl,
    replyTo,
  };
  localStorage.setItem(key, JSON.stringify([...existing, newMsg]));
  return newMsg;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── GIF Picker ──────────────────────────────────────────────────────────────

interface GifResult {
  id: string;
  title: string;
  url: string;
  preview: string;
}

function GifPicker({
  onSelect,
  onClose,
}: { onSelect: (url: string) => void; onClose: () => void }) {
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
      className="absolute bottom-full mb-2 left-0 w-72 rounded-xl shadow-2xl z-50 overflow-hidden"
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
          className="text-muted-foreground hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {loading && (
        <div
          className="p-4 text-center text-xs"
          style={{ color: "oklch(0.55 0.04 240)" }}
        >
          Loading…
        </div>
      )}
      {!loading && results.length === 0 && (
        <div
          className="p-4 text-center text-xs"
          style={{ color: "oklch(0.45 0.04 240)" }}
        >
          Type and press Go to search GIFs
        </div>
      )}
      <div className="grid grid-cols-3 gap-1 p-2 max-h-48 overflow-y-auto">
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
              className="w-full h-20 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Profile Modal ────────────────────────────────────────────────────────────

function ProfileModal({
  username,
  onClose,
  onMessage,
}: {
  username: string;
  onClose: () => void;
  onMessage: () => void;
}) {
  const joinDate = new Date(
    Date.now() - 86400000 * Math.floor(Math.random() * 365 + 30),
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        data-ocid="messages.profile.dialog"
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
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              background: "oklch(0.52 0.18 220 / 0.25)",
              color: "oklch(0.72 0.18 220)",
            }}
          >
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-center">
            <h3
              className="font-bold text-lg"
              style={{ color: "oklch(0.92 0.02 240)" }}
            >
              {username}
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.50 0.04 240)" }}
            >
              Joined{" "}
              {joinDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div
            className="w-full rounded-lg p-3 text-sm"
            style={{
              background: "oklch(0.10 0.03 260)",
              border: "1px solid oklch(0.20 0.04 260)",
              color: "oklch(0.65 0.04 240)",
            }}
          >
            Research enthusiast and knowledge explorer.
          </div>
          <Button
            data-ocid="messages.profile.button"
            className="w-full gap-2"
            style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
            onClick={() => {
              onMessage();
              onClose();
            }}
          >
            <MessageSquare className="w-4 h-4" /> Send Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isOwn,
  onReply,
  onProfileClick,
  setLightboxSrc,
}: {
  msg: DmMessage;
  isOwn: boolean;
  onReply: (msg: DmMessage) => void;
  onProfileClick: (username: string) => void;
  setLightboxSrc: (src: string | null) => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={`flex flex-col ${isOwn ? "items-end" : "items-start"} group`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Sender name for non-own messages */}
      {!isOwn && (
        <button
          type="button"
          onClick={() => onProfileClick(msg.from)}
          className="text-xs mb-0.5 px-1 hover:underline transition-all"
          style={{ color: "oklch(0.65 0.12 220)" }}
        >
          {msg.from}
        </button>
      )}

      <div
        className="flex items-end gap-1.5"
        style={{ flexDirection: isOwn ? "row-reverse" : "row" }}
      >
        {/* Avatar */}
        {!isOwn && (
          <button
            type="button"
            onClick={() => onProfileClick(msg.from)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mb-1 hover:opacity-80 transition-opacity"
            style={{
              background: "oklch(0.52 0.18 220 / 0.2)",
              color: "oklch(0.72 0.18 220)",
            }}
          >
            {msg.from.slice(0, 2).toUpperCase()}
          </button>
        )}

        {/* Bubble */}
        <div className="max-w-[75%] flex flex-col gap-1">
          {/* Reply preview */}
          {msg.replyTo && (
            <div
              className="px-2.5 py-1.5 rounded-lg text-xs"
              style={{
                background: isOwn
                  ? "oklch(0.40 0.15 220 / 0.5)"
                  : "oklch(0.16 0.04 260)",
                borderLeft: "3px solid oklch(0.65 0.18 220)",
                color: "oklch(0.68 0.06 240)",
              }}
            >
              <span
                className="font-semibold"
                style={{ color: "oklch(0.75 0.14 220)" }}
              >
                @{msg.replyTo.username}
              </span>
              <p className="truncate mt-0.5">{msg.replyTo.text}</p>
            </div>
          )}

          {/* Main bubble */}
          {(msg.text || !msg.imageUrl) && (
            <div
              className="px-3 py-2 text-sm"
              style={{
                background: isOwn
                  ? "oklch(0.52 0.18 220)"
                  : "oklch(0.20 0.04 260)",
                color: isOwn ? "white" : "oklch(0.88 0.03 240)",
                borderRadius: isOwn
                  ? "18px 18px 4px 18px"
                  : "18px 18px 18px 4px",
              }}
            >
              {msg.text}
            </div>
          )}

          {/* Image/GIF */}
          {msg.imageUrl && (
            <button
              type="button"
              onClick={() => setLightboxSrc(msg.imageUrl!)}
              className="rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
            >
              <img
                src={msg.imageUrl}
                alt="shared"
                className="max-w-[200px] max-h-[200px] object-cover rounded-xl"
              />
            </button>
          )}
        </div>

        {/* Reply button on hover */}
        {hover && (
          <button
            type="button"
            onClick={() => onReply(msg)}
            className="text-xs px-1.5 py-0.5 rounded mb-1 opacity-70 hover:opacity-100 transition-all"
            style={{
              background: "oklch(0.18 0.04 260)",
              color: "oklch(0.65 0.06 240)",
              border: "1px solid oklch(0.26 0.05 260)",
            }}
          >
            ↩
          </button>
        )}
      </div>

      <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
        {formatTime(msg.timestamp)}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MessagesPage({
  initialFriend,
}: {
  initialFriend?: string;
}) {
  const myUsername = getMyUsername();
  const [friends, setFriends] = useState<string[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(
    initialFriend || null,
  );
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyRef | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [profileUser, setProfileUser] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!myUsername) return;
    setFriends(getFriends(myUsername));
    setRequests(getIncomingRequests(myUsername));
  }, [myUsername]);

  useEffect(() => {
    if (selectedFriend && myUsername) {
      setDmMessages(getDmMessages(myUsername, selectedFriend));
    }
  }, [selectedFriend, myUsername]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  const handleAcceptRequest = (req: FriendRequest) => {
    const myFriends = getFriends(myUsername);
    if (!myFriends.includes(req.from)) {
      localStorage.setItem(
        `friends_${myUsername}`,
        JSON.stringify([...myFriends, req.from]),
      );
    }
    const theirFriends = getFriends(req.from);
    if (!theirFriends.includes(myUsername)) {
      localStorage.setItem(
        `friends_${req.from}`,
        JSON.stringify([...theirFriends, myUsername]),
      );
    }
    const allRequests: FriendRequest[] = (() => {
      try {
        return JSON.parse(localStorage.getItem("friend_requests") || "[]");
      } catch {
        return [];
      }
    })();
    const updated = allRequests.filter(
      (r) => !(r.from === req.from && r.to === req.to),
    );
    localStorage.setItem("friend_requests", JSON.stringify(updated));
    setRequests((prev) =>
      prev.filter((r) => !(r.from === req.from && r.to === req.to)),
    );
    setFriends(getFriends(myUsername));
    toast.success(`You and ${req.from} are now friends!`);
  };

  const handleDeclineRequest = (req: FriendRequest) => {
    const allRequests: FriendRequest[] = (() => {
      try {
        return JSON.parse(localStorage.getItem("friend_requests") || "[]");
      } catch {
        return [];
      }
    })();
    const updated = allRequests.filter(
      (r) => !(r.from === req.from && r.to === req.to),
    );
    localStorage.setItem("friend_requests", JSON.stringify(updated));
    setRequests((prev) =>
      prev.filter((r) => !(r.from === req.from && r.to === req.to)),
    );
    toast.success("Request declined");
  };

  const sendMessage = (text: string, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl) || !selectedFriend || !myUsername) return;
    const msg = saveDmMessage(
      myUsername,
      selectedFriend,
      text.trim(),
      imageUrl,
      replyTo ?? undefined,
    );
    setDmMessages((prev) => [...prev, msg]);
    setNewMessage("");
    setReplyTo(null);
  };

  const handleSend = () => sendMessage(newMessage);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      sendMessage("", dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (!myUsername) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "oklch(0.52 0.18 220 / 0.15)" }}
        >
          <MessageSquare
            className="w-7 h-7"
            style={{ color: "oklch(0.65 0.18 220)" }}
          />
        </div>
        <h2
          className="font-display font-bold text-xl mb-2"
          style={{ color: "oklch(0.92 0.01 240)" }}
        >
          Private Messages
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          You need to set a username in Community first before you can use
          private messaging.
        </p>
        <p className="text-xs text-muted-foreground">
          Go to <strong>Community</strong> tab and enter a display name to get
          started.
        </p>
      </div>
    );
  }

  return (
    <div data-ocid="messages.section" className="flex flex-col h-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Profile modal */}
      {profileUser && (
        <ProfileModal
          username={profileUser}
          onClose={() => setProfileUser(null)}
          onMessage={() => {
            setSelectedFriend(profileUser);
            setProfileUser(null);
          }}
        />
      )}

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

      <div className="flex items-center gap-3 mb-3 px-4 pt-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.52 0.18 200 / 0.15)" }}
        >
          <MessageSquare
            className="w-5 h-5"
            style={{ color: "oklch(0.65 0.18 200)" }}
          />
        </div>
        <div>
          <h1
            className="font-display font-bold text-xl"
            style={{ color: "oklch(0.92 0.01 240)" }}
          >
            Messages
          </h1>
          <p className="text-xs text-muted-foreground">
            Logged in as{" "}
            <span style={{ color: "oklch(0.72 0.12 220)" }}>{myUsername}</span>
          </p>
        </div>
      </div>

      {/* Friend Requests */}
      {requests.length > 0 && (
        <div
          className="mb-3 mx-4 p-3 rounded-xl"
          style={{
            background: "oklch(0.52 0.18 55 / 0.08)",
            border: "1px solid oklch(0.52 0.18 55 / 0.25)",
          }}
        >
          <p
            className="text-xs font-semibold mb-2 flex items-center gap-1.5"
            style={{ color: "oklch(0.72 0.18 55)" }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Friend Requests ({requests.length})
          </p>
          <div className="flex flex-col gap-2">
            {requests.map((req, i) => (
              <div
                key={`${req.from}-${req.timestamp}`}
                data-ocid={`messages.item.${i + 1}`}
                className="flex items-center justify-between gap-3"
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.88 0.03 240)" }}
                >
                  {req.from}
                </span>
                <div className="flex gap-1.5">
                  <Button
                    data-ocid={`messages.confirm_button.${i + 1}`}
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    style={{ background: "oklch(0.52 0.18 145)" }}
                    onClick={() => handleAcceptRequest(req)}
                  >
                    <Check className="w-3 h-3" />
                    Accept
                  </Button>
                  <Button
                    data-ocid={`messages.cancel_button.${i + 1}`}
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs"
                    style={{ color: "oklch(0.65 0.22 25)" }}
                    onClick={() => handleDeclineRequest(req)}
                  >
                    <X className="w-3 h-3" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-panel layout */}
      <div
        className="flex rounded-xl overflow-hidden flex-1 min-h-0"
        style={{
          border: "1px solid oklch(0.22 0.04 260)",
        }}
      >
        {/* Friends List */}
        <aside
          className={`${selectedFriend ? "hidden md:flex" : "flex"} w-full md:w-56 flex-shrink-0 flex-col`}
          style={{
            background: "oklch(0.11 0.03 260)",
            borderRight: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <div
            className="p-3 border-b"
            style={{ borderColor: "oklch(0.22 0.04 260)" }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: "oklch(0.55 0.06 240)" }}
            >
              FRIENDS ({friends.length})
            </p>
          </div>
          <ScrollArea className="flex-1">
            {friends.length === 0 ? (
              <div data-ocid="messages.empty_state" className="p-4 text-center">
                <UserCheck
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "oklch(0.35 0.04 260)" }}
                />
                <p className="text-xs text-muted-foreground">
                  No friends yet.
                  <br />
                  Visit profiles to add friends.
                </p>
              </div>
            ) : (
              <div className="p-2 flex flex-col gap-1">
                {friends.map((friend, i) => (
                  <button
                    key={friend}
                    type="button"
                    data-ocid={`messages.item.${i + 1}`}
                    onClick={() => setSelectedFriend(friend)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors"
                    style={{
                      background:
                        selectedFriend === friend
                          ? "oklch(0.52 0.18 220 / 0.15)"
                          : "transparent",
                      color:
                        selectedFriend === friend
                          ? "oklch(0.72 0.18 220)"
                          : "oklch(0.75 0.04 240)",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: "oklch(0.52 0.18 220 / 0.2)",
                        color: "oklch(0.72 0.18 220)",
                      }}
                    >
                      {friend.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {friend}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </aside>

        {/* DM Chat Panel */}
        <div
          className={`${!selectedFriend ? "hidden md:flex" : "flex"} flex-1 flex-col`}
          style={{ background: "oklch(0.13 0.03 260)" }}
        >
          {!selectedFriend ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <MessageSquare
                className="w-12 h-12 mb-3"
                style={{ color: "oklch(0.30 0.04 260)" }}
              />
              <p
                className="font-display font-semibold text-lg mb-1"
                style={{ color: "oklch(0.50 0.04 260)" }}
              >
                Select a conversation
              </p>
              <p className="text-xs text-muted-foreground">
                Choose a friend to start messaging
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: "oklch(0.22 0.04 260)" }}
              >
                <button
                  type="button"
                  className="md:hidden mr-1 p-1 rounded hover:bg-white/5"
                  style={{ color: "oklch(0.65 0.10 220)" }}
                  onClick={() => setSelectedFriend(null)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <title>Back</title>
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileUser(selectedFriend)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
                  style={{
                    background: "oklch(0.52 0.18 220 / 0.2)",
                    color: "oklch(0.72 0.18 220)",
                  }}
                >
                  {selectedFriend.slice(0, 2).toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileUser(selectedFriend)}
                  className="font-semibold text-sm hover:underline"
                  style={{ color: "oklch(0.88 0.03 240)" }}
                >
                  {selectedFriend}
                </button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                {dmMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Say hi!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {dmMessages.map((msg) => {
                      const isOwn = msg.from === myUsername;
                      return (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          isOwn={isOwn}
                          onReply={(m) =>
                            setReplyTo({
                              username: m.from,
                              text: m.imageUrl ? "[Image]" : m.text,
                            })
                          }
                          onProfileClick={setProfileUser}
                          setLightboxSrc={setLightboxSrc}
                        />
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input area */}
              <div
                className="border-t"
                style={{ borderColor: "oklch(0.22 0.04 260)" }}
              >
                {/* Reply context bar */}
                {replyTo && (
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-1.5"
                    style={{
                      background: "oklch(0.11 0.03 260)",
                      borderBottom: "1px solid oklch(0.20 0.04 260)",
                    }}
                  >
                    <div
                      className="text-xs"
                      style={{ color: "oklch(0.65 0.06 240)" }}
                    >
                      <span
                        className="font-semibold"
                        style={{ color: "oklch(0.72 0.14 220)" }}
                      >
                        ↩ @{replyTo.username}
                      </span>{" "}
                      <span className="truncate">
                        {replyTo.text.slice(0, 60)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      data-ocid="messages.cancel_button"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: "oklch(0.55 0.04 240)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 px-3 py-2 relative">
                  {/* GIF picker panel */}
                  {showGifPicker && (
                    <GifPicker
                      onSelect={(url) => sendMessage("", url)}
                      onClose={() => setShowGifPicker(false)}
                    />
                  )}

                  {/* Photo upload */}
                  <button
                    type="button"
                    data-ocid="messages.upload_button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
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
                    data-ocid="messages.gif.button"
                    onClick={() => setShowGifPicker((v) => !v)}
                    className="flex-shrink-0 h-8 px-2 rounded-lg flex items-center justify-center text-xs font-bold transition-colors hover:opacity-80"
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

                  <Input
                    data-ocid="messages.input"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedFriend}...`}
                    className="flex-1 h-9 text-sm"
                    style={{ color: "white" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                  />
                  <Button
                    data-ocid="messages.submit_button"
                    size="sm"
                    className="h-9 w-9 p-0 flex-shrink-0"
                    style={{ background: "oklch(0.52 0.18 220)" }}
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
