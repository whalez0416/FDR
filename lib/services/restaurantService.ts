import { supabase } from '@/lib/supabase/client';
import { ScrapedRestaurant } from '@/lib/sync/scraper';

export class RestaurantService {
  /**
   * Upserts restaurants for a specific mall.
   * Compares scraped data with existing records to reflect changes.
   */
  static async upsertRestaurants(mallId: string, scrapedData: ScrapedRestaurant[]) {
    console.log(`Upserting ${scrapedData.length} restaurants for mall: ${mallId}`);

    for (const item of scrapedData) {
      // 1. Try to find existing restaurant by name and mall_id
      const { data: existing } = await supabase
        .from('restaurants')
        .select('*')
        .eq('mall_id', mallId)
        .eq('name', item.name)
        .single();

      if (existing) {
        // 2. If exists, check for changes
        const hasChanged = 
          existing.floor !== item.floor || 
          existing.category !== item.category || 
          existing.status !== item.status;

        if (hasChanged) {
          await supabase
            .from('restaurants')
            .update({
              floor: item.floor,
              category: item.category,
              status: item.status,
              last_updated: new Date().toISOString(),
            })
            .eq('id', existing.id);
          console.log(`Updated: ${item.name}`);
        } else {
          // Just update the timestamp even if no content changed
          await supabase
            .from('restaurants')
            .update({ last_updated: new Date().toISOString() })
            .eq('id', existing.id);
        }
      } else {
        // 3. If doesn't exist, insert new record
        await supabase
          .from('restaurants')
          .insert({
            mall_id: mallId,
            name: item.name,
            category: item.category,
            floor: item.floor,
            status: item.status,
            stroller_accessible: item.stroller_accessible ?? false,
            highchair_available: item.highchair_available ?? false,
            last_updated: new Date().toISOString(),
          });
        console.log(`Inserted: ${item.name}`);
      }
    }

    // 4. Mark restaurants NOT in scraped data as 'CLOSED'
    const scrapedNames = scrapedData.map(d => d.name);
    await supabase
      .from('restaurants')
      .update({ status: 'CLOSED', last_updated: new Date().toISOString() })
      .eq('mall_id', mallId)
      .not('name', 'in', `(${scrapedNames.map(n => `"${n}"`).join(',')})`);
  }
}
