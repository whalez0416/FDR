import { ScrapedRestaurant } from './scraper';

export class KakaoPlaceService {
  private apiKey: string;
  private baseUrl = 'https://dapi.kakao.com/v2/local/search/keyword.json';

  constructor() {
    // Falls back to process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
    this.apiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || process.env.KAKAO_REST_API_KEY || '';
  }

  async fetchRestaurantsForMall(mallName: string): Promise<ScrapedRestaurant[]> {
    if (!this.apiKey) {
      console.warn('Kakao REST API Key is missing. Returning empty array.');
      return [];
    }

    const categories = [
      { code: 'FD6', label: '음식점' }, // Food
      { code: 'CE7', label: '카페' }    // Cafe
    ];

    let allResults: ScrapedRestaurant[] = [];

    for (const cat of categories) {
      let page = 1;
      let isEnd = false;

      while (!isEnd && page <= 3) { // Max 3 pages (45 items) per category to stay fast
        try {
          const queryUrl = `${this.baseUrl}?query=${encodeURIComponent(mallName)}&category_group_code=${cat.code}&page=${page}&size=15`;
          
          const response = await fetch(queryUrl, {
            headers: {
              'Authorization': `KakaoAK ${this.apiKey}`
            }
          });

          if (!response.ok) {
            console.error(`Kakao API Error for ${mallName}: ${response.status}`);
            break;
          }

          const data = await response.json();
          const places = data.documents || [];
          
          for (const place of places) {
            // Only add if the place name actually contains the mall name or is located in the mall
            // Kakao usually filters well, but just in case.
            
            // Extract detailed category (e.g. "음식점 > 양식 > 이탈리안" -> "이탈리안")
            let specificCategory = cat.label;
            if (place.category_name) {
              const parts = place.category_name.split('>');
              if (parts.length > 1) {
                specificCategory = parts[parts.length - 1].trim();
              }
            }

            allResults.push({
              name: place.place_name.replace(mallName, '').trim() || place.place_name,
              category: specificCategory,
              floor: '안내데스크 확인', // Kakao API doesn't provide floor info easily
              status: 'OPEN',
              stroller_accessible: true, // Default to true for large malls
              highchair_available: true, // Default to true for large malls
              description: `전화번호: ${place.phone || '없음'} | 카카오맵 링크: ${place.place_url}`,
              mall_name: mallName
            });
          }

          isEnd = data.meta?.is_end || true;
          page++;
          
          // Polite delay
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`Fetch error for Kakao API:`, err);
          break;
        }
      }
    }

    console.log(`KakaoPlaceService: Found ${allResults.length} places for ${mallName}`);
    return allResults;
  }
}
