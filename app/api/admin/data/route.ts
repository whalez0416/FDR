import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Admin key missing' }, { status: 401 });
  }

  const { data: malls } = await supabaseAdmin.from('malls').select('*').order('name');
  const { data: restaurants } = await supabaseAdmin.from('restaurants').select('*').order('name');
  
  return NextResponse.json({ malls, restaurants });
}

export async function PATCH(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Admin key missing' }, { status: 401 });
  }

  try {
    const { id, updates } = await request.json();
    
    const { error } = await supabaseAdmin
      .from('restaurants')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
