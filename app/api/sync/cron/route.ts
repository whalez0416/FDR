import { NextResponse } from 'next/server';
import { KakaoPlaceService } from '@/lib/sync/kakaoScraper';
import { RestaurantService } from '@/lib/services/restaurantService';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { HYUNDAI_BRANCHES } from '@/lib/sync/hyundaiScraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow maximum 60 seconds if running on Pro/Cron

export async function GET(request: Request) {
  // Protect cron endpoint - Vercel automatically sends this header for legitimate cron requests
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In local dev, we might not have CRON_SECRET, so allow if it's missing entirely or if forced via query
    const url = new URL(request.url);
    if (!url.searchParams.get('force') && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Determine category based on day of week
  const day = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const categoryRotation = [
    '분식',        // 0: Sunday
    '한식',        // 1: Monday
    '일식',        // 2: Tuesday
    '중식',        // 3: Wednesday
    '양식',        // 4: Thursday
    '카페',        // 5: Friday
    '베이커리'     // 6: Saturday
  ];
  const targetCategory = categoryRotation[day];

  const kakaoService = new KakaoPlaceService();
  const results = [];

  try {
    // Ensure malls exist
    const mallIds: Record<string, string> = {};
    for (const branch of HYUNDAI_BRANCHES) {
      let { data: mall } = await supabaseAdmin.from('malls').select('id').eq('name', branch.name).single();
      if (!mall) {
        const { data: newMall, error } = await supabaseAdmin.from('malls').insert([{
          name: branch.name,
          city: '서울',
          district: '주요상권',
          image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000&auto=format&fit=crop'
        }]).select('id').single();
        if (error) continue;
        mall = newMall;
      }
      mallIds[branch.name] = mall.id;
    }

    // For cron, we sync ALL branches, but ONLY for the specific targetCategory
    // This keeps the payload small enough to usually avoid timeout
    for (const branch of HYUNDAI_BRANCHES) {
      const mallId = mallIds[branch.name];
      if (!mallId) continue;

      console.log(`Cron Syncing [${branch.name}] for category: [${targetCategory}]`);
      const scrapedRests = await kakaoService.fetchRestaurantsForMall(branch.name, targetCategory);
      
      if (scrapedRests.length > 0) {
        await RestaurantService.upsertRestaurants(mallId, scrapedRests);
      }

      results.push({ branch: branch.name, category: targetCategory, count: scrapedRests.length });
    }

    return NextResponse.json({
      success: true,
      message: `Daily Cron Sync complete for category: ${targetCategory}`,
      results
    });
  } catch (error: any) {
    console.error('Cron sync failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
