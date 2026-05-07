import { load } from 'cheerio';
import { BaseScraper, ScrapedRestaurant } from './scraper';

export class HyundaiPangyoScraper extends BaseScraper {
  mallName = '현대백화점 판교점';
  // Pangyo Branch Code: B00148000
  baseUrl = 'https://www.ehyundai.com/newPotal/DP/DP000000_V.do?branchCd=B00148000';

  async fetchRestaurants(): Promise<ScrapedRestaurant[]> {
    // Categories split by Hyundai's site structure
    const categories = [
      { id: 'B0670100', label: '전문식당가' },
      { id: 'B0670200', label: '푸드코트' },
      { id: 'B0670300', label: '카페' },
      { id: 'B0670400', label: '베이커리' }
    ];

    const allResults: ScrapedRestaurant[] = [];

    for (const cat of categories) {
      try {
        const url = `${this.baseUrl}&diningGubn=${cat.id}`;
        console.log(`Scraping ${cat.label} at Pangyo...`);
        
        const response = await fetch(url);
        const html = await response.text();
        const $ = load(html);

        // Selecting restaurant items based on Hyundai's HTML structure
        $('.dining-list li, .store-list li').each((_, element) => {
          const name = $(element).find('.name, .tit').text().trim();
          // Position/Floor is usually in a <dd> or next to a label
          const floorRaw = $(element).find('.floor, .loc, dt:contains("위치") + dd').text().trim();
          const phone = $(element).find('.tel, dt:contains("전화번호") + dd').text().trim();
          const description = $(element).find('.desc, .info-text, .txt').text().trim();

          if (name) {
            allResults.push({
              name,
              category: cat.label,
              floor: this.formatFloor(floorRaw),
              status: 'OPEN',
              stroller_accessible: true, // Malls are generally accessible
              highchair_available: true,
              description,
              phone
            });
          }
        });
      } catch (error) {
        console.error(`Error scraping category ${cat.label}:`, error);
      }
    }

    console.log(`Total restaurants found at Pangyo: ${allResults.length}`);
    return allResults;
  }

  private formatFloor(floor: string | undefined): string {
    if (!floor) return '1F';
    // Normalize: "지하1층" -> "B1", "9층" -> "9F"
    let f = floor.replace(/층/g, '').replace(/지하/g, 'B').trim();
    if (!f.startsWith('B') && !f.endsWith('F')) f = f + 'F';
    return f.toUpperCase();
  }
}
