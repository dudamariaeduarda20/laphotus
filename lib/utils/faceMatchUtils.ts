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
