import { load } from 'cheerio';
import { BaseScraper, ScrapedRestaurant } from './scraper';

export const HYUNDAI_BRANCHES = [
  { name: '더현대 서울', code: 'B00140000' },
  { name: '더현대 대구', code: 'B00146000' },
  { name: '압구정본점', code: 'B00121000' },
  { name: '무역센터점', code: 'B00122000' },
  { name: '천호점', code: 'B00126000' },
  { name: '신촌점', code: 'B00127000' },
  { name: '미아점', code: 'B00141000' },
  { name: '목동점', code: 'B00142000' },
  { name: '중동점', code: 'B00143000' },
  { name: '킨텍스점', code: 'B00145000' },
  { name: '디큐브시티', code: 'B00149000' },
  { name: '판교점', code: 'B00148000' },
  { name: '울산점', code: 'B00129000' },
  { name: '충청점', code: 'B00147000' },
  { name: '커넥트현대 부산', code: 'B00124000' },
  { name: '현대프리미엄아울렛 김포점', code: 'B00172000' },
  { name: '현대프리미엄아울렛 송도점', code: 'B00174000' },
  { name: '현대프리미엄아울렛 대전점', code: 'B00177000' },
  { name: '현대프리미엄아울렛 SPACE 1', code: 'B00178000' }
];

export class HyundaiMallScraper extends BaseScraper {
  async fetchByBranch(branchName: string, branchCode: string): Promise<ScrapedRestaurant[]> {
    const categories = [
      { id: 'B0670100', label: '전문식당가' },
      { id: 'B0670200', label: '푸드코트' },
      { id: 'B0670300', label: '카페' },
      { id: 'B0670400', label: '베이커리' }
    ];

    const branchResults: ScrapedRestaurant[] = [];
    const baseUrl = `https://www.ehyundai.com/newPortal/DP/DP000000_V.do?branchCd=${branchCode}`;

    for (const cat of categories) {
      try {
        const url = `${baseUrl}&diningGubn=${cat.id}`;
        console.log(`[Scraper] Requesting: ${branchName} - ${cat.label}`);
        
        const response = await fetch(url, {
          cache: 'no-store', // Force Vercel to bypass cache
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.ehyundai.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
          }
        });

        if (!response.ok) {
          console.error(`[Scraper] HTTP Error ${response.status} for ${branchName}`);
          continue;
        }
        
        const html = await response.text();
        if (html.includes('보안') || html.includes('접속이 제한')) {
          console.warn(`[Scraper] Security Blocked for ${branchName}`);
          continue;
        }

        const $ = load(html);

        $('.dining-list li, .store-list li').each((_, element) => {
          const name = $(element).find('.name, .tit').text().trim();
          const floorRaw = $(element).find('.floor, .loc, dt:contains("위치") + dd').text().trim();
          const phone = $(element).find('.tel, dt:contains("전화번호") + dd').text().trim();
          const description = $(element).find('.desc, .info-text').text().trim();

          if (name) {
            branchResults.push({
              name,
              category: cat.label,
              floor: this.formatFloor(floorRaw),
              status: 'OPEN',
              stroller_accessible: true,
              highchair_available: true,
              description,
              phone,
              mall_name: branchName // Added for multi-mall sync
            });
          }
        });
        // Small delay to be polite to the server
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error scraping ${branchName} - ${cat.label}:`, error);
      }
    }
    return branchResults;
  }

  // Legacy support for single fetch (default to Pangyo)
  async fetchRestaurants(): Promise<ScrapedRestaurant[]> {
    return this.fetchByBranch('현대백화점 판교점', 'B00148000');
  }

  private formatFloor(floor: string | undefined): string {
    if (!floor) return '1F';
    let f = floor.replace(/층/g, '').replace(/지하/g, 'B').trim();
    if (!f.startsWith('B') && !f.endsWith('F') && !isNaN(Number(f))) f = f + 'F';
    return f.toUpperCase();
  }
}
