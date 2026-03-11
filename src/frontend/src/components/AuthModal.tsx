import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, LogIn, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const AVATAR_COLORS = [
  "oklch(0.52 0.18 220)",
  "oklch(0.65 0.18 200)",
  "oklch(0.72 0.18 280)",
  "oklch(0.65 0.18 320)",
  "oklch(0.65 0.18 55)",
  "oklch(0.65 0.18 160)",
];

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const { login, isLoggingIn, isLoginSuccess, identity } =
    useInternetIdentity();
  const { actor } = useActor();
  const [step, setStep] = useState<"login" | "profile">("login");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleLogin = async () => {
    await login();
  };

  const handleContinueToProfile = () => {
    setStep("profile");
  };

  const handleSaveProfile = async () => {
    if (!actor) return;
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }
    setSaving(true);
    try {
      await actor.saveCallerUserProfile(
        username.trim(),
        bio.trim(),
        interests.trim(),
        selectedColor,
      );
      toast.success("Profile created!");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = username.trim().slice(0, 2).toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="auth.dialog"
        className="max-w-sm"
        style={{
          background: "oklch(0.14 0.04 260)",
          border: "1px solid oklch(0.28 0.06 260)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <User
              className="w-5 h-5"
              style={{ color: "oklch(0.78 0.18 200)" }}
            />
            {step === "login" ? "Sign In" : "Create Your Profile"}
          </DialogTitle>
        </DialogHeader>

        {step === "login" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Sign in with Internet Identity to join community chats and save
              your profile.
            </p>
            {!isLoginSuccess ? (
              <Button
                data-ocid="auth.submit_button"
                className="w-full h-11 font-semibold"
                style={{ background: "oklch(0.52 0.18 220)" }}
                onClick={handleLogin}
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
                    Sign In with Internet Identity
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div
                  className="text-sm rounded-lg p-3 flex items-center gap-2"
                  style={{
                    background: "oklch(0.2 0.06 160 / 0.3)",
                    color: "oklch(0.8 0.14 160)",
                  }}
                >
                  ✓ Signed in as{" "}
                  {identity?.getPrincipal().toString().slice(0, 16)}...
                </div>
                <Button
                  data-ocid="auth.confirm_button"
                  className="w-full"
                  style={{ background: "oklch(0.52 0.18 220)" }}
                  onClick={handleContinueToProfile}
                >
                  Continue to Profile Setup →
                </Button>
              </div>
            )}
            <Button
              data-ocid="auth.cancel_button"
              variant="ghost"
              className="w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-4 pt-2">
            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: selectedColor, color: "white" }}
              >
                {initials}
              </div>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c,
                      outline:
                        selectedColor === c
                          ? "3px solid oklch(0.9 0.02 240)"
                          : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="auth-username" className="text-sm font-medium">
                Username *
              </Label>
              <Input
                id="auth-username"
                data-ocid="auth.input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your display name"
                maxLength={32}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="auth-bio" className="text-sm font-medium">
                Bio
              </Label>
              <Textarea
                id="auth-bio"
                data-ocid="auth.textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself..."
                className="resize-none"
                rows={2}
                maxLength={200}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="auth-interests" className="text-sm font-medium">
                Research Interests
              </Label>
              <Input
                id="auth-interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="History, science, astronomy..."
                maxLength={100}
              />
            </div>

            <Button
              data-ocid="auth.save_button"
              className="w-full font-semibold"
              style={{ background: "oklch(0.52 0.18 220)" }}
              onClick={handleSaveProfile}
              disabled={saving || !username.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Profile"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
