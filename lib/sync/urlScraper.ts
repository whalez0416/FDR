import { load } from 'cheerio';
import OpenAI from 'openai';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// Hyundai dining tabs. The restaurant list is server-rendered per category,
// so we must request each one to get full coverage.
const HYUNDAI_DINING_CATEGORIES = [
  { id: 'B0670100', label: '전문식당가' },
  { id: 'B0670200', label: '푸드코트' },
  { id: 'B0670300', label: '카페' },
  { id: 'B0670400', label: '베이커리' },
];

export type ScrapedItem = { name: string; category: string; floor: string; phone?: string };
export type ScrapeResult = { data: ScrapedItem[]; nursingInfo: string | null };

export class UrlScraper {
  private openai: OpenAI | null = null;

  /** OpenAI is only needed for the generic GPT fallback; create it lazily. */
  private getOpenai(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  /**
   * Dispatch to a chain-specific parser when we recognise the host.
   * Shinsegae / Lotte / Hyundai all server-render their dining lists in a
   * stable structure, so we parse them directly — fast, free and accurate.
   * Unknown malls fall back to the generic GPT extractor.
   */
  async scrapeRestaurantsFromUrl(url: string, mallName: string): Promise<ScrapeResult> {
    console.log(`[UrlScraper] Fetching URL for ${mallName}: ${url}`);

    if (url.includes('shinsegae.com/store/restaurant.do')) {
      return this.scrapeShinsegaeViaAjax(url, mallName);
    }
    if (url.includes('lotteshopping.com')) {
      return this.scrapeLotte(url, mallName);
    }
    if (url.includes('ehyundai.com')) {
      return this.scrapeHyundai(url, mallName);
    }
    return this.scrapeGeneric(url, mallName);
  }

  // ---------------------------------------------------------------------------
  // Lotte Department Store — restaurants are in `.__item` <li> elements.
  // ---------------------------------------------------------------------------
  async scrapeLotte(url: string, mallName: string): Promise<ScrapeResult> {
    try {
      const response = await fetch(url, { headers: BROWSER_HEADERS, cache: 'no-store' });
      if (!response.ok) throw new Error(`Lotte HTTP ${response.status}`);

      const $ = load(await response.text());
      const items: ScrapedItem[] = [];
      const seen = new Set<string>();

      $('li.__item').each((_, el) => {
        const $el = $(el);
        const name = ($el.find('.__brand').first().text().trim() ||
          $el.find('img').first().attr('alt')?.trim() ||
          '').replace(/\s+/g, ' ');
        if (!name || seen.has(name)) return;

        const floor = ($el.attr('data-flrCd') || $el.find('.__floor').first().text().trim() || '').trim();
        // .__desc spans are: [category, phone]
        const descSpans = $el.find('.__desc span').map((__, s) => $(s).text().trim()).get().filter(Boolean);
        const category = ($el.attr('category-type') || descSpans[0] || '식당가').trim();

        seen.add(name);
        items.push({ name, category, floor: floor || '정보 없음' });
      });

      console.log(`[UrlScraper] Lotte parsed ${items.length} restaurants for ${mallName}`);
      return { data: items, nursingInfo: null };
    } catch (error) {
      console.error(`[UrlScraper] Lotte parse error for ${mallName}:`, error);
      return { data: [], nursingInfo: null };
    }
  }

  // ---------------------------------------------------------------------------
  // Hyundai Department Store — `.info_wrap` blocks, one fetch per dining tab.
  // ---------------------------------------------------------------------------
  async scrapeHyundai(url: string, mallName: string): Promise<ScrapeResult> {
    try {
      const branchCd = new URL(url).searchParams.get('branchCd');
      if (!branchCd) throw new Error('Hyundai URL missing branchCd');

      const items: ScrapedItem[] = [];
      const seen = new Set<string>();

      for (const cat of HYUNDAI_DINING_CATEGORIES) {
        const catUrl = `https://www.ehyundai.com/newPortal/DP/DN/DN000000_V.do?branchCd=${branchCd}&diningGubn=${cat.id}&n=2`;
        try {
          const response = await fetch(catUrl, {
            headers: { ...BROWSER_HEADERS, Referer: 'https://www.ehyundai.com/' },
            cache: 'no-store',
          });
          if (!response.ok) continue;

          const $ = load(await response.text());

          $('.info_wrap').each((_, el) => {
            const $el = $(el);
            const name = $el.find('.info_tit').first().text().trim().replace(/\s+/g, ' ');
            if (!name || seen.has(name)) return;

            let floor = '';
            let phone = '';
            $el.find('.info_desc div').each((__, d) => {
              const label = $(d).find('dt').text().trim();
              const value = $(d).find('dd').text().trim();
              if (label.includes('위치')) floor = value;
              if (label.includes('전화')) phone = value;
            });

            seen.add(name);
            items.push({ name, category: cat.label, floor: floor || '정보 없음', phone });
          });

          await new Promise((r) => setTimeout(r, 150));
        } catch (catErr) {
          console.error(`[UrlScraper] Hyundai ${cat.label} fetch failed for ${mallName}:`, catErr);
        }
      }

      console.log(`[UrlScraper] Hyundai parsed ${items.length} restaurants for ${mallName}`);
      return { data: items, nursingInfo: null };
    } catch (error) {
      console.error(`[UrlScraper] Hyundai parse error for ${mallName}:`, error);
      return { data: [], nursingInfo: null };
    }
  }

  // ---------------------------------------------------------------------------
  // Shinsegae Department Store — dining list comes from an AJAX endpoint.
  // ---------------------------------------------------------------------------
  async scrapeShinsegaeViaAjax(url: string, mallName: string): Promise<ScrapeResult> {
    try {
      const urlObj = new URL(url);
      const storeCd = urlObj.searchParams.get('storeCd') || 'SC00001';
      const storeSeq = parseInt(storeCd.replace('SC', ''), 10).toString();

      const ajaxUrl = `https://www.shinsegae.com/store/ajaxRestaurantData.do?storeSeq=${storeSeq}&storeCd=${storeCd}&schCategCd=`;
      console.log(`[UrlScraper] Intercepted Shinsegae URL. Fetching AJAX: ${ajaxUrl}`);

      const response = await fetch(ajaxUrl, {
        headers: { ...BROWSER_HEADERS, Accept: 'text/html, */*', Referer: url },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Shinsegae AJAX HTTP ${response.status}`);

      const $ = load(await response.text());
      const restaurants: ScrapedItem[] = [];

      $('li').each((_, el) => {
        const titleEl = $(el).find('.title');
        if (titleEl.length === 0) return;

        const floorText = titleEl.find('span').text().trim();
        const rawName = titleEl.text().replace(floorText, '').trim();
        const name = rawName.replace(/\s+/g, ' ').trim();
        const descText = $(el).find('.desc').text().replace(/\s+/g, ' ').trim();

        let category = '전문식당가';
        if (/카페|디저트|베이커리|커피|아이스크림/.test(descText)) category = '카페/디저트';
        else if (/어묵|떡볶이|김밥|샐러드|만두|유부초밥/.test(descText)) category = '델리';
        else if (/푸드|덮밥|텐동|일식|한식|냉면/.test(descText)) category = '푸드플라자';

        if (name) restaurants.push({ name, category, floor: floorText || '지하 1층' });
      });

      console.log(`[UrlScraper] Shinsegae parsed ${restaurants.length} restaurants for ${mallName}`);
      return { data: restaurants, nursingInfo: null };
    } catch (error) {
      console.error(`[UrlScraper] Error scraping Shinsegae AJAX:`, error);
      return { data: [], nursingInfo: null };
    }
  }

  // ---------------------------------------------------------------------------
  // Generic fallback — for malls we don't have a dedicated parser for.
  // ---------------------------------------------------------------------------
  async scrapeGeneric(url: string, mallName: string): Promise<ScrapeResult> {
    try {
      const response = await fetch(url, { headers: BROWSER_HEADERS });
      if (!response.ok) throw new Error(`HTTP Error ${response.status} for ${url}`);

      const $ = load(await response.text());
      $('script:not([type="application/json"])').remove();
      $('style, svg, img, video, iframe, nav, footer').remove();

      let pageContent = $('body').text().replace(/\s+/g, ' ').trim();
      if (pageContent.length > 100000) pageContent = pageContent.substring(0, 100000);

      const prompt = `
You are a highly capable data extraction AI.
I am providing you with the text content of a webpage for a shopping mall or department store named "${mallName}".
Your task is to find the list of all restaurants, cafes, and food stalls mentioned in this text and extract their names, categories, and floor numbers.

Webpage Text Content:
---
${pageContent}
---

If you find restaurant data, return a JSON object with a "data" array.
Each object in the array should have:
- "name": string
- "category": string (e.g., 카페, 한식, 일식)
- "floor": string (e.g., B1, 1F, 9F)

Additionally, look for any mention of a "유아휴게실" (Nursing room/Baby lounge) or "수유실" location for the entire mall.
If found, return it in a top-level "nursingInfo" field (e.g., "6층 서비스라운지 옆").

If no restaurants are found, return {"data": [], "nursingInfo": null}.
`;

      const completion = await this.getOpenai().chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content || '{"data": [], "nursingInfo": null}');
    } catch (error) {
      console.error(`[UrlScraper] Error scraping ${mallName}:`, error);
      return { data: [], nursingInfo: null };
    }
  }

  // ---------------------------------------------------------------------------
  // Facility / service page — extract nursing-room & stroller-rental locations.
  // ---------------------------------------------------------------------------
  async scrapeFacilityFromUrl(url: string, mallName: string): Promise<string | null> {
    console.log(`[UrlScraper] Fetching facility URL for ${mallName}: ${url}`);
    try {
      const response = await fetch(url, { headers: BROWSER_HEADERS });
      if (!response.ok) throw new Error(`HTTP Error ${response.status} for ${url}`);

      const $ = load(await response.text());
      $('script:not([type="application/json"])').remove();
      $('style, svg, img, video, iframe, nav, footer').remove();

      let pageContent = $('body').text().replace(/\s+/g, ' ').trim();
      if (pageContent.length > 50000) pageContent = pageContent.substring(0, 50000);

      const prompt = `
You are a highly capable data extraction AI.
I am providing you with the text content of a facility or service page for a shopping mall named "${mallName}".
Your task is to find and extract the location and information of:
1. "유아휴게실" / "수유실" / "아기 lounge" (Baby lounge / Nursing room)
2. "유모차 대여" / "유모차 대여소" (Stroller rental)

Format the output strictly as a single concise Korean sentence describing their locations.
For example:
"유아휴게실: 본관 6층 서비스라운지 옆 | 유모차대여: 1층 안내데스크"

If only one of them is found, describe only that one (e.g. "유아휴게실: 3층 아동 매장 안").
If neither is found, return "정보 없음".
`;

      const completion = await this.getOpenai().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a factual summarizer. Respond with only the concise Korean summary line. No markdown formatting.' },
          { role: 'user', content: `Webpage content for ${mallName}:\n\n${pageContent}\n\n${prompt}` },
        ],
      });

      const result = completion.choices[0].message.content?.trim();
      return result && result !== '정보 없음' ? result : null;
    } catch (error) {
      console.error(`[UrlScraper] Error scraping facility ${mallName}:`, error);
      return null;
    }
  }
}
