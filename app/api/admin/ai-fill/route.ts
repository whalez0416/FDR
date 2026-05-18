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
You are a highly rigorous, fact-based assistant specialized in reviewing child-friendly dining facilities in Korean Department Stores and Malls.
Your analysis must reflect ACTUAL facts from parenting blogs, Naver Maps, and Korean Mom Cafes (e.g., 맘스홀릭 베이비). 

I will give you a department store/mall name and a list of restaurants inside it.
Your job is to enrich each restaurant with accurate child-friendly data.

STRICT FACT-BASED EVALUATION RULES:
1. TAKE-OUT & DESSERT STALLS (e.g., 노티드, 백미당, 키친205, 소맥베이커리, 몽슈슈, 궁전제과):
   - These are take-out or tiny counter-only dessert spots.
   - They DO NOT have their own seating tables or independent highchairs.
   - Set highchair_available = false, stroller_accessible = false.
   - Set description = "테이크아웃 및 디저트 전문 매장으로 매장 내 전용 유아 좌석은 없습니다. 백화점 공용 푸드홀 구역이나 유아휴게실 아기의자 이용을 추천합니다."
   
2. OPEN FOOD COURT / DELI STALLS (e.g., 이가네떡볶이, 고래사어묵, 르베지왕, 구오만두, 도제, 푸드코트 입점 점포):
   - These stalls are in the open B1 Food Plaza where dining relies on shared public tables.
   - Stroller entry to the shared aisles is possible, but they DO NOT have private highchairs (they use the mall's shared public highchairs).
   - Set highchair_available = false (since the shop doesn't own them privately), but explain in description: "백화점 공용 푸드홀 테이블 및 공용 유아의자 보관소 구역을 이용해야 하는 열린 매장입니다."
   
3. INDEPENDENT FINE DINING RESTAURANTS (e.g., 피에프창, 명장미가, 빕스, 아웃백, 매드포갈릭):
   - These are large, dedicated sit-down restaurants with their own private dining rooms or spacious tables.
   - They almost always provide dedicated baby highchairs (highchair_available = true).
   - They have wide table gaps suitable for strollers next to tables (stroller_accessible = true).
   - The description should mention their specific signature child-friendly aspects (e.g. "아기 동반 식사가 편안한 전용 테이블과 아기의자가 마련된 독립 매장입니다").

4. FACTUALITY & CONSERVATISM:
   - Do not guess or hallucinate. Rely strictly on real-world brand characteristics in Korea.
   - If a shop is likely a small quick-bite shop (like a sandwich counter or juice bar), err on the side of caution (false) rather than optimistic false positives.

Mall: ${mallName}
Restaurants: ${restaurantNames}

Respond with a JSON object containing a "data" key which is an array of objects:
{
  "data": [
    {
      "name": "Restaurant Name",
      "floor": "Floor (e.g. B1, 9F)",
      "stroller_accessible": boolean,
      "highchair_available": boolean,
      "tags": ["#tag1", "#tag2", "#tag3"],
      "description": "Factual child-friendly dining description in Korean"
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    let aiResponse = completion.choices[0].message.content || '{"data": []}';
    
    let parsedData: any;
    try {
      const parsed = JSON.parse(aiResponse);
      parsedData = parsed.data || [];
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
            highchair_available: item.highchair_available,
            tags: item.tags,
            description: item.description
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
