import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
    const { mallId, mallName, restaurants } = await request.json();

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ error: 'No restaurants provided' }, { status: 400 });
    }

    // Prepare the list of restaurant names for the prompt
    const restaurantNames = restaurants.map((r: any) => r.name).join(', ');

    const prompt = `
You are an expert on Korean Department Stores and Malls. 
I will give you a mall name and a list of restaurants inside it.
Your job is to provide the floor number (e.g., "B1", "1F", "9F") and whether they likely have highchairs (true/false) and stroller accessibility (true/false).

Mall: ${mallName}
Restaurants: ${restaurantNames}

Respond with a JSON object containing a "data" key which is an array of objects:
{
  "data": [
    {
      "name": "Restaurant Name",
      "floor": "Floor (e.g. B1, 9F)",
      "stroller_accessible": boolean,
      "highchair_available": boolean
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    let aiResponse = completion.choices[0].message.content || '[]';
    
    // GPT-4o-mini might wrap the array in an object when json_object is enforced if the prompt asks for an array.
    // Let's parse it safely.
    let parsedData: any;
    try {
      parsedData = JSON.parse(aiResponse);
      if (!Array.isArray(parsedData)) {
        // If it wrapped it in an object like { "restaurants": [...] }
        const key = Object.keys(parsedData)[0];
        if (Array.isArray(parsedData[key])) {
          parsedData = parsedData[key];
        } else {
          parsedData = Object.values(parsedData)[0];
        }
      }
    } catch (e) {
      console.error("Failed to parse AI JSON:", e);
      throw new Error("AI returned invalid JSON");
    }

    // Now, update the database directly!
    for (const item of parsedData) {
      const originalRestaurant = restaurants.find((r: any) => r.name === item.name);
      if (originalRestaurant) {
        await supabaseAdmin
          .from('restaurants')
          .update({
            floor: item.floor,
            stroller_accessible: item.stroller_accessible,
            highchair_available: item.highchair_available
          })
          .eq('id', originalRestaurant.id);
      }
    }

    return NextResponse.json({ success: true, count: parsedData.length });

  } catch (error: any) {
    console.error('AI Fill Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
