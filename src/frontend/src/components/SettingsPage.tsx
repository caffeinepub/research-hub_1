import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Plus, Settings, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  claimDailyLogin,
  claimInstallReward,
  getCreditsBalance,
  isAdmin,
} from "../utils/aiCredits";

const TAB_OPTIONS = [
  { value: "search", label: "Search (Home)" },
  { value: "discover", label: "Discover" },
  { value: "ai", label: "AI Chat" },
  { value: "chat", label: "Community" },
  { value: "browser", label: "Browser" },
  { value: "dictionary", label: "Dictionary" },
  { value: "study", label: "Study" },
  { value: "comics", label: "Comics" },
];

function loadSettings() {
  return {
    theme: localStorage.getItem("settings_theme") || "dark",
    defaultTab: localStorage.getItem("settings_default_tab") || "search",
    textSize: localStorage.getItem("settings_text_size") || "normal",
  };
}

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [customDomains, setCustomDomains] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("custom_archive_domains") || "[]");
    } catch {
      return [];
    }
  });
  const [credits, setCredits] = useState(() => getCreditsBalance());

  // Lazy initializers so values are read from localStorage only once
  const [theme, setTheme] = useState(() => loadSettings().theme);
  const [defaultTab, setDefaultTab] = useState(() => loadSettings().defaultTab);
  const [textSize, setTextSize] = useState(() => loadSettings().textSize);

  const handleAddDomain = () => {
    const d = newDomain
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    if (!d) return;
    if (customDomains.includes(d)) {
      toast.error("Domain already added");
      return;
    }
    const updated = [...customDomains, d];
    setCustomDomains(updated);
    localStorage.setItem("custom_archive_domains", JSON.stringify(updated));
    setNewDomain("");
    toast.success("Collection added!");
  };

  const handleRemoveDomain = (d: string) => {
    const updated = customDomains.filter((x) => x !== d);
    setCustomDomains(updated);
    localStorage.setItem("custom_archive_domains", JSON.stringify(updated));
    toast.success("Collection removed");
  };

  const handleClaimDailyLogin = () => {
    const claimed = claimDailyLogin();
    if (claimed) {
      setCredits(getCreditsBalance());
      toast.success("+2 credits added!");
    } else toast.error("Already claimed today. Come back tomorrow!");
  };

  const handleClaimInstall = () => {
    const claimed = claimInstallReward();
    if (claimed) {
      setCredits(getCreditsBalance());
      toast.success("+5 credits added!");
    } else toast.error("Install reward already claimed.");
  };

  const handleSave = () => {
    localStorage.setItem("settings_theme", theme);
    localStorage.setItem("settings_default_tab", defaultTab);
    localStorage.setItem("settings_text_size", textSize);
    setSaved(true);
    toast.success("Settings saved!");
    setTimeout(() => setSaved(false), 3000);
    // Apply text size immediately
    document.documentElement.style.fontSize =
      textSize === "large" ? "18px" : "16px";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.52 0.18 220 / 0.15)" }}
        >
          <Settings
            className="w-5 h-5"
            style={{ color: "oklch(0.65 0.18 220)" }}
          />
        </div>
        <div>
          <h1
            className="font-display font-bold text-xl"
            style={{ color: "oklch(0.92 0.01 240)" }}
          >
            Settings
          </h1>
          <p className="text-xs text-muted-foreground">
            Customize your Research Hub experience
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Theme */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: "oklch(0.13 0.025 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "oklch(0.88 0.03 240)" }}
          >
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="theme-toggle"
                style={{ color: "oklch(0.85 0.03 240)" }}
              >
                Dark Mode
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switch between dark and light themes
              </p>
            </div>
            <Switch
              data-ocid="settings.switch"
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>
        </div>

        {/* Default Tab */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: "oklch(0.13 0.025 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "oklch(0.88 0.03 240)" }}
          >
            Navigation
          </h2>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="default-tab"
              style={{ color: "oklch(0.85 0.03 240)" }}
            >
              Default Tab
            </Label>
            <p className="text-xs text-muted-foreground">
              Which tab opens when you launch the app
            </p>
            <Select value={defaultTab} onValueChange={setDefaultTab}>
              <SelectTrigger
                data-ocid="settings.select"
                id="default-tab"
                className="mt-1"
                style={{ color: "white" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAB_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Text Size */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: "oklch(0.13 0.025 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "oklch(0.88 0.03 240)" }}
          >
            Accessibility
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <Label style={{ color: "oklch(0.85 0.03 240)" }}>Text Size</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Normal (16px) or Large (18px)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                data-ocid="settings.toggle"
                onClick={() => setTextSize("normal")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background:
                    textSize === "normal"
                      ? "oklch(0.52 0.18 220 / 0.2)"
                      : "oklch(0.18 0.03 260)",
                  color:
                    textSize === "normal"
                      ? "oklch(0.72 0.18 220)"
                      : "oklch(0.55 0.05 240)",
                  border:
                    textSize === "normal"
                      ? "1px solid oklch(0.52 0.18 220 / 0.4)"
                      : "1px solid oklch(0.25 0.04 260)",
                }}
              >
                Normal
              </button>
              <button
                type="button"
                data-ocid="settings.toggle"
                onClick={() => setTextSize("large")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background:
                    textSize === "large"
                      ? "oklch(0.52 0.18 220 / 0.2)"
                      : "oklch(0.18 0.03 260)",
                  color:
                    textSize === "large"
                      ? "oklch(0.72 0.18 220)"
                      : "oklch(0.55 0.05 240)",
                  border:
                    textSize === "large"
                      ? "1px solid oklch(0.52 0.18 220 / 0.4)"
                      : "1px solid oklch(0.25 0.04 260)",
                }}
              >
                Large
              </button>
            </div>
          </div>
        </div>

        {/* Custom Archive.org Collections */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: "oklch(0.13 0.025 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-1"
            style={{ color: "oklch(0.88 0.03 240)" }}
          >
            Custom Archive.org Collections
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Submitted collections are searchable by everyone. Admin can remove
            them.
          </p>
          <div className="flex gap-2 mb-3">
            <Input
              data-ocid="settings.input"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="e.g. audio_music, librivoxaudio"
              className="flex-1 text-white"
              style={{ color: "white" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDomain();
                }
              }}
            />
            <Button
              type="button"
              data-ocid="settings.primary_button"
              onClick={handleAddDomain}
              size="sm"
              style={{ background: "oklch(0.52 0.18 220)" }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {customDomains.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No custom collections added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {customDomains.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{
                    background: "oklch(0.18 0.04 260)",
                    border: "1px solid oklch(0.28 0.06 260)",
                  }}
                >
                  <span
                    className="text-sm font-mono"
                    style={{ color: "oklch(0.80 0.06 220)" }}
                  >
                    {d}
                  </span>
                  <button
                    type="button"
                    data-ocid="settings.delete_button"
                    onClick={() => handleRemoveDomain(d)}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Credits */}
        {!isAdmin() && (
          <div
            className="p-4 rounded-xl"
            style={{
              background: "oklch(0.13 0.025 260)",
              border: "1px solid oklch(0.22 0.04 260)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-1"
              style={{ color: "oklch(0.88 0.03 240)" }}
            >
              AI Search Credits
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Balance:{" "}
              <span
                className="font-mono"
                style={{ color: "oklch(0.65 0.18 145)" }}
              >
                {credits} credits
              </span>
            </p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                data-ocid="settings.primary_button"
                variant="outline"
                size="sm"
                onClick={handleClaimDailyLogin}
              >
                Claim Daily Login Bonus (+2 credits)
              </Button>
              <Button
                type="button"
                data-ocid="settings.secondary_button"
                variant="outline"
                size="sm"
                onClick={handleClaimInstall}
              >
                Claim Install Reward (+5 credits)
              </Button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          type="button"
          data-ocid="settings.save_button"
          onClick={handleSave}
          className="w-full h-10 font-semibold"
          style={{ background: "oklch(0.52 0.18 220)" }}
        >
          {saved ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved!
            </span>
          ) : (
            "Save Settings"
          )}
        </Button>

        {saved && (
          <p
            data-ocid="settings.success_state"
            className="text-center text-sm"
            style={{ color: "oklch(0.65 0.18 145)" }}
          >
            Your preferences have been applied.
          </p>
        )}
      </div>
    </div>
  );
}
