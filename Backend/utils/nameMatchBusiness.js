// utils/nameMatch.js
import levenshtein from "fast-levenshtein";

export const matchNames = (a, b) => {
  if (!a || !b) return 0;

  const s1 = normalize(a);
  const s2 = normalize(b);

  const distance = levenshtein.get(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);

  return maxLen === 0 ? 1 : 1 - distance / maxLen;
};

const normalize = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim();
// currently not in use due to no verification requirements
