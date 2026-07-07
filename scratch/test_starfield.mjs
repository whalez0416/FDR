// ponytail: quick self-check for scrapeStarfield — run with `npx tsx scratch/test_starfield.mjs`
import { UrlScraper } from '../lib/sync/urlScraper';
const s = new UrlScraper();
for (const b of ['hanam', 'wirye']) {
  const r = await s.scrapeRestaurantsFromUrl(`https://www.starfield.co.kr/${b}/tenant/categoryInfo.do`, `스타필드 ${b}`);
  console.log(b, r.data.length, JSON.stringify(r.data.slice(0, 3), null, 1));
  if (r.data.length === 0) { console.error('FAIL: 0 items for ' + b); process.exit(1); }
}
console.log('OK');
