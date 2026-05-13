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
      
      // If the content is too large, we might need to truncate or chunk it. 
      // GPT-4o supports up to 128k tokens, which is usually >300,000 characters.
      // We will limit to 100,000 characters to be safe.
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
      return [];
    }
  }
}
