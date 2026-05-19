require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const shinsegae = [
  { name: "신세계백화점 강남점", city: "Seoul", district: "서초구" },
  { name: "광주신세계", city: "Gwangju", district: "서구" },
  { name: "신세계백화점 김해점", city: "Gyeongsang", district: "김해시" },
  { name: "대구신세계", city: "Daegu", district: "동구" },
  { name: "대전신세계 Art & Science", city: "Daejeon", district: "유성구" },
  { name: "신세계백화점 마산점", city: "Gyeongsang", district: "창원시" },
  { name: "신세계백화점 본점", city: "Seoul", district: "중구" },
  { name: "신세계백화점 센텀시티", city: "Busan", district: "해운대구" },
  { name: "신세계백화점 스타필드 하남점", city: "Gyeonggi", district: "하남시" },
  { name: "신세계 사우스시티", city: "Gyeonggi", district: "용인시" },
  { name: "신세계백화점 의정부점", city: "Gyeonggi", district: "의정부시" },
  { name: "신세계백화점 천안아산점", city: "Chungcheong", district: "천안시" },
  { name: "신세계백화점 타임스퀘어점", city: "Seoul", district: "영등포구" }
];

const lotte = [
  { name: "롯데백화점 본점", city: "Seoul", district: "중구" },
  { name: "롯데백화점 잠실점", city: "Seoul", district: "송파구" },
  { name: "롯데백화점 부산본점", city: "Busan", district: "부산진구" },
  { name: "롯데백화점 광복점", city: "Busan", district: "중구" },
  { name: "롯데백화점 대구점", city: "Daegu", district: "북구" },
  { name: "롯데백화점 인천점", city: "Incheon", district: "미추홀구" },
  { name: "롯데백화점 수원점", city: "Gyeonggi", district: "수원시" },
  { name: "롯데백화점 영등포점", city: "Seoul", district: "영등포구" },
  { name: "롯데백화점 노원점", city: "Seoul", district: "노원구" },
  { name: "롯데백화점 강남점", city: "Seoul", district: "강남구" }
];

async function insert() {
  const allMalls = [...shinsegae, ...lotte];
  console.log(`Inserting ${allMalls.length} new malls...`);

  for (const mall of allMalls) {
    const { data, error } = await supabase.from('malls').upsert({
      name: mall.name,
      city: mall.city,
      district: mall.district,
      image_url: `https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800`
    }, { onConflict: 'name' });

    if (error) {
      console.error(`Error inserting ${mall.name}:`, error.message);
    } else {
      console.log(`Successfully inserted/updated ${mall.name}`);
    }
  }
}

insert();
