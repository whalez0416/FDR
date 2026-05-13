import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Admin key missing' }, { status: 401 });
  }

  try {
    const { malls } = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('malls')
      .upsert(malls, { onConflict: 'name' });

    if (error) throw error;

    return NextResponse.json({ success: true, count: malls.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
