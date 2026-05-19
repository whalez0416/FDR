require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mallName = '더현대 대구';
const restaurants = [
  { "name": "개정", "category": "전문식당가", "floor": "8층" },
  { "name": "심비디움", "category": "전문식당가", "floor": "8층" },
  { "name": "풍국면", "category": "전문식당가", "floor": "8층" },
  { "name": "JS가든", "category": "전문식당가", "floor": "8층" },
  { "name": "호우섬", "category": "전문식당가", "floor": "8층" },
  { "name": "와인웍스", "category": "전문식당가", "floor": "B1층" },
  { "name": "텍사스 로드 하우스", "category": "전문식당가", "floor": "B1층" },
  { "name": "매드포갈릭", "category": "전문식당가", "floor": "8층" },
  { "name": "스시덴고쿠", "category": "전문식당가", "floor": "8층" },
  { "name": "정돈", "category": "전문식당가", "floor": "8층" },
  { "name": "퍼부어", "category": "전문식당가", "floor": "8층" },
  { "name": "770철판", "category": "푸드코트", "floor": "B1층" },
  { "name": "건강밥상", "category": "푸드코트", "floor": "B1층" },
  { "name": "한솔냉면", "category": "푸드코트", "floor": "B1층" },
  { "name": "마유유 마라탕", "category": "푸드코트", "floor": "B1층" },
  { "name": "메이루", "category": "푸드코트", "floor": "B1층" },
  { "name": "비첸향", "category": "푸드코트", "floor": "B1층" },
  { "name": "시오톤", "category": "푸드코트", "floor": "B1층" },
  { "name": "탕미엔", "category": "푸드코트", "floor": "B1층" },
  { "name": "돈까스1985", "category": "푸드코트", "floor": "B1층" },
  { "name": "그린파이브", "category": "푸드코트", "floor": "B1층" },
  { "name": "폴바셋", "category": "카페", "floor": "B1층" },
  { "name": "아무하", "category": "카페", "floor": "4층" },
  { "name": "워킹컵", "category": "카페", "floor": "9층" },
  { "name": "그래인스쿠키", "category": "베이커리", "floor": "B1층" },
  { "name": "콜드져니", "category": "베이커리", "floor": "B1층" }
];

async function sync() {
  const { data: mall } = await supabase.from('malls').select('id').eq('name', mallName).single();
  if (!mall) {
    console.error("Mall not found:", mallName);
    return;
  }

  console.log(`Syncing ${restaurants.length} restaurants for ${mallName}...`);

  for (const r of restaurants) {
    const { error } = await supabase.from('restaurants').upsert({
      mall_id: mall.id,
      name: r.name,
      category: r.category,
      floor: r.floor,
      status: 'OPEN',
      stroller_accessible: true,
      highchair_available: true
    }, { onConflict: 'mall_id, name' });

    if (error) console.error(`Error syncing ${r.name}:`, error.message);
  }

  console.log("Sync complete!");
}

sync();
