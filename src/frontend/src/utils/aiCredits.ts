// AI Credits utility - localStorage based

const DAILY_LIMIT = 10;
const DATE_KEY = "ai_searches_date";
const COUNT_KEY = "ai_searches_count";
const CREDITS_KEY = "ai_credits_balance";
const ADMIN_KEY = "adminUnlocked";

export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function getCreditsBalance(): number {
  return Number.parseInt(localStorage.getItem(CREDITS_KEY) || "0", 10);
}

export function getRemainingSearches(): number {
  if (isAdmin()) return Number.POSITIVE_INFINITY;
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(DATE_KEY);
  const count =
    storedDate === today
      ? Number.parseInt(localStorage.getItem(COUNT_KEY) || "0", 10)
      : 0;
  const credits = getCreditsBalance();
  return Math.max(0, DAILY_LIMIT + credits - count);
}

export function canSearch(): boolean {
  if (isAdmin()) return true;
  return getRemainingSearches() > 0;
}

export function recordSearch(): void {
  if (isAdmin()) return;
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(DATE_KEY);
  let count =
    storedDate === today
      ? Number.parseInt(localStorage.getItem(COUNT_KEY) || "0", 10)
      : 0;
  count++;
  localStorage.setItem(DATE_KEY, today);
  localStorage.setItem(COUNT_KEY, String(count));
}

export function addCredits(amount: number): void {
  const current = getCreditsBalance();
  localStorage.setItem(CREDITS_KEY, String(current + amount));
}

export function claimDailyLogin(): boolean {
  const key = "ai_daily_login_claimed";
  const today = new Date().toDateString();
  if (localStorage.getItem(key) === today) return false;
  localStorage.setItem(key, today);
  addCredits(2);
  return true;
}

export function claimInstallReward(): boolean {
  const key = "ai_install_reward_claimed";
  if (localStorage.getItem(key) === "true") return false;
  localStorage.setItem(key, "true");
  addCredits(5);
  return true;
}

export function claimCommunityParticipation(): boolean {
  const key = "ai_community_reward_date";
  const today = new Date().toDateString();
  if (localStorage.getItem(key) === today) return false;
  localStorage.setItem(key, today);
  addCredits(1);
  return true;
}

export function getDailyUsage(): {
  used: number;
  limit: number;
  credits: number;
} {
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(DATE_KEY);
  const used =
    storedDate === today
      ? Number.parseInt(localStorage.getItem(COUNT_KEY) || "0", 10)
      : 0;
  const credits = getCreditsBalance();
  return { used, limit: DAILY_LIMIT, credits };
}
