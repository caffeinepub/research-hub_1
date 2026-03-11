import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ban, Globe, Lock, MessageSquare, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ADMIN_PASSCODE = "TRX";

interface StoredUser {
  username: string;
  bio?: string;
  principal?: string;
  banned?: boolean;
}

interface LocalMessage {
  id: number;
  text: string;
  author: string;
  roomId?: string | number;
  createdAt?: number;
}

function loadAllUsers(): StoredUser[] {
  const users: StoredUser[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("profile_")) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        users.push({
          username: data.username || key.replace("profile_", ""),
          bio: data.bio,
          principal: key.replace("profile_", ""),
          banned: data.banned || false,
        });
      } catch {
        // skip
      }
    }
  }
  // Also include any chat usernames
  const chatUser = localStorage.getItem("chat_username");
  if (chatUser && !users.find((u) => u.username === chatUser)) {
    users.push({ username: chatUser });
  }
  return users;
}

function loadAllMessages(): LocalMessage[] {
  const messages: LocalMessage[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("chat_messages_")) {
      try {
        const roomId = key.replace("chat_messages_", "");
        const data: LocalMessage[] = JSON.parse(
          localStorage.getItem(key) || "[]",
        );
        for (const m of data) {
          messages.push({ ...m, roomId });
        }
      } catch {
        // skip
      }
    }
  }
  return messages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function loadArchiveDomains(): string[] {
  try {
    return JSON.parse(localStorage.getItem("custom_archive_domains") || "[]");
  } catch {
    return [];
  }
}

