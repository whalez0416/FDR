import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { HyundaiMallScraper, HYUNDAI_BRANCHES } from '@/lib/sync/hyundaiScraper';
import { UrlScraper } from '@/lib/sync/urlScraper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey });
  const scraper = new HyundaiMallScraper();
  const urlScraper = new UrlScraper();

  try {
    const { data: malls, error: mallError } = await supabaseAdmin.from('malls').select('id, name, source_url');
    if (mallError) throw mallError;

    let totalNew = 0;
    let totalUpdated = 0;

    for (const mall of malls) {
      console.log(`Processing mall: ${mall.name}...`);
      
      let scrapedList: any[] = [];
      const sourceUrl = mall.source_url;

      if (sourceUrl) {
        console.log(`Using custom source URL for ${mall.name}`);
        const scrapeResult = await urlScraper.scrapeRestaurantsFromUrl(sourceUrl, mall.name);
        scrapedList = scrapeResult.data || [];

        if (scrapeResult.nursingInfo) {
          console.log(`[Sync] Updating nursing info for ${mall.name}: ${scrapeResult.nursingInfo}`);
          await supabaseAdmin.from('malls').update({ district: scrapeResult.nursingInfo }).eq('id', mall.id);
        }
      } else {
        // Track A: Scrape Official Data (Fallback to old Hyundai Scraper logic if no URL)
        const branchInfo = HYUNDAI_BRANCHES.find(b => b.name === mall.name || mall.name.includes(b.name.replace('현대백화점 ', '')));
        if (branchInfo) {
          scrapedList = await scraper.fetchByBranch(branchInfo.name, branchInfo.code);
        } else {
          // Fallback to AI discovery
          const discoverPrompt = `List ALL restaurants in "${mall.name}". JSON format: {"data": [{"name": "...", "category": "...", "floor": "..."}]}`;
          const discComp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: discoverPrompt }],
            response_format: { type: "json_object" }
          });
          scrapedList = JSON.parse(discComp.choices[0].message.content || '{"data": []}').data || [];
        }
      }

      if (!scrapedList || scrapedList.length === 0) continue;

      // Fetch existing
      const { data: existingRests } = await supabaseAdmin.from('restaurants').select('id, name, status').eq('mall_id', mall.id);
      const existingMap = new Map(existingRests?.map(r => [r.name, r]) || []);
      const scrapedNames = new Set(scrapedList.map(r => r.name));

      // Track B: Enrich new restaurants
      const newRestaurants = scrapedList.filter(r => !existingMap.has(r.name));
      if (newRestaurants.length > 0) {
        const namesToEnrich = newRestaurants.map(r => r.name).join(', ');
        const enrichPrompt = `
You are an expert on child-friendly dining. Enrich these restaurants in ${mall.name}: ${namesToEnrich}.
Provide tags (3-4 hashtags like #아기의자완비, #유모차편한) and a short description for parents.
Return JSON: {"data": [{"name": "...", "tags": [...], "description": "...", "highchair_available": true/false, "stroller_accessible": true/false}]}
`;
        const enrichComp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: enrichPrompt }],
          response_format: { type: "json_object" }
        });
        const enrichedData = JSON.parse(enrichComp.choices[0].message.content || '{"data": []}').data || [];
        
        // Merge enriched data
        for (const newRest of newRestaurants) {
          const enrichInfo = enrichedData.find((e: any) => e.name === newRest.name);
          if (enrichInfo) {
            newRest.tags = enrichInfo.tags || [];
            newRest.description = enrichInfo.description || '';
            newRest.highchair_available = enrichInfo.highchair_available ?? true;
            newRest.stroller_accessible = enrichInfo.stroller_accessible ?? true;
          }
        }
      }

      // Upsert scraped & enriched
      for (const item of scrapedList) {
        const { error } = await supabaseAdmin
          .from('restaurants')
          .upsert({
            mall_id: mall.id,
            name: item.name,
            category: item.category,
            floor: item.floor,
            tags: item.tags || [],
            description: item.description || '',
            status: 'OPEN',
            stroller_accessible: item.stroller_accessible ?? true,
            highchair_available: item.highchair_available ?? true,
            last_updated: new Date().toISOString()
          }, { onConflict: 'mall_id, name' });

        if (!error) totalUpdated++;
      }

      // Mark closed
      for (const [name, existing] of Array.from(existingMap.entries())) {
        if (!scrapedNames.has(name) && existing.status !== 'CLOSED') {
          await supabaseAdmin.from('restaurants').update({ status: 'CLOSED' }).eq('id', existing.id);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Auto-sync completed. Processed ${malls.length} malls.`,
      updated_count: totalUpdated
    });

  } catch (error: any) {
    console.error('Cron Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
