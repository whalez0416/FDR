import { supabaseAdmin } from '../supabase/admin';
import { ScrapedRestaurant } from '../sync/scraper';

export class RestaurantService {
  /**
   * Upserts restaurants for a specific mall.
   * Efficiently handles mass updates using Supabase upsert.
   */
  static async upsertRestaurants(mallId: string, scrapedData: ScrapedRestaurant[]) {
    console.log(`Upserting ${scrapedData.length} restaurants for mall: ${mallId}`);

    if (scrapedData.length === 0) return;

    // 1. Format data for bulk upsert
    const formattedData = scrapedData.map(item => ({
      mall_id: mallId,
      name: item.name,
      category: item.category || '기타',
      floor: item.floor,
      status: 'OPEN',
      stroller_accessible: item.stroller_accessible ?? true,
      highchair_available: item.highchair_available ?? true,
      description: item.description || '',
      last_updated: new Date().toISOString(),
    }));

    // 2. Perform Batch Upsert (Conflict on mall_id + name) using Admin client
    const { error } = await supabaseAdmin
      .from('restaurants')
      .upsert(formattedData, { 
        onConflict: 'mall_id,name',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`Error during batch upsert for mall ${mallId}:`, error);
      throw error;
    }

    // 3. Mark restaurants NOT in scraped data as 'CLOSED' for this specific mall
    const currentNames = scrapedData.map(d => d.name);
    const { error: closeError } = await supabaseAdmin
      .from('restaurants')
      .update({ status: 'CLOSED', last_updated: new Date().toISOString() })
      .eq('mall_id', mallId)
      .not('name', 'in', `(${currentNames.map(n => `"${n}"`).join(',')})`);

    if (closeError) {
      console.warn(`Could not update closed status for ${mallId}:`, closeError);
    }
  }
}
