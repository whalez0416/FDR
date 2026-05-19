import { load } from 'cheerio';
import OpenAI from 'openai';

export class UrlScraper {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    this.openai = new OpenAI({ apiKey });
  }

  async scrapeRestaurantsFromUrl(url: string, mallName: string): Promise<any> {
    console.log(`[UrlScraper] Fetching URL for ${mallName}: ${url}`);
    
    // 1. Intercept Shinsegae Department Store dining guide URLs
    if (url.includes('shinsegae.com/store/restaurant.do')) {
      return this.scrapeShinsegaeViaAjax(url, mallName);
    }
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status} for ${url}`);
      }

      const html = await response.text();
      const $ = load(html);

      // Remove unnecessary elements to reduce text size
      $('script:not([type="application/json"])').remove();
      $('style, svg, img, video, iframe, nav, footer').remove();

      let pageContent = $('body').text().replace(/\s+/g, ' ').trim();
      
      // GPT-4o supports up to 128k tokens. We will limit to 100,000 characters.
      if (pageContent.length > 100000) {
        pageContent = pageContent.substring(0, 100000);
      }

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

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"data": [], "nursingInfo": null}');
      return result;

    } catch (error) {
      console.error(`[UrlScraper] Error scraping ${mallName}:`, error);
      return { data: [], nursingInfo: null };
    }
  }

  async scrapeFacilityFromUrl(url: string, mallName: string): Promise<string | null> {
    console.log(`[UrlScraper] Fetching facility URL for ${mallName}: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status} for ${url}`);
      }

      const html = await response.text();
      const $ = load(html);

      // Clean up body
      $('script:not([type="application/json"])').remove();
      $('style, svg, img, video, iframe, nav, footer').remove();

      let pageContent = $('body').text().replace(/\s+/g, ' ').trim();
      
      if (pageContent.length > 50000) {
        pageContent = pageContent.substring(0, 50000);
      }

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

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a factual summarizer. Respond with only the concise Korean summary line. No markdown formatting." },
          { role: "user", content: `Webpage content for ${mallName}:\n\n${pageContent}\n\n${prompt}` }
        ]
      });

      const result = completion.choices[0].message.content?.trim();
      if (result && result !== "정보 없음") {
        return result;
      }
      return null;

    } catch (error) {
      console.error(`[UrlScraper] Error scraping facility ${mallName}:`, error);
      return null;
    }
  }

  async scrapeShinsegaeViaAjax(url: string, mallName: string): Promise<any> {
    try {
      const urlObj = new URL(url);
      const storeCd = urlObj.searchParams.get('storeCd') || 'SC00001';
      const storeSeq = parseInt(storeCd.replace('SC', ''), 10).toString();
      
      const ajaxUrl = `https://www.shinsegae.com/store/ajaxRestaurantData.do?storeSeq=${storeSeq}&storeCd=${storeCd}&schCategCd=`;
      console.log(`[UrlScraper] Intercepted Shinsegae URL. Fetching AJAX: ${ajaxUrl}`);
      
      const response = await fetch(ajaxUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html, */*',
          'Referer': url
        }
      });
      
      if (!response.ok) {
        throw new Error(`Shinsegae AJAX HTTP Error ${response.status}`);
      }
      
      const html = await response.text();
      const $ = load(html);
      
      const restaurants: any[] = [];
      
      $('li').each((_, el) => {
        const titleEl = $(el).find('.title');
        if (titleEl.length === 0) return;
        
        const floorText = titleEl.find('span').text().trim();
        const rawName = titleEl.text().replace(floorText, '').trim();
        const name = rawName.replace(/\s+/g, ' ').trim();
        
        const descText = $(el).find('.desc').text().replace(/\s+/g, ' ').trim();
        
        let category = '전문식당가';
        if (descText.includes('카페') || descText.includes('디저트') || descText.includes('베이커리') || descText.includes('커피') || descText.includes('아이스크림')) {
          category = '카페/디저트';
        } else if (descText.includes('어묵') || descText.includes('떡볶이') || descText.includes('김밥') || descText.includes('샐러드') || descText.includes('만두') || descText.includes('유부초밥')) {
          category = '델리';
        } else if (descText.includes('푸드') || descText.includes('덮밥') || descText.includes('텐동') || descText.includes('일식') || descText.includes('한식') || descText.includes('냉면')) {
          category = '푸드플라자';
        }
        
        if (name) {
          restaurants.push({
            name,
            category,
            floor: floorText || '지하 1층'
          });
        }
      });
      
      console.log(`[UrlScraper] Successfully parsed ${restaurants.length} restaurants from Shinsegae AJAX!`);
      
      return {
        data: restaurants,
        nursingInfo: null
      };
      
    } catch (error) {
      console.error(`[UrlScraper] Error scraping Shinsegae AJAX:`, error);
      return { data: [], nursingInfo: null };
    }
  }
}
