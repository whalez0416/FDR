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

    // 1. Fetch existing restaurants for this mall
    const { data: existingRecords, error: fetchError } = await supabaseAdmin
      .from('restaurants')
      .select('id, name')
      .eq('mall_id', mallId);

    if (fetchError) {
      console.error(`Error fetching existing records:`, fetchError);
      throw fetchError;
    }

    const existingMap = new Map((existingRecords || []).map(r => [r.name, r.id]));
    const currentNames = new Set(scrapedData.map(d => d.name));

    // 2. Insert or Update manually to avoid ON CONFLICT constraint issues
    for (const item of scrapedData) {
      const payload = {
        mall_id: mallId,
        name: item.name,
        category: item.category || '기타',
        floor: item.floor,
        status: 'OPEN',
        stroller_accessible: item.stroller_accessible ?? true,
        highchair_available: item.highchair_available ?? true,
        description: item.description || '',
        last_updated: new Date().toISOString(),
      };

      const existingId = existingMap.get(item.name);

      if (existingId) {
        // Update existing
        await supabaseAdmin.from('restaurants').update(payload).eq('id', existingId);
      } else {
        // Insert new
        await supabaseAdmin.from('restaurants').insert(payload);
      }
    }

    // 3. Mark restaurants NOT in scraped data as 'CLOSED' for this specific mall
    if (existingRecords && existingRecords.length > 0) {
      const toCloseIds = existingRecords
        .filter(r => !currentNames.has(r.name))
        .map(r => r.id);

      if (toCloseIds.length > 0) {
        await supabaseAdmin
          .from('restaurants')
          .update({ status: 'CLOSED', last_updated: new Date().toISOString() })
          .in('id', toCloseIds);
      }
    }
  }
}
