export const DISTRICT_SYNONYMS: Record<string, string[]> = {
  kalaburagi: ["gulbarga"],
  belagavi: ["belgaum"],
  mysuru: ["mysore"],
  bengaluru: ["bangalore", "bangalore urban", "bengaluru urban"],
  shivamogga: ["shimoga"],
  tumakuru: ["tumkur"],
  hubballi: ["hubli", "hubli-dharwad"],
  mangaluru: ["mangalore", "dakshina kannada"],
};

export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]) + 1;
      }
    }
  }
  return dp[m][n];
}

export function similarityScore(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  if (str1 === str2) return 100;
  if (str1.includes(str2) || str2.includes(str1)) return 95; // very high if one is full substring

  const dist = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  return Math.max(0, 100 - (dist / maxLen) * 100);
}

export function areDistrictsMatching(declared: string, extracted: string): boolean {
  if (!extracted || !declared) return false;
  let dec = declared.toLowerCase().trim();
  let ext = extracted.toLowerCase().trim();

  // Basic similarity
  if (similarityScore(dec, ext) > 80) return true;

  // Check synonyms
  // E.g., declared is 'Gulbarga', extracted is 'Kalaburagi'
  for (const [modern, oldNames] of Object.entries(DISTRICT_SYNONYMS)) {
    if (ext.includes(modern) || oldNames.some(on => ext.includes(on))) {
       if (dec.includes(modern) || oldNames.some(on => dec.includes(on))) {
         return true;
       }
    }
  }

  // Final fallback
  return dec.split(' ')[0] === ext.split(' ')[0];
}
