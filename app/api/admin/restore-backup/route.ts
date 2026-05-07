import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
// Redeploy trigger to pick up new env vars
export const runtime = 'nodejs';

// Pre-loaded data to avoid 'fs' issues on Vercel
const BACKUP_DATA = {
  "malls": [
    {"id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"현대백화점 판교점","city":"경기","district":"분당구"},
    {"id":"ddcfc92b-c0fa-4dab-8eb7-b26b895bd9ea","name":"현대백화점 판교점","city":"경기","district":"성남시 분당구"},
    {"id":"97c8cc0b-c47e-4108-8c7e-c4b85229d49c","name":"더현대 서울","city":"서울","district":"주요상권"},
    {"id":"34d863b7-3f39-449b-baad-9422ad0c55ec","name":"현대백화점 무역센터점","city":"서울","district":"주요상권"},
    {"id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"현대백화점 압구정본점","city":"서울","district":"주요상권"},
    {"id":"b2413f9f-5a54-439f-a139-8c41257042fd","name":"현대백화점 천호점","city":"서울","district":"주요상권"},
    {"id":"6bdc1f29-4dc2-4125-ad5a-3f65595fa16d","name":"현대백화점 신촌점","city":"서울","district":"주요상권"},
    {"id":"37d6f596-25d1-405a-8ead-57112af8242c","name":"현대백화점 미아점","city":"서울","district":"주요상권"},
    {"id":"d95b809b-16ea-4bf0-9950-7aff727dcea3","name":"현대백화점 목동점","city":"서울","district":"주요상권"},
    {"id":"0f811041-e828-4dcb-9ca1-d0596cf1d0e8","name":"현대백화점 중동점","city":"서울","district":"주요상권"},
    {"id":"80160129-9555-43c7-8728-72f9c0fdc9fb","name":"현대백화점 킨텍스점","city":"서울","district":"주요상권"},
    {"id":"4a22f098-1d5e-42cc-b1c9-715aafec4de0","name":"현대백화점 디큐브시티","city":"서울","district":"주요상권"},
    {"id":"ae50acc1-61eb-48a8-894b-f0f3a819d4df","name":"현대백화점 울산점","city":"울산","district":"주요상권"},
    {"id":"b7e4a9e8-67a7-4d75-aae2-1612c0001a5b","name":"커넥트현대 부산","city":"서울","district":"주요상권"},
    {"id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"더현대 대구","city":"대구","district":"중구"}
  ],
  "restaurants": [
    // Pangyo
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"정돈 현대백화점판교점","category":"돈까스,우동","floor":"9F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"신승반점 현대백화점판교점","category":"중국요리","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"이탈리 판교점","category":"이탈리안","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"H541 현대백화점판교점","category":"이탈리안","floor":"9F","stroller_accessible":true,"highchair_available":true},
    
    // Apgujeong
    {"mall_id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"도원스타일 현대백화점압구정본점","category":"중국요리","floor":"5F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"크리스탈제이드 압구정본점","category":"중국요리","floor":"5F","stroller_accessible":true,"highchair_available":true},

    // The Hyundai Seoul
    {"mall_id":"97c8cc0b-c47e-4108-8c7e-c4b85229d49c","name":"호우섬","category":"아시안","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"97c8cc0b-c47e-4108-8c7e-c4b85229d49c","name":"삼성혈해물탕 현대백화점 더현대서울점","category":"매운탕,해물탕","floor":"B1","stroller_accessible":true,"highchair_available":true},

    // The Hyundai Daegu (ALL major brands)
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"텍사스로드하우스 더현대 대구점","category":"패밀리레스토랑","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"폴트버거 더현대 대구점","category":"햄버거","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"금금 더현대 대구점","category":"퓨전한식","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"강호연파 더현대 대구점","category":"샤브샤브","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"호우섬 더현대 대구점","category":"아시안","floor":"8F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"매드포갈릭 더현대 대구점","category":"이탈리안","floor":"8F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"정돈 더현대 대구점","category":"돈까스","floor":"8F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"심비디움 더현대 대구점","category":"한식","floor":"8F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"스시덴고쿠 더현대 대구점","category":"일식","floor":"8F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"개정 더현대 대구점","category":"한식","floor":"8F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"봉우리 더현대 대구점","category":"한식","floor":"8F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"워킹컵 카페","category":"카페","floor":"9F","stroller_accessible":true,"highchair_available":false},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"폴바셋 더현대 대구점","category":"카페","floor":"B1","stroller_accessible":true,"highchair_available":false},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"뵈르뵈르 더현대 대구점","category":"디저트","floor":"B1","stroller_accessible":true,"highchair_available":false},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"올댓커피 더현대 대구점","category":"카페","floor":"B1","stroller_accessible":true,"highchair_available":false}
  ]
};

export async function GET() {
  try {
    const { malls, restaurants } = BACKUP_DATA;
    const results = { mallsInserted: 0, restaurantsInserted: 0, errors: [] as string[] };

    // 0. Cleanup: Remove Trade Center restaurants wrongly attached to The Hyundai Seoul
    await supabaseAdmin
      .from('restaurants')
      .delete()
      .eq('mall_id', '97c8cc0b-c47e-4108-8c7e-c4b85229d49c') // The Hyundai Seoul
      .ilike('name', '%무역센터점%');

    // Restore logic
    const mallNameIdMap: Record<string, string> = {};

    for (const mall of malls) {
      // 1. First, try to find by ID
      const { data: existingById } = await supabaseAdmin.from('malls').select('id').eq('id', mall.id).single();
      let mallId = existingById?.id;

      if (mallId) {
        await supabaseAdmin.from('malls').update({ name: mall.name, city: mall.city, district: mall.district }).eq('id', mall.id);
      } else {
        const { data: existingByName } = await supabaseAdmin.from('malls').select('id').eq('name', mall.name).single();
        mallId = existingByName?.id;

        if (!mallId) {
          const { data: newMall, error: mallError } = await supabaseAdmin.from('malls').insert([{
            id: mall.id, name: mall.name, city: mall.city, district: mall.district
          }]).select('id').single();
          if (!mallError) {
            mallId = newMall.id;
            results.mallsInserted++;
          }
        }
      }
      mallNameIdMap[mall.name] = mallId;
    }

    const oldMallIdToName: Record<string, string> = {};
    malls.forEach((m: any) => { oldMallIdToName[m.id] = m.name; });

    for (const rest of restaurants) {
      const mallName = oldMallIdToName[rest.mall_id];
      const newMallId = mallNameIdMap[mallName];
      if (!newMallId) continue;

      const { error: restError } = await supabaseAdmin.from('restaurants').upsert([{
        mall_id: newMallId, name: rest.name, category: rest.category,
        floor: rest.floor, status: 'OPEN', stroller_accessible: rest.stroller_accessible,
        highchair_available: rest.highchair_available
      }], { onConflict: 'mall_id, name' });

      if (!restError) results.restaurantsInserted++;
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
