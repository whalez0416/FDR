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
    if (url.includes('timessquare.co.kr')) {
      return this.scrapeTimesSquare(url, mallName);
    }
    if (url.includes('premiumoutlets.co.kr')) {
      return this.scrapeShinsegaeSimon(url, mallName);
    }
    if (url.includes('akplaza.com')) {
      return this.scrapeAkPlaza(url, mallName);
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
  // Times Square (영등포, 경방) — a Liferay portal. The dining list comes from a
  // paginated JSON resource endpoint (StorePortlet `get_stores`, 4 stores per
  // page) filtered by the "EAT" top category (categoryId 2). We page through
  // `cur` until `hasNext` is false. URL passed in is ignored — the endpoint is
  // fixed — it only serves to route here from scrapeRestaurantsFromUrl.
  // ---------------------------------------------------------------------------
  async scrapeTimesSquare(_url: string, mallName: string): Promise<ScrapeResult> {
    const PORTLET = 'kr_co_timessquare_store_web_portlet_StorePortlet';
    const endpoint =
      'https://www.timessquare.co.kr/web/www/floor-info' +
      `?p_p_id=${PORTLET}&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view` +
      `&p_p_cacheability=cacheLevelPage&_${PORTLET}_cmd=get_stores`;
    const EAT_CATEGORY_ID = 2;
    const MAX_PAGES = 60; // safety cap (~77 stores / 4 per page ≈ 20 pages)

    try {
      const items: ScrapedItem[] = [];
      const seen = new Set<string>();

      for (let cur = 1; cur <= MAX_PAGES; cur++) {
        const filter = JSON.stringify({
          floorIds: [],
          categoryIds: [EAT_CATEGORY_ID],
          hasEvent: false,
          favorite: false,
          cur,
        });
        const body = new URLSearchParams({ [`_${PORTLET}_params`]: filter });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            ...BROWSER_HEADERS,
            Accept: 'application/json, text/javascript, */*',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            Referer: 'https://www.timessquare.co.kr/web/www/floor-info',
          },
          body,
          cache: 'no-store',
        });
        if (!response.ok) break;

        const json = (await response.json()) as {
          stores?: Array<{
            storeName?: string;
            floorNames?: string;
            categoryNames?: string;
            phone1?: string;
          }>;
          hasNext?: boolean;
        };

        for (const s of json.stores || []) {
          const name = (s.storeName || '').replace(/\s+/g, ' ').trim();
          if (!name || seen.has(name)) continue;
          seen.add(name);
          items.push({
            name,
            category: (s.categoryNames || '식당').replace(/\s+/g, ' ').trim(),
            floor: (s.floorNames || '정보 없음').trim(),
            phone: (s.phone1 || '').trim() || undefined,
          });
        }

        if (!json.hasNext) break;
        await new Promise((r) => setTimeout(r, 120));
      }

      console.log(`[UrlScraper] TimesSquare parsed ${items.length} restaurants for ${mallName}`);
      return { data: items, nursingInfo: null };
    } catch (error) {
      console.error(`[UrlScraper] TimesSquare parse error for ${mallName}:`, error);
      return { data: [], nursingInfo: null };
    }
  }

  // ---------------------------------------------------------------------------
  // Shinsegae Simon Premium Outlets (여주·파주·부산·시흥·제주) — one Vue app
  // serves every outlet from a single /api/brand JSON feed (~1000 brands, all
  // locations). There is NO dining category: eateries sit in category 11
  // ("기타") alongside a handful of non-food services (info desks, Olive Young,
  // Daiso, pop-ups…). Brand names alone can't reliably separate them, so we
  // pre-filter to category 11 for the requested outlet, then let GPT keep only
  // the actual restaurants/cafes — accurate classification, no fabricated data.
  // Outlet is identified by the storeCode in the URL (…/main/index/<storeCode>).
  // ---------------------------------------------------------------------------
  private static readonly SIMON_STORE_CODES: Record<string, string> = {
    '01': 'yeoju',
    '02': 'paju',
    '03': 'busan',
    '05': 'siheung',
    '06': 'jeju',
  };
  private static readonly SIMON_DINING_CATEGORY_NO = 11; // "기타" — holds the eateries

  async scrapeShinsegaeSimon(url: string, mallName: string): Promise<ScrapeResult> {
    try {
      const codeMatch = url.match(/index\/(\d+)/);
      const storeCode = codeMatch ? codeMatch[1] : '';
      const area = UrlScraper.SIMON_STORE_CODES[storeCode];
      if (!area) throw new Error(`Unknown Shinsegae Simon storeCode in URL: ${url}`);

      const response = await fetch('https://www.premiumoutlets.co.kr/api/brand', {
        headers: { ...BROWSER_HEADERS, Accept: 'application/json, */*' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Simon /api/brand HTTP ${response.status}`);

      const brands = (await response.json()) as Array<{
        brandKorean?: string;
        brandArea?: string;
        brandAreaEnglish?: string;
        brandTel?: string;
        area?: string;
        categoryList?: Array<{ brandCategoryNo?: number }>;
      }>;

      const candidates = brands.filter(
        (b) =>
          b.area === area &&
          (b.categoryList || []).some((c) => c.brandCategoryNo === UrlScraper.SIMON_DINING_CATEGORY_NO)
      );
      if (candidates.length === 0) return { data: [], nursingInfo: null };

      const foodNames = await this.classifyFoodBrands(
        candidates.map((b) => (b.brandKorean || '').trim()).filter(Boolean),
        mallName
      );
      const keep = new Set(foodNames);

      const items: ScrapedItem[] = [];
      const seen = new Set<string>();
      for (const b of candidates) {
        const name = (b.brandKorean || '').replace(/\s+/g, ' ').trim();
        if (!name || seen.has(name) || !keep.has(name)) continue;
        seen.add(name);
        const isCafe = /커피|카페|coffee|베이커리|도넛|디저트|젤라|빙수|호두과자|케이크/.test(name);
        items.push({
          name,
          category: isCafe ? '카페/디저트' : '식당',
          floor: (b.brandArea || b.brandAreaEnglish || '정보 없음').trim(),
          phone: (b.brandTel || '').trim() || undefined,
        });
      }

      console.log(`[UrlScraper] Shinsegae Simon (${area}) parsed ${items.length}/${candidates.length} eateries for ${mallName}`);
      return { data: items, nursingInfo: null };
    } catch (error) {
      console.error(`[UrlScraper] Shinsegae Simon parse error for ${mallName}:`, error);
      return { data: [], nursingInfo: null };
    }
  }

  // ---------------------------------------------------------------------------
  // AK Plaza (AK& / AK플라자) — the floor guide loads each floor's brands via
  // `/ajax/html/getFloorDetailHtml?branchCode=XX&categoryCode=2&seq=N`, one
  // call per floor tab. Each floor's HTML groups brands under <article> blocks
  // whose <h3> names the category ("F&B", "전문식당가", "카페"…); we keep only
  // the food categories. Floor seqs differ per branch, so we first read the
  // floor page (`/store/floor?store=XX`) and scrape the callFloorDetail('N')
  // handlers to collect them. Fully server-rendered — no GPT needed. The branch
  // code comes from `store=` in the URL.
  // ---------------------------------------------------------------------------
  async scrapeAkPlaza(url: string, mallName: string): Promise<ScrapeResult> {
    const AK_ORIGIN = 'https://www.akplaza.com';
    // A category is food when its <h3> label names a place to eat or drink.
    // Kids' cafes are play facilities, not dining, so they're excluded.
    const isFoodCategory = (label: string): boolean => {
      if (/키즈\s*카페/.test(label)) return false;
      if (/F\s*&\s*B/i.test(label)) return true;
      return /식당|레스토랑|델리|다이닝|푸드|베이커리|디저트|분식|스낵|카페|커피|맛집|다과/.test(label);
    };

    try {
      const branchCode = url.match(/store=(\d+)/)?.[1] || '';
      if (!branchCode) throw new Error(`AK Plaza: no store code in URL: ${url}`);
      const floorPageUrl = `${AK_ORIGIN}/store/floor?store=${branchCode}`;

      // 1) Floor page → the seq of every floor tab (callFloorDetail('N')).
      const floorPage = await fetch(floorPageUrl, { headers: BROWSER_HEADERS, cache: 'no-store' });
      if (!floorPage.ok) throw new Error(`AK Plaza floor page HTTP ${floorPage.status}`);
      const floorHtml = await floorPage.text();
      const seqs: string[] = [];
      const seqSeen = new Set<string>();
      const seqRe = /callFloorDetail\('(\d+)'\)/g;
      let seqMatch: RegExpExecArray | null;
      while ((seqMatch = seqRe.exec(floorHtml)) !== null) {
        if (!seqSeen.has(seqMatch[1])) {
          seqSeen.add(seqMatch[1]);
          seqs.push(seqMatch[1]);
        }
      }
      if (seqs.length === 0) throw new Error('AK Plaza: no floor tabs found');

      // 2) Each floor → keep only the brands under food-category articles.
      const items: ScrapedItem[] = [];
      const seen = new Set<string>();
      for (const seq of seqs) {
        const res = await fetch(
          `${AK_ORIGIN}/ajax/html/getFloorDetailHtml?branchCode=${branchCode}&categoryCode=2&seq=${seq}`,
          {
            headers: { ...BROWSER_HEADERS, 'X-Requested-With': 'XMLHttpRequest', Referer: floorPageUrl },
            cache: 'no-store',
          }
        );
        if (!res.ok) continue;

        const $ = load(await res.text());
        const floor = $('.titleArea strong').first().text().trim() || '정보 없음';

        $('.resultsArea article').each((_, art) => {
          const category = $(art).find('h3').first().text().replace(/\s+/g, ' ').trim();
          if (!isFoodCategory(category)) return;
          $(art).find('li').each((__, li) => {
            const name = $(li).find('strong').first().text().replace(/\s+/g, ' ').trim();
            if (!name || seen.has(name)) return;
            seen.add(name);
            const phone = $(li).find('span').first().text().trim();
            items.push({ name, category: category || '식당', floor, phone: phone || undefined });
          });
        });

        await new Promise((r) => setTimeout(r, 100));
      }

      console.log(`[UrlScraper] AK Plaza (${branchCode}) parsed ${items.length} restaurants for ${mallName}`);
      return { data: items, nursingInfo: null };
    } catch (error) {
      console.error(`[UrlScraper] AK Plaza parse error for ${mallName}:`, error);
      return { data: [], nursingInfo: null };
    }
  }

  /**
   * Classify a list of outlet brand names, returning only the ones that are
   * places to eat or drink (restaurant / cafe / bakery / dessert / food court).
   * Used by the Shinsegae Simon parser where dining isn't its own category.
   * On any failure returns [] so the caller skips this mall rather than
   * registering mislabeled data.
   */
  private async classifyFoodBrands(names: string[], mallName: string): Promise<string[]> {
    if (names.length === 0) return [];
    try {
      const prompt = `다음은 "${mallName}"(신세계사이먼 프리미엄아울렛)의 "기타" 카테고리 브랜드 목록이다.
이 중 **사람이 먹거나 마시는 곳**(식당·레스토랑·카페·베이커리·디저트·푸드코트·분식 등)만 골라라.
패션/화장품(올리브영 등)/잡화/전자제품/안내센터/팝업스토어/마트/마켓/전시 등 먹는 곳이 아닌 것은 모두 제외한다.

브랜드 목록:
${names.map((n) => `- ${n}`).join('\n')}

반드시 아래 JSON 형식으로만 답하라. 먹는 곳의 이름을 원본 그대로 넣어라:
{"food": ["이름1", "이름2"]}`;

      const completion = await this.getOpenai().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a precise classifier. Respond only with the requested JSON object.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{"food":[]}') as { food?: string[] };
      const allowed = new Set(names);
      return (parsed.food || []).filter((n) => allowed.has(n)); // guard against hallucinated names
    } catch (error) {
      console.error(`[UrlScraper] Shinsegae Simon food classification failed for ${mallName}:`, error);
      return [];
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
