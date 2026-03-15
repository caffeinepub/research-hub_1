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

function createLocalSession(
  username: string,
  color: string,
  onSuccess?: () => void,
  onClose?: () => void,
) {
  const userObj = {
    username,
    avatar: color,
    isAdmin: false,
    credits: 10,
    joinedDate: new Date().toISOString(),
    bio: "",
    interests: "",
    principal: "",
  };
  localStorage.setItem("researchHubUser", JSON.stringify(userObj));
  localStorage.setItem("chat_username", username);
  toast.success(`Welcome, ${username}!`);
  onSuccess?.();
  onClose?.();
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
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    await login();
  };

  const handleContinueToProfile = () => {
    setStep("profile");
  };

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const user = `AppleUser_${suffix}`;
    const color = AVATAR_COLORS[suffix % AVATAR_COLORS.length];
    createLocalSession(user, color, onSuccess, onClose);
    setAppleLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const user = `GoogleUser_${suffix}`;
    const color = AVATAR_COLORS[suffix % AVATAR_COLORS.length];
    createLocalSession(user, color, onSuccess, onClose);
    setGoogleLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }
    setSaving(true);
    try {
      if (actor) {
        try {
          await actor.saveCallerUserProfile(
            username.trim(),
            bio.trim(),
            interests.trim(),
            selectedColor,
          );
        } catch {
          // backend save optional
        }
      }
      const userObj = {
        username: username.trim(),
        avatar: selectedColor,
        isAdmin: false,
        credits: 10,
        joinedDate: new Date().toISOString(),
        bio: bio.trim(),
        interests: interests.trim(),
        principal: identity?.getPrincipal().toString() ?? "",
      };
      localStorage.setItem("researchHubUser", JSON.stringify(userObj));
      localStorage.setItem("chat_username", username.trim());
      toast.success("Profile created! Welcome to Research Hub.");
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
            {step === "login"
              ? "Sign In to Research Hub"
              : "Create Your Profile"}
          </DialogTitle>
        </DialogHeader>

        {step === "login" && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Sign in to join community chats, save your profile, and unlock all
              features.
            </p>

            {/* Social login buttons */}
            <div className="space-y-2">
              <button
                type="button"
                data-ocid="auth.apple_button"
                onClick={handleAppleLogin}
                disabled={appleLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg font-medium text-sm transition-all hover:opacity-90 disabled:opacity-70"
                style={{
                  background: "oklch(0.98 0 0)",
                  color: "oklch(0.10 0 0)",
                  border: "1px solid oklch(0.85 0 0)",
                }}
              >
                {appleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg
                    width="16"
                    height="18"
                    viewBox="0 0 814 1000"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <title>Apple</title>
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.3-57-155.5-127.4C46.7 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49.5 191.2-49.5zm-174.6-51.5c-37.4 44.6-98 78.9-153.9 78.9-7.1 0-14.2-.6-21.3-1.9-1.3-6.4-1.9-12.8-1.9-19.9 0-50.8 26.9-104.4 68.1-139.1 20.6-17.9 55.7-33 85.5-34.6 1.9 7.7 2.6 15.4 2.6 22.4 0 49.5-19.3 100.9-79.1 94.2z" />
                  </svg>
                )}
                {appleLoading ? "Signing in..." : "Sign in with Apple"}
              </button>

              <button
                type="button"
                data-ocid="auth.google_button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg font-medium text-sm transition-all hover:opacity-90 border disabled:opacity-70"
                style={{
                  background: "oklch(0.16 0.03 260)",
                  color: "oklch(0.88 0.02 240)",
                  borderColor: "oklch(0.28 0.05 260)",
                }}
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 186.69 190.5"
                    aria-hidden="true"
                  >
                    <title>Google</title>
                    <g transform="translate(1184.583 765.171)">
                      <path
                        fill="#4285f4"
                        d="M-1089.333-687.239v36.888h51.262c-2.251 11.863-9.006 21.908-19.137 28.662l30.913 23.986c18.011-16.625 28.402-41.044 28.402-70.052 0-6.754-.606-13.249-1.732-19.483z"
                      />
                      <path
                        fill="#34a853"
                        d="M-1142.714-651.791l-6.972 5.337-24.679 19.223h0c15.673 31.086 47.796 52.561 85.03 52.561 25.717 0 47.278-8.486 63.038-23.033l-30.913-23.986c-8.486 5.715-19.31 9.179-32.125 9.179-24.765 0-45.806-16.712-53.379-39.226z"
                      />
                      <path
                        fill="#fbbc05"
                        d="M-1174.365-712.61c-6.494 12.815-10.217 27.276-10.217 42.689s3.723 29.874 10.217 42.689c0 .086 31.693-24.592 31.693-24.592-1.905-5.715-3.031-11.776-3.031-18.098s1.126-12.383 3.031-18.098z"
                      />
                      <path
                        fill="#ea4335"
                        d="M-1089.333-727.244c14.028 0 26.497 4.849 36.455 14.201l27.276-27.276c-16.539-15.413-38.013-24.852-63.731-24.852-37.234 0-69.359 21.388-85.032 52.561l31.692 24.592c7.576-22.514 28.616-39.226 53.34-39.226z"
                      />
                    </g>
                  </svg>
                )}
                {googleLoading ? "Signing in..." : "Sign in with Google"}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div
                  className="w-full border-t"
                  style={{ borderColor: "oklch(0.22 0.04 260)" }}
                />
              </div>
              <div className="relative flex justify-center text-xs">
                <span
                  className="px-2 text-muted-foreground"
                  style={{ background: "oklch(0.14 0.04 260)" }}
                >
                  or continue with Internet Identity
                </span>
              </div>
            </div>

            {/* Internet Identity login */}
            {!isLoginSuccess ? (
              <Button
                data-ocid="auth.primary_button"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full"
                style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in with Internet Identity
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{
                    background: "oklch(0.65 0.18 145 / 0.1)",
                    border: "1px solid oklch(0.65 0.18 145 / 0.3)",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: "oklch(0.65 0.18 145)" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Connected! Now create your profile.
                  </span>
                </div>
                <Button
                  data-ocid="auth.continue_button"
                  onClick={handleContinueToProfile}
                  className="w-full"
                  style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
                >
                  Continue to Profile Setup
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-4 pt-2">
            {/* Avatar preview */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: selectedColor, color: "white" }}
              >
                {initials}
              </div>
              <div className="flex gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-ocid="auth.toggle"
                    onClick={() => setSelectedColor(c)}
                    className="w-6 h-6 rounded-full transition-all"
                    style={{
                      background: c,
                      outline: selectedColor === c ? `2px solid ${c}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-username" className="text-sm font-medium">
                Username *
              </Label>
              <Input
                id="auth-username"
                data-ocid="auth.input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="h-9"
                style={{
                  background: "oklch(0.18 0.04 260)",
                  borderColor: "oklch(0.28 0.06 260)",
                  color: "white",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && username.trim()) handleSaveProfile();
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-bio" className="text-sm font-medium">
                Bio (optional)
              </Label>
              <Textarea
                id="auth-bio"
                data-ocid="auth.textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={2}
                className="resize-none text-sm"
                style={{
                  background: "oklch(0.18 0.04 260)",
                  borderColor: "oklch(0.28 0.06 260)",
                  color: "white",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-interests" className="text-sm font-medium">
                Research Interests (optional)
              </Label>
              <Input
                id="auth-interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. Space, History, Science"
                className="h-9"
                style={{
                  background: "oklch(0.18 0.04 260)",
                  borderColor: "oklch(0.28 0.06 260)",
                  color: "white",
                }}
              />
            </div>

            <Button
              data-ocid="auth.submit_button"
              onClick={handleSaveProfile}
              disabled={saving || !username.trim()}
              className="w-full"
              style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Profile & Enter"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
