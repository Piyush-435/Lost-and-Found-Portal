import { db }                from '../config/db.js';
import { items, matches }    from '../db/schema.js';
import { eq, and, ne }       from 'drizzle-orm';

// removes special chars, lowercases, splits into words, filters short words
const extractKeywords = (str) => {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
};

// counts how many keywords two strings share
const countKeywordMatches = (str1, str2) => {
  const keywords1 = extractKeywords(str1);
  const keywords2 = extractKeywords(str2);
  return keywords1.filter(word => keywords2.includes(word)).length;
};

// checks if two dates are within N days of each other (default 7)
const isWithinDays = (date1, date2, days = 7) => {
  const diff = Math.abs(new Date(date1).getTime() - new Date(date2).getTime());
  return diff <= days * 24 * 60 * 60 * 1000;
};

// calculates match score between a lost and found item
// max score = 113, threshold to save = 40
const calculateScore = (lostItem, foundItem) => {
  let score = 0;

  // same category → +40
  if (lostItem.category === foundItem.category) score += 40;

  // location keyword overlap → up to +30
  const locationMatches = countKeywordMatches(lostItem.location, foundItem.location);
  score += Math.min(locationMatches * 10, 30);

  // dates within 7 days → +20
  if (lostItem.date && foundItem.date && isWithinDays(lostItem.date, foundItem.date)) score += 20;

  // name keyword overlap → up to +20
  const nameMatches = countKeywordMatches(lostItem.name, foundItem.name);
  score += Math.min(nameMatches * 10, 20);

  // description keyword overlap → up to +3
  const descMatches = countKeywordMatches(lostItem.description, foundItem.description);
  score += Math.min(descMatches * 1, 3);

  return score;
};

// finds and saves matches for a newly submitted item
// returns number of new matches found
export const findAndSaveMatches = async (newItem) => {
  try {
    const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';

    // fetch all active opposite-type items excluding same user
    const oppositeItems = await db.select().from(items)
      .where(and(
        eq(items.type,    oppositeType),
        eq(items.status,  'active'),
        ne(items.userId,  newItem.userId)
      ));

    const matchesToInsert = [];

    for (const candidate of oppositeItems) {
      const lostItem  = newItem.type === 'lost' ? newItem    : candidate;
      const foundItem = newItem.type === 'lost' ? candidate  : newItem;

      const score = calculateScore(lostItem, foundItem);

      if (score >= 65) {
        // skip if match already exists
        const existing = await db.select().from(matches)
          .where(and(
            eq(matches.lostItemId,  lostItem.id),
            eq(matches.foundItemId, foundItem.id)
          ))
          .limit(1);

        if (!existing[0]) {
          matchesToInsert.push({
            lostItemId   : lostItem.id,
            foundItemId  : foundItem.id,
            lostUserId   : lostItem.userId,
            foundUserId  : foundItem.userId,
            lostItemName : lostItem.name,
            foundItemName: foundItem.name,
            score,
          });
        }
      }
    }

    // bulk insert all new matches
    if (matchesToInsert.length > 0) {
      await db.insert(matches).values(matchesToInsert);
    }

    return matchesToInsert.length;

  } catch (err) {
    console.error('findAndSaveMatches error:', err.message);
    return 0;
  }
};