export function AdminPage() {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem("adminUnlocked") === "true",
  );
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [domains, setDomains] = useState<string[]>([]);

  useEffect(() => {
    if (unlocked) {
      setUsers(loadAllUsers());
      setMessages(loadAllMessages());
      setDomains(loadArchiveDomains());
    }
  }, [unlocked]);

  const handleUnlock = () => {
    if (passcode === ADMIN_PASSCODE) {
      localStorage.setItem("adminUnlocked", "true");
      setUnlocked(true);
      setError("");
      toast.success("Admin access granted");
    } else {
      setError("Incorrect passcode");
      toast.error("Incorrect passcode");
    }
  };

  const handleBanUser = (username: string) => {
    const key = `profile_${username}`;
    const existing = (() => {
      try {
        return JSON.parse(localStorage.getItem(key) || "{}");
      } catch {
        return {};
      }
    })();
    localStorage.setItem(key, JSON.stringify({ ...existing, banned: true }));
    const banned_key = "banned_users";
    const bannedList = (() => {
      try {
        return JSON.parse(localStorage.getItem(banned_key) || "[]");
      } catch {
        return [];
      }
    })() as string[];
    if (!bannedList.includes(username)) {
      bannedList.push(username);
      localStorage.setItem(banned_key, JSON.stringify(bannedList));
    }
    setUsers((prev) =>
      prev.map((u) => (u.username === username ? { ...u, banned: true } : u)),
    );
    toast.success(`User "${username}" has been banned`);
  };

  const handleDeleteMessage = (roomId: string | number, msgId: number) => {
    const key = `chat_messages_${roomId}`;
    const existing: LocalMessage[] = (() => {
      try {
        return JSON.parse(localStorage.getItem(key) || "[]");
      } catch {
        return [];
      }
    })();
    const updated = existing.filter((m) => m.id !== msgId);
    localStorage.setItem(key, JSON.stringify(updated));
    setMessages((prev) =>
      prev.filter((m) => !(m.id === msgId && m.roomId === roomId)),
    );
    toast.success("Message deleted");
  };

  const handleRemoveDomain = (domain: string) => {
    const updated = domains.filter((d) => d !== domain);
    localStorage.setItem("custom_archive_domains", JSON.stringify(updated));
    setDomains(updated);
    toast.success(`Domain "${domain}" removed`);
  };

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div
          className="w-full max-w-sm p-8 rounded-2xl"
          style={{
            background: "oklch(0.13 0.025 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "oklch(0.55 0.22 25 / 0.15)" }}
            >
              <Lock
                className="w-7 h-7"
                style={{ color: "oklch(0.65 0.22 25)" }}
              />
            </div>
            <h1
              className="font-display font-bold text-xl mb-1"
              style={{ color: "oklch(0.92 0.01 240)" }}
            >
              Admin Access
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter the admin passcode to continue
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Input
              data-ocid="admin.input"
              type="password"
              placeholder="Enter passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              className="h-10 text-center text-base"
              style={{ color: "white" }}
            />
            {error && (
              <p
                data-ocid="admin.error_state"
                className="text-xs text-center"
                style={{ color: "oklch(0.65 0.22 25)" }}
              >
                {error}
              </p>
            )}
            <Button
              data-ocid="admin.submit_button"
              onClick={handleUnlock}
              style={{ background: "oklch(0.55 0.22 25)" }}
              className="w-full"
            >
              Unlock Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.55 0.22 25 / 0.15)" }}
        >
          <Lock className="w-5 h-5" style={{ color: "oklch(0.65 0.22 25)" }} />
        </div>
        <div>
          <h1
            className="font-display font-bold text-xl"
            style={{ color: "oklch(0.92 0.01 240)" }}
          >
            Admin Control Panel
          </h1>
          <p className="text-xs text-muted-foreground">Research Hub Admin</p>
        </div>
        <Button
          data-ocid="admin.secondary_button"
          variant="outline"
          size="sm"
          className="ml-auto text-xs"
          onClick={() => {
            localStorage.removeItem("adminUnlocked");
            setUnlocked(false);
          }}
          style={{
            borderColor: "oklch(0.35 0.08 25)",
            color: "oklch(0.65 0.22 25)",
          }}
        >
          Lock Admin
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList
          className="mb-5"
          style={{ background: "oklch(0.13 0.025 260)" }}
        >
          <TabsTrigger
            data-ocid="admin.users_tab"
            value="users"
            className="gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger
            data-ocid="admin.messages_tab"
            value="messages"
            className="gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Messages ({messages.length})
          </TabsTrigger>
          <TabsTrigger
            data-ocid="admin.domains_tab"
            value="domains"
            className="gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            Domains ({domains.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid oklch(0.22 0.04 260)" }}
          >
            {users.length === 0 ? (
              <div
                data-ocid="admin.users_empty_state"
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No users found in local storage
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: "oklch(0.22 0.04 260)" }}>
                    <TableHead style={{ color: "oklch(0.65 0.06 240)" }}>
                      Username
                    </TableHead>
                    <TableHead style={{ color: "oklch(0.65 0.06 240)" }}>
                      Status
                    </TableHead>
                    <TableHead style={{ color: "oklch(0.65 0.06 240)" }}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, i) => (
                    <TableRow
                      key={user.username}
                      data-ocid={`admin.users_row.${i + 1}`}
                      style={{ borderColor: "oklch(0.22 0.04 260)" }}
                    >
                      <TableCell
                        className="font-medium text-sm"
                        style={{ color: "oklch(0.88 0.03 240)" }}
                      >
                        {user.username}
                      </TableCell>
                      <TableCell>
                        {user.banned ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "oklch(0.55 0.22 25 / 0.15)",
                              color: "oklch(0.65 0.22 25)",
                            }}
                          >
                            Banned
                          </span>
                        ) : (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "oklch(0.52 0.18 145 / 0.15)",
                              color: "oklch(0.65 0.18 145)",
                            }}
                          >
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!user.banned && (
                          <Button
                            data-ocid={`admin.users_delete_button.${i + 1}`}
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            style={{ color: "oklch(0.65 0.22 25)" }}
                            onClick={() => handleBanUser(user.username)}
                          >
                            <Ban className="w-3 h-3" />
                            Ban
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <ScrollArea
            className="h-[480px] rounded-xl"
            style={{ border: "1px solid oklch(0.22 0.04 260)" }}
          >
            {messages.length === 0 ? (
              <div
                data-ocid="admin.messages_empty_state"
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No messages in local storage
              </div>
            ) : (
              <div
                className="divide-y"
                style={{ borderColor: "oklch(0.22 0.04 260)" }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={`${msg.roomId}-${msg.id}`}
                    data-ocid={`admin.messages_row.${i + 1}`}
                    className="flex items-start gap-3 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "oklch(0.65 0.18 220)" }}
                        >
                          {msg.author}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Room: {msg.roomId}
                        </span>
                      </div>
                      <p
                        className="text-sm break-words"
                        style={{ color: "oklch(0.80 0.02 240)" }}
                      >
                        {msg.text || "[media attachment]"}
                      </p>
                    </div>
                    <Button
                      data-ocid={`admin.messages_delete_button.${i + 1}`}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0"
                      style={{ color: "oklch(0.65 0.22 25)" }}
                      onClick={() => handleDeleteMessage(msg.roomId!, msg.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains">
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid oklch(0.22 0.04 260)" }}
          >
            {domains.length === 0 ? (
              <div
                data-ocid="admin.domains_empty_state"
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No custom Archive.org domains submitted yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: "oklch(0.22 0.04 260)" }}>
                    <TableHead style={{ color: "oklch(0.65 0.06 240)" }}>
                      Collection ID
                    </TableHead>
                    <TableHead style={{ color: "oklch(0.65 0.06 240)" }}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain, i) => (
                    <TableRow
                      key={domain}
                      data-ocid={`admin.domains_row.${i + 1}`}
                      style={{ borderColor: "oklch(0.22 0.04 260)" }}
                    >
                      <TableCell
                        className="font-mono text-sm"
                        style={{ color: "oklch(0.72 0.12 220)" }}
                      >
                        {domain}
                      </TableCell>
                      <TableCell>
                        <Button
                          data-ocid={`admin.domains_delete_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          style={{ color: "oklch(0.65 0.22 25)" }}
                          onClick={() => handleRemoveDomain(domain)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
