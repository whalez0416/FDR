import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UrlScraper } from '@/lib/sync/urlScraper';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Admin key missing' }, { status: 401 });
  }

  try {
    let batchList: Array<{ mall_name: string; source_url: string }> = [];

    // Attempt to parse request body
    try {
      const body = await request.json();
      if (body && Array.isArray(body)) {
        batchList = body;
      } else if (body && Array.isArray(body.malls)) {
        batchList = body.malls;
      }
    } catch (e) {
      // Body is empty or malformed, fall back to reading from local JSON file
      const filePath = path.join(process.cwd(), 'data', 'mall_urls.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        batchList = JSON.parse(fileContent);
      }
    }

    if (!batchList || batchList.length === 0) {
      return NextResponse.json({ error: 'No malls or URLs provided for batch sync' }, { status: 400 });
    }

    const results: any[] = [];
    const urlScraper = new UrlScraper();

    for (const entry of batchList) {
      const { mall_name, source_url, facility_url } = entry as any;
      // Skip entry if both URLs are empty
      if (!mall_name || (!source_url && !facility_url)) continue;

      console.log(`[BatchSync] Processing mall: ${mall_name} | source_url: ${source_url || 'None'} | facility_url: ${facility_url || 'None'}`);

      // 1. Find or create the mall record in Supabase
      let { data: mall, error: mallFetchError } = await supabaseAdmin
        .from('malls')
        .select('*')
        .eq('name', mall_name)
        .maybeSingle();

      if (mallFetchError) {
        console.error(`[BatchSync] Error fetching mall ${mall_name}:`, mallFetchError);
        results.push({ mall_name, success: false, error: 'Database fetch error' });
        continue;
      }

      if (!mall) {
        console.log(`[BatchSync] Mall ${mall_name} not found. Creating new record...`);
        const { data: newMall, error: createError } = await supabaseAdmin
          .from('malls')
          .insert({
            name: mall_name,
            city: mall_name.includes('서울') ? 'Seoul' : (mall_name.includes('부산') ? 'Busan' : (mall_name.includes('대구') ? 'Daegu' : 'Gyeonggi')),
            district: '주요상권',
            image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800'
          })
          .select()
          .single();

        if (createError) {
          console.error(`[BatchSync] Error creating mall ${mall_name}:`, createError);
          results.push({ mall_name, success: false, error: 'Database create error' });
          continue;
        }
        mall = newMall;
      }

      // 2. Update the mall's source_url (if provided)
      if (source_url) {
        await supabaseAdmin
          .from('malls')
          .update({ source_url })
          .eq('id', mall.id);
      }

      // 2.1. Scrape and update service/facility information (if facility_url is provided)
      let facilityInfoText = '';
      if (facility_url) {
        console.log(`[BatchSync] Crawling service facility page for ${mall_name}: ${facility_url}`);
        try {
          const facilityText = await urlScraper.scrapeFacilityFromUrl(facility_url, mall_name);
          if (facilityText) {
            console.log(`[BatchSync] Successfully extracted facility info: ${facilityText}`);
            await supabaseAdmin
              .from('malls')
              .update({ district: facilityText })
              .eq('id', mall.id);
            mall.district = facilityText; // update local object
            facilityInfoText = facilityText;
          }
        } catch (facErr: any) {
          console.error(`[BatchSync] Facility scraping failed for ${mall_name}:`, facErr);
        }
      }

      // If no restaurant url is provided, report facility sync success and proceed
      if (!source_url) {
        results.push({
          mall_name,
          success: true,
          scraped_count: 0,
          registered_count: 0,
          already_existed_count: 0,
          facility_info: facilityInfoText || '유아시설 정보 연동 완료'
        });
        continue;
      }

      // 3. Scrape restaurants from the official URL
      let scrapeResult;
      try {
        scrapeResult = await urlScraper.scrapeRestaurantsFromUrl(source_url, mall_name);
      } catch (err: any) {
        console.error(`[BatchSync] Scraper error for ${mall_name}:`, err);
        results.push({ mall_name, success: false, error: `Scraper error: ${err.message}` });
        continue;
      }

      const scrapedRests = scrapeResult?.data || [];
      console.log(`[BatchSync] Scraped ${scrapedRests.length} restaurants for ${mall_name}`);

      // Auto-populate nursing room info if found from restaurant page and not already present via facility page
      if (scrapeResult?.nursingInfo && (!mall.district || mall.district === '주요상권')) {
        await supabaseAdmin
          .from('malls')
          .update({ district: scrapeResult.nursingInfo })
          .eq('id', mall.id);
      }

      const newlyRegistered: any[] = [];
      const alreadyExisted: string[] = [];

      // 4. Register newly found restaurants
      for (const rest of scrapedRests) {
        const { data: existingRest } = await supabaseAdmin
          .from('restaurants')
          .select('id, name')
          .eq('mall_id', mall.id)
          .eq('name', rest.name)
          .maybeSingle();

        if (existingRest) {
          alreadyExisted.push(rest.name);
        } else {
          // Insert brand new restaurant record
          const { data: insertedRest, error: insertError } = await supabaseAdmin
            .from('restaurants')
            .insert({
              mall_id: mall.id,
              name: rest.name,
              category: rest.category || '전문식당가',
              floor: rest.floor || '지하 1층',
              status: 'OPEN'
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[BatchSync] Failed to register restaurant ${rest.name}:`, insertError);
          } else if (insertedRest) {
            newlyRegistered.push(insertedRest);
          }
        }
      }

      console.log(`[BatchSync] Registered ${newlyRegistered.length} new restaurants for ${mall_name}`);

      results.push({
        mall_name,
        success: true,
        scraped_count: scrapedRests.length,
        registered_count: newlyRegistered.length,
        already_existed_count: alreadyExisted.length
      });
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error('[BatchSync] Overall batch sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
