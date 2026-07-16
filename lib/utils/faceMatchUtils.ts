// Calculates percentile rank from position in sorted array (0-100 scale)
export function calculatePercentile(index: number, total: number): number {
  if (total <= 1) return 100;
  // Rank (1-based) → percentile (best=100, worst=0)
  const rank = index + 1;
  return Math.round(((total - rank + 1) / total) * 100);
}

// Color class based on percentile confidence
export function getConfidenceColor(percentile: number): string {
  if (percentile >= 80) return "bg-green-500 text-white"; // top 20%
  if (percentile >= 60) return "bg-yellow-500 text-gray-900"; // top 20-40%
  return "bg-orange-500 text-white"; // top 40%+
}

// Group matches by cluster (faceClusterId) or photo, keep best per group
export interface GroupedMatch {
  groupId: string; // cluster ID or photo ID
  bestMatch: any; // highest scoring photo in group
  allMatches: any[]; // all photos in this group
  count: number; // number of variations
}

export function groupMatchesByCluster(matches: any[]): GroupedMatch[] {
  const groups = new Map<string, any[]>();

  // Group by cluster ID (prefer) or photo ID (fallback)
  for (const match of matches) {
    const key = match.faceClusterId || match.photoId;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(match);
  }

  // For each group, select best (highest matchPercent)
  const result: GroupedMatch[] = [];
  for (const [groupId, groupMatches] of groups) {
    const best = groupMatches.reduce((a, b) =>
      (b.matchPercent || 0) > (a.matchPercent || 0) ? b : a
    );
    result.push({
      groupId,
      bestMatch: best,
      allMatches: groupMatches.sort(
        (a, b) => (b.matchPercent || 0) - (a.matchPercent || 0)
      ),
      count: groupMatches.length,
    });
  }

  // Sort by best match score
  return result.sort(
    (a, b) => (b.bestMatch.matchPercent || 0) - (a.bestMatch.matchPercent || 0)
  );
}
