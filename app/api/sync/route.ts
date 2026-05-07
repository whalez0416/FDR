import { NextResponse } from 'next/server';
import { HyundaiPangyoScraper } from '../../../lib/sync/hyundaiScraper';
import { supabase } from '../../../lib/supabase/client';

export async function GET() {
  try {
    console.log('--- Manual Sync Started via API ---');
    
    // 1. Fetch real data using Scraper
    const scraper = new HyundaiPangyoScraper();
    const scrapedData = await scraper.fetchRestaurants();
    
    if (!scrapedData || scrapedData.length === 0) {
      return NextResponse.json({ error: "No data found from scraper" }, { status: 500 });
    }

    // 2. Fetch Mall ID for Hyundai Pangyo
    const { data: mall } = await supabase
      .from('malls')
      .select('id')
      .filter('name', 'ilike', '%판교%')
      .single();

    if (!mall) {
      return NextResponse.json({ error: "Hyundai Pangyo mall not found in DB" }, { status: 404 });
    }

    // 3. Map data for Supabase
    const restaurantsToUpsert = scrapedData.map(item => ({
      mall_id: mall.id,
      name: item.name,
      category: item.category || '식당',
      floor: item.floor,
      stroller_accessible: true,
      highchair_available: true,
      nursing_room_distance: 50,
      status: 'active',
      last_updated: new Date().toISOString()
    }));

    // 4. Upsert into Database
    const { error: upsertError } = await supabase
      .from('restaurants')
      .upsert(restaurantsToUpsert, { onConflict: 'mall_id,name' });

    if (upsertError) throw upsertError;

    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${restaurantsToUpsert.length} restaurants for Hyundai Pangyo`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
