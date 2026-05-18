/**
 * Cloud Sync Runner Utility
 * 
 * 이 스크립트는 로컬 컴퓨터에 Supabase/OpenAI 키를 노출하지 않고도,
 * Vercel Cloud 환경의 풍부한 리소스를 활용하여 백업 복원 및 식당 동기화를 
 * 안전하게 원격 트리거할 수 있도록 설계된 어드민 도구입니다.
 */

const { execSync } = require('child_process');

// 최신 배포 고유 주소 가져오기
let baseUrl = 'https://fdr-3wmt51yh2-whalez0416s-projects.vercel.app';

try {
  const vercelLs = execSync('npx vercel list --next 1', { encoding: 'utf8' });
  const urlMatch = vercelLs.match(/https:\/\/fdr-[a-z0-9-]+-whalez0416s-projects\.vercel\.app/);
  if (urlMatch) {
    baseUrl = urlMatch[0];
  }
} catch (e) {
  // vercel CLI 미설치 혹은 세션 만료 시 하드코딩된 최신 배포 주소 사용
}

console.log("\n========================================================");
console.log("   맘편한외식 Premium Cloud Data Sync Dashboard 🚀");
console.log("========================================================\n");
console.log(`현재 타겟 배포 URL: \x1b[36m${baseUrl}\x1b[0m`);
console.log("--------------------------------------------------------");
console.log("Vercel의 강력한 Deployment Protection(배포 보안) 정책으로 인해,");
console.log("가장 안전하고 확실한 트리거 방식은 '로그인 세션이 유지된 브라우저'에서");
console.log("아래 링크를 클릭하여 여는 것입니다. (원격 데이터베이스로 즉각 적재됩니다)\n");

console.log("\x1b[35m[1단계: 고품질 백업 복원 (1초 해결)]\x1b[0m");
console.log("👉 판교점, 더현대 서울, 압구정본점, 더현대 대구의 검증된 맛집 즉시 복원");
console.log(`🔗 \x1b[4m${baseUrl}/api/admin/restore-backup\x1b[0m\n`);

console.log("\x1b[35m[2단계: 카카오 API 전체 식당 연동 및 동기화]\x1b[0m");
console.log("👉 전국 현대백화점 지점별 수십~수백 개의 최신 매장을 실시간 검색 및 추가");
console.log(`🔗 \x1b[4m${baseUrl}/api/sync\x1b[0m`);
console.log("💡 특정 지점만 타겟팅하려면 뒤에 ?branch=지점명 을 붙이세요. (예: ?branch=판교점)\n");

console.log("\x1b[35m[3단계: AI (GPT-4o) 동반 상세 편의정보 & 태깅 보강]\x1b[0m");
console.log("👉 신규 추가된 식당을 분석하여 아기의자/유모차 여부와 태그(#아기의자완비 등), 한줄평 보강");
console.log(`🔗 \x1b[4m${baseUrl}/api/sync/cron\x1b[0m\n`);
console.log("========================================================");
console.log("💡 브라우저 창에서 새 탭으로 위 링크들을 하나씩 열어 실행을 시작해 주세요!");
console.log("========================================================\n");
