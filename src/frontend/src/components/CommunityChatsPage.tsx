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
import { Textarea } from "@/components/ui/textarea";
import {
  Hash,
  Link,
  Loader2,
  LogIn,
  Plus,
  Send,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatRoom, Message, User } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { AuthModal } from "./AuthModal";
import { MemesTab } from "./MemesTab";

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

export function CommunityChatsPage() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const isLoggedIn = !!identity;

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
  const [authOpen, setAuthOpen] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomTopic, setNewRoomTopic] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myPrincipal = identity?.getPrincipal().toString();

  const loadMessages = useCallback(
    async (room: ChatRoom) => {
      if (!actor) return;
      setLoadingMessages(true);
      try {
        const msgs = await actor.getMessages(room.id, BigInt(0), BigInt(50));
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [actor],
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

  useEffect(() => {
    if (actor && !isFetching) {
      loadRooms();
    }
  }, [actor, isFetching, loadRooms]);

  useEffect(() => {
    if (selectedRoom && actor) {
      loadMessages(selectedRoom);
    }
  }, [selectedRoom, actor, loadMessages]);

  const handleSend = async () => {
    if (
      !actor ||
      !selectedRoom ||
      (!messageText.trim() && !messageImage && !messageGif)
    )
      return;
    setSending(true);
    try {
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
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: bigint) => {
    if (!actor) return;
    try {
      await actor.deleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success("Message deleted");
    } catch {
      toast.error("Could not delete message");
    }
  };

  const handleCreateRoom = async () => {
    if (!actor || !newRoomName.trim()) return;
    setCreatingRoom(true);
    try {
      await actor.addRoom(newRoomName.trim(), newRoomTopic.trim() || "general");
      await loadRooms();
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
  };

  return (
    <div
      data-ocid="chat.section"
      className="flex overflow-hidden rounded-2xl"
      style={{
        height: "calc(100vh - 152px)",
        background: "oklch(0.13 0.03 260)",
        border: "1px solid oklch(0.25 0.05 260)",
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
            <h3 className="font-display font-bold text-sm">Community Chats</h3>
            {isLoggedIn && (
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
                        "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {loadingRooms
              ? ["sa", "sb", "sc", "sd", "se", "sf"].map((k) => (
                  <Skeleton key={k} className="h-9 w-full rounded-lg mb-1" />
                ))
              : rooms.map((room, idx) => {
                  const color = getRoomColor(room.topic);
                  const isActive = selectedRoom?.id === room.id;
                  return (
                    <button
                      key={room.id.toString()}
                      type="button"
                      data-ocid={`chat.item.${idx + 1}`}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm"
                      style={{
                        background: isActive
                          ? color.replace(")", " / 0.15)")
                          : "transparent",
                        color: isActive
                          ? "oklch(0.92 0.02 240)"
                          : "oklch(0.65 0.06 240)",
                      }}
                      onClick={() => handleSelectRoom(room)}
                    >
                      <Hash
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color }}
                      />
                      <span className="truncate font-medium">{room.name}</span>
                    </button>
                  );
                })}
          </div>
        </ScrollArea>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: "oklch(0.05 0.02 260 / 0.7)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: "oklch(0.22 0.05 260)" }}
        >
          <button
            type="button"
            className="md:hidden p-1 rounded"
            onClick={() => setSidebarOpen(true)}
          >
            <Hash className="w-5 h-5" />
          </button>
          {selectedRoom && (
            <>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
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
                <h2 className="font-display font-bold text-sm">
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
                  isOwn={msg.author.toString() === myPrincipal}
                  onDelete={() => handleDelete(msg.id)}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        {!isLoggedIn ? (
          <div
            className="px-4 py-3 border-t flex items-center justify-center gap-3"
            style={{ borderColor: "oklch(0.22 0.05 260)" }}
          >
            <p className="text-sm text-muted-foreground">
              Sign in to join the conversation
            </p>
            <Button
              data-ocid="chat.primary_button"
              size="sm"
              style={{ background: "oklch(0.52 0.18 220)" }}
              onClick={() => setAuthOpen(true)}
            >
              <LogIn className="w-4 h-4 mr-1" />
              Sign In
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
                />
                <Button
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
                className="p-2 rounded-lg transition-colors"
                style={{
                  color: showImageInput
                    ? "oklch(0.65 0.18 200)"
                    : "oklch(0.5 0.08 260)",
                  background: showImageInput
                    ? "oklch(0.65 0.18 200 / 0.1)"
                    : "transparent",
                }}
                onClick={() => {
                  setShowImageInput((v) => !v);
                  setShowGifPicker(false);
                }}
              >
                <Link className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Add GIF / Meme"
                className="p-2 rounded-lg transition-colors"
                style={{
                  color: showGifPicker
                    ? "oklch(0.65 0.18 320)"
                    : "oklch(0.5 0.08 260)",
                  background: showGifPicker
                    ? "oklch(0.65 0.18 320 / 0.1)"
                    : "transparent",
                }}
                onClick={() => {
                  setShowGifPicker((v) => !v);
                  setShowImageInput(false);
                }}
              >
                <Smile className="w-4 h-4" />
              </button>
              <Textarea
                data-ocid="chat.textarea"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message #${selectedRoom?.name || "chat"}...`}
                className="flex-1 resize-none min-h-[36px] max-h-[120px] py-1.5 text-sm"
                rows={1}
                style={{ color: "oklch(0.95 0.02 240)" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                data-ocid="chat.submit_button"
                size="sm"
                className="h-9 w-9 p-0 flex-shrink-0"
                style={{ background: "oklch(0.52 0.18 220)" }}
                onClick={handleSend}
                disabled={
                  sending ||
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

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={loadRooms}
      />
    </div>
  );
}

function MessageBubble({
  message,
  index,
  isOwn,
  onDelete,
}: {
  message: Message;
  index: number;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const displayName = `${message.author.toString().slice(0, 8)}...`;
  const avatarColor = "oklch(0.52 0.18 220)";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div
      data-ocid={`chat.item.${index}`}
      className="flex gap-3 group"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ background: avatarColor, color: "white" }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="text-sm font-semibold"
            style={{ color: avatarColor }}
          >
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && showDelete && (
            <button
              type="button"
              data-ocid={`chat.delete_button.${index}`}
              className="ml-auto p-1 rounded hover:bg-destructive/20 text-destructive opacity-70 hover:opacity-100 transition-opacity"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {message.text && (
          <p className="text-sm leading-relaxed break-words">{message.text}</p>
        )}

        {(message.gif || message.image) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.gif && (
              <img
                src={message.gif}
                alt="GIF attachment"
                className="max-w-[240px] max-h-[180px] rounded-xl object-cover"
                loading="lazy"
              />
            )}
            {message.image && (
              <img
                src={message.image}
                alt="Attachment"
                className="max-w-[240px] max-h-[180px] rounded-xl object-cover"
                loading="lazy"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
