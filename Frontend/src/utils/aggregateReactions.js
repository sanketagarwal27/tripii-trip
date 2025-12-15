export function aggregateReactions(reactions = []) {
  const map = {};

  for (const r of reactions) {
    if (!r?.emoji) continue;
    map[r.emoji] = (map[r.emoji] || 0) + 1;
  }

  return Object.entries(map)
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count);
}
