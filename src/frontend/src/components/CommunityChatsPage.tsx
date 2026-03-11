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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Hash,
  Link,
  Loader2,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatRoom, Message } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { MemesTab } from "./MemesTab";

// Local message type for when backend is unavailable
interface LocalMessage {
  id: number;
  text: string;
  image: string | null;
  gif: string | null;
  author: string;
  createdAt: number;
}

function localToMessage(lm: LocalMessage): Message {
  return {
    id: BigInt(lm.id),
    text: lm.text,
    image: lm.image ?? undefined,
    gif: lm.gif ?? undefined,
    author: { toString: () => lm.author } as any,
    createdAt: BigInt(lm.createdAt) * BigInt(1_000_000),
    room: BigInt(0),
  };
}

const DEFAULT_ROOMS = [
  { name: "Science", topic: "science" },
  { name: "History", topic: "history" },
  { name: "Technology", topic: "technology" },
  { name: "Art", topic: "art" },
  { name: "Nature", topic: "nature" },
  { name: "Space", topic: "space" },
];

const ROOM_TOPIC_COLORS: Record<string, string> = {
  science: "oklch(0.65 0.18 200)",
  history: "oklch(0.65 0.14 55)",
  technology: "oklch(0.52 0.18 220)",
  art: "oklch(0.65 0.18 320)",
  nature: "oklch(0.65 0.18 140)",
  space: "oklch(0.72 0.18 280)",
};

function getRoomColor(topic: string): string {
  return ROOM_TOPIC_COLORS[topic.toLowerCase()] || "oklch(0.65 0.10 260)";
}

function formatTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return d.toLocaleDateString();
}

// Friends helpers
function getFriends(): string[] {
  try {
    return JSON.parse(localStorage.getItem("community_friends") || "[]");
  } catch {
    return [];
  }
}

function saveFriends(friends: string[]): void {
  localStorage.setItem("community_friends", JSON.stringify(friends));
}

function getPendingRequests(): string[] {
  try {
    return JSON.parse(
      localStorage.getItem("community_friend_requests") || "[]",
    );
  } catch {
    return [];
  }
}

function savePendingRequests(requests: string[]): void {
  localStorage.setItem("community_friend_requests", JSON.stringify(requests));
}

// Get all known users from localStorage
function getKnownUsers(): string[] {
  try {
    return JSON.parse(localStorage.getItem("community_known_users") || "[]");
  } catch {
    return [];
  }
}

function registerUser(username: string): void {
  const known = getKnownUsers();
  if (!known.includes(username)) {
    known.push(username);
    localStorage.setItem("community_known_users", JSON.stringify(known));
  }
}

