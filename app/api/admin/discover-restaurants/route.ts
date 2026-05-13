import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UrlScraper } from '@/lib/sync/urlScraper';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Admin key missing' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not set' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const { mallId, mallName } = await request.json();

    let parsedData: any = { restaurants: [] };

    // Check if custom URL exists
    const urlFilePath = path.join(process.cwd(), 'data', 'mall_urls.json');
    let sourceUrl = '';
    if (fs.existsSync(urlFilePath)) {
      const urls = JSON.parse(fs.readFileSync(urlFilePath, 'utf8'));
      sourceUrl = urls[mallId];
    }

    if (sourceUrl) {
      console.log(`[Discovery] Using URL Scraper for ${mallName}: ${sourceUrl}`);
      const urlScraper = new UrlScraper();
      parsedData.restaurants = await urlScraper.scrapeRestaurantsFromUrl(sourceUrl, mallName);
    } else {
      console.log(`[Discovery] Using AI Knowledge for ${mallName}`);
      const prompt = `
You are an expert on Korean Department Stores and Malls.
Provide a comprehensive list of ALL restaurants, cafes, and food court stalls located in: "${mallName}".
Please search your internal knowledge to be as accurate as possible for the year 2024-2026.

Respond with a JSON object containing a "restaurants" key which is an array of objects:
{
  "restaurants": [
    {
      "name": "Restaurant Name",
      "category": "Category (e.g. 한식, 일식, 카페)",
      "floor": "Floor (e.g. B1, 9F)"
    }
  ]
}
`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      const aiResponse = completion.choices[0].message.content || '{"restaurants": []}';
      parsedData = JSON.parse(aiResponse);
    }
    
    // Check which ones already exist to highlight new ones
    const { data: existingRestaurants } = await supabaseAdmin
      .from('restaurants')
      .select('name')
      .eq('mall_id', mallId);
    
    const existingNames = new Set(existingRestaurants?.map(r => r.name) || []);
    
    const processedData = parsedData.restaurants.map((r: any) => ({
      ...r,
      is_new: !existingNames.has(r.name)
    }));

    return NextResponse.json({ restaurants: processedData });

  } catch (error: any) {
    console.error('Discovery Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
