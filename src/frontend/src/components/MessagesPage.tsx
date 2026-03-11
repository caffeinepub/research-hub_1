import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
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

interface DmMessage {
  id: number;
  from: string;
  to: string;
  text: string;
  timestamp: number;
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

function saveDmMessage(from: string, to: string, text: string) {
  const key = `dm_${[from, to].sort().join("_")}`;
  const existing = getDmMessages(from, to);
  const newMsg: DmMessage = {
    id: Date.now(),
    from,
    to,
    text,
    timestamp: Date.now(),
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    // Add to both users' friend lists
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
    // Remove request
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

  const handleSend = () => {
    if (!newMessage.trim() || !selectedFriend || !myUsername) return;
    const msg = saveDmMessage(myUsername, selectedFriend, newMessage.trim());
    setDmMessages((prev) => [...prev, msg]);
    setNewMessage("");
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
    <div data-ocid="messages.section" className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
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
          className="mb-4 p-3 rounded-xl"
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
        className="flex rounded-2xl overflow-hidden"
        style={{
          height: "calc(100vh - 280px)",
          minHeight: "400px",
          border: "1px solid oklch(0.22 0.04 260)",
        }}
      >
        {/* Friends List */}
        <aside
          className="w-56 flex-shrink-0 flex flex-col"
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
          className="flex-1 flex flex-col"
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
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: "oklch(0.22 0.04 260)" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "oklch(0.52 0.18 220 / 0.2)",
                    color: "oklch(0.72 0.18 220)",
                  }}
                >
                  {selectedFriend.slice(0, 2).toUpperCase()}
                </div>
                <span
                  className="font-semibold text-sm"
                  style={{ color: "oklch(0.88 0.03 240)" }}
                >
                  {selectedFriend}
                </span>
              </div>

              <ScrollArea className="flex-1 px-4 py-3">
                {dmMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Say hi!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {dmMessages.map((msg, i) => {
                      const isOwn = msg.from === myUsername;
                      return (
                        <div
                          key={msg.id}
                          data-ocid={`messages.item.${i + 1}`}
                          className={`flex flex-col ${
                            isOwn ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className="max-w-[75%] px-3 py-2 rounded-2xl text-sm"
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
                          <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div
                className="flex items-center gap-2 px-3 py-2 border-t"
                style={{ borderColor: "oklch(0.22 0.04 260)" }}
              >
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
