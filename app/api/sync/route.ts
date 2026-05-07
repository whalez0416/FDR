import { NextRequest, NextResponse } from 'next/server';
import { HYUNDAI_BRANCHES } from '@/lib/sync/hyundaiScraper';
import { KakaoPlaceService } from '@/lib/sync/kakaoScraper';
import { RestaurantService } from '@/lib/services/restaurantService';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const scraper = new KakaoPlaceService();
  const results = [];
  
  // Optional: Sync a specific branch (e.g., /api/sync?branch=판교점)
  const targetBranch = request.nextUrl.searchParams.get('branch');
  
  // To avoid Vercel 10s timeout, limit to 3 top branches if no specific branch is targeted
  let branchesToSync = HYUNDAI_BRANCHES;
  if (targetBranch) {
    branchesToSync = HYUNDAI_BRANCHES.filter(b => b.name.includes(targetBranch));
  } else {
    // Just sync The Hyundai Seoul, Apgujeong, and Pangyo as defaults to stay under 10s limit
    branchesToSync = HYUNDAI_BRANCHES.filter(b => 
      b.name === '더현대 서울' || b.name === '압구정본점' || b.name === '판교점'
    );
  }

  // 0. Check if Admin Key is present
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ 
      success: false, 
      error: 'SUPABASE_SERVICE_ROLE_KEY is missing in environment variables. Please add it to Vercel settings.' 
    }, { status: 401 });
  }

  try {
    // 1. Iterate through targeted branches
    for (const branch of branchesToSync) {
      console.log(`National Sync: Starting ${branch.name}...`);
      
      // 2. Ensure Mall exists in DB (or get ID) using Admin client
      let { data: mall } = await supabaseAdmin
        .from('malls')
        .select('id')
        .eq('name', branch.name)
        .maybeSingle();
      
      if (!mall) {
        let city = '서울';
        if (branch.name.includes('울산')) city = '울산';
        if (branch.name.includes('대구')) city = '대구';
        if (branch.name.includes('김포') || branch.name.includes('송도') || branch.name.includes('판교')) city = '경기';

        const { data: newMall, error: mallError } = await supabaseAdmin
          .from('malls')
          .insert({
            name: branch.name,
            city,
            district: branch.name.includes('판교') ? '분당구' : '주요상권',
            image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000&auto=format&fit=crop'
          })
          .select()
          .single();
        
        if (mallError) {
          console.error(`Failed to create mall ${branch.name}:`, mallError);
          continue; 
        }
        mall = newMall;
      }

      // 3. Scrape this branch using Kakao API
      const scrapedData = await scraper.fetchRestaurantsForMall(`현대백화점 ${branch.name}`);
      
      // 4. Batch Upsert to DB
      if (scrapedData.length > 0) {
        await RestaurantService.upsertRestaurants(mall.id, scrapedData);
        results.push({ branch: branch.name, count: scrapedData.length });
        console.log(`Success: ${branch.name} synced with ${scrapedData.length} items.`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return NextResponse.json({ 
      success: true, 
      message: 'National sync completed without cache',
      synced_branches: results 
    });
  } catch (error: any) {
    console.error('National Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
