import { NextResponse } from 'next/server';
import { HyundaiMallScraper, HYUNDAI_BRANCHES } from '@/lib/sync/hyundaiScraper';
import { RestaurantService } from '@/lib/services/restaurantService';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  const scraper = new HyundaiMallScraper();
  const results = [];

  try {
    // 1. Iterate through all major branches
    for (const branch of HYUNDAI_BRANCHES) {
      console.log(`National Sync: Starting ${branch.name}...`);
      
      // 2. Ensure Mall exists in DB (or get ID)
      let { data: mall } = await supabase
        .from('malls')
        .select('id')
        .eq('name', branch.name)
        .maybeSingle();
      
      if (!mall) {
        // Simple mapping for city based on name
        let city = '서울';
        if (branch.name.includes('울산')) city = '울산';
        if (branch.name.includes('대구')) city = '대구';
        if (branch.name.includes('김포') || branch.name.includes('송도') || branch.name.includes('판교')) city = '경기';

        const { data: newMall, error: mallError } = await supabase
          .from('malls')
          .insert({
            name: branch.name,
            city,
            district: branch.name.includes('판교') ? '분당구' : '주요상권',
            image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000&auto=format&fit=crop'
          })
          .select()
          .single();
        
        if (mallError) {
          console.error(`Failed to create mall ${branch.name}:`, mallError);
          continue; 
        }
        mall = newMall;
      }

      // 3. Scrape this branch's all floors
      const scrapedData = await scraper.fetchByBranch(branch.name, branch.code);
      
      // 4. Batch Upsert to DB
      if (scrapedData.length > 0) {
        await RestaurantService.upsertRestaurants(mall.id, scrapedData);
        results.push({ branch: branch.name, count: scrapedData.length });
        console.log(`Success: ${branch.name} synced with ${scrapedData.length} items.`);
      }
      
      // Safety pause to avoid hitting rate limits or timeouts too quickly
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({ 
      success: true, 
      message: 'National synchronization successful',
      synced_branches: results 
    });
  } catch (error: any) {
    console.error('National Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
