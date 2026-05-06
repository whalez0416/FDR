import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedRestaurant } from './scraper';

export class HyundaiPangyoScraper extends BaseScraper {
  mallName = '현대백화점 판교점';
  // Pangyo Branch Code: B00148000
  baseUrl = 'https://www.ehyundai.com/newGP/SD/SD000001.do?branchCd=B00148000';

  /**
   * Fetches the restaurant list from Hyundai Pangyo website.
   * Note: In a production environment, you might need a proxy or a real browser (Playwright) 
   * if the site uses heavy JS rendering.
   */
  async fetchRestaurants(): Promise<ScrapedRestaurant[]> {
    try {
      const response = await fetch(this.baseUrl);
      const html = await response.text();
      const $ = cheerio.load(html);
      const results: ScrapedRestaurant[] = [];

      // Selector for restaurant items (hypothetical based on common Hyundai Mall structure)
      // Actual selector would need to be verified against the live site.
      $('.restaurant-list-item, .store-info').each((_, element) => {
        const rawData = {
          name: $(element).find('.name, .title').text().trim(),
          category: $(element).find('.category, .type').text().trim(),
          floor: $(element).find('.floor').text().trim(),
          description: $(element).find('.desc, .info-text').text().trim(),
          phone: $(element).find('.phone, .tel').text().trim(),
        };

        if (rawData.name) {
          results.push(this.transform(rawData));
        }
      });

      return results;
    } catch (error) {
      console.error(`Error scraping ${this.mallName}:`, error);
      return [];
    }
  }

  /**
   * Transforms raw scraped data into our ScrapedRestaurant format
   * and performs keyword analysis for parenting convenience.
   */
  transform(data: any): ScrapedRestaurant {
    const description = data.description || '';
    
    // Keyword matching for parenting filters
    const isStrollerFriendly = /유모차|진입|광장|유모차 진입/i.test(description);
    const nearNursingRoom = /유아휴게실|수유실|아기쉼터|인접/i.test(description);
    const hasHighchair = /아기의자|하이체어|베이비체어/i.test(description);

    return {
      name: data.name,
      category: data.category || '기타',
      floor: this.formatFloor(data.floor),
      status: 'OPEN', // Default to OPEN if found on site
      stroller_accessible: isStrollerFriendly,
      highchair_available: hasHighchair,
      // Note: nursing_room_distance might need mapping against mall map data
      description: description,
    };
  }

  /**
   * Helper to normalize floor strings (e.g., "5층" -> "5F", "지하 1층" -> "B1")
   */
  private formatFloor(floor: string): string {
    if (floor.includes('지하')) {
      const num = floor.replace(/[^0-9]/g, '');
      return `B${num}`;
    }
    const num = floor.replace(/[^0-9]/g, '');
    return `${num}F`;
  }
}
