import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Loader2, LogIn, MessageSquare, Save, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { AuthModal } from "./AuthModal";

const AVATAR_COLORS = [
  "oklch(0.52 0.18 220)",
  "oklch(0.65 0.18 200)",
  "oklch(0.72 0.18 280)",
  "oklch(0.65 0.18 320)",
  "oklch(0.65 0.18 55)",
  "oklch(0.65 0.18 160)",
];

export function ProfilePage() {
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

  const isLoggedIn = !!identity;

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
            <h2 className="font-display text-2xl font-bold mb-2">
              Your Research Profile
            </h2>
            <p className="text-muted-foreground max-w-xs">
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
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: avatarColor, color: "white" }}
          >
            {initials}
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
              <h2 className="font-display text-xl font-bold truncate">
                {profile?.username || "No username set"}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {identity?.getPrincipal().toString().slice(0, 24)}...
              </p>
            </>
          )}
        </div>
        {!editing && profile && (
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Bio
              </h3>
              <p className="text-sm">
                {profile?.bio || (
                  <span className="text-muted-foreground italic">
                    No bio yet.
                  </span>
                )}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
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
                  <span className="text-sm text-muted-foreground italic">
                    None set.
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="profile-username">Username</Label>
              <Input
                id="profile-username"
                data-ocid="profile.input"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                maxLength={32}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                data-ocid="profile.textarea"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="resize-none"
                rows={3}
                maxLength={200}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="profile-interests">
                Research Interests (comma-separated)
              </Label>
              <Input
                id="profile-interests"
                value={editInterests}
                onChange={(e) => setEditInterests(e.target.value)}
                placeholder="History, Science, Art"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Avatar Color</Label>
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
            <div className="flex gap-2">
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
                Save
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
          <p className="text-muted-foreground text-sm mb-3">
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
