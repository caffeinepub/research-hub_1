import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Plus, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  claimDailyLogin,
  claimInstallReward,
  getCreditsBalance,
  isAdmin,
} from "../utils/aiCredits";
import { type AppSettings, getSettings, saveSettings } from "../utils/settings";

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
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMsg, setVoucherMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());

  // Apply settings to DOM on change
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    const sizeMap: Record<string, string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    document.body.style.fontSize = sizeMap[settings.textSize] || "16px";
    localStorage.setItem(
      "sensitiveContent",
      settings.sensitiveContentFilter ? "1" : "0",
    );
  }, [settings.darkMode, settings.textSize, settings.sensitiveContentFilter]);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      saveSettings(updated);
      return updated;
    });
  };

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

  const VALID_VOUCHERS: Record<string, number> = {
    RESEARCH50: 50,
    MEGATRX: 100,
    HUB2025: 25,
  };

  const handleRedeem = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    const redeemedCodes: string[] = JSON.parse(
      localStorage.getItem("redeemed_codes") || "[]",
    );
    if (redeemedCodes.includes(code)) {
      setVoucherMsg({
        type: "error",
        text: "This code has already been redeemed.",
      });
      return;
    }
    const bonus = VALID_VOUCHERS[code];
    if (!bonus) {
      setVoucherMsg({ type: "error", text: "Invalid voucher code." });
      return;
    }
    // Add credits
    const user = JSON.parse(localStorage.getItem("researchHubUser") || "{}");
    user.credits = (user.credits || 0) + bonus;
    localStorage.setItem("researchHubUser", JSON.stringify(user));
    redeemedCodes.push(code);
    localStorage.setItem("redeemed_codes", JSON.stringify(redeemedCodes));
    setCredits(getCreditsBalance());
    setVoucherCode("");
    setVoucherMsg({
      type: "success",
      text: `+${bonus} credits added! New balance: ${user.credits}`,
    });
    toast.success(`Voucher redeemed! +${bonus} credits`);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    toast.success("Settings saved!");
    setTimeout(() => setSaved(false), 3000);
  };

  const card = {
    background: "oklch(0.13 0.025 260)",
    border: "1px solid oklch(0.22 0.04 260)",
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Settings
          className="w-5 h-5"
          style={{ color: "oklch(0.65 0.18 220)" }}
        />
        <h1
          className="text-lg font-bold"
          style={{ color: "oklch(0.92 0.03 240)" }}
        >
          Settings
        </h1>
      </div>

      {/* Display & Appearance */}
      <div className="p-4 rounded-xl space-y-4" style={card}>
        <h2
          className="text-sm font-semibold"
          style={{ color: "oklch(0.88 0.03 240)" }}
        >
          Display &amp; Appearance
        </h2>

        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <div>
            <Label style={{ color: "oklch(0.85 0.03 240)" }}>Dark Mode</Label>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.50 0.05 240)" }}
            >
              Use dark color scheme throughout the app
            </p>
          </div>
          <Switch
            data-ocid="settings.switch"
            checked={settings.darkMode}
            onCheckedChange={(v) => updateSetting("darkMode", v)}
          />
        </div>

        {/* Compact Mode */}
        <div className="flex items-center justify-between">
          <div>
            <Label style={{ color: "oklch(0.85 0.03 240)" }}>
              Compact Mode
            </Label>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.50 0.05 240)" }}
            >
              Reduce spacing for more content on screen
            </p>
          </div>
          <Switch
            data-ocid="settings.switch"
            checked={settings.compactMode}
            onCheckedChange={(v) => updateSetting("compactMode", v)}
          />
        </div>

        {/* Text Size */}
        <div className="flex items-center justify-between">
          <div>
            <Label style={{ color: "oklch(0.85 0.03 240)" }}>Text Size</Label>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.50 0.05 240)" }}
            >
              Adjust font size across the app
            </p>
          </div>
          <div className="flex gap-1.5">
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                type="button"
                data-ocid="settings.toggle"
                onClick={() => updateSetting("textSize", size)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize"
                style={{
                  background:
                    settings.textSize === size
                      ? "oklch(0.52 0.18 220 / 0.2)"
                      : "oklch(0.18 0.03 260)",
                  color:
                    settings.textSize === size
                      ? "oklch(0.72 0.18 220)"
                      : "oklch(0.55 0.05 240)",
                  border:
                    settings.textSize === size
                      ? "1px solid oklch(0.52 0.18 220 / 0.4)"
                      : "1px solid oklch(0.25 0.04 260)",
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content & Privacy */}
      <div className="p-4 rounded-xl space-y-4" style={card}>
        <h2
          className="text-sm font-semibold"
          style={{ color: "oklch(0.88 0.03 240)" }}
        >
          Content &amp; Privacy
        </h2>

        {/* Sensitive Content Filter */}
        <div className="flex items-center justify-between">
          <div>
            <Label style={{ color: "oklch(0.85 0.03 240)" }}>
              Sensitive Content Filter
            </Label>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.50 0.05 240)" }}
            >
              Blur potentially sensitive content with a warning
            </p>
          </div>
          <Switch
            data-ocid="settings.switch"
            checked={settings.sensitiveContentFilter}
            onCheckedChange={(v) => updateSetting("sensitiveContentFilter", v)}
          />
        </div>

        {/* Auto-Play Videos */}
        <div className="flex items-center justify-between">
          <div>
            <Label style={{ color: "oklch(0.85 0.03 240)" }}>
              Auto-Play Videos
            </Label>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.50 0.05 240)" }}
            >
              Automatically play videos when they appear in results
            </p>
          </div>
          <Switch
            data-ocid="settings.switch"
            checked={settings.autoPlayVideos}
            onCheckedChange={(v) => updateSetting("autoPlayVideos", v)}
          />
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <Label style={{ color: "oklch(0.85 0.03 240)" }}>
              Notifications
            </Label>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.50 0.05 240)" }}
            >
              Show community activity and reply alerts
            </p>
          </div>
          <Switch
            data-ocid="settings.switch"
            checked={settings.notifications}
            onCheckedChange={(v) => updateSetting("notifications", v)}
          />
        </div>
      </div>

      {/* Custom Archive.org Collections */}
      <div className="p-4 rounded-xl" style={card}>
        <h2
          className="text-sm font-semibold mb-1"
          style={{ color: "oklch(0.88 0.03 240)" }}
        >
          Custom Archive.org Collections
        </h2>
        <p className="text-xs mb-3" style={{ color: "oklch(0.50 0.05 240)" }}>
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
          <p
            className="text-xs italic"
            style={{ color: "oklch(0.45 0.04 240)" }}
          >
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
                  className="hover:text-red-400 transition-colors"
                  style={{ color: "oklch(0.50 0.05 240)" }}
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
        <div className="p-4 rounded-xl" style={card}>
          <h2
            className="text-sm font-semibold mb-1"
            style={{ color: "oklch(0.88 0.03 240)" }}
          >
            AI Search Credits
          </h2>
          <p className="text-xs mb-3" style={{ color: "oklch(0.50 0.05 240)" }}>
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

      {/* Voucher / Promo Code */}
      <div className="p-4 rounded-xl" style={card}>
        <h2
          className="text-sm font-semibold mb-1"
          style={{ color: "oklch(0.88 0.03 240)" }}
        >
          Voucher / Promo Code
        </h2>
        <p className="text-xs mb-3" style={{ color: "oklch(0.50 0.05 240)" }}>
          Balance:{" "}
          <span className="font-mono" style={{ color: "oklch(0.65 0.18 145)" }}>
            {credits} credits
          </span>
        </p>
        <div className="flex gap-2 mb-2">
          <Input
            data-ocid="settings.input"
            value={voucherCode}
            onChange={(e) => {
              setVoucherCode(e.target.value.toUpperCase());
              setVoucherMsg(null);
            }}
            placeholder="Enter code (e.g. MEGATRX)"
            className="flex-1 text-white font-mono tracking-wider"
            style={{ color: "white" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRedeem();
              }
            }}
          />
          <Button
            type="button"
            data-ocid="settings.primary_button"
            onClick={handleRedeem}
            size="sm"
            style={{ background: "oklch(0.52 0.18 145)" }}
          >
            Redeem
          </Button>
        </div>
        {voucherMsg && (
          <p
            data-ocid={
              voucherMsg.type === "success"
                ? "settings.success_state"
                : "settings.error_state"
            }
            className="text-xs mt-1"
            style={{
              color:
                voucherMsg.type === "success"
                  ? "oklch(0.65 0.18 145)"
                  : "oklch(0.65 0.18 20)",
            }}
          >
            {voucherMsg.text}
          </p>
        )}
      </div>

      {/* Save */}
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
  );
}
