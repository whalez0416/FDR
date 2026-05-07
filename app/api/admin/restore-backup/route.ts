import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'live_data.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { malls, restaurants } = JSON.parse(fileContent);

    console.log(`Starting restore: ${malls.length} malls, ${restaurants.length} restaurants`);

    const results = {
      mallsInserted: 0,
      restaurantsInserted: 0,
      errors: [] as string[]
    };

    // 1. Restore Malls
    // Use a map to track old ID to new ID if they change, but since we use UUIDs from JSON, 
    // we should try to keep them or at least map them by name.
    const mallNameIdMap: Record<string, string> = {};

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
          results.errors.push(`Mall Error [${mall.name}]: ${mallError.message}`);
          continue;
        }
        mallId = newMall.id;
        results.mallsInserted++;
      }
      mallNameIdMap[mall.name] = mallId;
    }

    // 2. Restore Restaurants
    // We need to map the mall_id correctly. The JSON has mall_ids, but they might not match our new DB.
    // However, the JSON restaurants have names, and we can find the mall name from the malls list in JSON.
    const oldMallIdToName: Record<string, string> = {};
    malls.forEach((m: any) => { oldMallIdToName[m.id] = m.name; });

    for (const rest of restaurants) {
      const mallName = oldMallIdToName[rest.mall_id];
      const newMallId = mallNameIdMap[mallName];

      if (!newMallId) {
        results.errors.push(`Skip Rest [${rest.name}]: No mall mapping for ${mallName}`);
        continue;
      }

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
          phone: rest.phone // Included in some records
        }], { onConflict: 'mall_id, name' });

      if (restError) {
        // Fallback: try manual insert if unique constraint fails
        const { error: retryError } = await supabaseAdmin
          .from('restaurants')
          .insert([{
            mall_id: newMallId,
            name: rest.name,
            category: rest.category,
            floor: rest.floor,
            status: rest.status,
            stroller_accessible: rest.stroller_accessible,
            highchair_available: rest.highchair_available,
            nursing_room_distance: rest.nursing_room_distance,
            description: rest.description
          }]);
        
        if (retryError) {
          results.errors.push(`Rest Error [${rest.name}]: ${retryError.message}`);
        } else {
          results.restaurantsInserted++;
        }
      } else {
        results.restaurantsInserted++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data restoration complete!",
      results
    });

  } catch (error: any) {
    console.error("Restore failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
