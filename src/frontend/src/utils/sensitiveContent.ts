const SENSITIVE_KEYWORDS = [
  "adult",
  "explicit",
  "nsfw",
  "mature",
  "violence",
  "gore",
  "sexual",
  "nude",
  "nudity",
  "disturbing",
  "graphic",
  "warning",
  "sensitive",
  "18+",
  "xxx",
  "porn",
  "erotic",
  "brutal",
  "gory",
];

export function isSensitiveContent(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
}
