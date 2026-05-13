import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Admin key missing' }, { status: 401 });
  }

  try {
    const dataDir = path.join(process.cwd(), 'data', 'restaurants');
    
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ error: 'Data directory not found' }, { status: 404 });
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    let totalUpdated = 0;

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const { restaurants } = fileContent;
      
      if (restaurants && Array.isArray(restaurants)) {
        for (const rest of restaurants) {
          // Update by name and mall_id or name if mall info is matched
          // To be safe, we'll try to find the restaurant first or update by name within the mall context
          // Find the mall first to get its ID if needed, or use the one from JSON
          const { data: mallRows } = await supabaseAdmin
            .from('malls')
            .select('id')
            .eq('name', fileContent.mall.name)
            .limit(1);

          const mallData = mallRows && mallRows.length > 0 ? mallRows[0] : null;

          if (mallData) {
            const { error } = await supabaseAdmin
              .from('restaurants')
              .upsert({
                mall_id: mallData.id,
                name: rest.name,
                category: rest.category,
                floor: rest.floor,
                stroller_accessible: rest.stroller_accessible,
                highchair_available: rest.highchair_available,
                tags: rest.tags,
                description: rest.description,
                status: 'OPEN'
              }, { onConflict: 'mall_id, name' }); // Assumes a unique constraint on mall_id and name

            if (error) {
              console.error(`Error upserting ${rest.name}:`, error);
            } else {
              totalUpdated++;
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, count: totalUpdated });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
