import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Pre-loaded data to avoid 'fs' issues on Vercel
const BACKUP_DATA = {
  "malls": [
    {"id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"판교점","city":"경기","district":"분당구"},
    {"id":"ddcfc92b-c0fa-4dab-8eb7-b26b895bd9ea","name":"현대백화점 판교점","city":"경기","district":"성남시 분당구"},
    {"id":"97c8cc0b-c47e-4108-8c7e-c4b85229d49c","name":"더현대 서울","city":"서울","district":"주요상권"},
    {"id":"34d863b7-3f39-449b-baad-9422ad0c55ec","name":"무역센터점","city":"서울","district":"주요상권"},
    {"id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"압구정본점","city":"서울","district":"주요상권"},
    {"id":"b2413f9f-5a54-439f-a139-8c41257042fd","name":"천호점","city":"서울","district":"주요상권"},
    {"id":"6bdc1f29-4dc2-4125-ad5a-3f65595fa16d","name":"신촌점","city":"서울","district":"주요상권"},
    {"id":"37d6f596-25d1-405a-8ead-57112af8242c","name":"미아점","city":"서울","district":"주요상권"},
    {"id":"d95b809b-16ea-4bf0-9950-7aff727dcea3","name":"목동점","city":"서울","district":"주요상권"},
    {"id":"0f811041-e828-4dcb-9ca1-d0596cf1d0e8","name":"중동점","city":"서울","district":"주요상권"},
    {"id":"80160129-9555-43c7-8728-72f9c0fdc9fb","name":"킨텍스점","city":"서울","district":"주요상권"},
    {"id":"4a22f098-1d5e-42cc-b1c9-715aafec4de0","name":"디큐브시티","city":"서울","district":"주요상권"},
    {"id":"ae50acc1-61eb-48a8-894b-f0f3a819d4df","name":"울산점","city":"울산","district":"주요상권"},
    {"id":"b7e4a9e8-67a7-4d75-aae2-1612c0001a5b","name":"커넥트현대 부산","city":"서울","district":"주요상권"}
  ],
  "restaurants": [
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"신승반점 현대백화점판교점","category":"중국요리","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"1c866722-216c-498a-950a-d0795cacaf8b","name":"정돈 현대백화점판교점","category":"돈까스,우동","floor":"9F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"97c8cc0b-c47e-4108-8c7e-c4b85229d49c","name":"호우섬","category":"아시안","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"34d863b7-3f39-449b-baad-9422ad0c55ec","name":"더라멘워 현대백화점무역센터점","category":"일본식라면","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"34d863b7-3f39-449b-baad-9422ad0c55ec","name":"더크다이브 현대백화점무역센터점","category":"일식","floor":"B1","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"34d863b7-3f39-449b-baad-9422ad0c55ec","name":"더 이탈리안클럽 현대백화점무역센터점","category":"양식","floor":"10F","stroller_accessible":true,"highchair_available":true},
    {"mall_id":"631a0f65-d8ff-4589-9a89-9273b72eb5e4","name":"가야식당","category":"한식","floor":"5F","stroller_accessible":false,"highchair_available":true}
    // ... Additional restaurants can be added or fetched via sync
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
      const { data: existingMall } = await supabaseAdmin.from('malls').select('id').eq('name', mall.name).single();
      let mallId = existingMall?.id;

      if (!mallId) {
        const { data: newMall, error: mallError } = await supabaseAdmin.from('malls').insert([{
          name: mall.name, city: mall.city, district: mall.district
        }]).select('id').single();
        if (mallError) { results.errors.push(mallError.message); continue; }
        mallId = newMall.id;
        results.mallsInserted++;
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
