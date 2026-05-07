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
    {"id":"b7e4a9e8-67a7-4d75-aae2-1612c0001a5b","name":"커넥트현대 부산","city":"서울","district":"주요상권"}
  ],
  "restaurants": [
    // Pangyo
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"정돈 현대백화점판교점","category":"돈까스,우동","floor":"9F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"신승반점 현대백화점판교점","category":"중국요리","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"이탈리 판교점","category":"이탈리안","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"H541 현대백화점판교점","category":"이탈리안","floor":"9F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"텍사스로드하우스 현대백화점판교점","category":"패밀리레스토랑","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"js가든 현대백화점판교점","category":"중국요리","floor":"9F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"블루보틀 판교현대카페","category":"카페","floor":"1F","stroller_accessible":true,"highchair_available":false},
    
    // Apgujeong
    {"mall_id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"도원스타일 현대백화점압구정본점","category":"중국요리","floor":"5F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"크리스탈제이드 압구정본점","category":"중국요리","floor":"5F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"루엘드파리 현대백화점압구정본점","category":"제과,베이커리","floor":"B1","stroller_accessible":true,"highchair_available":false},
    {"mall_id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"밀도 현대백화점압구정본점","category":"제과,베이커리","floor":"B1","stroller_accessible":true,"highchair_available":false},
    {"mall_id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"샤브카덴","category":"샤브샤브","floor":"5F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"가야식당","category":"한식","floor":"5F","stroller_accessible":false,"highchair_available":true},

    // Trade Center
    {"mall_id":"34d863b7-3f39-449b-baad-9422ad0c55ec","name":"더 이탈리안클럽 현대백화점무역센터점","category":"양식","floor":"10F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"34d863b7-3f39-449b-baad-9422ad0c55ec","name":"더라멘워 현대백화점무역센터점","category":"일본식라면","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"34d863b7-3f39-449b-baad-9422ad0c55ec","name":"더크다이브 현대백화점무역센터점","category":"일식","floor":"B1","stroller_accessible":true,"highchair_available":true},

    // The Hyundai Seoul
    {"mall_id":"97c8cc0b-c47e-4108-8c7e-c4b85229d49c","name":"호우섬","category":"아시안","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"97c8cc0b-c47e-4108-8c7e-c4b85229d49c","name":"삼성혈해물탕 현대백화점 더현대서울점","category":"매운탕,해물탕","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"97c8cc0b-c47e-4108-8c7e-c4b85229d49c","name":"우나하우스 더현대서울","category":"카페","floor":"B1","stroller_accessible":true,"highchair_available":true},

    // The Hyundai Daegu
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"호우섬 더현대 대구점","category":"아시안","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"게이트나인 더현대 대구점","category":"태국음식","floor":"8F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"매드포갈릭 더현대 대구점","category":"양식","floor":"8F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"랑만 더현대 대구점","category":"베트남음식","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"9451d935-e9ae-4086-aff7-463be1a8dc8b","name":"폴바셋 더현대 대구점","category":"카페","floor":"B1","stroller_accessible":true,"highchair_available":false}
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
      // 1. First, try to find by ID to support renames
      const { data: existingById } = await supabaseAdmin
        .from('malls')
        .select('id')
        .eq('id', mall.id)
        .single();

      let mallId = existingById?.id;

      if (mallId) {
        // Update name for existing mall
        await supabaseAdmin.from('malls').update({
          name: mall.name,
          city: mall.city,
          district: mall.district
        }).eq('id', mall.id);
      } else {
        // 2. If not found by ID, try searching by name
        const { data: existingByName } = await supabaseAdmin
          .from('malls')
          .select('id')
          .eq('name', mall.name)
          .single();
        
        mallId = existingByName?.id;

        if (!mallId) {
          const { data: newMall, error: mallError } = await supabaseAdmin.from('malls').insert([{
            id: mall.id,
            name: mall.name, 
            city: mall.city, 
            district: mall.district
          }]).select('id').single();
          
          if (mallError) {
            const { data: fallbackMall, error: fbError } = await supabaseAdmin.from('malls').insert([{
              name: mall.name, city: mall.city, district: mall.district
            }]).select('id').single();
            if (fbError) { results.errors.push(fbError.message); continue; }
            mallId = fallbackMall.id;
          } else {
            mallId = newMall.id;
          }
          results.mallsInserted++;
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
