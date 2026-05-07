import { ScrapedRestaurant } from './scraper';

export class KakaoPlaceService {
  private apiKey: string;
  private baseUrl = 'https://dapi.kakao.com/v2/local/search/keyword.json';

  constructor() {
    // Falls back to process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
    this.apiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || process.env.KAKAO_REST_API_KEY || '';
  }

  async fetchRestaurantsForMall(mallName: string, targetCategory?: string): Promise<ScrapedRestaurant[]> {
    if (!this.apiKey) {
      console.warn('Kakao REST API Key is missing. Returning empty array.');
      return [];
    }

    let categories = [
      { code: 'FD6', label: '음식점' },
      { code: 'CE7', label: '카페' }
    ];

    if (targetCategory && ['카페', '베이커리', '디저트', '커피'].includes(targetCategory)) {
       categories = [{ code: 'CE7', label: '카페' }];
    } else if (targetCategory) {
       categories = [{ code: 'FD6', label: '음식점' }];
    }

    let allResults: ScrapedRestaurant[] = [];
    const seenNames = new Set<string>();

    const shortName = mallName.replace('현대백화점 ', '');
    const baseVariations = [
      mallName,
      `현백 ${shortName}`,
      `${shortName.replace('점', '')} 현백`
    ];

    // If targetCategory is provided, append it to the search keyword (e.g., "판교점 한식")
    const searchVariations = targetCategory 
      ? baseVariations.map(v => `${v} ${targetCategory}`)
      : baseVariations;

    for (const searchKeyword of searchVariations) {
      for (const cat of categories) {
        let page = 1;
        let isEnd = false;

        while (!isEnd && page <= 3) {
          try {
            const queryUrl = `${this.baseUrl}?query=${encodeURIComponent(searchKeyword)}&category_group_code=${cat.code}&page=${page}&size=15`;
            
            const response = await fetch(queryUrl, {
              headers: {
                'Authorization': `KakaoAK ${this.apiKey}`
              }
            });

            if (!response.ok) break;

            const data = await response.json();
            const places = data.documents || [];
            
            for (const place of places) {
              // Clean the name
              let cleanName = place.place_name
                .replace('현대백화점', '')
                .replace(shortName, '')
                .replace('판교점', '')
                .replace('무역센터점', '')
                .replace('압구정본점', '')
                .replace('더현대서울', '')
                .replace('더현대 서울', '')
                .trim();
              
              if (!cleanName) cleanName = place.place_name;

              // Avoid duplicates
              if (seenNames.has(cleanName)) continue;
              seenNames.add(cleanName);

              let specificCategory = cat.label;
              if (place.category_name) {
                const parts = place.category_name.split('>');
                if (parts.length > 1) specificCategory = parts[parts.length - 1].trim();
              }

              allResults.push({
                name: cleanName,
                category: specificCategory,
                floor: '안내데스크 확인',
                status: 'OPEN',
                stroller_accessible: true,
                highchair_available: true,
                description: `전화번호: ${place.phone || '없음'} | 카카오맵 링크: ${place.place_url}`,
                mall_name: mallName
              });
            }

            isEnd = data.meta?.is_end || true;
            page++;
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (err) {
            console.error(`Fetch error for Kakao API:`, err);
            break;
          }
        }
      }
    }

    console.log(`KakaoPlaceService: Found ${allResults.length} places for ${mallName}`);
    return allResults;
  }
}
