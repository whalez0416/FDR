require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const data = [
  { name: "개정", floor: "8층", category: "전문 식당가 > 한식" },
  { name: "심비디움", floor: "8층", category: "전문 식당가 > 한식" },
  { name: "풍국면", floor: "8층", category: "전문 식당가 > 한식" },
  { name: "JS가든", floor: "8층", category: "전문 식당가 > 중식" },
  { name: "호우섬", floor: "8층", category: "전문 식당가 > 중식" },
  { name: "와인웍스", floor: "B1층", category: "전문 식당가 > 양식" },
  { name: "텍사스 로드 하우스", floor: "B1층", category: "전문 식당가 > 양식" },
  { name: "매드포갈릭", floor: "8층", category: "전문 식당가 > 양식" },
  { name: "스시덴고쿠", floor: "8층", category: "전문 식당가 > 일식" },
  { name: "정돈", floor: "8층", category: "전문 식당가 > 일식" },
  { name: "퍼부어", floor: "8층", category: "전문 식당가 > 기타" },
  { name: "770철판", floor: "B1층", category: "푸드코트 > 한식" },
  { name: "건강밥상", floor: "B1층", category: "푸드코트 > 한식" },
  { name: "한솔냉면", floor: "B1층", category: "푸드코트 > 한식" },
  { name: "마유유 마라탕", floor: "B1층", category: "푸드코트 > 중식" },
  { name: "메이루", floor: "B1층", category: "푸드코트 > 중식" },
  { name: "비첸향", floor: "B1층", category: "푸드코트 > 기타" },
  { name: "시오톤", floor: "B1층", category: "푸드코트 > 일식" },
  { name: "탕미엔", floor: "B1층", category: "푸드코트 > 일식" },
  { name: "돈까스1985", floor: "B1층", category: "푸드코트 > 일식" },
  { name: "그린파이브", floor: "B1층", category: "푸드코트 > 기타" },
  { name: "폴바셋", floor: "B1층", category: "카페" },
  { name: "아무하", floor: "4층", category: "카페" },
  { name: "워킹컵", floor: "9층", category: "카페" },
  { name: "그래인스쿠키", floor: "B1층", category: "베이커리" },
  { name: "콜드져니", floor: "B1층", category: "베이커리" }
];

async function insertData() {
  const { data: mallData } = await supabase.from('malls').select('id').eq('name', '더현대 대구').single();
  if (!mallData) return console.error('Mall not found');
  
  for (const item of data) {
    let cat = item.category.split(' > ').pop() || item.category;
    await supabase.from('restaurants').upsert({
      mall_id: mallData.id,
      name: item.name,
      category: cat,
      floor: item.floor.replace('층', 'F'),
      status: 'OPEN'
    }, { onConflict: 'mall_id, name' });
  }
  console.log('Success');
}

insertData();
