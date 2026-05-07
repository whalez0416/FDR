import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase/client';

export async function GET() {
  try {
    console.log('--- Database Cleanup Started ---');
    
    // 1. Delete all reviews
    const { error: reviewError } = await supabase
      .from('reviews')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
    
    if (reviewError) throw reviewError;

    // 2. Delete all restaurants
    const { error: restError } = await supabase
      .from('restaurants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

    if (restError) throw restError;

    return NextResponse.json({ 
      success: true, 
      message: "Successfully cleared all sample restaurants and reviews. Your database is now clean!",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Clear Data Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
