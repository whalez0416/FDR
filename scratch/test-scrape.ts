import { HyundaiPangyoScraper } from '../lib/sync/hyundaiScraper';

async function testScrape() {
  console.log('--- 현대백화점 판교점 스크래핑 시작 ---');
  const scraper = new HyundaiPangyoScraper();
  const results = await scraper.fetchRestaurants();
  
  console.log(`수집 완료: 총 ${results.length}개의 식당을 찾았습니다.`);
  console.log('--- 샘플 데이터 (상위 3개) ---');
  console.log(JSON.stringify(results.slice(0, 3), null, 2));
}

testScrape();