function MessageBubble({
  message,
  index,
  isOwn,
  onDelete,
  isAdmin: isAdm,
}: {
  message: Message;
  index: number;
  isOwn: boolean;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const author = message.author.toString();
  const initials = author.slice(0, 2).toUpperCase();
  return (
    <div
      data-ocid={`chat.item.${index}`}
      className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
    >
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{
          background: isOwn
            ? "oklch(0.52 0.18 220 / 0.3)"
            : "oklch(0.30 0.08 260)",
          color: "oklch(0.90 0.04 240)",
        }}
      >
        {initials}
      </div>
      <div
        className={`flex flex-col gap-1 max-w-[75%] ${
          isOwn ? "items-end" : "items-start"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium"
            style={{
              color: isOwn ? "oklch(0.65 0.15 220)" : "oklch(0.70 0.08 240)",
            }}
          >
            {author.length > 20
              ? `${author.slice(0, 8)}...${author.slice(-4)}`
              : author}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div
          className="px-3 py-2 rounded-2xl text-sm"
          style={{
            background: isOwn ? "oklch(0.38 0.12 220)" : "oklch(0.20 0.04 260)",
            color: "oklch(0.93 0.02 240)",
          }}
        >
          {message.text}
        </div>
        {message.gif && (
          <img
            src={message.gif}
            alt="GIF"
            className="max-w-[200px] rounded-lg"
          />
        )}
        {message.image && (
          <img
            src={message.image}
            alt="Attachment"
            className="max-w-[200px] rounded-lg"
          />
        )}
        {(isOwn || isAdm) && (
          <button
            type="button"
            data-ocid={`chat.delete_button.${index}`}
            onClick={onDelete}
            className="text-muted-foreground/40 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function CommunityChatsPage() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const isLoggedIn = !!identity;

  const [localUsername, setLocalUsername] = useState<string>(
    () => localStorage.getItem("chat_username") || "",
  );
  const [pendingUsername, setPendingUsername] = useState("");
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageImage, setMessageImage] = useState("");
  const [messageGif, setMessageGif] = useState("");
  const [sending, setSending] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomTopic, setNewRoomTopic] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // User search & friends
  const [activePanel, setActivePanel] = useState<"chat" | "friends" | "search">(
    "chat",
  );
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [friends, setFriends] = useState<string[]>(() => getFriends());
  const [pendingRequests, setPendingRequests] = useState<string[]>(() =>
    getPendingRequests(),
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const myPrincipal = identity?.getPrincipal().toString();
  const myUsername = myPrincipal || localUsername;

  // Register user when they set a username
  useEffect(() => {
    if (localUsername) registerUser(localUsername);
  }, [localUsername]);

  const handleUserSearch = (q: string) => {
    setUserSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const known = getKnownUsers();
    const results = known.filter(
      (u) => u.toLowerCase().includes(q.toLowerCase()) && u !== myUsername,
    );
    setSearchResults(results);
  };

  const handleSendFriendRequest = (username: string) => {
    if (friends.includes(username)) {
      toast.error("Already friends!");
      return;
    }
    if (pendingRequests.includes(username)) {
      toast.error("Request already sent");
      return;
    }
    const updated = [...pendingRequests, username];
    setPendingRequests(updated);
    savePendingRequests(updated);
    toast.success(`Friend request sent to ${username}!`);
  };

  const handleAcceptFriend = (username: string) => {
    const updatedFriends = [...friends, username];
    const updatedRequests = pendingRequests.filter((r) => r !== username);
    setFriends(updatedFriends);
    setPendingRequests(updatedRequests);
    saveFriends(updatedFriends);
    savePendingRequests(updatedRequests);
    toast.success(`${username} is now your friend!`);
  };

  const handleRemoveFriend = (username: string) => {
    const updated = friends.filter((f) => f !== username);
    setFriends(updated);
    saveFriends(updated);
    toast.success("Friend removed");
  };

  const loadLocalMessages = useCallback((room: ChatRoom) => {
    const key = `chat_messages_${room.id}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: LocalMessage[] = JSON.parse(stored);
        setMessages(parsed.map(localToMessage));
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  }, []);

  const loadMessages = useCallback(
    async (room: ChatRoom) => {
      if (!actor) {
        loadLocalMessages(room);
        return;
      }
      setLoadingMessages(true);
      try {
        const msgs = await actor.getMessages(room.id, BigInt(0), BigInt(50));
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch {
        loadLocalMessages(room);
      } finally {
        setLoadingMessages(false);
      }
    },
    [actor, loadLocalMessages],
  );

  const loadRooms = useCallback(async () => {
    if (!actor || isFetching) return;
    setLoadingRooms(true);
    try {
      const fetched = await actor.getAllRooms();
      if (fetched.length === 0 && isLoggedIn) {
        for (const r of DEFAULT_ROOMS) {
          try {
            await actor.addRoom(r.name, r.topic);
          } catch {
            /* ignore */
          }
        }
        const seeded = await actor.getAllRooms();
        setRooms(seeded);
        if (seeded.length > 0) setSelectedRoom(seeded[0]);
      } else {
        setRooms(fetched);
        if (fetched.length > 0) setSelectedRoom((prev) => prev ?? fetched[0]);
      }
    } catch {
      const fallback: ChatRoom[] = DEFAULT_ROOMS.map((r, i) => ({
        id: BigInt(i + 1),
        name: r.name,
        topic: r.topic,
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
      }));
      setRooms(fallback);
      setSelectedRoom(fallback[0]);
    } finally {
      setLoadingRooms(false);
    }
  }, [actor, isFetching, isLoggedIn]);

  // Load rooms when actor available, or fallback to defaults
  useEffect(() => {
    if (actor && !isFetching) {
      loadRooms();
    } else if (!actor && !isFetching) {
      const fallback: ChatRoom[] = DEFAULT_ROOMS.map((r, i) => ({
        id: BigInt(i + 1),
        name: r.name,
        topic: r.topic,
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
      }));
      setRooms(fallback);
      setSelectedRoom((prev) => prev ?? fallback[0]);
      setLoadingRooms(false);
    }
  }, [actor, isFetching, loadRooms]);

  // Load messages when room changes
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom);
    }
  }, [selectedRoom, loadMessages]);

  const handleSend = async () => {
    if (!selectedRoom || (!messageText.trim() && !messageImage && !messageGif))
      return;
    setSending(true);
    try {
      if (actor && isLoggedIn) {
        await actor.addMessage(
          selectedRoom.id,
          messageText.trim(),
          messageImage || null,
          messageGif || null,
        );
        setMessageText("");
        setMessageImage("");
        setMessageGif("");
        setShowImageInput(false);
        setShowGifPicker(false);
        await loadMessages(selectedRoom);
      } else {
        // Local mode: store in localStorage
        const username = localUsername || "Anonymous";
        const newMsg: LocalMessage = {
          id: Date.now(),
          text: messageText.trim(),
          image: messageImage || null,
          gif: messageGif || null,
          author: username,
          createdAt: Date.now(),
        };
        const key = `chat_messages_${selectedRoom.id}`;
        const existing: LocalMessage[] = (() => {
          try {
            return JSON.parse(localStorage.getItem(key) || "[]");
          } catch {
            return [];
          }
        })();
        const updated = [...existing, newMsg];
        localStorage.setItem(key, JSON.stringify(updated));
        setMessages(updated.map(localToMessage));
        setMessageText("");
        setMessageImage("");
        setMessageGif("");
        setShowImageInput(false);
        setShowGifPicker(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: bigint) => {
    if (!actor) {
      if (!selectedRoom) return;
      const key = `chat_messages_${selectedRoom.id}`;
      const existing: LocalMessage[] = (() => {
        try {
          return JSON.parse(localStorage.getItem(key) || "[]");
        } catch {
          return [];
        }
      })();
      const updated = existing.filter((m) => BigInt(m.id) !== msgId);
      localStorage.setItem(key, JSON.stringify(updated));
      setMessages(updated.map(localToMessage));
      return;
    }
    try {
      await actor.deleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success("Message deleted");
    } catch {
      toast.error("Could not delete message");
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreatingRoom(true);
    try {
      if (actor) {
        await actor.addRoom(
          newRoomName.trim(),
          newRoomTopic.trim() || "general",
        );
        await loadRooms();
      } else {
        const newRoom: ChatRoom = {
          id: BigInt(Date.now()),
          name: newRoomName.trim(),
          topic: newRoomTopic.trim() || "general",
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        };
        setRooms((prev) => [...prev, newRoom]);
      }
      setShowCreateRoom(false);
      setNewRoomName("");
      setNewRoomTopic("");
      toast.success(`Room "${newRoomName}" created!`);
    } catch {
      toast.error("Failed to create room");
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setSidebarOpen(false);
    setActivePanel("chat");
  };

  // Determine if user can send messages
  const canSend = isLoggedIn || !!localUsername;

  return (
    <div
      data-ocid="chat.section"
      className="flex rounded-2xl"
      style={{
        height: "calc(100dvh - 160px)",
        minHeight: "400px",
        background: "oklch(0.13 0.03 260)",
        border: "1px solid oklch(0.25 0.05 260)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:relative z-30 inset-y-0 left-0 w-60 flex flex-col transition-transform duration-200`}
        style={{
          background: "oklch(0.11 0.03 260)",
          borderRight: "1px solid oklch(0.22 0.05 260)",
        }}
      >
        <div
          className="p-3 border-b"
          style={{ borderColor: "oklch(0.22 0.05 260)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3
              className="font-display font-bold text-sm"
              style={{ color: "oklch(0.90 0.03 240)" }}
            >
              Community
            </h3>
            <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="chat.open_modal_button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent
                data-ocid="chat.dialog"
                style={{
                  background: "oklch(0.14 0.04 260)",
                  border: "1px solid oklch(0.28 0.06 260)",
                }}
              >
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      data-ocid="chat.input"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="e.g. Philosophy"
                      maxLength={40}
                      style={{ color: "white" }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="room-topic">Topic (optional)</Label>
                    <Input
                      id="room-topic"
                      value={newRoomTopic}
                      onChange={(e) => setNewRoomTopic(e.target.value)}
                      placeholder="e.g. philosophy"
                      maxLength={30}
                      style={{ color: "white" }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    data-ocid="chat.cancel_button"
                    variant="outline"
                    onClick={() => setShowCreateRoom(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    data-ocid="chat.confirm_button"
                    style={{ background: "oklch(0.52 0.18 220)" }}
                    onClick={handleCreateRoom}
                    disabled={creatingRoom || !newRoomName.trim()}
                  >
                    {creatingRoom ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create Room"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Sidebar tabs */}
          <div className="flex gap-1">
            <button
              type="button"
              data-ocid="chat.tab"
              onClick={() => setActivePanel("chat")}
              className="flex-1 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background:
                  activePanel === "chat"
                    ? "oklch(0.52 0.18 220 / 0.2)"
                    : "transparent",
                color:
                  activePanel === "chat"
                    ? "oklch(0.72 0.15 220)"
                    : "oklch(0.55 0.05 240)",
              }}
            >
              Chats
            </button>
            <button
              type="button"
              data-ocid="chat.tab"
              onClick={() => setActivePanel("friends")}
              className="flex-1 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background:
                  activePanel === "friends"
                    ? "oklch(0.52 0.18 220 / 0.2)"
                    : "transparent",
                color:
                  activePanel === "friends"
                    ? "oklch(0.72 0.15 220)"
                    : "oklch(0.55 0.05 240)",
              }}
            >
              Friends
            </button>
            <button
              type="button"
              data-ocid="chat.tab"
              onClick={() => setActivePanel("search")}
              className="flex-1 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background:
                  activePanel === "search"
                    ? "oklch(0.52 0.18 220 / 0.2)"
                    : "transparent",
                color:
                  activePanel === "search"
                    ? "oklch(0.72 0.15 220)"
                    : "oklch(0.55 0.05 240)",
              }}
            >
              Find
            </button>
          </div>
        </div>

        {/* Panel: Rooms */}
        {activePanel === "chat" && (
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loadingRooms ? (
                <div className="space-y-2 p-2">
                  {["r1", "r2", "r3"].map((k) => (
                    <Skeleton key={k} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.id.toString()}
                    type="button"
                    data-ocid="chat.button"
                    onClick={() => handleSelectRoom(room)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors"
                    style={{
                      background:
                        selectedRoom?.id === room.id
                          ? "oklch(0.52 0.18 220 / 0.15)"
                          : "transparent",
                      color: "oklch(0.88 0.03 240)",
                    }}
                  >
                    <Hash
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: getRoomColor(room.topic) }}
                    />
                    <span className="text-sm font-medium truncate">
                      {room.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {/* Panel: Friends */}
        {activePanel === "friends" && (
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                {friends.length === 0
                  ? "No friends yet. Use Find to search for users."
                  : `${friends.length} friend${friends.length !== 1 ? "s" : ""}`}
              </p>
              {pendingRequests.length > 0 && (
                <div className="mb-3">
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: "oklch(0.72 0.12 220)" }}
                  >
                    Pending Requests
                  </p>
                  {pendingRequests.map((username, pi) => (
                    <div
                      key={username}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                      style={{ background: "oklch(0.18 0.04 260)" }}
                    >
                      <span
                        className="text-xs"
                        style={{ color: "oklch(0.85 0.03 240)" }}
                      >
                        {username}
                      </span>
                      <button
                        type="button"
                        data-ocid={`chat.confirm_button.${pi + 1}`}
                        onClick={() => handleAcceptFriend(username)}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "oklch(0.52 0.18 220 / 0.2)",
                          color: "oklch(0.72 0.15 220)",
                        }}
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {friends.map((username, fi) => (
                <div
                  key={username}
                  data-ocid={`chat.item.${fi + 1}`}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                  style={{ background: "oklch(0.18 0.04 260)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: "oklch(0.52 0.18 220 / 0.3)",
                        color: "oklch(0.90 0.04 240)",
                      }}
                    >
                      {username.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: "oklch(0.85 0.03 240)" }}
                    >
                      {username}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-ocid={`chat.delete_button.${fi + 1}`}
                    onClick={() => handleRemoveFriend(username)}
                    className="text-muted-foreground/40 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Panel: User Search */}
        {activePanel === "search" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-3">
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: "oklch(0.55 0.06 240)" }}
                />
                <Input
                  data-ocid="chat.search_input"
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="pl-8 h-8 text-xs"
                  style={{ color: "white" }}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-3 space-y-1">
                {userSearchQuery && searchResults.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No users found
                  </p>
                )}
                {searchResults.map((username, si) => (
                  <div
                    key={username}
                    className="flex items-center justify-between py-2 px-2 rounded-lg"
                    style={{ background: "oklch(0.18 0.04 260)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: "oklch(0.30 0.08 260)",
                          color: "oklch(0.90 0.04 240)",
                        }}
                      >
                        {username.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: "oklch(0.85 0.03 240)" }}
                      >
                        {username}
                      </span>
                    </div>
                    {friends.includes(username) ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5"
                      >
                        Friends
                      </Badge>
                    ) : (
                      <button
                        type="button"
                        data-ocid={`chat.primary_button.${si + 1}`}
                        onClick={() => handleSendFriendRequest(username)}
                        className="p-1 rounded transition-colors"
                        style={{ color: "oklch(0.65 0.15 220)" }}
                        title="Send friend request"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {!userSearchQuery && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Type a username to search
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: "oklch(0.08 0.03 260 / 0.6)" }}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Enter" && setSidebarOpen(false)}
          role="button"
          tabIndex={0}
        />
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat header */}
        <div
          className="px-4 py-3 border-b flex items-center gap-3 flex-shrink-0"
          style={{ borderColor: "oklch(0.22 0.05 260)" }}
        >
          <button
            type="button"
            data-ocid="chat.toggle"
            className="md:hidden p-1.5 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Hash className="w-4 h-4" />
          </button>
          {selectedRoom ? (
            <>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: getRoomColor(selectedRoom.topic).replace(
                    ")",
                    " / 0.15)",
                  ),
                }}
              >
                <Hash
                  className="w-4 h-4"
                  style={{ color: getRoomColor(selectedRoom.topic) }}
                />
              </div>
              <div>
                <h2
                  className="font-display font-bold text-sm"
                  style={{ color: "oklch(0.92 0.02 240)" }}
                >
                  {selectedRoom.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedRoom.topic}
                </p>
              </div>
              <Badge
                variant="outline"
                className="ml-auto text-xs"
                style={{
                  borderColor: getRoomColor(selectedRoom.topic).replace(
                    ")",
                    " / 0.4)",
                  ),
                  color: getRoomColor(selectedRoom.topic),
                }}
              >
                {selectedRoom.topic}
              </Badge>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a room</p>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-4">
            {loadingMessages ? (
              <div data-ocid="chat.loading_state" className="space-y-3">
                {["ma", "mb", "mc", "md", "me"].map((k) => (
                  <div key={k} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div
                data-ocid="chat.empty_state"
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="text-4xl mb-3">💬</div>
                <p className="text-muted-foreground text-sm">
                  No messages yet. Be the first to post!
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id.toString()}
                  message={msg}
                  index={idx + 1}
                  isOwn={
                    msg.author.toString() === myPrincipal ||
                    msg.author.toString() === localUsername
                  }
                  onDelete={() => handleDelete(msg.id)}
                  isAdmin={localStorage.getItem("adminUnlocked") === "true"}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        {!canSend ? (
          <div
            className="px-4 py-3 border-t flex items-center gap-2 flex-shrink-0"
            style={{ borderColor: "oklch(0.22 0.05 260)" }}
          >
            <Input
              data-ocid="chat.input"
              value={pendingUsername}
              onChange={(e) => setPendingUsername(e.target.value)}
              placeholder="Enter a display name to chat..."
              className="flex-1 h-9 text-sm"
              style={{ color: "oklch(0.95 0.02 240)" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pendingUsername.trim()) {
                  const name = pendingUsername.trim();
                  localStorage.setItem("chat_username", name);
                  setLocalUsername(name);
                  registerUser(name);
                }
              }}
            />
            <Button
              type="button"
              data-ocid="chat.submit_button"
              size="sm"
              style={{ background: "oklch(0.52 0.18 220)" }}
              disabled={!pendingUsername.trim()}
              onClick={() => {
                const name = pendingUsername.trim();
                localStorage.setItem("chat_username", name);
                setLocalUsername(name);
                registerUser(name);
              }}
            >
              Join
            </Button>
          </div>
        ) : (
          <div
            className="border-t flex-shrink-0"
            style={{ borderColor: "oklch(0.22 0.05 260)" }}
          >
            {/* GIF picker overlay */}
            {showGifPicker && (
              <div
                className="border-b p-3"
                style={{
                  borderColor: "oklch(0.22 0.05 260)",
                  background: "oklch(0.11 0.03 260)",
                  maxHeight: "320px",
                  overflowY: "auto",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Pick a GIF / Meme
                  </span>
                  <button type="button" onClick={() => setShowGifPicker(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <MemesTab
                  onSendToChat={(item) => {
                    setMessageGif(item.url);
                    setShowGifPicker(false);
                  }}
                />
              </div>
            )}

            {/* Image URL input */}
            {showImageInput && (
              <div
                className="flex gap-2 px-3 py-2 border-b"
                style={{ borderColor: "oklch(0.22 0.05 260)" }}
              >
                <Input
                  data-ocid="chat.search_input"
                  value={messageImage}
                  onChange={(e) => setMessageImage(e.target.value)}
                  placeholder="Paste image URL..."
                  className="h-8 text-sm"
                  style={{ color: "white" }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setMessageImage("");
                    setShowImageInput(false);
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* Previews */}
            {(messageGif || messageImage) && (
              <div className="flex gap-2 px-3 py-2">
                {messageGif && (
                  <div className="relative">
                    <img
                      src={messageGif}
                      alt="Selected GIF"
                      className="h-16 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "oklch(0.5 0.18 20)" }}
                      onClick={() => setMessageGif("")}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                {messageImage && (
                  <div className="relative">
                    <img
                      src={messageImage}
                      alt="Attachment preview"
                      className="h-16 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "oklch(0.5 0.18 20)" }}
                      onClick={() => setMessageImage("")}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Text input row */}
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                data-ocid="chat.toggle"
                title="Attach image"
                className="p-2 rounded-lg transition-colors flex-shrink-0"
                style={{
                  color: showImageInput
                    ? "oklch(0.72 0.15 220)"
                    : "oklch(0.50 0.05 240)",
                }}
                onClick={() => setShowImageInput((v) => !v)}
              >
                <Link className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-ocid="chat.toggle"
                title="Add GIF"
                className="p-2 rounded-lg transition-colors flex-shrink-0"
                style={{
                  color: showGifPicker
                    ? "oklch(0.72 0.15 220)"
                    : "oklch(0.50 0.05 240)",
                }}
                onClick={() => setShowGifPicker((v) => !v)}
              >
                <Smile className="w-4 h-4" />
              </button>
              <Input
                ref={inputRef}
                data-ocid="chat.input"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  selectedRoom
                    ? `Message #${selectedRoom.name}...`
                    : "Select a room to chat..."
                }
                disabled={sending}
                className="flex-1 h-9 text-sm"
                style={{ color: "oklch(0.95 0.02 240)" }}
              />
              <Button
                type="button"
                data-ocid="chat.submit_button"
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                style={{ background: "oklch(0.52 0.18 220)" }}
                onClick={handleSend}
                disabled={
                  sending ||
                  !selectedRoom ||
                  (!messageText.trim() && !messageImage && !messageGif)
                }
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
