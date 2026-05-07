import { supabaseAdmin } from '../lib/supabase/admin';
import fs from 'fs';
import path from 'path';

async function runRestore() {
  console.log('--- 데이터 복구 스크립트 시작 ---');
  
  try {
    const filePath = path.join(process.cwd(), 'live_data.json');
    if (!fs.existsSync(filePath)) {
      console.error('live_data.json 파일을 찾을 수 없습니다.');
      return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { malls, restaurants } = JSON.parse(fileContent);

    console.log(`복구 대상: 몰 ${malls.length}개, 식당 ${restaurants.length}개`);

    const mallNameIdMap: Record<string, string> = {};

    // 1. 몰 복구
    for (const mall of malls) {
      const { data: existingMall } = await supabaseAdmin
        .from('malls')
        .select('id')
        .eq('name', mall.name)
        .single();

      let mallId = existingMall?.id;

      if (!mallId) {
        const { data: newMall, error: mallError } = await supabaseAdmin
          .from('malls')
          .insert([{
            name: mall.name,
            city: mall.city,
            district: mall.district,
            image_url: mall.image_url
          }])
          .select('id')
          .single();

        if (mallError) {
          console.error(`몰 에러 [${mall.name}]: ${mallError.message}`);
          continue;
        }
        mallId = newMall.id;
        console.log(`몰 생성 완료: ${mall.name}`);
      } else {
        console.log(`몰 이미 존재함: ${mall.name}`);
      }
      mallNameIdMap[mall.name] = mallId;
    }

    // 2. 식당 복구
    const oldMallIdToName: Record<string, string> = {};
    malls.forEach((m: any) => { oldMallIdToName[m.id] = m.name; });

    let successCount = 0;
    for (const rest of restaurants) {
      const mallName = oldMallIdToName[rest.mall_id];
      const newMallId = mallNameIdMap[mallName];

      if (!newMallId) continue;

      const { error: restError } = await supabaseAdmin
        .from('restaurants')
        .upsert([{
          mall_id: newMallId,
          name: rest.name,
          category: rest.category,
          floor: rest.floor,
          status: rest.status,
          stroller_accessible: rest.stroller_accessible,
          highchair_available: rest.highchair_available,
          nursing_room_distance: rest.nursing_room_distance,
          description: rest.description,
          phone: rest.phone
        }], { onConflict: 'mall_id, name' });

      if (!restError) successCount++;
    }

    console.log(`--- 복구 완료! 성공한 식당: ${successCount}개 ---`);

  } catch (error) {
    console.error('복구 중 치명적 에러:', error);
  }
}

runRestore();
