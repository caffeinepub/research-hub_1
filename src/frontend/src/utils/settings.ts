export interface AppSettings {
  darkMode: boolean;
  sensitiveContentFilter: boolean;
  notifications: boolean;
  compactMode: boolean;
  autoPlayVideos: boolean;
  textSize: "small" | "medium" | "large";
}

const SETTINGS_KEY = "researchhub_settings";

const DEFAULTS: AppSettings = {
  darkMode: true,
  sensitiveContentFilter: true,
  notifications: false,
  compactMode: false,
  autoPlayVideos: false,
  textSize: "medium",
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
