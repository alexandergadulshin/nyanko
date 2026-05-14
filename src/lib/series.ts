/**
 * Series-title normalization — shared by the recommendation engine and the
 * search results dedup. Strips trailing season / sequel / movie markers so
 * different entries of the same franchise collapse to one key.
 *
 * Deliberately conservative: it's better to miss a merge than to wrongly
 * fuse two unrelated shows.
 */

const MARKER_PATTERNS: RegExp[] = [
  /\s*[:\-]?\s*the final season\s*$/,
  /\s*[:\-]?\s*final season\s*$/,
  /\s*[:\-]?\s*season\s+\d+\s*$/,
  /\s*[:\-]?\s*\d+(?:st|nd|rd|th)\s+season\s*$/,
  /\s*[:\-]?\s*part\s+\d+\s*$/,
  /\s*[:\-]?\s*cour\s+\d+\s*$/,
  /\s*[:\-]?\s*(?:the\s+)?movie(?:\s+\d+)?\s*$/,
  /\s+(?:ii|iii|iv|v|vi|vii|viii|ix|x)\s*$/,
];

/** Strip trailing season / part / cour / movie markers from a title. */
export function seriesKey(title: string): string {
  let t = title.toLowerCase().trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of MARKER_PATTERNS) {
      const next = t.replace(re, "").trim();
      if (next !== t && next.length >= 2) {
        t = next;
        changed = true;
      }
    }
  }
  return t;
}

/** True when the title carries a season / sequel / movie marker (not season 1). */
export function hasSeasonMarker(title: string): boolean {
  return seriesKey(title) !== title.toLowerCase().trim();
}
