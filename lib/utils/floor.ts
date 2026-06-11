/**
 * Floor parsing & nursing-room distance helpers.
 *
 * Real walking distance (meters) to a nursing room is not published on any
 * department-store website, so we derive a reliable relative measure from data
 * we DO have: the restaurant's floor and the mall's nursing-room floor.
 */

/**
 * Parse a free-form floor string into a signed integer level.
 *  - 1F / 1층 / 지상 1층      ->  1
 *  - B1 / B1F / 지하 1층      -> -1
 *  - 본관 지하1 / 신관 B2     -> -1 / -2
 *  - 6층 / 9F                 ->  6 / 9
 * Returns null when no floor number can be found.
 */
export function parseFloor(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = String(raw).replace(/\s+/g, '');

  // Basement: "지하1", "지하 1층", "B1", "B1F"
  const basement = s.match(/지하\s*(\d+)/) || s.match(/\bB\s*(\d+)/i);
  if (basement) return -Math.abs(parseInt(basement[1], 10));

  // Above ground: "6층", "지상6층", "9F", "1F"
  const ground = s.match(/(\d+)\s*층/) || s.match(/(\d+)\s*F/i);
  if (ground) return Math.abs(parseInt(ground[1], 10));

  // Bare number fallback ("6")
  const bare = s.match(/-?\d+/);
  if (bare) return parseInt(bare[0], 10);

  return null;
}

/** Human-readable label for a signed floor level. -1 -> "지하 1층", 6 -> "6층". */
export function floorToText(level: number | null): string {
  if (level === null) return '';
  if (level < 0) return `지하 ${-level}층`;
  return `${level}층`;
}

/**
 * Extract the nursing-room floor from the free-form text stored in malls.district
 * (e.g. "유아휴게실: 본관 6층 서비스라운지 옆" -> 6, "5층 유아휴게실" -> 5).
 */
export function nursingFloorFromText(text: string | null | undefined): number | null {
  if (!text) return null;
  // Prefer a floor token that appears near a nursing-room keyword.
  const keyword = text.match(/(?:유아휴게실|수유실|아기쉼터|유아휴게)[^0-9]{0,12}(지하\s*\d+층?|\d+\s*층|B\s*\d+|\d+\s*F)/i)
    || text.match(/(지하\s*\d+층?|\d+\s*층|B\s*\d+|\d+\s*F)\s*(?:에\s*)?(?:유아휴게실|수유실)/i);
  if (keyword) return parseFloor(keyword[1]);
  // Fall back to the first floor token anywhere in the string.
  return parseFloor(text);
}

export type NursingDistance = {
  /** Absolute floor of the nursing room, e.g. "6층". Empty when unknown. */
  floorText: string;
  /** Relative label, e.g. "같은 층", "2개 층 위", "3개 층 아래". Empty when unknown. */
  relative: string;
  /** True when we have enough data to show anything. */
  known: boolean;
};

/**
 * Build both the absolute location ("6층") and the relative distance
 * ("2개 층 위") of the nursing room from a given restaurant floor.
 */
export function nursingDistance(
  restaurantFloor: string | null | undefined,
  nursingFloorText: string | null | undefined
): NursingDistance {
  const nursing = nursingFloorFromText(nursingFloorText);
  if (nursing === null) {
    return { floorText: '', relative: '', known: false };
  }

  const floorText = floorToText(nursing);
  const rest = parseFloor(restaurantFloor);
  if (rest === null) {
    // We know where the nursing room is, but not the restaurant's floor.
    return { floorText, relative: '', known: true };
  }

  const diff = nursing - rest;
  let relative: string;
  if (diff === 0) relative = '같은 층';
  else if (diff > 0) relative = `${diff}개 층 위`;
  else relative = `${-diff}개 층 아래`;

  return { floorText, relative, known: true };
}
