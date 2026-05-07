// Supabase Edge Function for Weekly Mall Sync
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("Starting Real-time Sync for Hyundai Pangyo...")

    // 1. Fetch Hyundai Pangyo Mall ID from DB
    const { data: mall } = await supabase
      .from('malls')
      .filter('name', 'ilike', '%판교%')
      .single()

    if (!mall) {
      return new Response(JSON.stringify({ error: "Hyundai Pangyo mall not found in database" }), { status: 404 })
    }

    // 2. Scraping Hyundai Department Store Website
    // Target: Hyundai Pangyo Dining Guide
    const url = "https://www.ehyundai.com/newPotal/DP/DP000000_V.do?branchCd=B00148000" // Example URL
    
    // In a real Edge Function, we fetch the actual page content
    // For this demonstration, we'll implement the logic that fetches and parses
    const response = await fetch("https://www.ehyundai.com/newPotal/DP/DP000000_V.do?branchCd=B00148000")
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const scrapedRestaurants: any[] = []
    
    // Selecting restaurant elements (based on Hyundai's site structure)
    $('.dining-list li, .store-list li').each((_, el) => {
      const name = $(el).find('.name, .tit').text().trim()
      const floorRaw = $(el).find('.floor, .loc').text().trim()
      const category = $(el).find('.category, .type').text().trim()
      
      if (name) {
        // Normalize Floor (e.g., "9층" -> "9F")
        let floor = floorRaw.replace('층', 'F').toUpperCase()
        if (!floor.includes('F') && !floor.includes('B')) floor = floor + 'F'

        scrapedRestaurants.push({
          mall_id: mall.id,
          name: name,
          category: category || '식당',
          floor: floor,
          stroller_accessible: true, // Defaulting to true for mall restaurants
          highchair_available: true,
          nursing_room_distance: 50, // Initial estimate
          status: 'active',
          last_updated: new Date().toISOString()
        })
      }
    })

    console.log(`Successfully scraped ${scrapedRestaurants.length} restaurants.`)

    if (scrapedRestaurants.length === 0) {
      // Fallback: If scraping fails due to site structure change, log it
      return new Response(JSON.stringify({ error: "No restaurants found during scraping. Site structure might have changed." }), { status: 500 })
    }

    // 3. Upsert into Supabase
    const { error: upsertError } = await supabase
      .from('restaurants')
      .upsert(scrapedRestaurants, { onConflict: 'mall_id,name' })

    if (upsertError) throw upsertError

    return new Response(JSON.stringify({ 
      message: "Sync completed successfully", 
      count: scrapedRestaurants.length,
      mall: mall.name
    }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("Sync Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
