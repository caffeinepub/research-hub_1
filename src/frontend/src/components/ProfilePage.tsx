import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Edit2,
  ImageIcon,
  Loader2,
  LogIn,
  MessageSquare,
  Save,
  Send,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { getDailyUsage, isAdmin } from "../utils/aiCredits";
import { AuthModal } from "./AuthModal";

const AVATAR_COLORS = [
  "oklch(0.52 0.18 220)",
  "oklch(0.65 0.18 200)",
  "oklch(0.72 0.18 280)",
  "oklch(0.65 0.18 320)",
  "oklch(0.65 0.18 55)",
  "oklch(0.65 0.18 160)",
];

export function ProfilePage({
  viewingUser,
  onNavigateMessages,
  onViewProfile,
}: {
  viewingUser?: string;
  onNavigateMessages?: (friend?: string) => void;
  onViewProfile?: (username: string) => void;
} = {}) {
  const { identity, isLoggingIn } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [profile, setProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editInterests, setEditInterests] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editColor, setEditColor] = useState(AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const myUsername = localStorage.getItem("chat_username") || "default";

  // Social posts
  const targetUser = viewingUser || myUsername;
  const getPostsFor = (username: string) => {
    try {
      return JSON.parse(
        localStorage.getItem(`posts_${username}`) || "[]",
      ) as Array<{
        id: string;
        text: string;
        imageUrl?: string;
        timestamp: number;
        author: string;
      }>;
    } catch {
      return [];
    }
  };
  const [posts, setPosts] = useState(() => getPostsFor(targetUser));
  const [newPostText, setNewPostText] = useState("");

  const handleCreatePost = () => {
    if (!newPostText.trim()) return;
    const post = {
      id: `p-${Date.now()}`,
      text: newPostText.trim(),
      timestamp: Date.now(),
      author: myUsername,
    };
    const updated = [post, ...getPostsFor(myUsername)];
    localStorage.setItem(`posts_${myUsername}`, JSON.stringify(updated));
    setPosts(updated);
    setNewPostText("");
  };

  const [avatarImage, setAvatarImage] = useState<string | null>(() => {
    // If viewing another user's profile, try to load their saved avatar
    if (viewingUser) {
      return localStorage.getItem(`profile_avatar_${viewingUser}`) || null;
    }
    const username = localStorage.getItem("chat_username") || "default";
    return localStorage.getItem(`profile_avatar_${username}`) || null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!identity;
  const isOwnProfile = !viewingUser;

  const isFriend = (): boolean => {
    if (!myUsername || !viewingUser) return false;
    try {
      const friends: string[] = JSON.parse(
        localStorage.getItem(`friends_${myUsername}`) || "[]",
      );
      return friends.includes(viewingUser);
    } catch {
      return false;
    }
  };

  // Follow system
  const getFollowing = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem("researchhub_following") || "[]");
    } catch {
      return [];
    }
  };

  const [isFollowing, setIsFollowing] = useState(() => {
    if (!viewingUser) return false;
    return getFollowing().includes(viewingUser);
  });

  const [followingList, setFollowingList] = useState<string[]>(() =>
    getFollowing(),
  );

  const handleFollow = () => {
    if (!viewingUser) return;
    const current = getFollowing();
    let updated: string[];
    if (current.includes(viewingUser)) {
      updated = current.filter((u) => u !== viewingUser);
      setIsFollowing(false);
      toast.success(`Unfollowed ${viewingUser}`);
    } else {
      updated = [...current, viewingUser];
      setIsFollowing(true);
      toast.success(`Now following ${viewingUser}!`);
    }
    localStorage.setItem("researchhub_following", JSON.stringify(updated));
    setFollowingList(updated);
  };

  const handleAddFriend = () => {
    if (!myUsername || myUsername === "default") {
      toast.error("Set a username in Community first");
      return;
    }
    if (!viewingUser) return;
    const existing: { from: string; to: string; timestamp: number }[] = (() => {
      try {
        return JSON.parse(localStorage.getItem("friend_requests") || "[]");
      } catch {
        return [];
      }
    })();
    const alreadySent = existing.some(
      (r) => r.from === myUsername && r.to === viewingUser,
    );
    if (alreadySent) {
      toast.info("Friend request already sent");
      return;
    }
    existing.push({ from: myUsername, to: viewingUser, timestamp: Date.now() });
    localStorage.setItem("friend_requests", JSON.stringify(existing));
    toast.success(`Friend request sent to ${viewingUser}!`);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large. Please use an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const key = `profile_avatar_${myUsername}`;
      localStorage.setItem(key, dataUrl);
      setAvatarImage(dataUrl);
      toast.success("Profile picture updated!");
    };
    reader.readAsDataURL(file);
  };

  const loadProfile = useCallback(async () => {
    if (!actor || isFetching) return;
    setLoadingProfile(true);
    try {
      const p = await actor.getCallerUserProfile();
      setProfile(p);
      if (p) {
        setEditBio(p.bio);
        setEditInterests(p.researchInterests);
        setEditUsername(p.username);
        setEditColor(p.avatarColor || AVATAR_COLORS[0]);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingProfile(false);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    if (isLoggedIn && actor && !isFetching) {
      loadProfile();
    }
  }, [isLoggedIn, actor, isFetching, loadProfile]);

  const handleSave = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      await actor.saveCallerUserProfile(
        editUsername.trim(),
        editBio.trim(),
        editInterests.trim(),
        editColor,
      );
      await loadProfile();
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.username || editUsername || "?")
    .slice(0, 2)
    .toUpperCase();
  const avatarColor = profile?.avatarColor || editColor || AVATAR_COLORS[0];

  if (!isLoggedIn) {
    return (
      <>
        <div
          data-ocid="profile.section"
          className="flex flex-col items-center justify-center py-20 px-4 text-center gap-6"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
            style={{
              background: "oklch(0.22 0.05 260)",
              color: "oklch(0.5 0.08 260)",
            }}
          >
            👤
          </div>
          <div>
            <h2
              className="font-display text-2xl font-bold mb-2"
              style={{ color: "oklch(0.92 0.01 240)" }}
            >
              Your Research Profile
            </h2>
            <p className="max-w-xs" style={{ color: "oklch(0.6 0.05 240)" }}>
              Sign in to join community chats, save your research interests, and
              track your posts.
            </p>
          </div>
          <Button
            data-ocid="profile.primary_button"
            className="h-11 px-8 font-semibold"
            style={{ background: "oklch(0.52 0.18 220)" }}
            onClick={() => setAuthOpen(true)}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>
        </div>
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={loadProfile}
        />
      </>
    );
  }

  return (
    <div
      data-ocid="profile.section"
      className="max-w-xl mx-auto py-8 px-4 space-y-6"
    >
      {/* Avatar + Name row */}
      <div className="flex items-center gap-5">
        {loadingProfile ? (
          <Skeleton className="w-20 h-20 rounded-full" />
        ) : (
          <div className="relative w-20 h-20 flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold"
              style={{ background: avatarColor, color: "white" }}
            >
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            {editing && (
              <button
                type="button"
                data-ocid="profile.upload_button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center transition-opacity opacity-0 hover:opacity-100"
                style={{ background: "oklch(0.08 0.02 260 / 0.75)" }}
              >
                <Camera className="w-6 h-6" style={{ color: "white" }} />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {loadingProfile ? (
            <>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </>
          ) : (
            <>
              <h2
                className="font-display text-xl font-bold truncate"
                style={{ color: "oklch(0.92 0.01 240)" }}
              >
                {profile?.username || "No username set"}
              </h2>
              {(() => {
                const friendCount = (() => {
                  try {
                    const key = viewingUser
                      ? `friends_${viewingUser}`
                      : `friends_${myUsername}`;
                    return (
                      JSON.parse(localStorage.getItem(key) || "[]") as string[]
                    ).length;
                  } catch {
                    return 0;
                  }
                })();
                return (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Users
                      className="w-3.5 h-3.5"
                      style={{ color: "oklch(0.52 0.18 220)" }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "oklch(0.72 0.14 220)" }}
                    >
                      {friendCount} {friendCount === 1 ? "Friend" : "Friends"}
                    </span>
                  </div>
                );
              })()}
              <p
                className="text-xs truncate"
                style={{ color: "oklch(0.55 0.05 240)" }}
              >
                {isOwnProfile
                  ? `${identity?.getPrincipal().toString().slice(0, 24) ?? ""}...`
                  : ""}
              </p>
            </>
          )}
        </div>
        {!isOwnProfile && viewingUser && (
          <div className="flex gap-2">
            <Button
              data-ocid="profile.primary_button"
              size="sm"
              style={{
                background: isFollowing
                  ? "oklch(0.22 0.05 260)"
                  : "oklch(0.52 0.18 220)",
              }}
              onClick={handleFollow}
            >
              {isFollowing ? "Following ✓" : "Follow"}
            </Button>
            {!isFriend() ? (
              <Button
                data-ocid="profile.secondary_button"
                size="sm"
                variant="outline"
                onClick={handleAddFriend}
              >
                Add Friend
              </Button>
            ) : (
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  background: "oklch(0.52 0.18 145 / 0.15)",
                  color: "oklch(0.65 0.18 145)",
                }}
              >
                Friends
              </span>
            )}
            <Button
              data-ocid="profile.secondary_button"
              size="sm"
              variant="outline"
              onClick={() => onNavigateMessages?.(viewingUser)}
            >
              Message
            </Button>
          </div>
        )}
        {isOwnProfile && !editing && profile && (
          <Button
            data-ocid="profile.edit_button"
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {/* Profile card */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: "oklch(0.16 0.04 260)",
          border: "1px solid oklch(0.28 0.06 260)",
        }}
      >
        {!editing ? (
          <>
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "oklch(0.55 0.05 240)" }}
              >
                Bio
              </h3>
              <p style={{ color: "oklch(0.88 0.02 240)" }}>
                {profile?.bio || (
                  <span
                    style={{
                      color: "oklch(0.55 0.05 240)",
                      fontStyle: "italic",
                    }}
                  >
                    No bio yet.
                  </span>
                )}
              </p>
            </div>
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "oklch(0.55 0.05 240)" }}
              >
                Research Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.researchInterests ? (
                  profile.researchInterests
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))
                ) : (
                  <span
                    className="text-sm"
                    style={{
                      color: "oklch(0.55 0.05 240)",
                      fontStyle: "italic",
                    }}
                  >
                    None set.
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {editing && (
              <p className="text-xs" style={{ color: "oklch(0.55 0.05 240)" }}>
                Hover over your avatar above to change your profile picture.
              </p>
            )}
            <div className="space-y-1">
              <Label
                htmlFor="profile-username"
                style={{ color: "oklch(0.88 0.03 240)" }}
              >
                Username
              </Label>
              <Input
                id="profile-username"
                data-ocid="profile.input"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                maxLength={32}
                style={{ color: "white" }}
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="profile-bio"
                style={{ color: "oklch(0.88 0.03 240)" }}
              >
                Bio
              </Label>
              <Textarea
                id="profile-bio"
                data-ocid="profile.textarea"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="resize-none"
                rows={3}
                maxLength={200}
                style={{ color: "white" }}
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="profile-interests"
                style={{ color: "oklch(0.88 0.03 240)" }}
              >
                Research Interests (comma-separated)
              </Label>
              <Input
                id="profile-interests"
                value={editInterests}
                onChange={(e) => setEditInterests(e.target.value)}
                placeholder="History, Science, Art"
                maxLength={100}
                style={{ color: "white" }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: "oklch(0.88 0.03 240)" }}>
                Avatar Color
              </Label>
              <div className="flex gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditColor(c)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c,
                      outline:
                        editColor === c
                          ? "3px solid oklch(0.9 0.02 240)"
                          : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                data-ocid="profile.save_button"
                className="flex-1"
                style={{ background: "oklch(0.52 0.18 220)" }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save Profile
              </Button>
              <Button
                data-ocid="profile.cancel_button"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Following list - own profile only */}
      {isOwnProfile && followingList.length > 0 && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{
            background: "oklch(0.16 0.04 260)",
            border: "1px solid oklch(0.28 0.06 260)",
          }}
          data-ocid="profile.card"
        >
          <div className="flex items-center justify-between">
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "oklch(0.55 0.05 240)" }}
            >
              Following
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-mono"
              style={{
                background: "oklch(0.22 0.05 260)",
                color: "oklch(0.65 0.08 240)",
              }}
            >
              {followingList.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {followingList.map((username) => (
              <button
                key={username}
                type="button"
                data-ocid="profile.secondary_button"
                onClick={() => onViewProfile?.(username)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
                style={{
                  background: "oklch(0.20 0.06 220 / 0.4)",
                  border: "1px solid oklch(0.35 0.10 220 / 0.3)",
                  color: "oklch(0.72 0.14 220)",
                }}
              >
                {username}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Credits card - own profile only */}
      {isOwnProfile &&
        (() => {
          const usage = getDailyUsage();
          return (
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{
                background: "oklch(0.16 0.04 260)",
                border: "1px solid oklch(0.28 0.06 260)",
              }}
              data-ocid="profile.card"
            >
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "oklch(0.55 0.05 240)" }}
              >
                AI Research Credits
              </h3>
              {isAdmin() ? (
                <p style={{ color: "oklch(0.65 0.18 145)" }}>
                  Unlimited searches (Admin)
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "oklch(0.88 0.02 240)" }}>
                      Daily searches used
                    </span>
                    <span
                      className="font-mono"
                      style={{ color: "oklch(0.88 0.02 240)" }}
                    >
                      {usage.used} / {usage.limit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "oklch(0.88 0.02 240)" }}>
                      Bonus credits
                    </span>
                    <span
                      className="font-mono"
                      style={{ color: "oklch(0.65 0.18 145)" }}
                    >
                      +{usage.credits}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="font-semibold"
                      style={{ color: "oklch(0.92 0.01 240)" }}
                    >
                      Remaining today
                    </span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: "oklch(0.92 0.01 240)" }}
                    >
                      {Math.max(0, usage.limit + usage.credits - usage.used)}
                    </span>
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.55 0.05 240)" }}
                  >
                    Earn more credits: log in daily (+2), install the app (+5),
                    participate in Community (+1)
                  </p>
                </>
              )}
            </div>
          );
        })()}

      {/* Friends / Following */}
      {isOwnProfile &&
        (() => {
          const friends: string[] = (() => {
            try {
              return JSON.parse(
                localStorage.getItem(`friends_${myUsername}`) || "[]",
              );
            } catch {
              return [];
            }
          })();
          const FRIEND_COLORS = [
            "oklch(0.52 0.18 220)",
            "oklch(0.65 0.18 160)",
            "oklch(0.65 0.18 320)",
            "oklch(0.65 0.18 55)",
            "oklch(0.65 0.18 280)",
          ];
          return (
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{
                background: "oklch(0.16 0.04 260)",
                border: "1px solid oklch(0.28 0.06 260)",
              }}
              data-ocid="profile.card"
            >
              <div className="flex items-center justify-between">
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "oklch(0.55 0.05 240)" }}
                >
                  Friends
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-mono"
                  style={{
                    background: "oklch(0.22 0.05 260)",
                    color: "oklch(0.65 0.08 240)",
                  }}
                >
                  {friends.length}
                </span>
              </div>
              {friends.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.50 0.05 240)", fontStyle: "italic" }}
                  data-ocid="profile.empty_state"
                >
                  No friends yet. Add friends from Community.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {friends.map((friend, idx) => (
                    <div
                      key={friend}
                      data-ocid={`profile.item.${idx + 1}`}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl"
                      style={{
                        background: "oklch(0.13 0.03 260)",
                        border: "1px solid oklch(0.22 0.04 260)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{
                          background: FRIEND_COLORS[idx % FRIEND_COLORS.length],
                        }}
                      >
                        {friend.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-white text-center truncate w-full">
                        {friend}
                      </span>
                      <div className="flex gap-1 w-full">
                        <button
                          type="button"
                          data-ocid={`profile.secondary_button.${idx + 1}`}
                          onClick={() => onNavigateMessages?.(friend)}
                          className="flex-1 text-[10px] py-1 rounded-lg text-center transition-colors"
                          style={{
                            background: "oklch(0.52 0.18 220 / 0.15)",
                            color: "oklch(0.72 0.14 220)",
                            border: "1px solid oklch(0.40 0.12 220 / 0.3)",
                          }}
                        >
                          Message
                        </button>
                        <button
                          type="button"
                          data-ocid={`profile.button.${idx + 1}`}
                          onClick={() => onViewProfile?.(friend)}
                          className="flex-1 text-[10px] py-1 rounded-lg text-center transition-colors"
                          style={{
                            background: "oklch(0.52 0.18 145 / 0.15)",
                            color: "oklch(0.65 0.14 145)",
                            border: "1px solid oklch(0.40 0.12 145 / 0.3)",
                          }}
                        >
                          Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

      {/* Social Posts Section */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: "oklch(0.16 0.04 260)",
          border: "1px solid oklch(0.28 0.06 260)",
        }}
        data-ocid="profile.card"
      >
        <div className="flex items-center justify-between">
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "oklch(0.55 0.05 240)" }}
          >
            Posts
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono"
            style={{
              background: "oklch(0.22 0.05 260)",
              color: "oklch(0.65 0.08 240)",
            }}
          >
            {posts.length}
          </span>
        </div>

        {/* Create post - only on own profile */}
        {isOwnProfile && (
          <div className="flex gap-2 items-start">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: avatarColor, color: "white" }}
            >
              {initials}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                data-ocid="profile.textarea"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Share something with your followers..."
                rows={2}
                className="w-full resize-none rounded-xl px-3 py-2 text-sm"
                style={{
                  background: "oklch(0.13 0.025 260)",
                  border: "1px solid oklch(0.28 0.06 260)",
                  color: "white",
                  outline: "none",
                }}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  data-ocid="profile.primary_button"
                  onClick={handleCreatePost}
                  disabled={!newPostText.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: "oklch(0.52 0.18 220)",
                    color: "white",
                  }}
                >
                  <Send className="w-3.5 h-3.5" />
                  Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post feed */}
        {posts.length === 0 ? (
          <p
            className="text-sm italic text-center py-4"
            style={{ color: "oklch(0.45 0.04 240)" }}
            data-ocid="profile.empty_state"
          >
            {isOwnProfile
              ? "You haven't posted anything yet."
              : "No posts yet."}
          </p>
        ) : (
          <div className="space-y-3">
            {posts.slice(0, 20).map((post, idx) => {
              const postAvatar = localStorage.getItem(
                `profile_avatar_${post.author}`,
              );
              return (
                <div
                  key={post.id}
                  data-ocid={`profile.item.${idx + 1}`}
                  className="flex gap-3 p-3 rounded-xl"
                  style={{
                    background: "oklch(0.13 0.025 260)",
                    border: "1px solid oklch(0.22 0.04 260)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                    style={{ background: avatarColor, color: "white" }}
                  >
                    {postAvatar ? (
                      <img
                        src={postAvatar}
                        alt={post.author}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      post.author.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "oklch(0.85 0.04 240)" }}
                      >
                        {post.author}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: "oklch(0.45 0.04 240)" }}
                      >
                        {new Date(post.timestamp).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: "oklch(0.82 0.02 240)" }}
                    >
                      {post.text}
                    </p>
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt="post"
                        className="mt-2 rounded-lg max-h-48 object-cover"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* No profile yet */}
      {!loadingProfile && !profile && (
        <div
          data-ocid="profile.empty_state"
          className="rounded-2xl p-5 text-center"
          style={{
            background: "oklch(0.16 0.04 260)",
            border: "1px solid oklch(0.28 0.06 260)",
          }}
        >
          <MessageSquare
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: "oklch(0.5 0.08 260)" }}
          />
          <p className="text-sm mb-3" style={{ color: "oklch(0.55 0.05 240)" }}>
            You haven&apos;t set up a profile yet.
          </p>
          <Button
            data-ocid="profile.primary_button"
            size="sm"
            style={{ background: "oklch(0.52 0.18 220)" }}
            onClick={() => setEditing(true)}
          >
            Set Up Profile
          </Button>
        </div>
      )}
    </div>
  );
}
